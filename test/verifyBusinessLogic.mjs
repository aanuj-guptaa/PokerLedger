// Test suite for PokerLedger financial math and settlement minimization algorithm
import assert from "node:assert";

// 1. Participant Net Calculation
function calculateParticipantNet(buyIn, rebuys, cashOut) {
  const safeBuyIn = Math.max(0, Math.round(buyIn || 0));
  const safeRebuys = Math.max(0, Math.round(rebuys || 0));
  const safeCashOut = Math.max(0, Math.round(cashOut || 0));
  const totalBuyIn = safeBuyIn + safeRebuys;
  const net = safeCashOut - totalBuyIn;
  return { totalBuyIn, net };
}

// 2. Zero-sum Session Balance Validation
function validateSessionBalance(participants) {
  let totalBuyIn = 0;
  let totalCashOut = 0;
  for (const p of participants) {
    totalBuyIn += Math.round(p.totalBuyIn || 0);
    totalCashOut += Math.round(p.cashOut || 0);
  }
  const discrepancy = totalCashOut - totalBuyIn;
  return {
    isBalanced: discrepancy === 0,
    totalBuyIn,
    totalCashOut,
    discrepancy,
  };
}

// 3. Smart Settlement Algorithm (Min-Cash-Flow)
function calculateOptimizedSettlements(balanceMap) {
  const creditors = [];
  const debtors = [];

  for (const [playerId, balRaw] of Object.entries(balanceMap)) {
    const bal = Math.round(balRaw);
    if (bal > 0) {
      creditors.push({ playerId, amount: bal });
    } else if (bal < 0) {
      debtors.push({ playerId, amount: Math.abs(bal) });
    }
  }

  const transactions = [];

  // Pass 1: Exact 1-to-1 matching
  for (let i = debtors.length - 1; i >= 0; i--) {
    const d = debtors[i];
    const matchIndex = creditors.findIndex((c) => c.amount === d.amount);
    if (matchIndex !== -1) {
      const c = creditors[matchIndex];
      transactions.push({
        fromPlayerId: d.playerId,
        toPlayerId: c.playerId,
        amount: d.amount,
        isExactMatch: true,
      });
      debtors.splice(i, 1);
      creditors.splice(matchIndex, 1);
    }
  }

  // Pass 2: Greedy matching
  while (creditors.length > 0 && debtors.length > 0) {
    creditors.sort((a, b) => b.amount - a.amount);
    debtors.sort((a, b) => b.amount - a.amount);

    const largestCreditor = creditors[0];
    const largestDebtor = debtors[0];

    const paymentAmount = Math.min(largestCreditor.amount, largestDebtor.amount);

    if (paymentAmount > 0) {
      transactions.push({
        fromPlayerId: largestDebtor.playerId,
        toPlayerId: largestCreditor.playerId,
        amount: paymentAmount,
        isExactMatch: false,
      });

      largestCreditor.amount -= paymentAmount;
      largestDebtor.amount -= paymentAmount;
    }

    if (largestCreditor.amount <= 0) creditors.shift();
    if (largestDebtor.amount <= 0) debtors.shift();
  }

  return transactions;
}

console.log("Starting PokerLedger Verification Test Suite...\n");

// Test 1: Session #024 from Prompt
console.log("Test 1: Session #024 Calculation and Zero-Sum Validation");
const s24_anuj = calculateParticipantNet(500, 200, 1200);
assert.strictEqual(s24_anuj.totalBuyIn, 700);
assert.strictEqual(s24_anuj.net, 500, "Anuj Net should be +500");

const s24_keshav = calculateParticipantNet(500, 0, 300);
assert.strictEqual(s24_keshav.totalBuyIn, 500);
assert.strictEqual(s24_keshav.net, -200, "Keshav Net should be -200");

const s24_abhishek = calculateParticipantNet(500, 100, 300);
assert.strictEqual(s24_abhishek.totalBuyIn, 600);
assert.strictEqual(s24_abhishek.net, -300, "Abhishek Net should be -300");

const session24Validation = validateSessionBalance([
  { ...s24_anuj, cashOut: 1200, playerId: "anuj" },
  { ...s24_keshav, cashOut: 300, playerId: "keshav" },
  { ...s24_abhishek, cashOut: 300, playerId: "abhishek" },
]);

assert.strictEqual(session24Validation.isBalanced, true, "Session 024 must balance to zero");
assert.strictEqual(session24Validation.totalBuyIn, 1800);
assert.strictEqual(session24Validation.totalCashOut, 1800);
assert.strictEqual(session24Validation.discrepancy, 0);
console.log("✓ Test 1 Passed: Session #024 matches specification exactly.\n");

// Test 2: Unbalanced session detection
console.log("Test 2: Unbalanced Session Guard");
const unbalanced = validateSessionBalance([
  { totalBuyIn: 1000, cashOut: 1200, playerId: "p1" },
  { totalBuyIn: 1000, cashOut: 900, playerId: "p2" },
]);
assert.strictEqual(unbalanced.isBalanced, false);
assert.strictEqual(unbalanced.discrepancy, 100, "Discrepancy should be +100");
console.log("✓ Test 2 Passed: Unbalanced session correctly flagged.\n");

// Test 3: Prompt Section 5 Example Settlement
console.log("Test 3: Smart Settlement Minimization Algorithm (Prompt Example)");
/*
  Anuj is owed ₹2,500 (+2500)
  Tanishak is owed ₹1,500 (+1500)
  Keshav owes ₹2,000 (-2000)
  Abhishek owes ₹1,000 (-1000)
  Sparsh owes ₹1,000 (-1000)
*/
const promptBalances = {
  anuj: 2500,
  tanishak: 1500,
  keshav: -2000,
  abhishek: -1000,
  sparsh: -1000,
};

const settlements = calculateOptimizedSettlements(promptBalances);
console.log("Generated Transactions:");
settlements.forEach((t) => {
  console.log(`  • ${t.fromPlayerId} pays ${t.toPlayerId} ₹${t.amount} (exact match: ${t.isExactMatch})`);
});

// Verify transaction count is minimized (N=5 players => max 4 transactions)
assert(settlements.length <= 4, `Transactions count must be <= 4, got ${settlements.length}`);

// Verify total debt cleared equals total positive balances
const totalTransferred = settlements.reduce((sum, t) => sum + t.amount, 0);
assert.strictEqual(totalTransferred, 4000, "Total transferred must be exactly ₹4,000");

// Verify each player pays / receives exact balance
const verifiedNet = { anuj: 0, tanishak: 0, keshav: 0, abhishek: 0, sparsh: 0 };
for (const t of settlements) {
  verifiedNet[t.fromPlayerId] -= t.amount;
  verifiedNet[t.toPlayerId] += t.amount;
}
assert.strictEqual(verifiedNet.anuj, 2500);
assert.strictEqual(verifiedNet.tanishak, 1500);
assert.strictEqual(verifiedNet.keshav, -2000);
assert.strictEqual(verifiedNet.abhishek, -1000);
assert.strictEqual(verifiedNet.sparsh, -1000);
console.log("✓ Test 3 Passed: All balances cleared, minimal transactions generated.\n");

// Test 4: Exact 1-to-1 match prioritization
console.log("Test 4: Exact 1-to-1 Matching Priority");
const exactMatchBalances = {
  playerA: -3500,
  playerB: 3500,
  playerC: -1500,
  playerD: 1500,
};
const exactSettlements = calculateOptimizedSettlements(exactMatchBalances);
assert.strictEqual(exactSettlements.length, 2, "Should resolve 4 players with matching pairs in exactly 2 transactions");
assert(exactSettlements.every((t) => t.isExactMatch), "All should be marked exact matches");
console.log("✓ Test 4 Passed: 1-to-1 exact pairs prioritized correctly.\n");

// Test 5: 15-player stress test
console.log("Test 5: 15-Player Stress Test");
const fifteenPlayerBalances = {
  p1: 5000,
  p2: 3000,
  p3: 2000,
  p4: 1500,
  p5: 1000,
  p6: 500,
  p7: 500,
  p8: -2000,
  p9: -2000,
  p10: -2500,
  p11: -1500,
  p12: -3000,
  p13: -1000,
  p14: -1000,
  p15: -500,
};
// Check sum
const sumFifteen = Object.values(fifteenPlayerBalances).reduce((a, b) => a + b, 0);
assert.strictEqual(sumFifteen, 0, "Test pool must sum to zero");

const fifteenSettlements = calculateOptimizedSettlements(fifteenPlayerBalances);
console.log(`15 players with ₹13,500 total volume resolved in ${fifteenSettlements.length} transfers.`);
assert(fifteenSettlements.length < 15, "Transactions must be strictly less than 15");

const verified15 = {};
for (const k of Object.keys(fifteenPlayerBalances)) verified15[k] = 0;
for (const t of fifteenSettlements) {
  verified15[t.fromPlayerId] -= t.amount;
  verified15[t.toPlayerId] += t.amount;
}
for (const [pId, bal] of Object.entries(fifteenPlayerBalances)) {
  assert.strictEqual(verified15[pId], bal, `Player ${pId} balance mismatch`);
}
console.log("✓ Test 5 Passed: 15-player group fully balanced with zero discrepancy.\n");

console.log("=========================================");
console.log("🎉 ALL TESTS PASSED SUCCESSFULLY! (5/5)");
console.log("=========================================");
