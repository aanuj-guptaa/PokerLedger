import { LedgerStoreData } from "../types/poker";
import { INITIAL_LEDGER_DATA } from "./sampleData";

const STORAGE_KEY = "poker_ledger_data_v2";

export function loadLedgerData(): LedgerStoreData {
  if (typeof window === "undefined") {
    return INITIAL_LEDGER_DATA;
  }

  try {
    // Clear old v1 dirty sample data if present
    localStorage.removeItem("poker_ledger_data_v1");

    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      saveLedgerData(INITIAL_LEDGER_DATA);
      return INITIAL_LEDGER_DATA;
    }
    const parsed = JSON.parse(raw) as LedgerStoreData;
    // Basic schema check
    if (!parsed.players || !parsed.sessions || !parsed.cycles) {
      console.warn("Storage data corrupted, resetting to sample data");
      return INITIAL_LEDGER_DATA;
    }
    return parsed;
  } catch (err) {
    console.error("Failed to load ledger data from localStorage", err);
    return INITIAL_LEDGER_DATA;
  }
}

export function saveLedgerData(data: LedgerStoreData): void {
  if (typeof window === "undefined") return;
  try {
    const updatedData: LedgerStoreData = {
      ...data,
      lastUpdated: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedData));
  } catch (err) {
    console.error("Failed to save ledger data to localStorage", err);
  }
}

export function exportLedgerJson(data: LedgerStoreData): void {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const dateStr = new Date().toISOString().split("T")[0];
  a.href = url;
  a.download = `poker-ledger-backup-${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function importLedgerJson(jsonString: string): LedgerStoreData {
  const parsed = JSON.parse(jsonString) as LedgerStoreData;
  if (!parsed.players || !parsed.sessions || !parsed.cycles || !Array.isArray(parsed.players)) {
    throw new Error("Invalid PokerLedger backup JSON file structure.");
  }
  return parsed;
}
