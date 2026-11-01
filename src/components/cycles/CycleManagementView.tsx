"use client";

import React, { useState } from "react";
import {
  CalendarDays,
  PlusCircle,
  CheckCircle2,
  Lock,
  Clock,
  Layers,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  AlertTriangle,
  X,
  History,
} from "lucide-react";
import confetti from "canvas-confetti";
import { usePoker } from "../../context/PokerContext";
import { SettlementCycle } from "../../types/poker";
import { formatCurrency, calculateCycleBalances } from "../../lib/pokerMath";

interface CycleManagementViewProps {
  onNavigateToSettlements: () => void;
  onSelectSession: (sessionId: string) => void;
}

export default function CycleManagementView({
  onNavigateToSettlements,
  onSelectSession,
}: CycleManagementViewProps) {
  const {
    cycles,
    activeCycle,
    activeCycleId,
    startNewCycle,
    closeCycle,
    setActiveCycleId,
    players,
    sessions,
    settlements,
  } = usePoker();

  // Modal states
  const [showNewCycleModal, setShowNewCycleModal] = useState(false);
  const [newCycleName, setNewCycleName] = useState("");
  const [newCycleNotes, setNewCycleNotes] = useState("");

  const [inspectCycleId, setInspectCycleId] = useState<string | null>(null);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  const inspectedCycle =
    cycles.find((c) => c.id === (inspectCycleId || activeCycle?.id)) || activeCycle;

  // Compute balances for the inspected cycle
  const inspectedBalances = calculateCycleBalances(
    inspectedCycle?.id || "",
    players,
    sessions,
    settlements
  );

  const inspectedSessions = sessions.filter((s) => s.cycleId === inspectedCycle?.id);
  const inspectedSettlements = settlements.filter(
    (st) => st.cycleId === inspectedCycle?.id && st.status === "completed"
  );

  let totalUnsettled = 0;
  for (const s of Array.from(inspectedBalances.values())) {
    if (s.outstandingBalance > 0) totalUnsettled += s.outstandingBalance;
  }

  const handleStartCycleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const created = startNewCycle(newCycleName.trim(), undefined, newCycleNotes.trim());
    setShowNewCycleModal(false);
    setNewCycleName("");
    setNewCycleNotes("");
    setInspectCycleId(created.id);
  };

  const handleCloseActiveCycle = () => {
    if (!activeCycle) return;
    closeCycle(activeCycle.id, "Cycle closed and balances archived.");
    setShowCloseConfirm(false);

    try {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch (e) {}

    // Auto-prompt to start next cycle
    const nextNum = (activeCycle.cycleNumber || 1) + 1;
    startNewCycle(`Cycle #${nextNum}`, undefined, "Started automatically after closing cycle.");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <CalendarDays className="w-4 h-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Settlement Cycles
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Manage ~10-day settlement periods. Closing a cycle resets active balances to ₹0 while
            preserving all lifetime session history.
          </p>
        </div>

        <button
          onClick={() => {
            const nextNum = cycles.length + 1;
            setNewCycleName(`Cycle #${nextNum}: ${new Date().toLocaleDateString("en-IN", { month: "short", day: "numeric" })} onwards`);
            setShowNewCycleModal(true);
          }}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-bold text-xs sm:text-sm shadow-md shadow-emerald-500/20 active:scale-95 transition"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Start New Cycle</span>
        </button>
      </div>

      {/* Cycle Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-poker-border">
        {cycles.map((c) => {
          const isInspected = inspectedCycle?.id === c.id;
          const isActive = c.status === "active";
          return (
            <button
              key={c.id}
              onClick={() => setInspectCycleId(c.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                isInspected
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                  : "bg-poker-surface text-slate-400 hover:text-slate-200 border border-poker-border"
              }`}
            >
              {isActive ? (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              ) : (
                <Lock className="w-3 h-3 text-slate-500" />
              )}
              <span>{c.name}</span>
              {isActive && (
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-extrabold uppercase">
                  Current
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Inspected Cycle Card Overview */}
      {inspectedCycle && (
        <div className="card-glass rounded-2xl p-5 sm:p-6 border border-poker-border space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-white">{inspectedCycle.name}</h2>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                    inspectedCycle.status === "active"
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "bg-slate-800 text-slate-400 border border-slate-700"
                  }`}
                >
                  {inspectedCycle.status}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Started on {new Date(inspectedCycle.startDate).toLocaleDateString("en-IN", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
                {inspectedCycle.endDate &&
                  ` — Ended on ${new Date(inspectedCycle.endDate).toLocaleDateString("en-IN", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}`}
              </p>
              {inspectedCycle.notes && (
                <p className="text-xs text-slate-300 italic mt-1">{inspectedCycle.notes}</p>
              )}
            </div>

            {/* Cycle Actions */}
            {inspectedCycle.status === "active" && (
              <div className="flex items-center gap-2">
                <button
                  onClick={onNavigateToSettlements}
                  className="px-3 py-1.5 rounded-xl bg-poker-surface border border-poker-border hover:border-emerald-500/50 text-xs font-bold text-emerald-400 transition"
                >
                  Settlement Plan
                </button>
                <button
                  onClick={() => setShowCloseConfirm(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-red-600/90 hover:bg-red-500 text-white text-xs font-bold shadow transition"
                >
                  Close Cycle &amp; Reset Balances
                </button>
              </div>
            )}
          </div>

          {/* Close Confirmation Alert */}
          {showCloseConfirm && (
            <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/40 space-y-3 animate-in fade-in duration-150">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-white">Close {inspectedCycle.name}?</h4>
                  <p className="text-xs text-slate-300 mt-0.5">
                    {totalUnsettled > 0
                      ? `There are still ${formatCurrency(totalUnsettled)} in unsettled debts. Closing will archive this cycle and carry forward or zero-out balances for the next cycle. Historical session logs remain 100% intact.`
                      : "All debts are settled! Closing will archive this cycle and start Cycle #" +
                        (inspectedCycle.cycleNumber + 1) +
                        " with fresh zero balances."}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 justify-end">
                <button
                  onClick={() => setShowCloseConfirm(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCloseActiveCycle}
                  className="px-4 py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-bold text-xs shadow"
                >
                  Confirm &amp; Start Next Cycle
                </button>
              </div>
            </div>
          )}

          {/* KPI Strip for this cycle */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-poker-bg rounded-xl border border-poker-border">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">
                Sessions in Cycle
              </span>
              <span className="text-lg font-extrabold text-white block mt-1">
                {inspectedSessions.length} games
              </span>
            </div>

            <div className="p-3 bg-poker-bg rounded-xl border border-poker-border">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Pot Volume</span>
              <span className="text-lg font-extrabold text-white block mt-1">
                {formatCurrency(
                  inspectedSessions.reduce((sum, s) => sum + (s.totalPot || 0), 0)
                )}
              </span>
            </div>

            <div className="p-3 bg-poker-bg rounded-xl border border-poker-border">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">
                Unsettled Debts
              </span>
              <span className="text-lg font-extrabold text-amber-400 block mt-1">
                {formatCurrency(totalUnsettled)}
              </span>
            </div>

            <div className="p-3 bg-poker-bg rounded-xl border border-poker-border">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">
                Settled Payments
              </span>
              <span className="text-lg font-extrabold text-emerald-400 block mt-1">
                {inspectedSettlements.length} transfers
              </span>
            </div>
          </div>

          {/* Player Balances Table in this Cycle */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Player Balances in this Cycle
            </h3>

            <div className="border border-poker-border rounded-xl overflow-hidden bg-poker-bg/50">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-poker-border bg-poker-surface/70 text-slate-400 uppercase text-[10px] font-semibold tracking-wider">
                    <th className="py-2.5 px-3">Player</th>
                    <th className="py-2.5 px-3 text-right">Cycle Sessions Net</th>
                    <th className="py-2.5 px-3 text-right">Settlements Paid</th>
                    <th className="py-2.5 px-3 text-right">Settlements Received</th>
                    <th className="py-2.5 px-3 text-right">Outstanding Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-poker-border/40 font-medium">
                  {players
                    .filter((p) => !p.isArchived)
                    .map((p) => {
                      const summary = inspectedBalances.get(p.id);
                      const sessionNet = summary?.cycleSessionNet || 0;
                      const paid = summary?.cycleSettlementPaid || 0;
                      const received = summary?.cycleSettlementReceived || 0;
                      const balance = summary?.outstandingBalance || 0;

                      return (
                        <tr key={p.id} className="hover:bg-poker-surface/40 transition">
                          <td className="py-2.5 px-3 font-semibold text-white">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-slate-950 text-[10px]"
                                style={{ backgroundColor: p.avatar }}
                              >
                                {p.name.slice(0, 2)}
                              </div>
                              <span>{p.name}</span>
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-300">
                            {formatCurrency(sessionNet, true)}
                          </td>
                          <td className="py-2.5 px-3 text-right text-emerald-400">
                            {paid > 0 ? `+₹${paid}` : "—"}
                          </td>
                          <td className="py-2.5 px-3 text-right text-red-400">
                            {received > 0 ? `-₹${received}` : "—"}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <span
                              className={`px-2 py-0.5 rounded font-extrabold text-xs ${
                                balance > 0
                                  ? "text-emerald-400 bg-emerald-500/10"
                                  : balance < 0
                                  ? "text-red-400 bg-red-500/10"
                                  : "text-slate-400"
                              }`}
                            >
                              {formatCurrency(balance, true)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Sessions List in this Cycle */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Recorded Sessions in this Cycle ({inspectedSessions.length})
            </h3>
            {inspectedSessions.length === 0 ? (
              <p className="text-xs text-slate-500 py-3 italic">
                No sessions recorded in this cycle yet.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {inspectedSessions.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => onSelectSession(s.id)}
                    className="p-3 rounded-xl bg-poker-bg border border-poker-border hover:border-emerald-500/40 transition cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-xs text-white hover:text-emerald-400">
                        {s.title}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {new Date(s.date).toLocaleDateString("en-IN", {
                          month: "short",
                          day: "numeric",
                        })}{" "}
                        • {s.participants.length} players
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-white">{formatCurrency(s.totalPot)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Start New Cycle Modal */}
      {showNewCycleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-poker-surface border border-poker-border rounded-2xl p-6 shadow-2xl relative">
            <button
              onClick={() => setShowNewCycleModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <form onSubmit={handleStartCycleSubmit} className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-white">Start New Settlement Cycle</h3>
                <p className="text-xs text-slate-400">
                  Starts a new ~10-day period. Current active cycle will be marked closed.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Cycle Name
                </label>
                <input
                  type="text"
                  value={newCycleName}
                  onChange={(e) => setNewCycleName(e.target.value)}
                  className="w-full px-3 py-2 bg-poker-bg border border-poker-border rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. November first cycle..."
                  value={newCycleNotes}
                  onChange={(e) => setNewCycleNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-poker-bg border border-poker-border rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewCycleModal(false)}
                  className="flex-1 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow"
                >
                  Create Cycle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
