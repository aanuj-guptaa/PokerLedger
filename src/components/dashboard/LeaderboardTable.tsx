"use client";

import React, { useState, useMemo } from "react";
import { Search, Plus } from "lucide-react";
import { usePoker } from "../../context/PokerContext";
import { formatCurrency } from "../../lib/pokerMath";

interface LeaderboardTableProps {
  onSelectPlayer: (playerId: string) => void;
  onNavigateToPlayers?: () => void;
}

export default function LeaderboardTable({
  onSelectPlayer,
  onNavigateToPlayers,
}: LeaderboardTableProps) {
  const { players, sessions, activeCycle, activeCycleBalances } = usePoker();
  const [search, setSearch] = useState("");

  const leaderboardData = useMemo(() => {
    const cycleSessions = sessions.filter((s) => s.cycleId === activeCycle?.id);
    return players
      .filter((p) => !p.isArchived)
      .map((p) => {
        let buyIn = 0;
        let cashOut = 0;
        let sCount = 0;

        for (const s of cycleSessions) {
          const part = s.participants.find((pt) => pt.playerId === p.id);
          if (part) {
            sCount++;
            buyIn += part.totalBuyIn;
            cashOut += part.cashOut;
          }
        }

        const summary = activeCycleBalances.get(p.id);
        const net = summary ? summary.outstandingBalance : cashOut - buyIn;

        return {
          playerId: p.id,
          name: p.name,
          avatar: p.avatar,
          totalBuyIn: buyIn,
          totalCashOut: cashOut,
          net,
          sessionsCount: sCount,
        };
      })
      .sort((a, b) => b.net - a.net);
  }, [players, sessions, activeCycle, activeCycleBalances]);

  const filtered = useMemo(() => {
    if (!search.trim()) return leaderboardData;
    return leaderboardData.filter((item) =>
      item.name.toLowerCase().includes(search.toLowerCase().trim())
    );
  }, [leaderboardData, search]);

  return (
    <div className="bg-poker-surface/80 rounded-xl border border-poker-border overflow-hidden">
      {/* Table Header */}
      <div className="px-5 py-4 border-b border-poker-border/80 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-white tracking-tight">Leaderboard</h2>
          <p className="text-[11px] text-slate-400">Net Profit &amp; Loss for {activeCycle?.name || "Current Cycle"}</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search player..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-poker-bg border border-poker-border rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-32 sm:w-44"
            />
          </div>

          {onNavigateToPlayers && (
            <button
              onClick={onNavigateToPlayers}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span className="hidden sm:inline">Add Player</span>
            </button>
          )}
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs sm:text-sm">
          <thead>
            <tr className="border-b border-poker-border/60 bg-poker-bg/50 text-slate-400 text-[11px] font-semibold uppercase tracking-wider">
              <th className="py-3 px-5">Player</th>
              <th className="py-3 px-4 text-right">Total Buy-in</th>
              <th className="py-3 px-4 text-right">Total Cash-out</th>
              <th className="py-3 px-4 text-right">Net P&amp;L</th>
              <th className="py-3 px-5 text-right">Sessions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-poker-border/40 text-slate-200">
            {filtered.map((item) => {
              const isPositive = item.net > 0;
              const isNegative = item.net < 0;

              return (
                <tr
                  key={item.playerId}
                  onClick={() => onSelectPlayer(item.playerId)}
                  className="hover:bg-poker-bg/60 transition-colors cursor-pointer group"
                >
                  {/* Player Info */}
                  <td className="py-3 px-5">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-slate-950 text-[10px]"
                        style={{ backgroundColor: item.avatar }}
                      >
                        {item.name.slice(0, 2)}
                      </div>
                      <span className="font-semibold text-white group-hover:text-emerald-400 transition-colors">
                        {item.name}
                      </span>
                    </div>
                  </td>

                  {/* Total Buy-in */}
                  <td className="py-3 px-4 text-right text-slate-400">
                    {formatCurrency(item.totalBuyIn)}
                  </td>

                  {/* Total Cash-out */}
                  <td className="py-3 px-4 text-right text-slate-400">
                    {formatCurrency(item.totalCashOut)}
                  </td>

                  {/* Net P&L */}
                  <td className="py-3 px-4 text-right font-bold">
                    <span
                      className={
                        isPositive
                          ? "text-emerald-400"
                          : isNegative
                          ? "text-red-400"
                          : "text-slate-400"
                      }
                    >
                      {formatCurrency(item.net, true)}
                    </span>
                  </td>

                  {/* Sessions Count */}
                  <td className="py-3 px-5 text-right text-slate-500 text-xs">
                    {item.sessionsCount}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
