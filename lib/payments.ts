import { Decimal } from "decimal.js";
import { db } from "./db";
import { allocate } from "./allocate";
import { monthOf } from "./dates";

export type PayMethod = "CASH" | "BANK_TRANSFER" | "MOBILE_FINANCIAL_SERVICE" | "OTHER";
export const PAY_METHODS: PayMethod[] = ["CASH", "BANK_TRANSFER", "MOBILE_FINANCIAL_SERVICE", "OTHER"];
const takaText = (amount: string) => `৳${Number(amount).toLocaleString("en-US")}`;

export async function recordPayment(i: { flatNumber: string; amount: string; receivedOn: Date; method: PayMethod; reference?: string; notes?: string; actorId: string }) {
  const receivedOn = i.receivedOn.toISOString().slice(0, 10);
  return db().transaction(async tx => {
    const month = monthOf(i.receivedOn);
    if (await tx.orm.public.MonthClose.first({ month })) throw new Error(`${month} is closed. Ask the Super Admin to reopen it.`);
    const flat = await tx.orm.public.Flat.firstOrThrow({ number: i.flatNumber });
    const charges = await tx.orm.public.MonthlyCharge
      .where({ flatId: flat.id })
      .include("allocations", (al) => al.where((x) => x.payment.some((p) => p.voidedAt.isNull())))
      .all();
    const dues = charges.map(c => ({
      chargeId: c.id, month: c.month,
      due: new Decimal(c.amount).minus(c.waived).minus(c.allocations.reduce((a, x) => a.plus(x.amount), new Decimal(0))),
    }));
    const allocs = allocate(i.amount, dues);
    const counter = await tx.orm.public.Counter.where({ key: "receipt" }).forUpdate().first();
    const value = (counter?.value ?? 0) + 1;
    if (counter) await tx.orm.public.Counter.where({ key: "receipt" }).update({ value });
    else await tx.orm.public.Counter.create({ key: "receipt", value });
    const receiptNo = `RC-${month.slice(0, 4)}-${String(value).padStart(5, "0")}`;
    const p = await tx.orm.public.Payment.create({
      receiptNo, flatId: flat.id, amount: i.amount, receivedOn, method: i.method, reference: i.reference, notes: i.notes, createdById: i.actorId,
    });
    await tx.orm.public.PaymentAllocation.createAll(allocs.map(a => ({ paymentId: p.id, chargeId: a.chargeId, amount: a.amount.toString() })));
    await tx.orm.public.AuditLog.create({ actorId: i.actorId, action: "RECORD_PAYMENT", entity: "Payment", entityId: p.id, after: { receiptNo, flat: i.flatNumber, amount: i.amount } });
    const residents = await tx.orm.public.FlatResident.where({ flatId: flat.id, active: true }).all();
    for (const resident of residents) await tx.orm.public.Notification.create({ recipientEmail: resident.email, type: "PAYMENT", title: "Service charge payment recorded", body: `${takaText(i.amount)} received for Flat ${i.flatNumber}`, href: "/resident" });
    return p;
  }, { isolationLevel: "Serializable" });
}

export async function voidPayment(paymentId: string, reason: string, actorId: string) {
  if (!reason.trim()) throw new Error("A reason is required.");
  return db().transaction(async tx => {
    const p = await tx.orm.public.Payment.firstOrThrow({ id: paymentId });
    if (p.voidedAt) throw new Error("Already voided.");
    const month = p.receivedOn.slice(0, 7); // Date columns read as "YYYY-MM-DD".
    if (await tx.orm.public.MonthClose.first({ month })) throw new Error("That month is closed.");
    await tx.orm.public.Payment.where({ id: paymentId }).update({ voidedAt: new Date(), voidReason: reason });
    await tx.orm.public.AuditLog.create({ actorId, action: "VOID_PAYMENT", entity: "Payment", entityId: paymentId, before: { receiptNo: p.receiptNo, amount: p.amount }, reason });
  });
}
