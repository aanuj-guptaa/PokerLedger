"use client";

import React from "react";
import { Layers, CheckCircle2, ChevronRight, Trophy, Users } from "lucide-react";
import { usePoker } from "../../context/PokerContext";
import { formatCurrency } from "../../lib/pokerMath";

interface RecentSessionsWidgetProps {
  onNavigate: (tab: string) => void;
  onSelectSession: (sessionId: string) => void;
}

export default function RecentSessionsWidget({
  onNavigate,
  onSelectSession,
}: RecentSessionsWidgetProps) {
  const { sessions, players } = usePoker();

  const recent = sessions.slice(0, 4);

  return (
    <div className="card-glass rounded-2xl border border-poker-border p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <Layers className="w-4 h-4" />
          </div>
          <h3 className="text-base font-bold text-white">Recent Sessions</h3>
        </div>
        <button
          onClick={() => onNavigate("sessions")}
          className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition"
        >
          <span>View All ({sessions.length})</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="space-y-3">
        {recent.length === 0 ? (
          <p className="text-xs text-slate-500 py-4 text-center">No recorded sessions yet.</p>
        ) : (
          recent.map((sess) => {
            // Find top winner
            let topWinnerName = "";
            let topWinnerAmount = 0;
            for (const p of sess.participants) {
              if (p.net > topWinnerAmount) {
                topWinnerAmount = p.net;
                const pl = players.find((plItem) => plItem.id === p.playerId);
                topWinnerName = pl ? pl.name : "Unknown";
              }
            }

            const formattedDate = new Date(sess.date).toLocaleDateString("en-IN", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <div
                key={sess.id}
                onClick={() => onSelectSession(sess.id)}
                className="p-3 rounded-xl bg-poker-bg/70 border border-poker-border hover:border-emerald-500/40 transition cursor-pointer group flex items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs sm:text-sm text-white group-hover:text-emerald-400 transition-colors">
                      {sess.title}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                      {sess.gameType || "NL Texas"}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-3">
                    <span>{formattedDate}</span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3 text-slate-500" />
                      {sess.participants.length} players
                    </span>
                    {topWinnerAmount > 0 && (
                      <span className="text-emerald-400 flex items-center gap-1 font-semibold hidden sm:flex">
                        <Trophy className="w-3 h-3 text-amber-400" />
                        {topWinnerName} ({formatCurrency(topWinnerAmount, true)})
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-xs sm:text-sm font-extrabold text-white">
                    {formatCurrency(sess.totalPot)}
                  </div>
                  <div className="text-[10px] text-emerald-400 flex items-center justify-end gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    Balanced
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
