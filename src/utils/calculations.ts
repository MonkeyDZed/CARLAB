import type { TransactionSummary } from "../features/transactions/types";

export function calculateBalance(summary: TransactionSummary): number {
  return summary.totalIncomes - summary.totalExpenses;
}
