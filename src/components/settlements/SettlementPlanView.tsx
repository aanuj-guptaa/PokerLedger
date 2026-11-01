"use client";

import React, { useState } from "react";
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  QrCode,
  Check,
  Copy,
  X,
} from "lucide-react";
import confetti from "canvas-confetti";
import { usePoker } from "../../context/PokerContext";
import { SettlementSuggestion } from "../../types/poker";
import { formatCurrency } from "../../lib/pokerMath";
import { generateUpiLink } from "../../lib/settlementEngine";

export default function SettlementPlanView() {
  const {
    players,
    activeCycle,
    optimizedSettlements,
    settlements,
    recordPayment,
  } = usePoker();

  const [selectedUpiTx, setSelectedUpiTx] = useState<SettlementSuggestion | null>(null);
  const [copiedUpi, setCopiedUpi] = useState(false);

  const completedCycleSettlements = settlements.filter(
    (st) => st.cycleId === activeCycle?.id && st.status === "completed"
  );

  const handleMarkAsPaid = (sugg: SettlementSuggestion) => {
    recordPayment(sugg.fromPlayerId, sugg.toPlayerId, sugg.amount, "UPI", "Settlement payment");
    try {
      confetti({
        particleCount: 40,
        spread: 50,
        origin: { y: 0.6 },
      });
    } catch (e) {}
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const isAllSettled = optimizedSettlements.length === 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Smart Settlement</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Optimized payment transfers to settle {activeCycle?.name || "Current Cycle"}
          </p>
        </div>
      </div>

      {/* When Net 0 (All Settled) */}
      {isAllSettled ? (
        <div className="bg-poker-surface/60 rounded-xl p-8 border border-poker-border text-center space-y-2">
          <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white">All Balances are Net ₹0</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            No payments are needed. Every player in this cycle is completely settled.
          </p>
        </div>
      ) : (
        /* When transfers are needed */
        <div className="space-y-3">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Recommended Transfers ({optimizedSettlements.length})
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {optimizedSettlements.map((sugg, idx) => {
              const fromPlayer = players.find((p) => p.id === sugg.fromPlayerId);
              const toPlayer = players.find((p) => p.id === sugg.toPlayerId);
              const fromName = fromPlayer ? fromPlayer.name : "Debtor";
              const toName = toPlayer ? toPlayer.name : "Creditor";
              const fromAvatar = fromPlayer ? fromPlayer.avatar : "#ef4444";
              const toAvatar = toPlayer ? toPlayer.avatar : "#10b981";

              return (
                <div
                  key={`${sugg.fromPlayerId}-${sugg.toPlayerId}-${idx}`}
                  className="bg-poker-surface/80 rounded-xl p-4 border border-poker-border flex flex-col justify-between gap-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-slate-950 text-[10px]"
                        style={{ backgroundColor: fromAvatar }}
                      >
                        {fromName.slice(0, 2)}
                      </div>
                      <span className="text-xs font-bold text-white">{fromName}</span>
                    </div>

                    <div className="flex items-center gap-1.5 px-2">
                      <span className="text-sm font-extrabold text-emerald-400">
                        {formatCurrency(sugg.amount)}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                    </div>

                    <div className="flex items-center gap-2 text-right">
                      <span className="text-xs font-bold text-white">{toName}</span>
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-slate-950 text-[10px]"
                        style={{ backgroundColor: toAvatar }}
                      >
                        {toName.slice(0, 2)}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-poker-border/60 flex items-center justify-between gap-2 text-xs">
                    {toPlayer?.upiId ? (
                      <button
                        onClick={() => setSelectedUpiTx(sugg)}
                        className="px-2 py-1 rounded-lg bg-poker-bg border border-poker-border text-slate-300 hover:text-white flex items-center gap-1 text-[11px]"
                      >
                        <QrCode className="w-3 h-3 text-emerald-400" />
                        <span>UPI</span>
                      </button>
                    ) : (
                      <span />
                    )}

                    <button
                      onClick={() => handleMarkAsPaid(sugg)}
                      className="px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold flex items-center gap-1 text-xs transition"
                    >
                      <Check className="w-3 h-3 stroke-[3]" />
                      <span>Mark Paid</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Completed Settlements */}
      {completedCycleSettlements.length > 0 && (
        <div className="space-y-2 pt-4 border-t border-poker-border/60">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Completed Payments ({completedCycleSettlements.length})
          </div>

          <div className="divide-y divide-poker-border/40 border border-poker-border rounded-lg bg-poker-bg/50 text-xs">
            {completedCycleSettlements.map((tx) => {
              const fromPlayer = players.find((p) => p.id === tx.fromPlayerId);
              const toPlayer = players.find((p) => p.id === tx.toPlayerId);
              return (
                <div key={tx.id} className="px-3 py-2 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-white">{fromPlayer?.name}</span>
                    <span className="text-slate-500">paid</span>
                    <span className="font-semibold text-emerald-400">{toPlayer?.name}</span>
                  </div>
                  <span className="font-bold text-white font-mono">{formatCurrency(tx.amount)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* UPI QR Modal */}
      {selectedUpiTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-xs bg-poker-surface border border-poker-border rounded-xl p-5 shadow-2xl relative text-center space-y-3">
            <button
              onClick={() => setSelectedUpiTx(null)}
              className="absolute top-3 right-3 p-1 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            {(() => {
              const toPlayer = players.find((p) => p.id === selectedUpiTx.toPlayerId);
              const fromPlayer = players.find((p) => p.id === selectedUpiTx.fromPlayerId);
              const toName = toPlayer ? toPlayer.name : "Recipient";
              const fromName = fromPlayer ? fromPlayer.name : "Sender";
              const upiId = toPlayer?.upiId || "poker@upi";
              const upiDeepLink = generateUpiLink(
                upiId,
                toName,
                selectedUpiTx.amount,
                `Poker Settlement from ${fromName}`
              );
              const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                upiDeepLink
              )}`;

              return (
                <>
                  <div className="text-sm font-bold text-white">
                    {fromName} pays {toName}
                  </div>
                  <div className="text-xl font-extrabold text-emerald-400">
                    {formatCurrency(selectedUpiTx.amount)}
                  </div>

                  <div className="w-40 h-40 mx-auto p-2 bg-white rounded-lg flex items-center justify-center">
                    <img
                      src={qrImageUrl}
                      alt="UPI QR Code"
                      className="w-full h-full object-contain"
                    />
                  </div>

                  <div className="bg-poker-bg p-2 rounded-lg border border-poker-border text-xs flex items-center justify-between">
                    <span className="font-mono text-slate-300 text-[11px] truncate">{upiId}</span>
                    <button
                      onClick={() => copyToClipboard(upiId)}
                      className="text-emerald-400 hover:text-emerald-300 text-[11px] font-semibold"
                    >
                      {copiedUpi ? "Copied" : "Copy"}
                    </button>
                  </div>

                  <div className="pt-2 flex items-center gap-2">
                    <a
                      href={upiDeepLink}
                      className="flex-1 py-2 rounded-lg bg-emerald-500 text-slate-950 font-bold text-xs text-center"
                    >
                      Pay in UPI App
                    </a>
                    <button
                      onClick={() => {
                        handleMarkAsPaid(selectedUpiTx);
                        setSelectedUpiTx(null);
                      }}
                      className="flex-1 py-2 rounded-lg bg-poker-card border border-poker-border text-white font-bold text-xs"
                    >
                      Mark Paid
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
