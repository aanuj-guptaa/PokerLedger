"use client";

import React, { useState } from "react";
import {
  X,
  Calendar,
  Layers,
  Edit,
  Trash2,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  History,
  AlertTriangle,
  Users,
} from "lucide-react";
import { usePoker } from "../../context/PokerContext";
import { PokerSession } from "../../types/poker";
import { formatCurrency } from "../../lib/pokerMath";

interface SessionDetailModalProps {
  session: PokerSession | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (session: PokerSession) => void;
}

export default function SessionDetailModal({
  session,
  isOpen,
  onClose,
  onEdit,
}: SessionDetailModalProps) {
  const { players, cycles, deleteSession } = usePoker();
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  if (!isOpen || !session) return null;

  const cycle = cycles.find((c) => c.id === session.cycleId);
  const formattedDate = new Date(session.date).toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const handleDelete = () => {
    deleteSession(session.id);
    setShowConfirmDelete(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-poker-surface border border-poker-border rounded-2xl shadow-2xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-poker-border flex items-center justify-between bg-poker-card/50">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {session.gameType || "NL Texas Hold'em"}
              </span>
              <span className="text-xs text-slate-400">{cycle?.name}</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white mt-1">{session.title}</h2>
            <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
              <Calendar className="w-3.5 h-3.5" />
              {formattedDate}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onEdit(session);
              }}
              className="p-2 rounded-xl bg-poker-bg border border-poker-border text-slate-300 hover:text-emerald-400 hover:border-emerald-500/50 transition"
              title="Edit session"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowConfirmDelete(true)}
              className="p-2 rounded-xl bg-poker-bg border border-poker-border text-slate-300 hover:text-red-400 hover:border-red-500/50 transition"
              title="Delete session"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-poker-border transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Delete confirmation alert */}
        {showConfirmDelete && (
          <div className="m-4 p-4 rounded-xl bg-red-950/40 border border-red-500/40 flex items-start justify-between gap-3 animate-in fade-in duration-150">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-white">Delete this session permanently?</h4>
                <p className="text-xs text-slate-300 mt-0.5">
                  This will remove the session from the ledger and recalculate all player balances.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setShowConfirmDelete(false)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        )}

        {/* Body */}
        <div className="p-4 sm:p-6 space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-poker-bg rounded-xl border border-poker-border">
              <span className="text-[11px] text-slate-400 block">Total Pot</span>
              <span className="text-base sm:text-lg font-extrabold text-white">
                {formatCurrency(session.totalPot)}
              </span>
            </div>
            <div className="p-3 bg-poker-bg rounded-xl border border-poker-border">
              <span className="text-[11px] text-slate-400 block">Players</span>
              <span className="text-base sm:text-lg font-extrabold text-white flex items-center gap-1.5">
                <Users className="w-4 h-4 text-emerald-400" />
                {session.participants.length}
              </span>
            </div>
            <div className="p-3 bg-poker-bg rounded-xl border border-poker-border">
              <span className="text-[11px] text-slate-400 block">Net Balance</span>
              <span className="text-xs sm:text-sm font-bold text-emerald-400 flex items-center gap-1 mt-1">
                <CheckCircle2 className="w-4 h-4" />
                ₹0 (Zero-Sum)
              </span>
            </div>
            <div className="p-3 bg-poker-bg rounded-xl border border-poker-border">
              <span className="text-[11px] text-slate-400 block">Avg Pot / Player</span>
              <span className="text-base sm:text-lg font-extrabold text-white">
                {session.participants.length > 0
                  ? formatCurrency(session.totalPot / session.participants.length)
                  : "₹0"}
              </span>
            </div>
          </div>

          {/* Notes if available */}
          {session.notes && (
            <div className="p-3 bg-poker-card/50 rounded-xl border border-poker-border text-xs text-slate-300">
              <span className="font-semibold text-slate-400 block mb-1">Session Notes:</span>
              <p className="italic">{session.notes}</p>
            </div>
          )}

          {/* Table of Participants */}
          <div className="border border-poker-border rounded-xl overflow-hidden bg-poker-bg/50">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-poker-border bg-poker-surface/70 text-slate-400 uppercase text-[10px] font-semibold tracking-wider">
                  <th className="py-2.5 px-3">Player</th>
                  <th className="py-2.5 px-3 text-right">Buy-in</th>
                  <th className="py-2.5 px-3 text-right">Rebuys</th>
                  <th className="py-2.5 px-3 text-right">Total Invested</th>
                  <th className="py-2.5 px-3 text-right">Cash-Out</th>
                  <th className="py-2.5 px-3 text-right">Net P&amp;L</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-poker-border/40 font-medium">
                {session.participants
                  .slice()
                  .sort((a, b) => b.net - a.net)
                  .map((part) => {
                    const pl = players.find((p) => p.id === part.playerId);
                    const name = pl ? pl.name : "Unknown";
                    const avatar = pl ? pl.avatar : "#10b981";
                    const isPositive = part.net > 0;
                    const isNegative = part.net < 0;

                    return (
                      <tr key={part.playerId} className="hover:bg-poker-surface/40 transition">
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-slate-950 text-[10px]"
                              style={{ backgroundColor: avatar }}
                            >
                              {name.slice(0, 2)}
                            </div>
                            <span className="font-bold text-white">{name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right text-slate-300">
                          {formatCurrency(part.buyIn)}
                        </td>
                        <td className="py-3 px-3 text-right text-slate-400">
                          {part.rebuys > 0 ? formatCurrency(part.rebuys) : "—"}
                        </td>
                        <td className="py-3 px-3 text-right text-slate-300 font-semibold">
                          {formatCurrency(part.totalBuyIn)}
                        </td>
                        <td className="py-3 px-3 text-right text-slate-200 font-bold">
                          {formatCurrency(part.cashOut)}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-extrabold text-xs ${
                              isPositive
                                ? "text-emerald-400 bg-emerald-500/10"
                                : isNegative
                                ? "text-red-400 bg-red-500/10"
                                : "text-slate-400"
                            }`}
                          >
                            {isPositive && <TrendingUp className="w-3 h-3" />}
                            {isNegative && <TrendingDown className="w-3 h-3" />}
                            {formatCurrency(part.net, true)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          {/* Edit History Log */}
          {session.editHistory && session.editHistory.length > 0 && (
            <div className="pt-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 mb-2">
                <History className="w-3.5 h-3.5" />
                <span>Audit &amp; Edit History ({session.editHistory.length})</span>
              </div>
              <div className="space-y-2">
                {session.editHistory.map((rec) => (
                  <div
                    key={rec.id}
                    className="p-2.5 rounded-lg bg-poker-bg border border-poker-border text-xs flex items-center justify-between gap-2"
                  >
                    <div>
                      <div className="font-medium text-slate-300">{rec.summary}</div>
                      {rec.details && (
                        <div className="text-[11px] text-slate-500">{rec.details}</div>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-500 shrink-0 text-right">
                      <div>{new Date(rec.timestamp).toLocaleDateString("en-IN")}</div>
                      <div>by {rec.author}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
