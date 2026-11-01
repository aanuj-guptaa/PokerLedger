"use client";

import React, { useState } from "react";
import {
  Coins,
  Plus,
  Users,
  CheckCircle2,
  AlertTriangle,
  X,
  Play,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import confetti from "canvas-confetti";
import { usePoker } from "../../context/PokerContext";
import { formatCurrency } from "../../lib/pokerMath";

export default function LiveTableCard() {
  const {
    players,
    liveSession,
    startLiveSession,
    addRebuyLive,
    updateBuyInLive,
    seatPlayerLive,
    removePlayerLive,
    finalizeLiveSession,
    cancelLiveSession,
    addPlayer,
  } = usePoker();

  // Start Live Game Modal
  const [showStartModal, setShowStartModal] = useState(false);
  const [startBuyIn, setStartBuyIn] = useState<number>(1000);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [quickPlayerName, setQuickPlayerName] = useState("");

  // End Game / Cash-out Modal
  const [showCashOutModal, setShowCashOutModal] = useState(false);
  const [cashOutMap, setCashOutMap] = useState<Record<string, number>>({});
  const [finalizeError, setFinalizeError] = useState("");

  // Seat new player dropdown in active game
  const [seatPlayerId, setSeatPlayerId] = useState("");
  const [newLivePlayerName, setNewLivePlayerName] = useState("");

  const activePlayers = players.filter((p) => !p.isArchived);

  // Handle open start game modal
  const handleOpenStartModal = () => {
    // Default select first 4-5 players
    setSelectedPlayerIds(activePlayers.slice(0, 4).map((p) => p.id));
    setStartBuyIn(1000);
    setShowStartModal(true);
  };

  const handleStartSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedPlayerIds.length < 2) return;
    startLiveSession(undefined, startBuyIn, selectedPlayerIds);
    setShowStartModal(false);
  };

  const handleTogglePlayerSelection = (pId: string) => {
    if (selectedPlayerIds.includes(pId)) {
      setSelectedPlayerIds(selectedPlayerIds.filter((id) => id !== pId));
    } else {
      setSelectedPlayerIds([...selectedPlayerIds, pId]);
    }
  };

  const handleQuickAddAndSelect = () => {
    const trimmed = quickPlayerName.trim();
    if (!trimmed) return;
    const created = addPlayer({ name: trimmed });
    setSelectedPlayerIds((prev) => [...prev, created.id]);
    setQuickPlayerName("");
  };

  const handleQuickAddAndSeatLive = () => {
    if (!liveSession) return;
    const trimmed = newLivePlayerName.trim();
    if (!trimmed) return;
    const created = addPlayer({ name: trimmed });
    const defaultBuyIn = liveSession.participants[0]?.buyIn || 1000;
    seatPlayerLive(liveSession.id, created.id, defaultBuyIn);
    setNewLivePlayerName("");
  };

  // Cash-out handling
  const handleOpenCashOutModal = () => {
    if (!liveSession) return;
    const initialMap: Record<string, number> = {};
    for (const p of liveSession.participants) {
      initialMap[p.playerId] = p.cashOut || p.totalBuyIn;
    }
    setCashOutMap(initialMap);
    setFinalizeError("");
    setShowCashOutModal(true);
  };

  const handleCashOutChange = (playerId: string, value: number) => {
    setCashOutMap({
      ...cashOutMap,
      [playerId]: Math.max(0, value),
    });
  };

  const handleFinalizeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!liveSession) return;
    const res = finalizeLiveSession(liveSession.id, cashOutMap);
    if (!res.success) {
      setFinalizeError(res.error || "Cannot finalize session.");
      return;
    }

    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#10b981", "#f59e0b"],
      });
    } catch (e) {}

    setShowCashOutModal(false);
  };

  // If NO live session is running, show a sleek start prompt
  if (!liveSession) {
    return (
      <>
        <div className="bg-gradient-to-r from-emerald-950/30 to-slate-900/60 border border-emerald-500/30 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Play className="w-4 h-4 fill-emerald-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Starting a game tonight?</h3>
              <p className="text-xs text-slate-400">
                Launch a live table to adjust buy-ins &amp; add rebuys on the fly at any moment.
              </p>
            </div>
          </div>

          <button
            onClick={handleOpenStartModal}
            className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition shrink-0"
          >
            <Play className="w-3.5 h-3.5 fill-slate-950" />
            <span>Start Live Game</span>
          </button>
        </div>

        {/* Start Game Modal */}
        {showStartModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <div className="w-full max-w-md bg-poker-surface border border-poker-border rounded-xl p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">Start Live Poker Session</h3>
                  <p className="text-xs text-slate-400">Seat players and set starting buy-in</p>
                </div>
                <button
                  onClick={() => setShowStartModal(false)}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleStartSubmit} className="space-y-4">
                {/* Initial Buy-in */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Default Starting Buy-in (₹)
                  </label>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setStartBuyIn(Math.max(50, startBuyIn - 50))}
                      className="px-2.5 py-2 text-xs font-bold rounded-lg border bg-poker-bg text-slate-300 border-poker-border hover:text-red-400 hover:border-red-500/40 active:scale-95 transition"
                      title="Decrease starting buy-in by ₹50"
                    >
                      -50
                    </button>
                    <input
                      type="number"
                      step="50"
                      min="50"
                      value={startBuyIn}
                      onChange={(e) => setStartBuyIn(Number(e.target.value))}
                      className="w-24 px-2 py-2 bg-poker-bg border border-poker-border rounded-lg text-sm font-bold text-white text-center focus:outline-none focus:border-emerald-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setStartBuyIn(startBuyIn + 50)}
                      className="px-2.5 py-2 text-xs font-bold rounded-lg border bg-poker-bg text-slate-300 border-poker-border hover:text-emerald-400 hover:border-emerald-500/40 active:scale-95 transition"
                      title="Increase starting buy-in by ₹50"
                    >
                      +50
                    </button>

                    <div className="flex items-center gap-1 ml-auto">
                      {[500, 1000, 2000].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setStartBuyIn(amt)}
                          className={`px-2 py-2 text-xs font-semibold rounded-lg border transition ${
                            startBuyIn === amt
                              ? "bg-emerald-500 text-slate-950 border-emerald-500 font-bold"
                              : "bg-poker-bg text-slate-400 border-poker-border hover:text-white"
                          }`}
                        >
                          ₹{amt}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Player Select */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                    Select Seated Players ({selectedPlayerIds.length})
                  </label>
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                    {activePlayers.map((p) => {
                      const isSelected = selectedPlayerIds.includes(p.id);
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handleTogglePlayerSelection(p.id)}
                          className={`p-2 rounded-lg border text-left flex items-center gap-2 transition text-xs ${
                            isSelected
                              ? "bg-emerald-500/10 border-emerald-500/40 text-white font-semibold"
                              : "bg-poker-bg border-poker-border text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          <div
                            className="w-5 h-5 rounded-full flex items-center justify-center font-bold text-slate-950 text-[10px]"
                            style={{ backgroundColor: p.avatar }}
                          >
                            {p.name.slice(0, 2)}
                          </div>
                          <span className="truncate">{p.name}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Inline Quick Add Player */}
                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-poker-border/60">
                    <input
                      type="text"
                      placeholder="Add new friend to roster..."
                      value={quickPlayerName}
                      onChange={(e) => setQuickPlayerName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleQuickAddAndSelect();
                        }
                      }}
                      className="flex-1 px-3 py-1.5 bg-poker-bg border border-poker-border rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={handleQuickAddAndSelect}
                      disabled={!quickPlayerName.trim()}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold disabled:opacity-40 transition"
                    >
                      + Add
                    </button>
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowStartModal(false)}
                    className="flex-1 py-2 rounded-lg text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={selectedPlayerIds.length < 2}
                    className="flex-1 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs disabled:opacity-50"
                  >
                    Deal / Start Game
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </>
    );
  }

  // ACTIVE LIVE SESSION VIEW
  const availableToSeat = activePlayers.filter(
    (p) => !liveSession.participants.some((part) => part.playerId === p.id)
  );

  return (
    <div className="bg-poker-surface/90 border border-emerald-500/40 rounded-xl p-4 sm:p-5 shadow-lg shadow-emerald-950/20 space-y-4">
      {/* Live Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-poker-border/60 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-white">{liveSession.title}</h2>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                LIVE
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Change buy-ins or tap +₹500 / +₹1,000 to add rebuys immediately
            </p>
          </div>
        </div>

        {/* Right side pot and end game */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Pot</span>
            <span className="text-lg font-black text-emerald-400">
              {formatCurrency(liveSession.totalPot)}
            </span>
          </div>

          <button
            onClick={handleOpenCashOutModal}
            className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow transition active:scale-95"
          >
            End Game &amp; Cash Out
          </button>

          <button
            onClick={() => {
              if (confirm("Discard this active live session?")) {
                cancelLiveSession(liveSession.id);
              }
            }}
            className="p-1.5 text-slate-500 hover:text-red-400 text-xs"
            title="Cancel game"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Players List with Real-Time Rebuy Controls */}
      <div className="space-y-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {liveSession.participants.map((part) => {
            const player = players.find((p) => p.id === part.playerId);
            const playerName = player ? player.name : "Player";
            const playerAvatar = player ? player.avatar : "#10b981";

            return (
              <div
                key={part.playerId}
                className="bg-poker-bg/70 border border-poker-border rounded-lg p-3 flex items-center justify-between gap-3"
              >
                {/* Player Name and Buy-in display */}
                <div className="flex items-center gap-2.5 min-w-[120px]">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-slate-950 text-[10px] shrink-0"
                    style={{ backgroundColor: playerAvatar }}
                  >
                    {playerName.slice(0, 2)}
                  </div>
                  <div>
                    <span className="font-bold text-xs text-white block truncate">{playerName}</span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      Total: <span className="font-bold text-white">{formatCurrency(part.totalBuyIn)}</span>
                    </span>
                  </div>
                </div>

                {/* Instant Rebuy / Add-on Actions */}
                <div className="flex items-center gap-1">
                  {/* -50 decrement */}
                  <button
                    type="button"
                    onClick={() =>
                      updateBuyInLive(liveSession.id, part.playerId, Math.max(0, (part.buyIn || 0) - 50))
                    }
                    className="px-1.5 py-1 rounded bg-poker-surface border border-poker-border hover:border-red-500/50 hover:text-red-400 text-slate-300 font-bold text-[11px] transition active:scale-95"
                    title="Decrease buy-in by ₹50"
                  >
                    -50
                  </button>

                  {/* Direct Buy-in Input with step=50 */}
                  <input
                    type="number"
                    step="50"
                    min="0"
                    value={part.buyIn || ""}
                    onChange={(e) =>
                      updateBuyInLive(liveSession.id, part.playerId, Number(e.target.value))
                    }
                    className="w-14 px-1 py-1 text-center bg-poker-card border border-poker-border rounded text-[11px] text-white font-mono focus:outline-none focus:border-emerald-500"
                    title="Base buy-in (steps of 50)"
                  />

                  {/* +50 increment */}
                  <button
                    type="button"
                    onClick={() =>
                      updateBuyInLive(liveSession.id, part.playerId, (part.buyIn || 0) + 50)
                    }
                    className="px-1.5 py-1 rounded bg-poker-surface border border-poker-border hover:border-emerald-500/50 hover:text-emerald-400 text-slate-300 font-bold text-[11px] transition active:scale-95"
                    title="Increase buy-in by ₹50"
                  >
                    +50
                  </button>

                  {/* +₹500 rebuy */}
                  <button
                    type="button"
                    onClick={() => addRebuyLive(liveSession.id, part.playerId, 500)}
                    className="px-1.5 py-1 rounded bg-poker-surface border border-poker-border hover:border-emerald-500/50 hover:text-emerald-400 text-slate-300 font-bold text-[11px] transition active:scale-95"
                    title="Add ₹500 immediately"
                  >
                    +500
                  </button>

                  {/* +₹1k rebuy */}
                  <button
                    type="button"
                    onClick={() => addRebuyLive(liveSession.id, part.playerId, 1000)}
                    className="px-1.5 py-1 rounded bg-poker-surface border border-poker-border hover:border-emerald-500/50 hover:text-emerald-400 text-slate-300 font-bold text-[11px] transition active:scale-95"
                    title="Add ₹1,000 immediately"
                  >
                    +1k
                  </button>

                  {/* Remove player */}
                  <button
                    type="button"
                    onClick={() => removePlayerLive(liveSession.id, part.playerId)}
                    className="p-1 text-slate-600 hover:text-red-400"
                    title="Remove from table"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Seat Late Player or Add New Friend on the Fly */}
        <div className="pt-2 flex flex-wrap items-center gap-3 border-t border-poker-border/60">
          {availableToSeat.length > 0 && (
            <div className="flex items-center gap-2">
              <select
                value={seatPlayerId}
                onChange={(e) => setSeatPlayerId(e.target.value)}
                className="bg-poker-bg border border-poker-border rounded-lg px-2.5 py-1 text-xs text-slate-300 focus:outline-none"
              >
                <option value="">Seat existing roster player...</option>
                {availableToSeat.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>

              {seatPlayerId && (
                <button
                  type="button"
                  onClick={() => {
                    const defaultBuyIn = liveSession.participants[0]?.buyIn || 1000;
                    seatPlayerLive(liveSession.id, seatPlayerId, defaultBuyIn);
                    setSeatPlayerId("");
                  }}
                  className="px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold hover:bg-emerald-500/30 transition"
                >
                  + Seat with ₹{liveSession.participants[0]?.buyIn || 1000}
                </button>
              )}
            </div>
          )}

          {/* Quick Add & Seat Brand New Player */}
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              placeholder="+ New player name..."
              value={newLivePlayerName}
              onChange={(e) => setNewLivePlayerName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleQuickAddAndSeatLive();
                }
              }}
              className="w-36 px-2.5 py-1 bg-poker-bg border border-poker-border rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
            />
            <button
              type="button"
              onClick={handleQuickAddAndSeatLive}
              disabled={!newLivePlayerName.trim()}
              className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold disabled:opacity-40 transition"
            >
              + Add &amp; Seat
            </button>
          </div>
        </div>
      </div>

      {/* Cash-Out & Finalize Modal */}
      {showCashOutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-poker-surface border border-poker-border rounded-xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Cash Out &amp; Finalize Session</h3>
                <p className="text-xs text-slate-400">
                  Enter final chip counts. Total cash-outs must equal the total pot.
                </p>
              </div>
              <button
                onClick={() => setShowCashOutModal(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {finalizeError && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{finalizeError}</span>
              </div>
            )}

            <form onSubmit={handleFinalizeSubmit} className="space-y-4">
              <div className="border border-poker-border rounded-lg overflow-hidden divide-y divide-poker-border/60 text-xs">
                {liveSession.participants.map((part) => {
                  const pl = players.find((p) => p.id === part.playerId);
                  const name = pl ? pl.name : "Player";
                  const cashVal = cashOutMap[part.playerId] || 0;
                  const net = cashVal - part.totalBuyIn;

                  return (
                    <div key={part.playerId} className="p-2.5 flex items-center justify-between gap-3">
                      <div>
                        <span className="font-bold text-white block">{name}</span>
                        <span className="text-[10px] text-slate-400">
                          Total Invested: {formatCurrency(part.totalBuyIn)}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span
                            className={`font-mono font-bold text-xs ${
                              net > 0 ? "text-emerald-400" : net < 0 ? "text-red-400" : "text-slate-400"
                            }`}
                          >
                            {formatCurrency(net, true)}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() =>
                              handleCashOutChange(part.playerId, Math.max(0, (cashVal || 0) - 50))
                            }
                            className="px-1.5 py-1 rounded bg-poker-surface border border-poker-border hover:border-red-500/50 hover:text-red-400 text-slate-300 font-bold text-[10px] transition active:scale-95"
                            title="Decrease chips by ₹50"
                          >
                            -50
                          </button>
                          <input
                            type="number"
                            step="50"
                            min="0"
                            value={cashVal || ""}
                            onChange={(e) =>
                              handleCashOutChange(part.playerId, Number(e.target.value))
                            }
                            placeholder="Chips (₹)"
                            className="w-20 px-1 py-1 bg-poker-bg border border-poker-border rounded text-xs text-center font-bold text-white focus:outline-none focus:border-emerald-500 font-mono"
                            required
                          />
                          <button
                            type="button"
                            onClick={() =>
                              handleCashOutChange(part.playerId, (cashVal || 0) + 50)
                            }
                            className="px-1.5 py-1 rounded bg-poker-surface border border-poker-border hover:border-emerald-500/50 hover:text-emerald-400 text-slate-300 font-bold text-[10px] transition active:scale-95"
                            title="Increase chips by ₹50"
                          >
                            +50
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Zero-Sum Status */}
              {(() => {
                const totalCash = Object.values(cashOutMap).reduce(
                  (sum, v) => sum + Math.round(v || 0),
                  0
                );
                const diff = totalCash - liveSession.totalPot;
                const isMatch = diff === 0;

                return (
                  <div
                    className={`p-3 rounded-lg border text-xs flex items-center justify-between ${
                      isMatch
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                        : "bg-amber-500/10 border-amber-500/30 text-amber-400"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {isMatch ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                      <span>
                        {isMatch
                          ? "Balanced: Total Cash-Outs match Total Pot"
                          : `Discrepancy: ${diff > 0 ? `+₹${diff}` : `-₹${Math.abs(diff)}`}`}
                      </span>
                    </div>
                    <span className="font-bold font-mono">
                      {formatCurrency(totalCash)} / {formatCurrency(liveSession.totalPot)}
                    </span>
                  </div>
                );
              })()}

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowCashOutModal(false)}
                  className="flex-1 py-2 rounded-lg text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs"
                >
                  Finalize &amp; Record to Ledger
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
