import { Prisma } from "@prisma/client";
export type Due = { chargeId: string; month: string; due: Prisma.Decimal };

// Applies a payment to the oldest unpaid months first. Throws if it exceeds total dues.
export function allocate(amount: Prisma.Decimal.Value, dues: Due[]) {
  let left = new Prisma.Decimal(amount);
  if (left.lte(0)) throw new Error("Amount must be greater than zero.");
  const out: { chargeId: string; amount: Prisma.Decimal }[] = [];
  for (const d of [...dues].sort((a, b) => a.month.localeCompare(b.month))) {
    if (left.lte(0)) break;
    if (d.due.lte(0)) continue;
    const a = Prisma.Decimal.min(left, d.due);
    out.push({ chargeId: d.chargeId, amount: a });
    left = left.minus(a);
  }
  if (left.gt(0)) throw new Error(`Amount exceeds total dues by ${left.toFixed(2)}.`);
  return out;
}
