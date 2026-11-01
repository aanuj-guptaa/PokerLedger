import { LedgerStoreData, Player, PokerSession, SettlementCycle, SettlementTransaction } from "../types/poker";

export const INITIAL_PLAYERS: Player[] = [
  {
    id: "p-anuj",
    name: "Anuj",
    avatar: "#10b981", // Emerald
    upiId: "anuj@okhdfcbank",
    phone: "+91 98765 43210",
    createdAt: "2026-11-01T00:00:00Z",
    isArchived: false,
  },
  {
    id: "p-keshav",
    name: "Keshav",
    avatar: "#f59e0b", // Gold
    upiId: "keshav@okaxis",
    phone: "+91 98765 43211",
    createdAt: "2026-11-01T00:00:00Z",
    isArchived: false,
  },
  {
    id: "p-abhishek",
    name: "Abhishek",
    avatar: "#6366f1", // Indigo
    upiId: "abhishek@paytm",
    phone: "+91 98765 43212",
    createdAt: "2026-11-01T00:00:00Z",
    isArchived: false,
  },
  {
    id: "p-tanishak",
    name: "Tanishak",
    avatar: "#14b8a6", // Teal
    upiId: "tanishak@icici",
    phone: "+91 98765 43213",
    createdAt: "2026-11-01T00:00:00Z",
    isArchived: false,
  },
  {
    id: "p-sparsh",
    name: "Sparsh",
    avatar: "#f43f5e", // Rose
    upiId: "sparsh@okaxis",
    phone: "+91 98765 43214",
    createdAt: "2026-11-01T00:00:00Z",
    isArchived: false,
  },
  {
    id: "p-rohan",
    name: "Rohan",
    avatar: "#a855f7", // Purple
    upiId: "rohan@oksbi",
    phone: "+91 98765 43215",
    createdAt: "2026-11-01T00:00:00Z",
    isArchived: false,
  },
  {
    id: "p-vikram",
    name: "Vikram",
    avatar: "#0ea5e9", // Sky
    upiId: "vikram@hdfcbank",
    phone: "+91 98765 43216",
    createdAt: "2026-11-01T00:00:00Z",
    isArchived: false,
  },
  {
    id: "p-divyansh",
    name: "Divyansh",
    avatar: "#f97316", // Orange
    upiId: "divyansh@kotak",
    phone: "+91 98765 43217",
    createdAt: "2026-11-01T00:00:00Z",
    isArchived: false,
  },
];

export const INITIAL_CYCLES: SettlementCycle[] = [
  {
    id: "cycle-1",
    cycleNumber: 1,
    name: "Cycle #1 (Active)",
    startDate: new Date().toISOString(),
    endDate: null,
    status: "active",
    notes: "Active settlement cycle",
  },
];

export const INITIAL_SETTLEMENTS: SettlementTransaction[] = [];

export const INITIAL_SESSIONS: PokerSession[] = [];

export const INITIAL_LEDGER_DATA: LedgerStoreData = {
  players: INITIAL_PLAYERS,
  sessions: INITIAL_SESSIONS,
  cycles: INITIAL_CYCLES,
  settlements: INITIAL_SETTLEMENTS,
  activeCycleId: "cycle-1",
  version: "2.0.0",
  lastUpdated: new Date().toISOString(),
};
