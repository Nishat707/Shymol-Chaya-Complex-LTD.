type PaymentForRanking = {
  amount: { toString(): string } | number;
  voidedAt: Date | null;
  flat: { id: string; number: string; ownerName: string | null };
};

type ExpenseForRanking = {
  amount: { toString(): string } | number;
  status: string;
  category: { id: string; name: string };
};

export type RankedAmount = { label: string; total: number };

function topAmounts(amounts: Map<string, RankedAmount>, limit: number): RankedAmount[] {
  return Array.from(amounts.values())
    .sort((a, b) => b.total - a.total || a.label.localeCompare(b.label))
    .slice(0, limit);
}

export function topPayers(payments: PaymentForRanking[], limit = 5): RankedAmount[] {
  const amounts = new Map<string, RankedAmount>();
  for (const payment of payments) {
    if (payment.voidedAt) continue;
    const label = `${payment.flat.ownerName ?? "Owner not set"} · Flat ${payment.flat.number}`;
    const ranked = amounts.get(payment.flat.id) ?? { label, total: 0 };
    ranked.total += Number(payment.amount);
    amounts.set(payment.flat.id, ranked);
  }
  return topAmounts(amounts, limit);
}

export function topExpenseCategories(expenses: ExpenseForRanking[], limit = 5): RankedAmount[] {
  const amounts = new Map<string, RankedAmount>();
  for (const expense of expenses) {
    if (expense.status !== "PAID") continue;
    const ranked = amounts.get(expense.category.id) ?? { label: expense.category.name, total: 0 };
    ranked.total += Number(expense.amount);
    amounts.set(expense.category.id, ranked);
  }
  return topAmounts(amounts, limit);
}
