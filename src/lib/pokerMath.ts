import {
  Player,
  PokerSession,
  SessionParticipant,
  SettlementCycle,
  SettlementTransaction,
  PlayerStats,
  CycleBalanceSummary,
} from "../types/poker";

/**
 * Format an integer INR currency amount with + or - signs
 */
export function formatCurrency(amount: number, showPlusSign: boolean = false): string {
  const rounded = Math.round(amount);
  const formatted = Math.abs(rounded).toLocaleString("en-IN");
  if (rounded > 0) {
    return showPlusSign ? `+₹${formatted}` : `₹${formatted}`;
  }
  if (rounded < 0) {
    return `-₹${formatted}`;
  }
  return `₹0`;
}

/**
 * Calculate net P&L for a session participant: Cash-out - (Buy-in + Rebuys)
 */
export function calculateParticipantNet(
  buyIn: number,
  rebuys: number,
  cashOut: number
): { totalBuyIn: number; net: number } {
  const safeBuyIn = Math.max(0, Math.round(buyIn || 0));
  const safeRebuys = Math.max(0, Math.round(rebuys || 0));
  const safeCashOut = Math.max(0, Math.round(cashOut || 0));
  const totalBuyIn = safeBuyIn + safeRebuys;
  const net = safeCashOut - totalBuyIn;
  return { totalBuyIn, net };
}

/**
 * Check if a session balances to zero. Total cash-outs must equal total buy-ins.
 */
export function validateSessionBalance(participants: SessionParticipant[]): {
  isBalanced: boolean;
  totalBuyIn: number;
  totalCashOut: number;
  discrepancy: number; // positive = excess cash-out, negative = missing cash-out
} {
  let totalBuyIn = 0;
  let totalCashOut = 0;

  for (const p of participants) {
    totalBuyIn += Math.round(p.totalBuyIn || 0);
    totalCashOut += Math.round(p.cashOut || 0);
  }

  const discrepancy = totalCashOut - totalBuyIn;
  const isBalanced = discrepancy === 0;

  return {
    isBalanced,
    totalBuyIn,
    totalCashOut,
    discrepancy,
  };
}

/**
 * Calculate current outstanding balance and stats for all players in a specific cycle
 */
export function calculateCycleBalances(
  cycleId: string,
  players: Player[],
  sessions: PokerSession[],
  settlements: SettlementTransaction[]
): Map<string, CycleBalanceSummary> {
  const summaryMap = new Map<string, CycleBalanceSummary>();

  for (const player of players) {
    summaryMap.set(player.id, {
      playerId: player.id,
      cycleSessionNet: 0,
      cycleSettlementPaid: 0,
      cycleSettlementReceived: 0,
      outstandingBalance: 0,
    });
  }

  // 1. Accumulate completed session results for this cycle (exclude live games)
  const cycleSessions = sessions.filter(
    (s) => s.cycleId === cycleId && s.status !== "live"
  );
  for (const session of cycleSessions) {
    for (const p of session.participants) {
      const summary = summaryMap.get(p.playerId);
      if (summary) {
        summary.cycleSessionNet += Math.round(p.net || 0);
      }
    }
  }

  // 2. Accumulate completed settlements for this cycle
  const cycleSettlements = settlements.filter(
    (st) => st.cycleId === cycleId && st.status === "completed"
  );
  for (const st of cycleSettlements) {
    const fromSummary = summaryMap.get(st.fromPlayerId);
    if (fromSummary) {
      fromSummary.cycleSettlementPaid += Math.round(st.amount || 0);
    }
    const toSummary = summaryMap.get(st.toPlayerId);
    if (toSummary) {
      toSummary.cycleSettlementReceived += Math.round(st.amount || 0);
    }
  }

  // 3. Compute final outstanding balance:
  // Net session + Paid settlements - Received settlements
  for (const summary of Array.from(summaryMap.values())) {
    summary.outstandingBalance =
      summary.cycleSessionNet + summary.cycleSettlementPaid - summary.cycleSettlementReceived;
  }

  return summaryMap;
}

/**
 * Calculate detailed lifetime statistics for a player
 */
export function calculatePlayerStats(
  playerId: string,
  players: Player[],
  sessions: PokerSession[],
  settlements: SettlementTransaction[],
  activeCycleId: string
): PlayerStats {
  const player = players.find((p) => p.id === playerId);
  const playerName = player ? player.name : "Unknown Player";
  const playerAvatar = player ? player.avatar : "#10b981";

  let totalBuyIn = 0;
  let totalCashOut = 0;
  let lifetimeNet = 0;
  let winningSessions = 0;
  let losingSessions = 0;
  let breakevenSessions = 0;
  let totalSessions = 0;

  let biggestWin: { amount: number; sessionTitle: string; date: string } | null = null;
  let biggestLoss: { amount: number; sessionTitle: string; date: string } | null = null;

  for (const s of sessions) {
    if (s.status === "live") continue;
    const part = s.participants.find((p) => p.playerId === playerId);
    if (!part) continue;

    totalSessions++;
    const pBuyIn = Math.round(part.totalBuyIn || 0);
    const pCashOut = Math.round(part.cashOut || 0);
    const pNet = Math.round(part.net || 0);

    totalBuyIn += pBuyIn;
    totalCashOut += pCashOut;
    lifetimeNet += pNet;

    if (pNet > 0) {
      winningSessions++;
      if (!biggestWin || pNet > biggestWin.amount) {
        biggestWin = { amount: pNet, sessionTitle: s.title, date: s.date };
      }
    } else if (pNet < 0) {
      losingSessions++;
      if (!biggestLoss || pNet < biggestLoss.amount) {
        biggestLoss = { amount: pNet, sessionTitle: s.title, date: s.date };
      }
    } else {
      breakevenSessions++;
    }
  }

  // Current cycle outstanding balance
  const cycleBalances = calculateCycleBalances(activeCycleId, players, sessions, settlements);
  const cycleSummary = cycleBalances.get(playerId);
  const cycleBalance = cycleSummary ? cycleSummary.outstandingBalance : 0;

  const winRate = totalSessions > 0 ? (winningSessions / totalSessions) * 100 : 0;
  const roiPercentage = totalBuyIn > 0 ? (lifetimeNet / totalBuyIn) * 100 : 0;
  const avgBuyIn = totalSessions > 0 ? Math.round(totalBuyIn / totalSessions) : 0;
  const avgNet = totalSessions > 0 ? Math.round(lifetimeNet / totalSessions) : 0;

  return {
    playerId,
    playerName,
    playerAvatar,
    totalSessions,
    totalBuyIn,
    totalCashOut,
    lifetimeNet,
    cycleBalance,
    winningSessions,
    losingSessions,
    breakevenSessions,
    winRate: Math.round(winRate * 10) / 10,
    biggestWin,
    biggestLoss,
    roiPercentage: Math.round(roiPercentage * 10) / 10,
    avgBuyIn,
    avgNet,
  };
}
