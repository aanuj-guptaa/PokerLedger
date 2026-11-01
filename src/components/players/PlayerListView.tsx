"use client";

import React, { useState, useMemo } from "react";
import {
  Users,
  Plus,
  Edit,
  Trash2,
  X,
  Search,
  AlertTriangle,
} from "lucide-react";
import { usePoker } from "../../context/PokerContext";
import { Player } from "../../types/poker";
import { formatCurrency } from "../../lib/pokerMath";

interface PlayerListViewProps {
  onSelectPlayer: (playerId: string) => void;
}

export default function PlayerListView({ onSelectPlayer }: PlayerListViewProps) {
  const { players, allTimePlayerStats, addPlayer, updatePlayer, deletePlayer } = usePoker();

  // Search filter
  const [search, setSearch] = useState("");

  // Add / Edit Modal
  const [showModal, setShowModal] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("#10b981");
  const [upiId, setUpiId] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState("");

  // Delete Confirmation Modal
  const [playerToDelete, setPlayerToDelete] = useState<Player | null>(null);

  const colorPresets = [
    "#10b981", // Emerald
    "#f59e0b", // Gold
    "#6366f1", // Indigo
    "#14b8a6", // Teal
    "#f43f5e", // Rose
    "#a855f7", // Purple
    "#0ea5e9", // Sky
    "#f97316", // Orange
  ];

  const handleOpenAdd = () => {
    setEditingPlayer(null);
    setName("");
    setAvatar(colorPresets[Math.floor(Math.random() * colorPresets.length)]);
    setUpiId("");
    setPhone("");
    setNotes("");
    setFormError("");
    setShowModal(true);
  };

  const handleOpenEdit = (player: Player) => {
    setEditingPlayer(player);
    setName(player.name);
    setAvatar(player.avatar);
    setUpiId(player.upiId || "");
    setPhone(player.phone || "");
    setNotes(player.notes || "");
    setFormError("");
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setFormError("Player name is required.");
      return;
    }

    // Check duplicate name
    const isDuplicate = players.some(
      (p) =>
        p.id !== editingPlayer?.id &&
        p.name.toLowerCase() === trimmedName.toLowerCase() &&
        !p.isArchived
    );

    if (isDuplicate) {
      setFormError(`A player named "${trimmedName}" already exists.`);
      return;
    }

    if (editingPlayer) {
      updatePlayer(editingPlayer.id, {
        name: trimmedName,
        avatar,
        upiId: upiId.trim() || undefined,
        phone: phone.trim() || undefined,
        notes: notes.trim() || undefined,
      });
    } else {
      addPlayer({
        name: trimmedName,
        avatar,
        upiId: upiId.trim() || undefined,
        phone: phone.trim() || undefined,
        notes: notes.trim() || undefined,
      });
    }

    setShowModal(false);
  };

  const handleDeleteConfirm = () => {
    if (!playerToDelete) return;
    deletePlayer(playerToDelete.id, true);
    setPlayerToDelete(null);
  };

  const activePlayers = useMemo(() => {
    return players.filter((p) => !p.isArchived);
  }, [players]);

  const filteredPlayers = useMemo(() => {
    if (!search.trim()) return activePlayers;
    const q = search.toLowerCase().trim();
    return activePlayers.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.upiId && p.upiId.toLowerCase().includes(q))
    );
  }, [activePlayers, search]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-tight">Players</h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
              {activePlayers.length} Active
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage your group roster, UPI handles, and lifetime stats
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Search bar */}
          <div className="relative flex-1 sm:w-56">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search players..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-poker-surface border border-poker-border rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          {/* Add Player Button */}
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-sm shadow-emerald-500/20 transition active:scale-95 whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>Add Player</span>
          </button>
        </div>
      </div>

      {/* Players Grid */}
      {filteredPlayers.length === 0 ? (
        <div className="bg-poker-surface/60 rounded-xl p-8 border border-poker-border text-center space-y-3">
          <div className="w-10 h-10 rounded-full bg-poker-card flex items-center justify-center mx-auto text-slate-500">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">No players found</h3>
            <p className="text-xs text-slate-400 mt-1">
              {search.trim()
                ? `No active player matches "${search}"`
                : "Your poker roster is currently empty. Add your first player to get started."}
            </p>
          </div>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>Add Player</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {filteredPlayers.map((player) => {
            const stats = allTimePlayerStats.find((s) => s.playerId === player.id);
            const lifetimeNet = stats ? stats.lifetimeNet : 0;
            const sessionsCount = stats ? stats.totalSessions : 0;

            return (
              <div
                key={player.id}
                onClick={() => onSelectPlayer(player.id)}
                className="bg-poker-surface/80 rounded-xl p-4 border border-poker-border hover:border-slate-500 transition cursor-pointer flex flex-col justify-between gap-3 group relative hover:shadow-lg hover:shadow-black/20"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-slate-950 text-xs shadow-sm"
                      style={{ backgroundColor: player.avatar }}
                    >
                      {player.name.slice(0, 2)}
                    </div>
                    <div className="overflow-hidden">
                      <h3 className="font-bold text-sm text-white group-hover:text-emerald-400 transition-colors truncate">
                        {player.name}
                      </h3>
                      <span className="text-[11px] text-slate-400 font-mono block truncate">
                        {player.upiId || "No UPI"}
                      </span>
                    </div>
                  </div>

                  {/* Actions: Edit & Delete */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEdit(player);
                      }}
                      className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-poker-card transition"
                      title="Edit player"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPlayerToDelete(player);
                      }}
                      className="p-1.5 rounded-md text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition"
                      title="Delete player"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="pt-2 border-t border-poker-border/60 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400">{sessionsCount} sessions</span>
                  <span
                    className={`font-bold font-mono ${
                      lifetimeNet > 0
                        ? "text-emerald-400"
                        : lifetimeNet < 0
                        ? "text-red-400"
                        : "text-slate-400"
                    }`}
                  >
                    {formatCurrency(lifetimeNet, true)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Player Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-poker-surface border border-poker-border rounded-xl p-5 shadow-2xl relative space-y-4">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <h3 className="text-base font-bold text-white">
                {editingPlayer ? `Edit ${editingPlayer.name}` : "Add Player"}
              </h3>
              <p className="text-xs text-slate-400">
                {editingPlayer
                  ? "Update player details and payment identifiers"
                  : "Add a new friend to your poker group roster"}
              </p>
            </div>

            {formError && (
              <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Keshav"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (formError) setFormError("");
                  }}
                  autoFocus
                  className="w-full px-3 py-2 bg-poker-bg border border-poker-border rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Avatar Color
                </label>
                <div className="flex items-center gap-1.5">
                  {colorPresets.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setAvatar(color)}
                      className={`w-6 h-6 rounded-lg transition ${
                        avatar === color ? "ring-2 ring-white scale-110" : "opacity-70 hover:opacity-100"
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  UPI ID (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. keshav@okaxis"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="w-full px-3 py-2 bg-poker-bg border border-poker-border rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Phone (Optional)
                </label>
                <input
                  type="text"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-poker-bg border border-poker-border rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2 rounded-lg text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs"
                >
                  {editingPlayer ? "Save Changes" : "Add Player"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {playerToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-poker-surface border border-red-500/30 rounded-xl p-5 shadow-2xl relative space-y-4">
            <button
              onClick={() => setPlayerToDelete(null)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-slate-950 text-sm shadow-sm shrink-0"
                style={{ backgroundColor: playerToDelete.avatar }}
              >
                {playerToDelete.name.slice(0, 2)}
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  Delete &quot;{playerToDelete.name}&quot;?
                </h3>
                <span className="text-xs text-slate-400 font-mono">
                  {playerToDelete.upiId || "No UPI"}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-slate-300 space-y-1">
              {(() => {
                const stats = allTimePlayerStats.find((s) => s.playerId === playerToDelete.id);
                const sCount = stats ? stats.totalSessions : 0;
                if (sCount > 0) {
                  return (
                    <p className="text-red-300">
                      Warning: <strong>{playerToDelete.name}</strong> has participated in {sCount} session(s). Deleting them will remove them from the active group roster.
                    </p>
                  );
                }
                return (
                  <p className="text-slate-300">
                    This player has no recorded sessions. They will be permanently removed from the roster.
                  </p>
                );
              })()}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setPlayerToDelete(null)}
                className="flex-1 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-white bg-poker-card border border-poker-border transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="flex-1 py-2 rounded-lg bg-red-500 hover:bg-red-400 text-white font-bold text-xs shadow-sm shadow-red-500/20 transition active:scale-95"
              >
                Delete Player
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
