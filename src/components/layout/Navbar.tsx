"use client";

import React, { useState } from "react";
import {
  LayoutDashboard,
  Layers,
  Scale,
  Sparkles,
  CalendarDays,
  Users,
  Settings,
  Plus,
  Menu,
  X,
  Coins,
} from "lucide-react";
import { usePoker } from "../../context/PokerContext";

export type NavTab =
  | "dashboard"
  | "sessions"
  | "balances"
  | "settlements"
  | "cycles"
  | "players"
  | "settings";

interface NavbarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenNewSession: () => void;
}

export default function Navbar({ currentTab, onSelectTab, onOpenNewSession }: NavbarProps) {
  const { activeCycle } = usePoker();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: "dashboard" as NavTab, label: "Dashboard", icon: LayoutDashboard },
    { id: "sessions" as NavTab, label: "Sessions", icon: Layers },
    { id: "balances" as NavTab, label: "Balances", icon: Scale },
    { id: "settlements" as NavTab, label: "Settlements", icon: Sparkles },
    { id: "cycles" as NavTab, label: "Cycles", icon: CalendarDays },
    { id: "players" as NavTab, label: "Players", icon: Users },
    { id: "settings" as NavTab, label: "Data", icon: Settings },
  ];

  const handleTabClick = (tab: NavTab) => {
    onSelectTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-poker-border/80 bg-poker-bg/95 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-15 py-3">
          {/* Brand Logo */}
          <button
            onClick={() => handleTabClick("dashboard")}
            className="flex items-center gap-2.5 text-left group"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Coins className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight text-white group-hover:text-emerald-400 transition-colors">
                Poker<span className="text-emerald-400">Ledger</span>
              </span>
              {activeCycle && (
                <span className="hidden sm:inline text-[11px] text-slate-400 font-medium px-2 py-0.5 rounded-md bg-poker-surface border border-poker-border">
                  {activeCycle.name}
                </span>
              )}
            </div>
          </button>

          {/* Desktop Nav Items */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"
                      : "text-slate-400 hover:text-slate-200 hover:bg-poker-surface/60"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? "text-emerald-400" : "text-slate-400"}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Action: Record Session */}
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenNewSession}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-sm shadow-emerald-500/20 transition active:scale-95"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>Record Session</span>
            </button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 rounded-lg bg-poker-surface border border-poker-border text-slate-300 hover:text-white"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-poker-border bg-poker-surface/95 px-4 py-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition ${
                  isActive
                    ? "text-emerald-400 bg-emerald-500/10"
                    : "text-slate-300 hover:bg-poker-card"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
}
