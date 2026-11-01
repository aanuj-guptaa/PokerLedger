"use client";

import React, { useState } from "react";
import {
  Scale,
  TrendingUp,
  TrendingDown,
  Sparkles,
  CheckCircle2,
  Calendar,
} from "lucide-react";
import { usePoker } from "../../context/PokerContext";
import { formatCurrency, calculateCycleBalances } from "../../lib/pokerMath";

interface LiveBalancesViewProps {
  onNavigateToSettlements: () => void;
  onSelectPlayer: (playerId: string) => void;
}

export default function LiveBalancesView({
  onNavigateToSettlements,
  onSelectPlayer,
}: LiveBalancesViewProps) {
  const { players, sessions, settlements, cycles, activeCycleId } = usePoker();
  const [selectedCycleId, setSelectedCycleId] = useState(activeCycleId);

  const balanceMap = calculateCycleBalances(selectedCycleId, players, sessions, settlements);
  const activeCycle = cycles.find((c) => c.id === selectedCycleId) || cycles[0];

  const creditors: { playerId: string; name: string; avatar: string; upiId?: string; balance: number }[] = [];
  const debtors: { playerId: string; name: string; avatar: string; upiId?: string; balance: number }[] = [];
  const settled: { playerId: string; name: string; avatar: string }[] = [];

  let totalDebt = 0;

  for (const player of players) {
    if (player.isArchived) continue;
    const summary = balanceMap.get(player.id);
    if (!summary) continue;

    const bal = summary.outstandingBalance;
    if (bal > 0) {
      creditors.push({
        playerId: player.id,
        name: player.name,
        avatar: player.avatar,
        upiId: player.upiId,
        balance: bal,
      });
      totalDebt += bal;
    } else if (bal < 0) {
      debtors.push({
        playerId: player.id,
        name: player.name,
        avatar: player.avatar,
        upiId: player.upiId,
        balance: bal,
      });
    } else {
      settled.push({
        playerId: player.id,
        name: player.name,
        avatar: player.avatar,
      });
    }
  }

  creditors.sort((a, b) => b.balance - a.balance);
  debtors.sort((a, b) => a.balance - b.balance);

  const isAllSettled = creditors.length === 0 && debtors.length === 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Live Group Balances</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Cumulative outstanding balance for each member in {activeCycle?.name}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-poker-surface px-2.5 py-1.5 rounded-lg border border-poker-border text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedCycleId}
              onChange={(e) => setSelectedCycleId(e.target.value)}
              className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
            >
              {cycles.map((c) => (
                <option key={c.id} value={c.id} className="bg-poker-surface text-white">
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {!isAllSettled && (
            <button
              onClick={onNavigateToSettlements}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Settlement Plan</span>
            </button>
          )}
        </div>
      </div>

      {/* When Net 0 (All Settled) */}
      {isAllSettled ? (
        <div className="bg-poker-surface/60 rounded-xl p-8 border border-poker-border text-center space-y-3">
          <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">All Balances are at Net ₹0</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              There are no outstanding debts. Every member is completely settled.
            </p>
          </div>

          {/* Clean Member Roster */}
          <div className="pt-4 max-w-md mx-auto">
            <div className="border border-poker-border rounded-lg overflow-hidden bg-poker-bg/40 divide-y divide-poker-border/50 text-xs">
              {players.filter((p) => !p.isArchived).map((p) => (
                <div
                  key={p.id}
                  onClick={() => onSelectPlayer(p.id)}
                  className="px-4 py-2.5 flex items-center justify-between hover:bg-poker-surface/50 cursor-pointer transition"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-slate-950 text-[10px]"
                      style={{ backgroundColor: p.avatar }}
                    >
                      {p.name.slice(0, 2)}
                    </div>
                    <span className="font-medium text-white">{p.name}</span>
                  </div>
                  <span className="font-semibold text-slate-400 font-mono">₹0</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* When there are active balances */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Creditors */}
          <div className="bg-poker-surface/80 rounded-xl border border-poker-border p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-poker-border/60 pb-2">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" />
                Owed Money ({creditors.length})
              </span>
              <span className="text-xs font-bold text-emerald-400 font-mono">
                +{formatCurrency(totalDebt)}
              </span>
            </div>

            <div className="space-y-2">
              {creditors.map((item) => (
                <div
                  key={item.playerId}
                  onClick={() => onSelectPlayer(item.playerId)}
                  className="p-2.5 rounded-lg bg-poker-bg/60 border border-poker-border hover:border-emerald-500/40 cursor-pointer flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-slate-950 text-[10px]"
                      style={{ backgroundColor: item.avatar }}
                    >
                      {item.name.slice(0, 2)}
                    </div>
                    <span className="font-semibold text-white">{item.name}</span>
                  </div>
                  <span className="font-bold text-emerald-400 font-mono">
                    +{formatCurrency(item.balance)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Debtors */}
          <div className="bg-poker-surface/80 rounded-xl border border-poker-border p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-poker-border/60 pb-2">
              <span className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                <TrendingDown className="w-3.5 h-3.5" />
                Owes Money ({debtors.length})
              </span>
              <span className="text-xs font-bold text-red-400 font-mono">
                -{formatCurrency(totalDebt)}
              </span>
            </div>

            <div className="space-y-2">
              {debtors.map((item) => (
                <div
                  key={item.playerId}
                  onClick={() => onSelectPlayer(item.playerId)}
                  className="p-2.5 rounded-lg bg-poker-bg/60 border border-poker-border hover:border-red-500/40 cursor-pointer flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-slate-950 text-[10px]"
                      style={{ backgroundColor: item.avatar }}
                    >
                      {item.name.slice(0, 2)}
                    </div>
                    <span className="font-semibold text-white">{item.name}</span>
                  </div>
                  <span className="font-bold text-red-400 font-mono">
                    {formatCurrency(item.balance)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
