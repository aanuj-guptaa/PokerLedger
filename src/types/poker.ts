export interface Player {
  id: string;
  name: string;
  avatar: string; // Color code or avatar identifier
  upiId?: string;
  phone?: string;
  notes?: string;
  createdAt: string;
  isArchived: boolean;
}

export interface SessionParticipant {
  playerId: string;
  buyIn: number;
  rebuys: number;
  totalBuyIn: number;
  cashOut: number;
  net: number;
}

export interface EditRecord {
  id: string;
  timestamp: string;
  author: string;
  summary: string;
  details?: string;
}

export interface PokerSession {
  id: string;
  sessionNumber: number;
  title: string;
  date: string; // ISO string
  cycleId: string;
  notes?: string;
  gameType?: string;
  participants: SessionParticipant[];
  totalPot: number;
  isBalanced: boolean;
  status: "live" | "completed";
  createdAt: string;
  updatedAt: string;
  editHistory: EditRecord[];
}

export type CycleStatus = "active" | "settling" | "closed";

export interface SettlementCycle {
  id: string;
  cycleNumber: number;
  name: string;
  startDate: string;
  endDate: string | null;
  status: CycleStatus;
  notes?: string;
  closedAt?: string;
}

export type PaymentStatus = "pending" | "completed";

export interface SettlementTransaction {
  id: string;
  cycleId: string;
  fromPlayerId: string; // debtor
  toPlayerId: string; // creditor
  amount: number;
  status: PaymentStatus;
  paidAt?: string;
  paymentMethod?: "UPI" | "Cash" | "Bank Transfer" | "Other";
  notes?: string;
  createdAt: string;
}

export interface PlayerStats {
  playerId: string;
  playerName: string;
  playerAvatar: string;
  totalSessions: number;
  totalBuyIn: number;
  totalCashOut: number;
  lifetimeNet: number;
  cycleBalance: number;
  winningSessions: number;
  losingSessions: number;
  breakevenSessions: number;
  winRate: number; // percentage
  biggestWin: { amount: number; sessionTitle: string; date: string } | null;
  biggestLoss: { amount: number; sessionTitle: string; date: string } | null;
  roiPercentage: number;
  avgBuyIn: number;
  avgNet: number;
}

export interface SettlementSuggestion {
  fromPlayerId: string;
  toPlayerId: string;
  amount: number;
  isExactMatch?: boolean;
}

export interface CycleBalanceSummary {
  playerId: string;
  cycleSessionNet: number;
  cycleSettlementPaid: number;
  cycleSettlementReceived: number;
  outstandingBalance: number; // Positive = owed money, Negative = owes money
}

export interface LedgerStoreData {
  players: Player[];
  sessions: PokerSession[];
  cycles: SettlementCycle[];
  settlements: SettlementTransaction[];
  activeCycleId: string;
  version: string;
  lastUpdated: string;
}
