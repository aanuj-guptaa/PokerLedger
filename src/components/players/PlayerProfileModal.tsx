"use client";

import React, { useMemo } from "react";
import {
  X,
  Trophy,
  TrendingUp,
  TrendingDown,
  Layers,
  Coins,
  CreditCard,
  QrCode,
  Calendar,
  CheckCircle2,
  Edit,
  Trash2,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { usePoker } from "../../context/PokerContext";
import { formatCurrency, calculatePlayerStats } from "../../lib/pokerMath";

interface PlayerProfileModalProps {
  playerId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onEditPlayer: (playerId: string) => void;
  onSelectSession: (sessionId: string) => void;
}

export default function PlayerProfileModal({
  playerId,
  isOpen,
  onClose,
  onEditPlayer,
  onSelectSession,
}: PlayerProfileModalProps) {
  const { players, sessions, settlements, activeCycleId, deletePlayer } = usePoker();

  if (!isOpen || !playerId) return null;

  const player = players.find((p) => p.id === playerId);
  if (!player) return null;

  const stats = calculatePlayerStats(
    playerId,
    players,
    sessions,
    settlements,
    activeCycleId
  );

  // Filter player sessions chronologically for chart and table
  const playerSessions = useMemo(() => {
    return sessions
      .filter((s) => s.participants.some((p) => p.playerId === playerId))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [sessions, playerId]);

  // Build cumulative P&L progression data for Recharts
  const chartData = useMemo(() => {
    let runningNet = 0;
    const points = [{ sessionName: "Start", net: 0, date: "" }];

    for (const s of playerSessions) {
      const part = s.participants.find((p) => p.playerId === playerId);
      if (part) {
        runningNet += part.net;
        points.push({
          sessionName: s.title.replace("Session #", "#"),
          net: runningNet,
          date: new Date(s.date).toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
        });
      }
    }
    return points;
  }, [playerSessions, playerId]);

  // Settlements involving this player
  const playerSettlements = settlements.filter(
    (st) => st.fromPlayerId === playerId || st.toPlayerId === playerId
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-poker-surface border border-poker-border rounded-2xl shadow-2xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-poker-border flex items-center justify-between bg-poker-card/50">
          <div className="flex items-center gap-3.5">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center font-extrabold text-slate-950 text-base shadow-md"
              style={{ backgroundColor: player.avatar }}
            >
              {player.name.slice(0, 2)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-white">{player.name}</h2>
                <button
                  onClick={() => onEditPlayer(player.id)}
                  className="p-1 text-slate-400 hover:text-white"
                  title="Edit player"
                >
                  <Edit className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Are you sure you want to delete "${player.name}" from the ledger?`)) {
                      deletePlayer(player.id, true);
                      onClose();
                    }
                  }}
                  className="p-1 text-slate-400 hover:text-red-400"
                  title="Delete player"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="text-xs text-slate-400 flex items-center gap-3 mt-0.5">
                {player.upiId && <span className="font-mono text-slate-300">{player.upiId}</span>}
                {player.phone && <span>{player.phone}</span>}
                <span>Player ID: {player.id}</span>
              </div>
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
        <div className="p-4 sm:p-6 space-y-6">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Lifetime Net */}
            <div className="p-3.5 bg-poker-bg rounded-xl border border-poker-border">
              <span className="text-[11px] text-slate-400 block font-medium">Lifetime Net P&amp;L</span>
              <div
                className={`text-lg sm:text-xl font-extrabold mt-1 ${
                  stats.lifetimeNet > 0
                    ? "text-emerald-400"
                    : stats.lifetimeNet < 0
                    ? "text-red-400"
                    : "text-slate-300"
                }`}
              >
                {formatCurrency(stats.lifetimeNet, true)}
              </div>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                ROI: {stats.roiPercentage > 0 ? `+${stats.roiPercentage}%` : `${stats.roiPercentage}%`}
              </span>
            </div>

            {/* Current Cycle Balance */}
            <div className="p-3.5 bg-poker-bg rounded-xl border border-poker-border">
              <span className="text-[11px] text-slate-400 block font-medium">Cycle Balance</span>
              <div
                className={`text-lg sm:text-xl font-extrabold mt-1 ${
                  stats.cycleBalance > 0
                    ? "text-emerald-400"
                    : stats.cycleBalance < 0
                    ? "text-red-400"
                    : "text-slate-300"
                }`}
              >
                {formatCurrency(stats.cycleBalance, true)}
              </div>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                {stats.cycleBalance > 0
                  ? "Owed to player"
                  : stats.cycleBalance < 0
                  ? "Owes group"
                  : "Settled"}
              </span>
            </div>

            {/* Win Rate */}
            <div className="p-3.5 bg-poker-bg rounded-xl border border-poker-border">
              <span className="text-[11px] text-slate-400 block font-medium">Win Rate</span>
              <div className="text-lg sm:text-xl font-extrabold text-white mt-1">
                {stats.winRate}%
              </div>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                {stats.winningSessions}W / {stats.losingSessions}L / {stats.breakevenSessions}D
              </span>
            </div>

            {/* Total Buy-in & Cashout */}
            <div className="p-3.5 bg-poker-bg rounded-xl border border-poker-border">
              <span className="text-[11px] text-slate-400 block font-medium">Total Chips Volume</span>
              <div className="text-sm font-bold text-slate-200 mt-1">
                Buy: {formatCurrency(stats.totalBuyIn)}
              </div>
              <div className="text-sm font-bold text-emerald-400">
                Cash: {formatCurrency(stats.totalCashOut)}
              </div>
            </div>
          </div>

          {/* Biggest Win and Loss Callout Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 bg-emerald-950/20 border border-emerald-500/30 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[11px] text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1">
                  <Trophy className="w-3.5 h-3.5" />
                  Biggest Winning Session
                </span>
                <div className="text-base font-extrabold text-white mt-1">
                  {stats.biggestWin ? formatCurrency(stats.biggestWin.amount, true) : "—"}
                </div>
                <div className="text-[11px] text-slate-400">
                  {stats.biggestWin ? stats.biggestWin.sessionTitle : "None recorded"}
                </div>
              </div>
              <TrendingUp className="w-8 h-8 text-emerald-500/30" />
            </div>

            <div className="p-3.5 bg-red-950/20 border border-red-500/30 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[11px] text-red-400 font-bold uppercase tracking-wider flex items-center gap-1">
                  <TrendingDown className="w-3.5 h-3.5" />
                  Biggest Losing Session
                </span>
                <div className="text-base font-extrabold text-white mt-1">
                  {stats.biggestLoss ? formatCurrency(stats.biggestLoss.amount, true) : "—"}
                </div>
                <div className="text-[11px] text-slate-400">
                  {stats.biggestLoss ? stats.biggestLoss.sessionTitle : "None recorded"}
                </div>
              </div>
              <TrendingDown className="w-8 h-8 text-red-500/30" />
            </div>
          </div>

          {/* Cumulative Profit/Loss Progression Chart */}
          <div className="p-4 bg-poker-bg rounded-xl border border-poker-border">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Cumulative Profit / Loss Timeline
              </h3>
              <span className="text-[11px] text-slate-400">
                {playerSessions.length} sessions played
              </span>
            </div>

            <div className="h-48 w-full">
              {chartData.length <= 1 ? (
                <div className="h-full flex items-center justify-center text-xs text-slate-500">
                  Play more sessions to view performance graph
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="pokerGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2d44" />
                    <XAxis dataKey="sessionName" stroke="#64748b" fontSize={10} />
                    <YAxis stroke="#64748b" fontSize={10} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const val = payload[0].value as number;
                          return (
                            <div className="p-2 rounded-lg bg-poker-surface border border-poker-border text-xs shadow-lg">
                              <span className="text-slate-400 block">{payload[0].payload.sessionName}</span>
                              <span className={`font-bold ${val >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                                {formatCurrency(val, true)}
                              </span>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <ReferenceLine y={0} stroke="#475569" strokeDasharray="2 2" />
                    <Area
                      type="monotone"
                      dataKey="net"
                      stroke="#10b981"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#pokerGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Session History Table for this Player */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Recent Session Records
            </h3>
            <div className="border border-poker-border rounded-xl overflow-hidden bg-poker-bg/50">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-poker-border bg-poker-surface/70 text-slate-400 uppercase text-[10px] font-semibold tracking-wider">
                    <th className="py-2 px-3">Session</th>
                    <th className="py-2 px-3">Date</th>
                    <th className="py-2 px-3 text-right">Buy-in</th>
                    <th className="py-2 px-3 text-right">Rebuys</th>
                    <th className="py-2 px-3 text-right">Cash-out</th>
                    <th className="py-2 px-3 text-right">Net</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-poker-border/40 font-medium">
                  {playerSessions
                    .slice()
                    .reverse()
                    .map((s) => {
                      const part = s.participants.find((p) => p.playerId === playerId);
                      if (!part) return null;
                      const isPositive = part.net > 0;
                      const isNegative = part.net < 0;

                      return (
                        <tr
                          key={s.id}
                          onClick={() => {
                            onClose();
                            onSelectSession(s.id);
                          }}
                          className="hover:bg-poker-surface/40 transition cursor-pointer"
                        >
                          <td className="py-2.5 px-3 font-bold text-white hover:text-emerald-400">
                            {s.title}
                          </td>
                          <td className="py-2.5 px-3 text-slate-400 text-xs">
                            {new Date(s.date).toLocaleDateString("en-IN", {
                              month: "short",
                              day: "numeric",
                            })}
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-300">
                            {formatCurrency(part.buyIn)}
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-400">
                            {part.rebuys > 0 ? formatCurrency(part.rebuys) : "—"}
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-200">
                            {formatCurrency(part.cashOut)}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <span
                              className={`px-2 py-0.5 rounded font-extrabold text-xs ${
                                isPositive
                                  ? "text-emerald-400 bg-emerald-500/10"
                                  : isNegative
                                  ? "text-red-400 bg-red-500/10"
                                  : "text-slate-400"
                              }`}
                            >
                              {formatCurrency(part.net, true)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Settlement History */}
          {playerSettlements.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Settlement Payment Transfers ({playerSettlements.length})
              </h3>
              <div className="space-y-1.5 text-xs">
                {playerSettlements.map((tx) => {
                  const isPayer = tx.fromPlayerId === playerId;
                  const otherPlayerId = isPayer ? tx.toPlayerId : tx.fromPlayerId;
                  const otherPlayer = players.find((p) => p.id === otherPlayerId);
                  const otherName = otherPlayer ? otherPlayer.name : "Player";

                  return (
                    <div
                      key={tx.id}
                      className="p-2.5 rounded-lg bg-poker-bg border border-poker-border flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        {isPayer ? (
                          <ArrowUpRight className="w-3.5 h-3.5 text-red-400" />
                        ) : (
                          <ArrowDownRight className="w-3.5 h-3.5 text-emerald-400" />
                        )}
                        <span className="text-slate-300">
                          {isPayer ? `Paid to ${otherName}` : `Received from ${otherName}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`font-bold ${isPayer ? "text-red-400" : "text-emerald-400"}`}>
                          {isPayer ? `-₹${tx.amount}` : `+₹${tx.amount}`}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {tx.paidAt ? new Date(tx.paidAt).toLocaleDateString("en-IN") : "Pending"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
