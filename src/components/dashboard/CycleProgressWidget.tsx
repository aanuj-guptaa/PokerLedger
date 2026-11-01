"use client";

import React from "react";
import { Sparkles, Calendar, ArrowRight, ShieldCheck, CreditCard } from "lucide-react";
import { usePoker } from "../../context/PokerContext";
import { formatCurrency } from "../../lib/pokerMath";

export default function CycleProgressWidget({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const { activeCycle, activeCycleBalances, optimizedSettlements, settlements } = usePoker();

  let totalDebtAmount = 0;
  for (const summary of Array.from(activeCycleBalances.values())) {
    if (summary.outstandingBalance > 0) {
      totalDebtAmount += summary.outstandingBalance;
    }
  }

  // Count completed payments in this cycle
  const completedCycleSettlements = settlements.filter(
    (st) => st.cycleId === activeCycle?.id && st.status === "completed"
  );
  const totalSettledAmount = completedCycleSettlements.reduce((sum, st) => sum + st.amount, 0);

  const totalPool = totalDebtAmount + totalSettledAmount;
  const progressPercent = totalPool > 0 ? Math.round((totalSettledAmount / totalPool) * 100) : 0;

  return (
    <div className="card-glass rounded-2xl p-5 border border-poker-border relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute -top-12 -right-12 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Active Settlement Cycle
            </span>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              Every ~10 Days
            </span>
          </div>
          <h3 className="text-lg font-extrabold text-white mt-1.5">
            {activeCycle?.name || "Current Cycle"}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Automatic calculation of who owes whom across all games
          </p>
        </div>

        <button
          onClick={() => onNavigate("settlements")}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition active:scale-95 shrink-0"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Settle Debts</span>
          <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
        </button>
      </div>

      {/* Settlement summary metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-poker-border/60">
        <div>
          <span className="text-[11px] text-slate-400 block">Pending to Settle</span>
          <span className="text-base sm:text-lg font-extrabold text-amber-400">
            {formatCurrency(totalDebtAmount)}
          </span>
        </div>
        <div>
          <span className="text-[11px] text-slate-400 block">Optimized Transactions</span>
          <span className="text-base sm:text-lg font-extrabold text-white flex items-center gap-1">
            <CreditCard className="w-4 h-4 text-emerald-400" />
            {optimizedSettlements.length} transfers
          </span>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <span className="text-[11px] text-slate-400 block">Settled so far</span>
          <span className="text-base sm:text-lg font-extrabold text-emerald-400">
            {formatCurrency(totalSettledAmount)}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      {totalPool > 0 && (
        <div className="mt-4">
          <div className="flex justify-between text-[11px] text-slate-400 mb-1">
            <span>Cycle Settlement Progress</span>
            <span className="font-semibold text-slate-200">{progressPercent}% complete</span>
          </div>
          <div className="w-full h-2 rounded-full bg-poker-bg overflow-hidden border border-poker-border">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
