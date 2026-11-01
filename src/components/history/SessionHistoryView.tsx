"use client";

import React, { useState, useMemo } from "react";
import {
  Layers,
  Search,
  Filter,
  Calendar,
  Users,
  Trophy,
  CheckCircle2,
  PlusCircle,
  Eye,
  ArrowUpDown,
} from "lucide-react";
import { usePoker } from "../../context/PokerContext";
import { formatCurrency } from "../../lib/pokerMath";

interface SessionHistoryViewProps {
  onSelectSession: (sessionId: string) => void;
  onOpenNewSession: () => void;
}

export default function SessionHistoryView({
  onSelectSession,
  onOpenNewSession,
}: SessionHistoryViewProps) {
  const { sessions, players, cycles } = usePoker();

  // Filter states
  const [search, setSearch] = useState("");
  const [selectedCycleId, setSelectedCycleId] = useState<string>("all");
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>("all");
  const [outcomeFilter, setOutcomeFilter] = useState<"all" | "won" | "lost">("all");
  const [sortOrder, setSortOrder] = useState<"date-desc" | "date-asc" | "pot-desc">("date-desc");

  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      // Search
      const matchesSearch =
        s.title.toLowerCase().includes(search.toLowerCase().trim()) ||
        (s.notes && s.notes.toLowerCase().includes(search.toLowerCase().trim()));
      if (!matchesSearch) return false;

      // Cycle
      if (selectedCycleId !== "all" && s.cycleId !== selectedCycleId) return false;

      // Player
      if (selectedPlayerId !== "all") {
        const participant = s.participants.find((p) => p.playerId === selectedPlayerId);
        if (!participant) return false;

        // Outcome for this player
        if (outcomeFilter === "won" && participant.net <= 0) return false;
        if (outcomeFilter === "lost" && participant.net >= 0) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortOrder === "date-asc") {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      }
      if (sortOrder === "pot-desc") {
        return (b.totalPot || 0) - (a.totalPot || 0);
      }
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  }, [sessions, search, selectedCycleId, selectedPlayerId, outcomeFilter, sortOrder]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <Layers className="w-4 h-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Session History
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Browse, search, and audit all continuous poker sessions recorded in the ledger
          </p>
        </div>

        <button
          onClick={onOpenNewSession}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-bold text-xs sm:text-sm shadow-md shadow-emerald-500/20 active:scale-95 transition"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Record New Session</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="card-glass rounded-2xl p-4 border border-poker-border space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by session title or notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-poker-bg border border-poker-border rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Cycle Dropdown */}
          <div className="flex items-center gap-1.5 bg-poker-bg px-2.5 py-1.5 rounded-xl border border-poker-border text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedCycleId}
              onChange={(e) => setSelectedCycleId(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-poker-surface">
                All Cycles
              </option>
              {cycles.map((c) => (
                <option key={c.id} value={c.id} className="bg-poker-surface">
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Player Dropdown */}
          <div className="flex items-center gap-1.5 bg-poker-bg px-2.5 py-1.5 rounded-xl border border-poker-border text-xs">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedPlayerId}
              onChange={(e) => {
                setSelectedPlayerId(e.target.value);
                if (e.target.value === "all") setOutcomeFilter("all");
              }}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-poker-surface">
                All Players
              </option>
              {players
                .filter((p) => !p.isArchived)
                .map((p) => (
                  <option key={p.id} value={p.id} className="bg-poker-surface">
                    {p.name}
                  </option>
                ))}
            </select>
          </div>

          {/* Outcome Filter (if player selected) */}
          {selectedPlayerId !== "all" && (
            <div className="flex items-center bg-poker-bg p-1 rounded-xl border border-poker-border text-xs">
              <button
                onClick={() => setOutcomeFilter("all")}
                className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                  outcomeFilter === "all" ? "bg-emerald-500 text-slate-950" : "text-slate-400"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setOutcomeFilter("won")}
                className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                  outcomeFilter === "won" ? "bg-emerald-500 text-slate-950" : "text-slate-400"
                }`}
              >
                Won
              </button>
              <button
                onClick={() => setOutcomeFilter("lost")}
                className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                  outcomeFilter === "lost" ? "bg-red-500 text-white" : "text-slate-400"
                }`}
              >
                Lost
              </button>
            </div>
          )}

          {/* Sort Order */}
          <div className="flex items-center gap-1.5 bg-poker-bg px-2.5 py-1.5 rounded-xl border border-poker-border text-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="date-desc" className="bg-poker-surface">
                Newest Date
              </option>
              <option value="date-asc" className="bg-poker-surface">
                Oldest Date
              </option>
              <option value="pot-desc" className="bg-poker-surface">
                Highest Pot
              </option>
            </select>
          </div>
        </div>
      </div>

      {/* Sessions Grid */}
      <div className="space-y-3">
        {sessions.length === 0 ? (
          <div className="bg-poker-surface/60 rounded-xl p-8 border border-poker-border text-center space-y-2">
            <h3 className="text-sm font-bold text-white">No Sessions Recorded Yet</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              The ledger is clean at net ₹0. Click below to record your first poker session.
            </p>
            <div className="pt-2">
              <button
                onClick={onOpenNewSession}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Record First Session</span>
              </button>
            </div>
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="bg-poker-surface/60 rounded-xl p-6 border border-poker-border text-center text-xs text-slate-400">
            No poker sessions match your selected filters.
          </div>
        ) : (
          filteredSessions.map((s) => {
            const cycle = cycles.find((c) => c.id === s.cycleId);
            const formattedDate = new Date(s.date).toLocaleDateString("en-IN", {
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });

            // Top winner
            let topWinnerName = "";
            let topWinnerNet = 0;
            for (const part of s.participants) {
              if (part.net > topWinnerNet) {
                topWinnerNet = part.net;
                const pl = players.find((p) => p.id === part.playerId);
                topWinnerName = pl ? pl.name : "Winner";
              }
            }

            return (
              <div
                key={s.id}
                onClick={() => onSelectSession(s.id)}
                className="card-glass rounded-2xl p-4 sm:p-5 border border-poker-border hover:border-emerald-500/50 transition cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors">
                      {s.title}
                    </h3>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {s.gameType || "NL Texas"}
                    </span>
                    {cycle && (
                      <span className="text-[10px] text-slate-400 bg-poker-bg px-2 py-0.5 rounded border border-poker-border">
                        {cycle.name}
                      </span>
                    )}
                    {s.editHistory && s.editHistory.length > 0 && (
                      <span className="text-[9px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20">
                        Edited
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-3">
                    <span>{formattedDate}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-500" />
                      {s.participants.length} players seated
                    </span>
                    {topWinnerNet > 0 && (
                      <>
                        <span>•</span>
                        <span className="text-emerald-400 font-semibold flex items-center gap-1">
                          <Trophy className="w-3 h-3 text-amber-400" />
                          Top: {topWinnerName} (+₹{topWinnerNet})
                        </span>
                      </>
                    )}
                  </div>

                  {/* Player avatars strip */}
                  <div className="flex items-center gap-1.5 mt-2.5">
                    {s.participants.slice(0, 8).map((p) => {
                      const pl = players.find((item) => item.id === p.playerId);
                      const name = pl ? pl.name : "";
                      const avatar = pl ? pl.avatar : "#10b981";
                      return (
                        <div
                          key={p.playerId}
                          className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-slate-950 text-[10px]"
                          style={{ backgroundColor: avatar }}
                          title={`${name}: ${formatCurrency(p.net, true)}`}
                        >
                          {name.slice(0, 1)}
                        </div>
                      );
                    })}
                    {s.participants.length > 8 && (
                      <span className="text-[10px] text-slate-400 font-bold ml-1">
                        +{s.participants.length - 8}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right Column: Pot & Zero-sum balance */}
                <div className="text-right shrink-0 flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-3 sm:pt-0 border-poker-border/60">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block sm:text-right">
                      Total Pot
                    </span>
                    <span className="text-base sm:text-lg font-extrabold text-white">
                      {formatCurrency(s.totalPot)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-emerald-400 text-xs font-semibold mt-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Balanced</span>
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
