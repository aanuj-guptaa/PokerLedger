"use client";

import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import {
  Player,
  PokerSession,
  SettlementCycle,
  SettlementTransaction,
  LedgerStoreData,
  PlayerStats,
  CycleBalanceSummary,
  SettlementSuggestion,
  SessionParticipant,
} from "../types/poker";
import { INITIAL_LEDGER_DATA } from "../lib/sampleData";
import { loadLedgerData, saveLedgerData, exportLedgerJson, importLedgerJson } from "../lib/storage";
import {
  calculateCycleBalances,
  calculatePlayerStats,
  validateSessionBalance,
} from "../lib/pokerMath";
import { calculateOptimizedSettlements } from "../lib/settlementEngine";

interface PokerContextType {
  players: Player[];
  sessions: PokerSession[];
  cycles: SettlementCycle[];
  settlements: SettlementTransaction[];
  activeCycleId: string;
  activeCycle: SettlementCycle | undefined;
  isLoaded: boolean;

  // Computed
  activeCycleBalances: Map<string, CycleBalanceSummary>;
  allTimePlayerStats: PlayerStats[];
  optimizedSettlements: SettlementSuggestion[];

  liveSession: PokerSession | undefined;

  // Actions - Players
  addPlayer: (data: { name: string; avatar?: string; upiId?: string; phone?: string; notes?: string }) => Player;
  updatePlayer: (id: string, updates: Partial<Player>) => void;
  deletePlayer: (id: string, permanent?: boolean) => void;

  // Actions - Sessions
  addSession: (
    data: Omit<PokerSession, "id" | "sessionNumber" | "createdAt" | "updatedAt" | "editHistory" | "totalPot" | "isBalanced" | "status"> & {
      sessionNumber?: number;
      status?: "live" | "completed";
      participants: SessionParticipant[];
    }
  ) => { success: boolean; session?: PokerSession; error?: string };
  updateSession: (
    id: string,
    updates: Partial<PokerSession>,
    editSummary?: string
  ) => { success: boolean; session?: PokerSession; error?: string };
  deleteSession: (id: string) => void;

  // Actions - Live Table Real-Time Rebuys & Buyins
  startLiveSession: (title?: string, initialBuyIn?: number, playerIds?: string[]) => PokerSession;
  addRebuyLive: (sessionId: string, playerId: string, amount: number) => void;
  updateBuyInLive: (sessionId: string, playerId: string, newBuyIn: number) => void;
  seatPlayerLive: (sessionId: string, playerId: string, buyIn?: number) => void;
  removePlayerLive: (sessionId: string, playerId: string) => void;
  finalizeLiveSession: (sessionId: string, cashOuts: Record<string, number>) => { success: boolean; error?: string };
  cancelLiveSession: (sessionId: string) => void;

  // Actions - Settlements
  recordPayment: (
    fromPlayerId: string,
    toPlayerId: string,
    amount: number,
    paymentMethod?: "UPI" | "Cash" | "Bank Transfer" | "Other",
    notes?: string
  ) => SettlementTransaction;
  markSettlementPaid: (id: string) => void;

  // Actions - Cycles
  startNewCycle: (name: string, startDate?: string, notes?: string) => SettlementCycle;
  closeCycle: (cycleId: string, notes?: string) => void;
  setActiveCycleId: (id: string) => void;

  // Storage / Backup
  resetToSampleData: () => void;
  clearAllData: () => void;
  exportData: () => void;
  importData: (json: string) => void;
}

const PokerContext = createContext<PokerContextType | undefined>(undefined);

export function PokerProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<LedgerStoreData>(INITIAL_LEDGER_DATA);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  // Load from LocalStorage on mount
  useEffect(() => {
    const loaded = loadLedgerData();
    setData(loaded);
    setIsLoaded(true);
  }, []);

  // Sync to LocalStorage on update
  const updateData = (newData: LedgerStoreData) => {
    setData(newData);
    saveLedgerData(newData);
  };

  const activeCycle = useMemo(() => {
    return data.cycles.find((c) => c.id === data.activeCycleId) || data.cycles[0];
  }, [data.cycles, data.activeCycleId]);

  const liveSession = useMemo(() => {
    return data.sessions.find((s) => s.status === "live");
  }, [data.sessions]);

  // Compute active cycle balances
  const activeCycleBalances = useMemo(() => {
    if (!activeCycle) return new Map<string, CycleBalanceSummary>();
    return calculateCycleBalances(activeCycle.id, data.players, data.sessions, data.settlements);
  }, [activeCycle, data.players, data.sessions, data.settlements]);

  // Compute all-time stats for all active players
  const allTimePlayerStats = useMemo(() => {
    const activeCycleId = activeCycle?.id || "";
    return data.players
      .filter((p) => !p.isArchived)
      .map((p) =>
        calculatePlayerStats(p.id, data.players, data.sessions, data.settlements, activeCycleId)
      )
      .sort((a, b) => b.lifetimeNet - a.lifetimeNet);
  }, [data.players, data.sessions, data.settlements, activeCycle]);

  // Compute smart optimized settlement plan for active cycle
  const optimizedSettlements = useMemo(() => {
    return calculateOptimizedSettlements(activeCycleBalances);
  }, [activeCycleBalances]);

  // Player handlers
  const addPlayer = (playerData: {
    name: string;
    avatar?: string;
    upiId?: string;
    phone?: string;
    notes?: string;
  }): Player => {
    const defaultAvatars = ["#10b981", "#f59e0b", "#6366f1", "#14b8a6", "#f43f5e", "#a855f7", "#0ea5e9", "#f97316"];
    const randomAvatar = defaultAvatars[Math.floor(Math.random() * defaultAvatars.length)];
    const newPlayer: Player = {
      id: `p-${Date.now()}`,
      name: playerData.name.trim(),
      avatar: playerData.avatar || randomAvatar,
      upiId: playerData.upiId?.trim() || undefined,
      phone: playerData.phone?.trim() || undefined,
      notes: playerData.notes?.trim() || undefined,
      createdAt: new Date().toISOString(),
      isArchived: false,
    };
    const updated = {
      ...data,
      players: [...data.players, newPlayer],
    };
    updateData(updated);
    return newPlayer;
  };

  const updatePlayer = (id: string, updates: Partial<Player>) => {
    const updated = {
      ...data,
      players: data.players.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    };
    updateData(updated);
  };

  const deletePlayer = (id: string, permanent: boolean = true) => {
    let updatedPlayers = data.players;
    if (permanent) {
      updatedPlayers = data.players.filter((p) => p.id !== id);
    } else {
      updatedPlayers = data.players.map((p) => (p.id === id ? { ...p, isArchived: true } : p));
    }

    // Also clean up from any active live session if present
    const updatedSessions = data.sessions.map((s) => {
      if (s.status === "live") {
        const remaining = s.participants.filter((p) => p.playerId !== id);
        return {
          ...s,
          participants: remaining,
          totalPot: remaining.reduce((sum, p) => sum + (p.totalBuyIn || 0), 0),
        };
      }
      return s;
    });

    const updated = {
      ...data,
      players: updatedPlayers,
      sessions: updatedSessions,
    };
    updateData(updated);
  };

  // Session handlers
  const addSession = (sessionData: {
    sessionNumber?: number;
    title: string;
    date: string;
    cycleId: string;
    notes?: string;
    gameType?: string;
    status?: "live" | "completed";
    participants: SessionParticipant[];
  }): { success: boolean; session?: PokerSession; error?: string } => {
    const isLive = sessionData.status === "live";
    let isBalanced = false;
    let totalPot = 0;

    if (!isLive) {
      const validation = validateSessionBalance(sessionData.participants);
      if (!validation.isBalanced) {
        return {
          success: false,
          error: `Session does not balance to zero! Discrepancy is ${
            validation.discrepancy > 0 ? `+₹${validation.discrepancy}` : `-₹${Math.abs(validation.discrepancy)}`
          }. Total cash-outs must equal total buy-ins.`,
        };
      }
      isBalanced = true;
      totalPot = validation.totalBuyIn;
    } else {
      totalPot = sessionData.participants.reduce((sum, p) => sum + (p.totalBuyIn || 0), 0);
    }

    const nextNumber =
      sessionData.sessionNumber ||
      (data.sessions.length > 0
        ? Math.max(...data.sessions.map((s) => s.sessionNumber || 0)) + 1
        : 1);

    const newSession: PokerSession = {
      id: `sess-${Date.now()}`,
      sessionNumber: nextNumber,
      title: sessionData.title || `Session #${String(nextNumber).padStart(3, "0")}`,
      date: sessionData.date || new Date().toISOString(),
      cycleId: sessionData.cycleId || activeCycle?.id || "cycle-1",
      notes: sessionData.notes,
      gameType: sessionData.gameType || "NL Texas Hold'em",
      participants: sessionData.participants,
      totalPot,
      isBalanced,
      status: sessionData.status || "completed",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      editHistory: [],
    };

    const updated = {
      ...data,
      sessions: [newSession, ...data.sessions],
    };
    updateData(updated);
    return { success: true, session: newSession };
  };

  // Instant Live Game Handlers
  const startLiveSession = (
    title?: string,
    initialBuyIn: number = 1000,
    playerIds?: string[]
  ): PokerSession => {
    const selectedPlayerIds =
      playerIds && playerIds.length > 0
        ? playerIds
        : data.players.filter((p) => !p.isArchived).slice(0, 4).map((p) => p.id);

    const nextNumber =
      data.sessions.length > 0
        ? Math.max(...data.sessions.map((s) => s.sessionNumber || 0)) + 1
        : 1;

    const participants: SessionParticipant[] = selectedPlayerIds.map((pId) => ({
      playerId: pId,
      buyIn: initialBuyIn,
      rebuys: 0,
      totalBuyIn: initialBuyIn,
      cashOut: 0,
      net: -initialBuyIn,
    }));

    const totalPot = initialBuyIn * selectedPlayerIds.length;

    const newLiveSession: PokerSession = {
      id: `sess-${Date.now()}`,
      sessionNumber: nextNumber,
      title: title?.trim() || `Session #${String(nextNumber).padStart(3, "0")} (Live Table)`,
      date: new Date().toISOString(),
      cycleId: activeCycle?.id || data.activeCycleId,
      notes: "Live poker game in progress",
      gameType: "NL Texas Hold'em",
      participants,
      totalPot,
      isBalanced: false,
      status: "live",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      editHistory: [],
    };

    const updated = {
      ...data,
      sessions: [newLiveSession, ...data.sessions],
    };
    updateData(updated);
    return newLiveSession;
  };

  const addRebuyLive = (sessionId: string, playerId: string, amount: number) => {
    const session = data.sessions.find((s) => s.id === sessionId);
    if (!session) return;

    const updatedParticipants = session.participants.map((p) => {
      if (p.playerId === playerId) {
        const newRebuys = (p.rebuys || 0) + amount;
        const newTotalBuyIn = p.buyIn + newRebuys;
        return {
          ...p,
          rebuys: newRebuys,
          totalBuyIn: newTotalBuyIn,
          net: (p.cashOut || 0) - newTotalBuyIn,
        };
      }
      return p;
    });

    const newTotalPot = updatedParticipants.reduce((sum, p) => sum + (p.totalBuyIn || 0), 0);

    const updatedSession: PokerSession = {
      ...session,
      participants: updatedParticipants,
      totalPot: newTotalPot,
      updatedAt: new Date().toISOString(),
    };

    updateData({
      ...data,
      sessions: data.sessions.map((s) => (s.id === sessionId ? updatedSession : s)),
    });
  };

  const updateBuyInLive = (sessionId: string, playerId: string, newBuyIn: number) => {
    const session = data.sessions.find((s) => s.id === sessionId);
    if (!session) return;

    const updatedParticipants = session.participants.map((p) => {
      if (p.playerId === playerId) {
        const safeBuyIn = Math.max(0, newBuyIn);
        const newTotal = safeBuyIn + (p.rebuys || 0);
        return {
          ...p,
          buyIn: safeBuyIn,
          totalBuyIn: newTotal,
          net: (p.cashOut || 0) - newTotal,
        };
      }
      return p;
    });

    const newTotalPot = updatedParticipants.reduce((sum, p) => sum + (p.totalBuyIn || 0), 0);

    const updatedSession: PokerSession = {
      ...session,
      participants: updatedParticipants,
      totalPot: newTotalPot,
      updatedAt: new Date().toISOString(),
    };

    updateData({
      ...data,
      sessions: data.sessions.map((s) => (s.id === sessionId ? updatedSession : s)),
    });
  };

  const seatPlayerLive = (sessionId: string, playerId: string, buyIn: number = 1000) => {
    const session = data.sessions.find((s) => s.id === sessionId);
    if (!session) return;
    if (session.participants.some((p) => p.playerId === playerId)) return;

    const newParticipant: SessionParticipant = {
      playerId,
      buyIn,
      rebuys: 0,
      totalBuyIn: buyIn,
      cashOut: 0,
      net: -buyIn,
    };

    const updatedParticipants = [...session.participants, newParticipant];
    const newTotalPot = updatedParticipants.reduce((sum, p) => sum + p.totalBuyIn, 0);

    const updatedSession: PokerSession = {
      ...session,
      participants: updatedParticipants,
      totalPot: newTotalPot,
      updatedAt: new Date().toISOString(),
    };

    updateData({
      ...data,
      sessions: data.sessions.map((s) => (s.id === sessionId ? updatedSession : s)),
    });
  };

  const removePlayerLive = (sessionId: string, playerId: string) => {
    const session = data.sessions.find((s) => s.id === sessionId);
    if (!session) return;

    const updatedParticipants = session.participants.filter((p) => p.playerId !== playerId);
    const newTotalPot = updatedParticipants.reduce((sum, p) => sum + p.totalBuyIn, 0);

    const updatedSession: PokerSession = {
      ...session,
      participants: updatedParticipants,
      totalPot: newTotalPot,
      updatedAt: new Date().toISOString(),
    };

    updateData({
      ...data,
      sessions: data.sessions.map((s) => (s.id === sessionId ? updatedSession : s)),
    });
  };

  const finalizeLiveSession = (
    sessionId: string,
    cashOuts: Record<string, number>
  ): { success: boolean; error?: string } => {
    const session = data.sessions.find((s) => s.id === sessionId);
    if (!session) return { success: false, error: "Session not found" };

    const totalCashOut = Object.values(cashOuts).reduce((sum, v) => sum + Math.round(v || 0), 0);
    const discrepancy = totalCashOut - session.totalPot;

    if (discrepancy !== 0) {
      return {
        success: false,
        error: `Cannot finalize: cash-outs (₹${totalCashOut.toLocaleString("en-IN")}) do not equal total buy-ins (₹${session.totalPot.toLocaleString("en-IN")}). Discrepancy: ${
          discrepancy > 0 ? `+₹${discrepancy}` : `-₹${Math.abs(discrepancy)}`
        }.`,
      };
    }

    const updatedParticipants = session.participants.map((p) => {
      const pCashOut = Math.round(cashOuts[p.playerId] || 0);
      return {
        ...p,
        cashOut: pCashOut,
        net: pCashOut - p.totalBuyIn,
      };
    });

    const updatedSession: PokerSession = {
      ...session,
      title: session.title.replace(" (Live Table)", "").replace(" (Live)", ""),
      participants: updatedParticipants,
      isBalanced: true,
      status: "completed",
      updatedAt: new Date().toISOString(),
    };

    updateData({
      ...data,
      sessions: data.sessions.map((s) => (s.id === sessionId ? updatedSession : s)),
    });

    return { success: true };
  };

  const cancelLiveSession = (sessionId: string) => {
    updateData({
      ...data,
      sessions: data.sessions.filter((s) => s.id !== sessionId),
    });
  };

  const updateSession = (
    id: string,
    updates: Partial<PokerSession>,
    editSummary: string = "Session updated"
  ): { success: boolean; session?: PokerSession; error?: string } => {
    const existing = data.sessions.find((s) => s.id === id);
    if (!existing) {
      return { success: false, error: "Session not found" };
    }

    const participants = updates.participants || existing.participants;
    const validation = validateSessionBalance(participants);

    if (!validation.isBalanced) {
      return {
        success: false,
        error: `Session does not balance to zero! Discrepancy is ${
          validation.discrepancy > 0 ? `+₹${validation.discrepancy}` : `-₹${Math.abs(validation.discrepancy)}`
        }. Total cash-outs must equal total buy-ins.`,
      };
    }

    const newHistoryRecord = {
      id: `edit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      author: "Admin",
      summary: editSummary,
      details: `Pot: ₹${validation.totalBuyIn}, Participants: ${participants.length}`,
    };

    const updatedSession: PokerSession = {
      ...existing,
      ...updates,
      participants,
      totalPot: validation.totalBuyIn,
      isBalanced: true,
      updatedAt: new Date().toISOString(),
      editHistory: [newHistoryRecord, ...existing.editHistory],
    };

    const updated = {
      ...data,
      sessions: data.sessions.map((s) => (s.id === id ? updatedSession : s)),
    };
    updateData(updated);
    return { success: true, session: updatedSession };
  };

  const deleteSession = (id: string) => {
    const updated = {
      ...data,
      sessions: data.sessions.filter((s) => s.id !== id),
    };
    updateData(updated);
  };

  // Settlement handlers
  const recordPayment = (
    fromPlayerId: string,
    toPlayerId: string,
    amount: number,
    paymentMethod: "UPI" | "Cash" | "Bank Transfer" | "Other" = "UPI",
    notes?: string
  ): SettlementTransaction => {
    const newTx: SettlementTransaction = {
      id: `st-${Date.now()}`,
      cycleId: activeCycle?.id || data.activeCycleId,
      fromPlayerId,
      toPlayerId,
      amount: Math.round(amount),
      status: "completed",
      paidAt: new Date().toISOString(),
      paymentMethod,
      notes,
      createdAt: new Date().toISOString(),
    };

    const updated = {
      ...data,
      settlements: [newTx, ...data.settlements],
    };
    updateData(updated);
    return newTx;
  };

  const markSettlementPaid = (id: string) => {
    const updated = {
      ...data,
      settlements: data.settlements.map((st) =>
        st.id === id ? { ...st, status: "completed" as const, paidAt: new Date().toISOString() } : st
      ),
    };
    updateData(updated);
  };

  // Cycle handlers
  const startNewCycle = (name: string, startDate?: string, notes?: string): SettlementCycle => {
    const nextNumber =
      data.cycles.length > 0 ? Math.max(...data.cycles.map((c) => c.cycleNumber)) + 1 : 1;
    const newCycle: SettlementCycle = {
      id: `cycle-${Date.now()}`,
      cycleNumber: nextNumber,
      name: name || `Cycle #${nextNumber}`,
      startDate: startDate || new Date().toISOString(),
      endDate: null,
      status: "active",
      notes,
    };

    // Close current active cycle if it was active
    const updatedCycles = data.cycles.map((c) =>
      c.id === data.activeCycleId ? { ...c, status: "closed" as const, endDate: new Date().toISOString() } : c
    );

    const updated = {
      ...data,
      cycles: [newCycle, ...updatedCycles],
      activeCycleId: newCycle.id,
    };
    updateData(updated);
    return newCycle;
  };

  const closeCycle = (cycleId: string, notes?: string) => {
    const updated = {
      ...data,
      cycles: data.cycles.map((c) =>
        c.id === cycleId
          ? {
              ...c,
              status: "closed" as const,
              endDate: new Date().toISOString(),
              closedAt: new Date().toISOString(),
              notes: notes || c.notes,
            }
          : c
      ),
    };
    updateData(updated);
  };

  const setActiveCycleId = (id: string) => {
    const updated = {
      ...data,
      activeCycleId: id,
    };
    updateData(updated);
  };

  // Backup & Reset
  const resetToSampleData = () => {
    updateData(INITIAL_LEDGER_DATA);
  };

  const clearAllData = () => {
    const emptyData: LedgerStoreData = {
      players: data.players, // keep player names so they don't have to re-enter
      sessions: [],
      cycles: [
        {
          id: `cycle-${Date.now()}`,
          cycleNumber: 1,
          name: "Cycle #1",
          startDate: new Date().toISOString(),
          endDate: null,
          status: "active",
        },
      ],
      settlements: [],
      activeCycleId: `cycle-${Date.now()}`,
      version: "1.0.0",
      lastUpdated: new Date().toISOString(),
    };
    updateData(emptyData);
  };

  const exportData = () => {
    exportLedgerJson(data);
  };

  const importData = (jsonString: string) => {
    const imported = importLedgerJson(jsonString);
    updateData(imported);
  };

  return (
    <PokerContext.Provider
      value={{
        players: data.players,
        sessions: data.sessions,
        cycles: data.cycles,
        settlements: data.settlements,
        activeCycleId: data.activeCycleId,
        activeCycle,
        isLoaded,
        activeCycleBalances,
        allTimePlayerStats,
        optimizedSettlements,
        liveSession,
        addPlayer,
        updatePlayer,
        deletePlayer,
        addSession,
        updateSession,
        deleteSession,
        startLiveSession,
        addRebuyLive,
        updateBuyInLive,
        seatPlayerLive,
        removePlayerLive,
        finalizeLiveSession,
        cancelLiveSession,
        recordPayment,
        markSettlementPaid,
        startNewCycle,
        closeCycle,
        setActiveCycleId,
        resetToSampleData,
        clearAllData,
        exportData,
        importData,
      }}
    >
      {children}
    </PokerContext.Provider>
  );
}

export function usePoker() {
  const context = useContext(PokerContext);
  if (!context) {
    throw new Error("usePoker must be used within a PokerProvider");
  }
  return context;
}
