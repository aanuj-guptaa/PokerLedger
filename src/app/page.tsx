"use client";

import React, { useState } from "react";
import Navbar, { NavTab } from "../components/layout/Navbar";
import StatCards from "../components/dashboard/StatCards";
import LeaderboardTable from "../components/dashboard/LeaderboardTable";
import CycleProgressWidget from "../components/dashboard/CycleProgressWidget";
import RecentSessionsWidget from "../components/dashboard/RecentSessionsWidget";
import SessionHistoryView from "../components/history/SessionHistoryView";
import LiveBalancesView from "../components/balances/LiveBalancesView";
import SettlementPlanView from "../components/settlements/SettlementPlanView";
import CycleManagementView from "../components/cycles/CycleManagementView";
import PlayerListView from "../components/players/PlayerListView";
import DataSettingsView from "../components/settings/DataSettingsView";
import SessionModal from "../components/sessions/SessionModal";
import SessionDetailModal from "../components/sessions/SessionDetailModal";
import PlayerProfileModal from "../components/players/PlayerProfileModal";
import LiveTableCard from "../components/sessions/LiveTableCard";
import { usePoker } from "../context/PokerContext";
import { PokerSession } from "../types/poker";

export default function Home() {
  const { sessions, isLoaded } = usePoker();

  // Navigation state
  const [currentTab, setCurrentTab] = useState<NavTab>("dashboard");

  // Modal states
  const [sessionModalOpen, setSessionModalOpen] = useState(false);
  const [sessionToEdit, setSessionToEdit] = useState<PokerSession | null>(null);

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<PokerSession | null>(null);

  const [playerProfileModalOpen, setPlayerProfileModalOpen] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);

  // Handlers
  const handleOpenNewSession = () => {
    setSessionToEdit(null);
    setSessionModalOpen(true);
  };

  const handleOpenEditSession = (session: PokerSession) => {
    setSelectedSession(null);
    setDetailModalOpen(false);
    setSessionToEdit(session);
    setSessionModalOpen(true);
  };

  const handleSelectSession = (sessionId: string) => {
    const s = sessions.find((item) => item.id === sessionId);
    if (s) {
      setSelectedSession(s);
      setDetailModalOpen(true);
    }
  };

  const handleSelectPlayer = (playerId: string) => {
    setSelectedPlayerId(playerId);
    setPlayerProfileModalOpen(true);
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-poker-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
          <span className="text-xs text-slate-400 font-semibold tracking-wider uppercase">
            Loading PokerLedger...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-poker-bg flex flex-col selection:bg-emerald-500/30">
      {/* Top Navigation */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenNewSession={handleOpenNewSession}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {currentTab === "dashboard" && (
          <div className="space-y-6">
            {/* Live Interactive Poker Table */}
            <LiveTableCard />

            {/* Top Stat Cards */}
            <StatCards onNavigate={(tab) => setCurrentTab(tab as NavTab)} />

            {/* Leaderboard Table */}
            <LeaderboardTable
              onSelectPlayer={handleSelectPlayer}
              onNavigateToPlayers={() => setCurrentTab("players")}
            />

            {/* Recent Sessions (only when games are recorded) */}
            {sessions.length > 0 && (
              <RecentSessionsWidget
                onNavigate={(tab) => setCurrentTab(tab as NavTab)}
                onSelectSession={handleSelectSession}
              />
            )}
          </div>
        )}

        {currentTab === "sessions" && (
          <div className="space-y-6">
            {/* Live Interactive Poker Table */}
            <LiveTableCard />

            <SessionHistoryView
              onSelectSession={handleSelectSession}
              onOpenNewSession={handleOpenNewSession}
            />
          </div>
        )}

        {currentTab === "balances" && (
          <LiveBalancesView
            onNavigateToSettlements={() => setCurrentTab("settlements")}
            onSelectPlayer={handleSelectPlayer}
          />
        )}

        {currentTab === "settlements" && <SettlementPlanView />}

        {currentTab === "cycles" && (
          <CycleManagementView
            onNavigateToSettlements={() => setCurrentTab("settlements")}
            onSelectSession={handleSelectSession}
          />
        )}

        {currentTab === "players" && (
          <PlayerListView onSelectPlayer={handleSelectPlayer} />
        )}

        {currentTab === "settings" && <DataSettingsView />}
      </main>

      {/* Modals */}
      <SessionModal
        isOpen={sessionModalOpen}
        onClose={() => setSessionModalOpen(false)}
        existingSession={sessionToEdit}
      />

      <SessionDetailModal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        session={selectedSession}
        onEdit={handleOpenEditSession}
      />

      <PlayerProfileModal
        isOpen={playerProfileModalOpen}
        onClose={() => setPlayerProfileModalOpen(false)}
        playerId={selectedPlayerId}
        onEditPlayer={(id) => {
          setPlayerProfileModalOpen(false);
          setCurrentTab("players");
        }}
        onSelectSession={handleSelectSession}
      />

      {/* Footer */}
      <footer className="border-t border-poker-border/60 py-6 text-center text-xs text-slate-500 bg-poker-bg/80">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>PokerLedger • Continuous Poker Accounting &amp; Smart Settlements</span>
          <span className="text-slate-400">
            Automated Zero-Sum Invariant • High Precision Currency Math
          </span>
        </div>
      </footer>
    </div>
  );
}
