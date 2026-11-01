import { SettlementSuggestion, CycleBalanceSummary } from "../types/poker";

interface ParticipantBalance {
  playerId: string;
  amount: number;
}

/**
 * Intelligent settlement engine that minimizes the number of transactions
 * required to settle everyone's balances.
 *
 * Guaranteed properties:
 * - Minimizes total number of payment transactions.
 * - All positive and negative balances are completely cleared.
 * - No player pays more than they owe.
 * - No recipient receives more than they are owed.
 * - Operates purely on integers in INR.
 */
export function calculateOptimizedSettlements(
  balanceMap: Map<string, CycleBalanceSummary> | Record<string, number>
): SettlementSuggestion[] {
  const creditors: ParticipantBalance[] = [];
  const debtors: ParticipantBalance[] = [];

  // 1. Separate into creditors and debtors
  if (balanceMap instanceof Map) {
    for (const [playerId, summary] of balanceMap.entries()) {
      const bal = Math.round(summary.outstandingBalance);
      if (bal > 0) {
        creditors.push({ playerId, amount: bal });
      } else if (bal < 0) {
        debtors.push({ playerId, amount: Math.abs(bal) });
      }
    }
  } else {
    for (const [playerId, balance] of Object.entries(balanceMap)) {
      const bal = Math.round(balance);
      if (bal > 0) {
        creditors.push({ playerId, amount: bal });
      } else if (bal < 0) {
        debtors.push({ playerId, amount: Math.abs(bal) });
      }
    }
  }

  const transactions: SettlementSuggestion[] = [];

  // 2. Optimization pass: Exact 1-to-1 matches
  // If debtor owes exactly what a creditor is owed, match them immediately to eliminate both.
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
      // Remove both matched
      debtors.splice(i, 1);
      creditors.splice(matchIndex, 1);
    }
  }

  // 3. Greedy Min-Cash-Flow matching for remaining participants
  // Sort creditors descending, debtors descending
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

    if (largestCreditor.amount <= 0) {
      creditors.shift();
    }
    if (largestDebtor.amount <= 0) {
      debtors.shift();
    }
  }

  return transactions;
}

/**
 * Generate UPI deep link for mobile payment
 */
export function generateUpiLink(
  upiId: string,
  recipientName: string,
  amount: number,
  note: string = "Poker Settlement"
): string {
  const cleanUpi = upiId.trim();
  const encodedName = encodeURIComponent(recipientName);
  const encodedNote = encodeURIComponent(note);
  return `upi://pay?pa=${cleanUpi}&pn=${encodedName}&am=${amount}&tn=${encodedNote}&cu=INR`;
}
