import { Prisma, PayMethod } from "@prisma/client";
import { prisma } from "./db";
import { allocate } from "./allocate";
import { monthOf } from "./dates";

export async function recordPayment(i: { flatNumber: string; amount: string; receivedOn: Date; method: PayMethod; reference?: string; notes?: string; actorId: string }) {
  return prisma.$transaction(async tx => {
    const month = monthOf(i.receivedOn);
    if (await tx.monthClose.findUnique({ where: { month } })) throw new Error(`${month} is closed. Ask the Super Admin to reopen it.`);
    const flat = await tx.flat.findUniqueOrThrow({ where: { number: i.flatNumber } });
    const charges = await tx.monthlyCharge.findMany({ where: { flatId: flat.id }, include: { allocations: { where: { payment: { voidedAt: null } } } } });
    const dues = charges.map(c => ({
      chargeId: c.id, month: c.month,
      due: c.allocations.reduce((a, x) => a.minus(x.amount), c.amount.minus(c.waived)),
    }));
    const allocs = allocate(i.amount, dues);
    const n = await tx.counter.upsert({ where: { key: "receipt" }, create: { key: "receipt", value: 1 }, update: { value: { increment: 1 } } });
    const receiptNo = `RC-${month.slice(0, 4)}-${String(n.value).padStart(5, "0")}`;
    const p = await tx.payment.create({
      data: { receiptNo, flatId: flat.id, amount: i.amount, receivedOn: i.receivedOn, method: i.method, reference: i.reference, notes: i.notes, createdById: i.actorId,
        allocations: { create: allocs } },
    });
    await tx.auditLog.create({ data: { actorId: i.actorId, action: "RECORD_PAYMENT", entity: "Payment", entityId: p.id, after: { receiptNo, flat: i.flatNumber, amount: i.amount } } });
    return p;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

export async function voidPayment(paymentId: string, reason: string, actorId: string) {
  if (!reason.trim()) throw new Error("A reason is required.");
  return prisma.$transaction(async tx => {
    const p = await tx.payment.findUniqueOrThrow({ where: { id: paymentId } });
    if (p.voidedAt) throw new Error("Already voided.");
    if (await tx.monthClose.findUnique({ where: { month: monthOf(p.receivedOn) } })) throw new Error("That month is closed.");
    await tx.payment.update({ where: { id: paymentId }, data: { voidedAt: new Date(), voidReason: reason } });
    await tx.auditLog.create({ data: { actorId, action: "VOID_PAYMENT", entity: "Payment", entityId: paymentId, before: { receiptNo: p.receiptNo, amount: p.amount.toString() }, reason } });
  });
}
