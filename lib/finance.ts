import { prisma } from "./db";
// Cash basis: unpaid charges are not income; recorded-but-unpaid expenses are not outflow.
export async function summary() {
  const [opening, inc, out, charges, alloc] = await Promise.all([
    prisma.setting.findUnique({ where: { key: "opening_balance" } }),
    prisma.payment.aggregate({ where: { voidedAt: null }, _sum: { amount: true } }),
    prisma.expense.aggregate({ where: { status: "PAID" }, _sum: { amount: true } }),
    prisma.monthlyCharge.aggregate({ _sum: { amount: true, waived: true } }),
    prisma.paymentAllocation.aggregate({ where: { payment: { voidedAt: null } }, _sum: { amount: true } }),
  ]);
  const o = Number(opening?.value ?? 0), i = Number(inc._sum.amount ?? 0), e = Number(out._sum.amount ?? 0);
  const billed = Number(charges._sum.amount ?? 0) - Number(charges._sum.waived ?? 0);
  return { opening: o, income: i, expensesPaid: e, balance: o + i - e, outstanding: billed - Number(alloc._sum.amount ?? 0) };
}
