import { db } from "./db";
// Cash basis: unpaid charges are not income; recorded-but-unpaid expenses are not outflow.
export async function summary() {
  const d = db();
  const [opening, inc, out, charges, alloc] = await Promise.all([
    d.orm.public.Setting.first({ key: "opening_balance" }),
    d.orm.public.Payment.where((p) => p.voidedAt.isNull()).aggregate((a) => ({ total: a.sum("amount") })),
    d.orm.public.Expense.where({ status: "PAID" }).aggregate((a) => ({ total: a.sum("amount") })),
    d.orm.public.MonthlyCharge.aggregate((a) => ({ amount: a.sum("amount"), waived: a.sum("waived") })),
    d.orm.public.PaymentAllocation.where((pa) => pa.payment.some((p) => p.voidedAt.isNull())).aggregate((a) => ({ total: a.sum("amount") })),
  ]);
  const o = Number(opening?.value ?? 0), i = Number(inc.total ?? 0), e = Number(out.total ?? 0);
  const billed = Number(charges.amount ?? 0) - Number(charges.waived ?? 0);
  return { opening: o, income: i, expensesPaid: e, balance: o + i - e, outstanding: billed - Number(alloc.total ?? 0) };
}
