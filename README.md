# ♠️ PokerLedger — Modern Poker Ledger & Smart Settlement Management

**PokerLedger** is a premium, full-stack web application tailored for private groups of friends who play multiple poker sessions nightly and settle balances periodically (every ~10 days).

It eliminates manual math, enforces strict zero-sum ledger integrity, tracks lifetime player statistics, and features an **intelligent settlement engine** that minimizes debt settlement transactions between members.

---

## 🌟 Key Features

### 1. 📊 Executive Financial Dashboard
- **Group Key Metrics**: Total sessions played, total chips pot volume, active player count, and current settlement cycle status.
- **Dynamic Leaderboard**: Real-time rankings by Net Profit/Loss, Total Buy-in, Total Cash-out, Win Rate %, and ROI %.
- **Scope Toggle**: Switch seamlessly between **Current Settlement Cycle** and **All-Time Cumulative** stats.
- **Zero-Sum Balance Verification**: Live visual confirmation that the total money owed in the group exactly balances the total money owing.

### 2. ♠️ Session Recording with Zero-Sum Invariant
- **Live Zero-Sum Balance Bar**: As you enter starting buy-ins, rebuys, and final cash-outs for each player, the system validates in real time that:
  $$\sum \text{Total Cash-Outs} = \sum \text{Total Buy-Ins} \iff \sum \text{Net P\&L} = 0$$
- **Discrepancy Alerts**: If missing chips or unrecorded rebuys are present, clear color-coded warning banners highlight the exact discrepancy (+₹X or -₹X) and prevent saving corrupted sessions.
- **Audit & Edit History**: Any modifications to past sessions record timestamps, editor, and before/after difference summaries, automatically recalculating all affected player balances.

### 3. ⚖️ Live Group Balances
- Dedicated view categorizing members into:
  - **Creditors (Owed Money — Green `+₹`)**: Players with positive cumulative net balances.
  - **Debtors (Owes Money — Red `-₹`)**: Players with negative cumulative net balances.
  - **Even & Settled (`₹0`)**: Members whose balances are settled.
- Clear mathematical breakdown:
  $$\text{Outstanding Balance} = \text{Session Net} + \text{Settlements Paid} - \text{Settlements Received}$$

### 4. 🧠 Smart Settlement Engine (Min-Cash-Flow)
- **Minimizes Total Transfers**: Uses an optimized Min-Cash-Flow bipartite matching algorithm:
  1. Identifies and executes exact 1-to-1 matching pairs first (e.g. A owes ₹2,000 and B is owed ₹2,000 $\rightarrow$ 1 transfer eliminates both).
  2. Greedily matches maximum debtors with maximum creditors.
- **Safety Guarantees**:
  - No player pays more than they owe.
  - No recipient receives more than they are owed.
  - All debts are completely cleared in the theoretical minimum number of transactions ($< N$).
- **1-Tap Settlement**:
  - Mark individual transactions as completed with 1 click.
  - Partial payments supported (e.g., pay ₹500 out of ₹1,000, leaving ₹500 remaining).
  - UPI deep links (`upi://pay?pa=...&am=...`) and instant QR code generation for PhonePe, Google Pay, and Paytm.

### 5. 🔄 Settlement Cycles (~10-Day Windows)
- Start a new settlement cycle manually or periodically.
- Displays each player's cycle starting net, settlements paid/received, and final balance.
- **Safe Cycle Closure**: Closing a cycle archives that cycle's payments and resets active balances to ₹0 for the next cycle, **without deleting any lifetime session history**.

### 6. 👤 Individual Player Profiles & Analytics
- Comprehensive profile for each group member:
  - Interactive cumulative P&L progression area chart (built with **Recharts**).
  - Biggest winning session and biggest losing session callouts.
  - Total buy-in, cash-out, win rate %, and ROI %.
  - Complete chronological session history for this player.
  - Incoming and outgoing settlement receipts log.

### 7. 💾 Zero-Database Setup & Complete Backup/Restore
- Runs instantly in any browser without needing external PostgreSQL / Supabase server setups or credentials.
- Backed by reactive persistent browser storage (`localStorage`).
- **1-Click JSON Backup & Restore**: Export complete ledger snapshots or restore from JSON anytime.
- Preloaded with realistic tournament sample data matching the prompt's examples (Anuj, Keshav, Abhishek, Tanishak, Sparsh, Rohan, Vikram).

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ (tested with Node v22.16.0)
- npm 9+

### Run Locally

```bash
# 1. Install dependencies
npm install

# 2. Run unit tests verifying zero-sum invariant and settlement minimization
npm test

# 3. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
npm run build
npm start
```

---

## 📁 Project Architecture

```
PokerLedger/
├── src/
│   ├── app/
│   │   ├── globals.css         # Dark theme poker styling & custom scrollbars
│   │   ├── layout.tsx          # App root with PokerProvider wrapper
│   │   └── page.tsx            # Main application coordinator & tab switcher
│   ├── components/
│   │   ├── balances/           # Live group balances (creditors vs debtors)
│   │   ├── cycles/             # Settlement cycle management & archiving
│   │   ├── dashboard/          # StatCards, LeaderboardTable, Cycle progress
│   │   ├── history/            # Searchable session history with multi-filter
│   │   ├── layout/             # Top Navbar, responsive drawer & brand header
│   │   ├── players/            # Player list & PlayerProfileModal with Recharts
│   │   ├── sessions/           # SessionModal (zero-sum bar) & SessionDetailModal
│   │   ├── settlements/        # Smart settlement plan, UPI QR modal, partial pay
│   │   └── settings/           # JSON backup/restore & sample data controls
│   ├── context/
│   │   └── PokerContext.tsx    # Reactive state management with local persistence
│   ├── lib/
│   │   ├── pokerMath.ts        # Zero-sum validation, currency formatting, player stats
│   │   ├── sampleData.ts       # Realistic seed data (matching prompt specifications)
│   │   ├── settlementEngine.ts # Min-cash-flow algorithm & UPI deep link helper
│   │   └── storage.ts          # LocalStorage adapter & JSON export/import
│   └── types/
│       └── poker.ts            # Domain types for players, sessions, cycles, transfers
└── test/
    └── verifyBusinessLogic.mjs # Automated unit tests for math and settlements
```

---

## 🧪 Verification & Test Suite

Run the test suite with:

```bash
npm test
```

### Verified Test Cases:
1. **Session #024 Calculations**: Verifies that Anuj (+₹500), Keshav (-₹200), and Abhishek (-₹300) match prompt examples and validate to zero.
2. **Unbalanced Session Guard**: Rejects unbalanced sessions and accurately reports discrepancies.
3. **Smart Settlement Minimization**: Matches the prompt's exact scenario:
   - Anuj: +₹2,500
   - Tanishak: +₹1,500
   - Keshav: -₹2,000
   - Abhishek: -₹1,000
   - Sparsh: -₹1,000
   - Verifies minimal transfers and zero residual balances.
4. **Exact 1-to-1 Match Priority**: Verifies that matching debtor-creditor pairs are paired directly in a single step.
5. **15-Player Stress Test**: Verifies that a full 15-player table with ₹13,500 in pot volume resolves with 0 error.
