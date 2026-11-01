"use client";

import React, { useRef, useState } from "react";
import {
  Download,
  Upload,
  RotateCcw,
  Trash2,
  Database,
  CheckCircle2,
  AlertTriangle,
  Info,
  Shield,
  FileText,
} from "lucide-react";
import { usePoker } from "../../context/PokerContext";

export default function DataSettingsView() {
  const {
    players,
    sessions,
    cycles,
    settlements,
    exportData,
    importData,
    resetToSampleData,
    clearAllData,
  } = usePoker();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        importData(text);
        setSuccessMsg("Ledger backup successfully restored!");
        setTimeout(() => setSuccessMsg(""), 3000);
      } catch (err: any) {
        setErrorMsg(err.message || "Failed to parse backup JSON file");
        setTimeout(() => setErrorMsg(""), 4000);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleResetSample = () => {
    if (confirm("Reset ledger data to realistic sample tournament data?")) {
      resetToSampleData();
      setSuccessMsg("Sample data loaded successfully!");
      setTimeout(() => setSuccessMsg(""), 3000);
    }
  };

  const handleClearAll = () => {
    if (
      confirm(
        "Are you sure you want to clear all recorded sessions and settlement cycles? (Player names will be kept)"
      )
    ) {
      clearAllData();
      setSuccessMsg("All sessions and settlements cleared.");
      setTimeout(() => setSuccessMsg(""), 3000);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <Database className="w-4 h-4" />
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Data, Backup &amp; Storage
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          PokerLedger operates with zero external database dependencies. Your ledger data is
          securely persisted in local storage and can be backed up or restored anytime.
        </p>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2 animate-in fade-in duration-150">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2 animate-in fade-in duration-150">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Backup and Restore Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Export Backup */}
        <div className="card-glass rounded-2xl p-5 border border-poker-border space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Export Ledger Backup</h3>
              <p className="text-xs text-slate-400">Save a complete JSON snapshot</p>
            </div>
          </div>
          <p className="text-xs text-slate-300">
            Downloads all players, continuous sessions, edit history, and settlement records to a
            portable file that can be kept on your device or shared with friends.
          </p>
          <button
            onClick={exportData}
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20 active:scale-95 transition"
          >
            <Download className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Download Backup (.json)</span>
          </button>
        </div>

        {/* Import Backup */}
        <div className="card-glass rounded-2xl p-5 border border-poker-border space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Restore from Backup</h3>
              <p className="text-xs text-slate-400">Import a saved JSON ledger</p>
            </div>
          </div>
          <p className="text-xs text-slate-300">
            Load an existing PokerLedger backup JSON file to restore all past history, balances, and
            member roster across devices.
          </p>
          <input
            type="file"
            accept=".json"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-2.5 px-4 rounded-xl bg-poker-card border border-poker-border hover:border-emerald-500/50 text-white font-bold text-xs flex items-center justify-center gap-2 transition"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Choose Backup File</span>
          </button>
        </div>
      </div>

      {/* Ledger Stats Card */}
      <div className="card-glass rounded-2xl p-5 border border-poker-border space-y-4">
        <h3 className="font-bold text-white text-sm flex items-center gap-2">
          <FileText className="w-4 h-4 text-emerald-400" />
          <span>Current Ledger Database Summary</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-poker-bg rounded-xl border border-poker-border">
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Players</span>
            <span className="text-base font-extrabold text-white mt-1 block">
              {players.filter((p) => !p.isArchived).length} registered
            </span>
          </div>

          <div className="p-3 bg-poker-bg rounded-xl border border-poker-border">
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Sessions</span>
            <span className="text-base font-extrabold text-white mt-1 block">
              {sessions.length} recorded
            </span>
          </div>

          <div className="p-3 bg-poker-bg rounded-xl border border-poker-border">
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Cycles</span>
            <span className="text-base font-extrabold text-white mt-1 block">
              {cycles.length} settlement cycles
            </span>
          </div>

          <div className="p-3 bg-poker-bg rounded-xl border border-poker-border">
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Transfers</span>
            <span className="text-base font-extrabold text-white mt-1 block">
              {settlements.length} settlement payments
            </span>
          </div>
        </div>
      </div>

      {/* Reset & Wipe Actions */}
      <div className="card-glass rounded-2xl p-5 border border-poker-border space-y-4">
        <h3 className="font-bold text-white text-sm">Preset &amp; Clean Slate Actions</h3>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={handleResetSample}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-poker-surface border border-poker-border hover:border-emerald-500/40 text-slate-200 hover:text-emerald-400 text-xs font-semibold flex items-center justify-center gap-2 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reload Realistic Sample Data</span>
          </button>

          <button
            onClick={handleClearAll}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-red-950/30 border border-red-500/30 hover:border-red-500 text-red-400 hover:text-red-300 text-xs font-semibold flex items-center justify-center gap-2 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear All Sessions (Fresh Start)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
