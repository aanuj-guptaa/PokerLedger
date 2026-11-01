"use client";

import React from "react";
import { usePoker } from "../../context/PokerContext";
import { formatCurrency } from "../../lib/pokerMath";

export default function StatCards({ onNavigate }: { onNavigate?: (tab: string) => void }) {
  const { sessions, players, activeCycle, activeCycleBalances } = usePoker();

  const totalSessions = sessions.length;
  const totalVolume = sessions.reduce((sum, s) => sum + (s.totalPot || 0), 0);
  const activePlayers = players.filter((p) => !p.isArchived).length;

  let totalDebt = 0;
  for (const summary of Array.from(activeCycleBalances.values())) {
    if (summary.outstandingBalance > 0) {
      totalDebt += summary.outstandingBalance;
    }
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {/* Total Sessions */}
      <div className="bg-poker-surface/80 rounded-xl p-4 border border-poker-border">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
          Sessions
        </span>
        <div className="mt-2 text-2xl font-bold text-white">
          {totalSessions}
        </div>
        <div className="mt-1 text-[11px] text-slate-500">
          {totalSessions === 0 ? "No games yet" : `${totalSessions} recorded`}
        </div>
      </div>

      {/* Total Pot Volume */}
      <div className="bg-poker-surface/80 rounded-xl p-4 border border-poker-border">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
          Total Pot
        </span>
        <div className="mt-2 text-2xl font-bold text-white">
          {formatCurrency(totalVolume)}
        </div>
        <div className="mt-1 text-[11px] text-slate-500">
          {totalVolume === 0 ? "₹0 chips exchanged" : "All-time buy-ins"}
        </div>
      </div>

      {/* Active Players */}
      <div
        onClick={() => onNavigate?.("players")}
        className="bg-poker-surface/80 rounded-xl p-4 border border-poker-border hover:border-slate-600 transition cursor-pointer"
      >
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
          Active Players
        </span>
        <div className="mt-2 text-2xl font-bold text-white">
          {activePlayers}
        </div>
        <div className="mt-1 text-[11px] text-slate-500">
          In group ledger
        </div>
      </div>

      {/* Group Net Debt */}
      <div
        onClick={() => onNavigate?.("settlements")}
        className="bg-poker-surface/80 rounded-xl p-4 border border-poker-border hover:border-slate-600 transition cursor-pointer"
      >
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
          Outstanding Debt
        </span>
        <div className="mt-2 text-2xl font-bold text-emerald-400">
          {formatCurrency(totalDebt)}
        </div>
        <div className="mt-1 text-[11px] text-emerald-500/80">
          {totalDebt === 0 ? "Net 0 (All settled)" : "Needs settlement"}
        </div>
      </div>
    </div>
  );
}
