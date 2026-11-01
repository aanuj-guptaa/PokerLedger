"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Coins,
  Calendar,
  Sparkles,
  Info,
  Clock,
} from "lucide-react";
import confetti from "canvas-confetti";
import { usePoker } from "../../context/PokerContext";
import { Player, PokerSession, SessionParticipant } from "../../types/poker";
import { formatCurrency, calculateParticipantNet, validateSessionBalance } from "../../lib/pokerMath";

interface SessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingSession?: PokerSession | null;
}

export default function SessionModal({ isOpen, onClose, existingSession }: SessionModalProps) {
  const { players, cycles, activeCycleId, addSession, updateSession, addPlayer } = usePoker();

  // Form states
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [cycleId, setCycleId] = useState("");
  const [gameType, setGameType] = useState("NL Texas Hold'em");
  const [notes, setNotes] = useState("");
  const [editReason, setEditReason] = useState("");

  // Participants row state: { playerId, buyIn, rebuys, cashOut }
  const [rows, setRows] = useState<
    { playerId: string; buyIn: number; rebuys: number; cashOut: number }[]
  >([]);

  // Quick player add state
  const [showQuickAddPlayer, setShowQuickAddPlayer] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Populate form on open or change of existingSession
  useEffect(() => {
    if (existingSession) {
      setTitle(existingSession.title);
      // Format to datetime-local
      const d = new Date(existingSession.date);
      const localIso = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
      setDate(localIso);
      setCycleId(existingSession.cycleId);
      setGameType(existingSession.gameType || "NL Texas Hold'em");
      setNotes(existingSession.notes || "");
      setEditReason("");
      setRows(
        existingSession.participants.map((p) => ({
          playerId: p.playerId,
          buyIn: p.buyIn,
          rebuys: p.rebuys,
          cashOut: p.cashOut,
        }))
      );
    } else {
      // New session defaults
      const now = new Date();
      const localIso = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
      setDate(localIso);
      setCycleId(activeCycleId);
      setTitle("");
      setGameType("NL Texas Hold'em");
      setNotes("");
      setEditReason("");

      // Default participating players: top 4 active players
      const activePlayers = players.filter((p) => !p.isArchived).slice(0, 4);
      setRows(
        activePlayers.map((p) => ({
          playerId: p.id,
          buyIn: 1000,
          rebuys: 0,
          cashOut: 1000,
        }))
      );
    }
    setErrorMsg("");
  }, [existingSession, isOpen, players, activeCycleId]);

  if (!isOpen) return null;

  // Compute calculated participants
  const computedParticipants: SessionParticipant[] = rows.map((r) => {
    const { totalBuyIn, net } = calculateParticipantNet(r.buyIn, r.rebuys, r.cashOut);
    return {
      playerId: r.playerId,
      buyIn: Math.round(r.buyIn || 0),
      rebuys: Math.round(r.rebuys || 0),
      totalBuyIn,
      cashOut: Math.round(r.cashOut || 0),
      net,
    };
  });

  // Zero-Sum balance verification
  const balanceInfo = validateSessionBalance(computedParticipants);

  // Available players who are not yet added
  const availablePlayers = players.filter(
    (p) => !p.isArchived && !rows.some((r) => r.playerId === p.id)
  );

  const handleAddPlayerToSession = (playerId: string) => {
    setRows([...rows, { playerId, buyIn: 1000, rebuys: 0, cashOut: 0 }]);
  };

  const handleRemovePlayer = (playerId: string) => {
    setRows(rows.filter((r) => r.playerId !== playerId));
  };

  const handleFieldChange = (
    playerId: string,
    field: "buyIn" | "rebuys" | "cashOut",
    val: number
  ) => {
    setRows(
      rows.map((r) =>
        r.playerId === playerId ? { ...r, [field]: Math.max(0, val) } : r
      )
    );
  };

  const handleQuickAddPlayerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayerName.trim()) return;
    const created = addPlayer({ name: newPlayerName.trim() });
    setRows([...rows, { playerId: created.id, buyIn: 1000, rebuys: 0, cashOut: 0 }]);
    setNewPlayerName("");
    setShowQuickAddPlayer(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (rows.length < 2) {
      setErrorMsg("A poker session requires at least 2 players.");
      return;
    }

    if (!balanceInfo.isBalanced) {
      setErrorMsg(
        `Session is unbalanced! Total cash-outs must equal total buy-ins (discrepancy: ${
          balanceInfo.discrepancy > 0
            ? `+₹${balanceInfo.discrepancy}`
            : `-₹${Math.abs(balanceInfo.discrepancy)}`
        }).`
      );
      return;
    }

    if (existingSession) {
      const summary = editReason.trim() || "Session details updated";
      const res = updateSession(
        existingSession.id,
        {
          title: title.trim() || existingSession.title,
          date: new Date(date).toISOString(),
          cycleId: cycleId || existingSession.cycleId,
          gameType,
          notes: notes.trim() || undefined,
          participants: computedParticipants,
        },
        summary
      );
      if (!res.success) {
        setErrorMsg(res.error || "Failed to update session");
        return;
      }
    } else {
      const res = addSession({
        title: title.trim(),
        date: new Date(date).toISOString(),
        cycleId: cycleId || activeCycleId,
        gameType,
        notes: notes.trim() || undefined,
        participants: computedParticipants,
      });
      if (!res.success) {
        setErrorMsg(res.error || "Failed to create session");
        return;
      }
      // Confetti celebration
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#10b981", "#f59e0b", "#3b82f6"],
        });
      } catch (e) {
        // ignore if not supported
      }
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-poker-surface border border-poker-border rounded-2xl shadow-2xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-4 sm:p-6 border-b border-poker-border flex items-center justify-between bg-poker-card/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {existingSession ? `Edit ${existingSession.title}` : "Record New Poker Session"}
              </h2>
              <p className="text-xs text-slate-400">
                Track buy-ins, rebuys, and cash-outs with automated zero-sum balance
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-poker-border transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Session Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Session Title / Name
              </label>
              <input
                type="text"
                placeholder="e.g. Session #025"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 bg-poker-bg border border-poker-border rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Date &amp; Time
              </label>
              <input
                type="datetime-local"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full px-3 py-2 bg-poker-bg border border-poker-border rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Settlement Cycle
              </label>
              <select
                value={cycleId}
                onChange={(e) => setCycleId(e.target.value)}
                className="w-full px-3 py-2 bg-poker-bg border border-poker-border rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                {cycles.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.status === "active" ? "(Active)" : "(Closed)"}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Game Type</label>
              <input
                type="text"
                placeholder="NL Texas Hold'em ₹10/₹20"
                value={gameType}
                onChange={(e) => setGameType(e.target.value)}
                className="w-full px-3 py-2 bg-poker-bg border border-poker-border rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Player Chips & Cashouts Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Participants &amp; Chip Count</h3>
                <p className="text-xs text-slate-400">
                  Enter starting buy-in, any additional rebuys, and final cash-out chips
                </p>
              </div>

              {/* Add player dropdown */}
              <div className="flex items-center gap-2">
                {availablePlayers.length > 0 && (
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        handleAddPlayerToSession(e.target.value);
                        e.target.value = "";
                      }
                    }}
                    defaultValue=""
                    className="px-2.5 py-1.5 bg-poker-bg border border-poker-border rounded-xl text-xs text-slate-300 hover:border-emerald-500/50 focus:outline-none"
                  >
                    <option value="" disabled>
                      + Add Player to Table
                    </option>
                    {availablePlayers.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                )}

                <button
                  type="button"
                  onClick={() => setShowQuickAddPlayer(!showQuickAddPlayer)}
                  className="px-2.5 py-1.5 rounded-xl bg-poker-card border border-poker-border text-xs text-emerald-400 hover:bg-emerald-500/10 transition flex items-center gap-1 font-semibold"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Player</span>
                </button>
              </div>
            </div>

            {/* Quick add player inline input */}
            {showQuickAddPlayer && (
              <div className="p-3 bg-poker-card/80 border border-emerald-500/30 rounded-xl flex items-center gap-3 animate-in fade-in duration-150">
                <input
                  type="text"
                  placeholder="Player's full or nickname..."
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                  className="px-3 py-1.5 bg-poker-bg border border-poker-border rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500 flex-1"
                />
                <button
                  type="button"
                  onClick={handleQuickAddPlayerSubmit}
                  className="px-3 py-1.5 bg-emerald-500 text-slate-950 font-bold text-xs rounded-lg hover:bg-emerald-400 transition"
                >
                  Add &amp; Seat
                </button>
                <button
                  type="button"
                  onClick={() => setShowQuickAddPlayer(false)}
                  className="text-slate-400 hover:text-white text-xs"
                >
                  Cancel
                </button>
              </div>
            )}

            {/* Table of player rows */}
            <div className="overflow-x-auto border border-poker-border rounded-xl bg-poker-bg/50">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-poker-border bg-poker-surface/70 text-slate-400 uppercase text-[10px] font-semibold tracking-wider">
                    <th className="py-2.5 px-3">Player</th>
                    <th className="py-2.5 px-3 w-28 text-right">Starting Buy-in (₹)</th>
                    <th className="py-2.5 px-3 w-28 text-right">Rebuys (₹)</th>
                    <th className="py-2.5 px-3 w-28 text-right">Total Invested</th>
                    <th className="py-2.5 px-3 w-32 text-right">Cash-Out (₹)</th>
                    <th className="py-2.5 px-3 w-28 text-right">Net P&amp;L</th>
                    <th className="py-2.5 px-2 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-poker-border/40">
                  {rows.map((row) => {
                    const player = players.find((p) => p.id === row.playerId);
                    const playerName = player ? player.name : "Unknown";
                    const playerAvatar = player ? player.avatar : "#10b981";
                    const totalInvested = (row.buyIn || 0) + (row.rebuys || 0);
                    const net = (row.cashOut || 0) - totalInvested;

                    return (
                      <tr key={row.playerId} className="hover:bg-poker-surface/40 transition">
                        <td className="py-2.5 px-3 font-semibold text-white">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-slate-950 text-[10px]"
                              style={{ backgroundColor: playerAvatar }}
                            >
                              {playerName.slice(0, 2)}
                            </div>
                            <span>{playerName}</span>
                          </div>
                        </td>

                        {/* Starting Buy-in */}
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() =>
                                handleFieldChange(row.playerId, "buyIn", Math.max(0, (row.buyIn || 0) - 50))
                              }
                              className="px-1.5 py-0.5 text-[10px] font-bold bg-poker-bg border border-poker-border rounded text-slate-400 hover:text-red-400 transition"
                              title="Subtract ₹50"
                            >
                              -50
                            </button>
                            <input
                              type="number"
                              min="0"
                              step="50"
                              value={row.buyIn || ""}
                              onChange={(e) =>
                                handleFieldChange(row.playerId, "buyIn", Number(e.target.value))
                              }
                              className="w-16 text-center px-1 py-1 bg-poker-card border border-poker-border rounded-lg text-xs font-semibold text-white focus:outline-none focus:border-emerald-500 font-mono"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                handleFieldChange(row.playerId, "buyIn", (row.buyIn || 0) + 50)
                              }
                              className="px-1.5 py-0.5 text-[10px] font-bold bg-poker-bg border border-poker-border rounded text-slate-400 hover:text-emerald-400 transition"
                              title="Add ₹50"
                            >
                              +50
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleFieldChange(row.playerId, "buyIn", (row.buyIn || 0) + 500)
                              }
                              className="px-1.5 py-0.5 text-[10px] font-bold bg-poker-bg border border-poker-border rounded text-slate-400 hover:text-emerald-400 transition"
                              title="Add ₹500"
                            >
                              +500
                            </button>
                          </div>
                        </td>

                        {/* Rebuys */}
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() =>
                                handleFieldChange(row.playerId, "rebuys", Math.max(0, (row.rebuys || 0) - 50))
                              }
                              className="px-1.5 py-0.5 text-[10px] font-bold bg-poker-bg border border-poker-border rounded text-slate-400 hover:text-red-400 transition"
                              title="Subtract ₹50"
                            >
                              -50
                            </button>
                            <input
                              type="number"
                              min="0"
                              step="50"
                              value={row.rebuys || ""}
                              onChange={(e) =>
                                handleFieldChange(row.playerId, "rebuys", Number(e.target.value))
                              }
                              className="w-14 text-center px-1 py-1 bg-poker-card border border-poker-border rounded-lg text-xs font-semibold text-white focus:outline-none focus:border-emerald-500 font-mono"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                handleFieldChange(row.playerId, "rebuys", (row.rebuys || 0) + 50)
                              }
                              className="px-1.5 py-0.5 text-[10px] font-bold bg-poker-bg border border-poker-border rounded text-slate-400 hover:text-emerald-400 transition"
                              title="Add ₹50"
                            >
                              +50
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleFieldChange(row.playerId, "rebuys", (row.rebuys || 0) + 500)
                              }
                              className="px-1.5 py-0.5 text-[10px] font-bold bg-poker-bg border border-poker-border rounded text-slate-400 hover:text-emerald-400 transition"
                              title="Add ₹500 rebuy"
                            >
                              +500
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleFieldChange(row.playerId, "rebuys", (row.rebuys || 0) + 1000)
                              }
                              className="px-1.5 py-0.5 text-[10px] font-bold bg-poker-bg border border-poker-border rounded text-slate-400 hover:text-emerald-400 transition"
                              title="Add ₹1,000 rebuy"
                            >
                              +1k
                            </button>
                          </div>
                        </td>

                        {/* Total Invested */}
                        <td className="py-2.5 px-3 text-right text-slate-400 font-semibold text-xs">
                          {formatCurrency(totalInvested)}
                        </td>

                        {/* Cash-Out */}
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() =>
                                handleFieldChange(row.playerId, "cashOut", Math.max(0, (row.cashOut || 0) - 50))
                              }
                              className="px-1.5 py-0.5 text-[10px] font-bold bg-poker-bg border border-poker-border rounded text-slate-400 hover:text-red-400 transition"
                              title="Subtract ₹50"
                            >
                              -50
                            </button>
                            <input
                              type="number"
                              min="0"
                              step="50"
                              value={row.cashOut || ""}
                              onChange={(e) =>
                                handleFieldChange(row.playerId, "cashOut", Number(e.target.value))
                              }
                              className="w-20 text-center px-1 py-1 bg-poker-card border border-poker-border rounded-lg text-xs font-bold text-white focus:outline-none focus:border-emerald-500 font-mono"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                handleFieldChange(row.playerId, "cashOut", (row.cashOut || 0) + 50)
                              }
                              className="px-1.5 py-0.5 text-[10px] font-bold bg-poker-bg border border-poker-border rounded text-slate-400 hover:text-emerald-400 transition"
                              title="Add ₹50"
                            >
                              +50
                            </button>
                          </div>
                        </td>

                        {/* Net */}
                        <td className="py-2.5 px-3 text-right">
                          <span
                            className={`font-extrabold text-xs px-2 py-0.5 rounded ${
                              net > 0
                                ? "text-emerald-400 bg-emerald-500/10"
                                : net < 0
                                ? "text-red-400 bg-red-500/10"
                                : "text-slate-400"
                            }`}
                          >
                            {formatCurrency(net, true)}
                          </span>
                        </td>

                        {/* Remove */}
                        <td className="py-2.5 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemovePlayer(row.playerId)}
                            className="p-1 text-slate-500 hover:text-red-400 transition"
                            title="Remove player"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* LIVE ZERO-SUM BALANCE BAR */}
          <div
            className={`p-4 rounded-xl border transition-all ${
              balanceInfo.isBalanced
                ? "bg-emerald-950/20 border-emerald-500/40"
                : "bg-amber-950/20 border-amber-500/40"
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {balanceInfo.isBalanced ? (
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                )}
                <div>
                  <div className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                    <span>
                      {balanceInfo.isBalanced
                        ? "Session is Balanced to Zero"
                        : "Session Balance Mismatch"}
                    </span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                        balanceInfo.isBalanced
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-amber-500/20 text-amber-400"
                      }`}
                    >
                      Net: {formatCurrency(balanceInfo.discrepancy, true)}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {balanceInfo.isBalanced
                      ? "Total Cash-outs equal Total Buy-ins. Ready to record."
                      : balanceInfo.discrepancy > 0
                      ? `Cash-outs exceed buy-ins by ₹${balanceInfo.discrepancy}. Check if someone had an unrecorded rebuy.`
                      : `Buy-ins exceed cash-outs by ₹${Math.abs(balanceInfo.discrepancy)}. Check missing chips.`}
                  </p>
                </div>
              </div>

              {/* Totals Summary */}
              <div className="flex items-center gap-4 text-xs shrink-0 bg-poker-bg/80 px-3 py-1.5 rounded-lg border border-poker-border">
                <div>
                  <span className="text-slate-400 block text-[10px]">Total Buy-ins</span>
                  <span className="font-bold text-slate-200">
                    {formatCurrency(balanceInfo.totalBuyIn)}
                  </span>
                </div>
                <div className="text-slate-600 font-bold">=</div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Total Cash-outs</span>
                  <span className="font-bold text-slate-200">
                    {formatCurrency(balanceInfo.totalCashOut)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Edit History Reason (Only when editing) */}
          {existingSession && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Reason for Edit (Logged in audit history)
              </label>
              <input
                type="text"
                placeholder="e.g. Corrected Keshav's cashout chips"
                value={editReason}
                onChange={(e) => setEditReason(e.target.value)}
                className="w-full px-3 py-2 bg-poker-bg border border-poker-border rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Session Notes (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Hosted at Keshav's flat, big hand between Anuj and Abhishek..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-poker-bg border border-poker-border rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-poker-border flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={!balanceInfo.isBalanced || rows.length < 2}
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-lg transition flex items-center gap-2 ${
                balanceInfo.isBalanced && rows.length >= 2
                  ? "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 shadow-emerald-500/25 cursor-pointer active:scale-95"
                  : "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{existingSession ? "Save Changes" : "Save Poker Session"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
