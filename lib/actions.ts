"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { PayMethod, Prisma } from "@prisma/client";
import { prisma } from "./db";
import { requireStaff } from "./session";
import { recordPayment, voidPayment } from "./payments";
import { generateMonth } from "./billing";
import { monthOf } from "./dates";

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const day = (v: string) => { if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) throw new Error("Enter a valid date."); return new Date(v + "T00:00:00Z"); };
const amount = (v: string) => { if (!/^\d+(\.\d{1,2})?$/.test(v) || Number(v) <= 0) throw new Error("Enter an amount greater than zero (up to 2 decimals)."); return v; };
const method = (v: string) => { if (!(Object.values(PayMethod) as string[]).includes(v)) throw new Error("Choose a payment method."); return v as PayMethod; };
const email = (v: string) => { const e = v.toLowerCase(); if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) throw new Error("Enter a valid email."); return e; };
const month = (v: string) => { if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(v)) throw new Error("Month must look like 2026-11."); return v; };

async function run(path: string, fn: () => Promise<void>) {
  let err = "";
  try { await fn(); } catch (e) {
    if (e && typeof e === "object" && "digest" in e && String((e as { digest: string }).digest).startsWith("NEXT_REDIRECT")) throw e;
    err = e instanceof Error ? e.message : "Something went wrong.";
  }
  revalidatePath(path);
  redirect(err ? `${path}?err=${encodeURIComponent(err)}` : `${path}?ok=1`);
}
async function superAdmin() { const s = await requireStaff(); if (s.role !== "SUPER_ADMIN") throw new Error("Only the Super Admin can do this."); return s; }
async function assertOpen(d: Date) { const m = monthOf(d); if (await prisma.monthClose.findUnique({ where: { month: m } })) throw new Error(`${m} is closed.`); }
const audit = (actorId: string, action: string, entity: string, entityId: string, before?: unknown, after?: unknown, reason?: string) =>
  prisma.auditLog.create({ data: { actorId, action, entity, entityId, before: before as Prisma.InputJsonValue, after: after as Prisma.InputJsonValue, reason } });

export async function addPayment(fd: FormData) {
  await run("/admin/payments", async () => {
    const s = await requireStaff();
    const p = await recordPayment({ flatNumber: str(fd, "flat"), amount: amount(str(fd, "amount")), receivedOn: day(str(fd, "date")), method: method(str(fd, "method")), reference: str(fd, "reference") || undefined, notes: str(fd, "notes") || undefined, actorId: s.userId });
    redirect(`/admin/receipt/${p.id}`);
  });
}
export async function voidPay(fd: FormData) {
  await run("/admin/payments", async () => { const s = await requireStaff(); await voidPayment(str(fd, "id"), str(fd, "reason"), s.userId); });
}

export async function addExpense(fd: FormData) {
  await run("/admin/expenses", async () => {
    const s = await requireStaff(); const d = day(str(fd, "date")); await assertOpen(d);
    if (!str(fd, "title")) throw new Error("Enter a title.");
    const paid = str(fd, "paid") === "1";
    const e = await prisma.expense.create({ data: { title: str(fd, "title"), categoryId: str(fd, "category"), amount: amount(str(fd, "amount")), expenseDate: d, vendor: str(fd, "vendor") || null, description: str(fd, "description") || null, method: paid ? method(str(fd, "method")) : null, status: paid ? "PAID" : "RECORDED", paidOn: paid ? d : null, createdById: s.userId } });
    await audit(s.userId, "ADD_EXPENSE", "Expense", e.id, null, { title: e.title, amount: e.amount.toString(), status: e.status });
  });
}
export async function payExpense(fd: FormData) {
  await run("/admin/expenses", async () => {
    const s = await requireStaff(); const e = await prisma.expense.findUniqueOrThrow({ where: { id: str(fd, "id") } });
    if (e.status !== "RECORDED") throw new Error("Only unpaid expenses can be marked paid.");
    const d = day(str(fd, "date")); await assertOpen(d);
    await prisma.expense.update({ where: { id: e.id }, data: { status: "PAID", paidOn: d, method: method(str(fd, "method")) } });
    await audit(s.userId, "PAY_EXPENSE", "Expense", e.id, { status: e.status }, { status: "PAID", paidOn: str(fd, "date") });
  });
}
export async function voidExpense(fd: FormData) {
  await run("/admin/expenses", async () => {
    const s = await requireStaff(); const reason = str(fd, "reason"); if (!reason) throw new Error("A reason is required.");
    const e = await prisma.expense.findUniqueOrThrow({ where: { id: str(fd, "id") } });
    if (e.status === "VOID") throw new Error("Already voided."); await assertOpen(e.expenseDate);
    await prisma.expense.update({ where: { id: e.id }, data: { status: "VOID", voidReason: reason } });
    await audit(s.userId, "VOID_EXPENSE", "Expense", e.id, { status: e.status, amount: e.amount.toString() }, null, reason);
  });
}

export async function saveFlat(fd: FormData) {
  const n = str(fd, "number");
  await run(`/admin/flats/${n}`, async () => {
    const s = await requireStaff(); const f = await prisma.flat.findUniqueOrThrow({ where: { number: n } });
    const cc = str(fd, "customCharge");
    const data = { ownerName: str(fd, "ownerName") || null, tenantName: str(fd, "tenantName") || null, phone: str(fd, "phone") || null, occupancy: str(fd, "occupancy") === "VACANT" ? "VACANT" as const : "OCCUPIED" as const, customCharge: cc ? amount(cc) : null };
    await prisma.flat.update({ where: { id: f.id }, data });
    await audit(s.userId, "EDIT_FLAT", "Flat", f.id, { ...f, customCharge: f.customCharge?.toString() }, data);
  });
}
export async function addResident(fd: FormData) {
  const n = str(fd, "number");
  await run(`/admin/flats/${n}`, async () => {
    const s = await requireStaff(); const f = await prisma.flat.findUniqueOrThrow({ where: { number: n } });
    const r = await prisma.flatResident.create({ data: { flatId: f.id, email: email(str(fd, "email")), name: str(fd, "name") || null } });
    await audit(s.userId, "ADD_RESIDENT", "FlatResident", r.id, null, { flat: n, email: r.email });
  });
}
export async function toggleResident(fd: FormData) {
  const n = str(fd, "number");
  await run(`/admin/flats/${n}`, async () => {
    const s = await requireStaff(); const r = await prisma.flatResident.findUniqueOrThrow({ where: { id: str(fd, "id") } });
    await prisma.flatResident.update({ where: { id: r.id }, data: { active: !r.active } });
    await audit(s.userId, r.active ? "DEACTIVATE_RESIDENT" : "ACTIVATE_RESIDENT", "FlatResident", r.id, { active: r.active }, { active: !r.active });
  });
}

export async function addNotice(fd: FormData) {
  await run("/admin/notices", async () => {
    const s = await requireStaff(); if (!str(fd, "title") || !str(fd, "body")) throw new Error("Enter a title and message.");
    const pr = str(fd, "priority"); const exp = str(fd, "expires");
    const n = await prisma.notice.create({ data: { title: str(fd, "title"), body: str(fd, "body"), priority: pr === "URGENT" ? "URGENT" : pr === "IMPORTANT" ? "IMPORTANT" : "NORMAL", expiresAt: exp ? day(exp) : null, createdById: s.userId } });
    await audit(s.userId, "ADD_NOTICE", "Notice", n.id, null, { title: n.title });
  });
}

export async function generateBills(fd: FormData) {
  await run("/admin/settings", async () => { const s = await requireStaff(); await generateMonth(month(str(fd, "month")), s.userId); });
}
export async function setDefaultCharge(fd: FormData) {
  await run("/admin/settings", async () => {
    const s = await superAdmin(); const a = amount(str(fd, "amount")); const from = day(str(fd, "from"));
    const c = await prisma.chargeSetting.create({ data: { amount: a, effectiveFrom: from } });
    await audit(s.userId, "SET_DEFAULT_CHARGE", "ChargeSetting", c.id, null, { amount: a, from: str(fd, "from") });
  });
}
export async function setOpening(fd: FormData) {
  await run("/admin/settings", async () => {
    const s = await superAdmin(); const v = str(fd, "value"); if (!/^-?\d+(\.\d{1,2})?$/.test(v)) throw new Error("Enter a number.");
    const old = await prisma.setting.findUnique({ where: { key: "opening_balance" } });
    await prisma.setting.upsert({ where: { key: "opening_balance" }, create: { key: "opening_balance", value: v }, update: { value: v } });
    await audit(s.userId, "SET_OPENING_BALANCE", "Setting", "opening_balance", { value: old?.value }, { value: v }, str(fd, "reason") || undefined);
  });
}
export async function closeMonth(fd: FormData) {
  await run("/admin/settings", async () => {
    const s = await superAdmin(); const m = month(str(fd, "month"));
    await prisma.monthClose.create({ data: { month: m, closedById: s.userId } }); await audit(s.userId, "CLOSE_MONTH", "MonthClose", m);
  });
}
export async function reopenMonth(fd: FormData) {
  await run("/admin/settings", async () => {
    const s = await superAdmin(); const m = month(str(fd, "month")); const reason = str(fd, "reason"); if (!reason) throw new Error("A reason is required to reopen a month.");
    await prisma.monthClose.delete({ where: { month: m } }); await audit(s.userId, "REOPEN_MONTH", "MonthClose", m, null, null, reason);
  });
}
export async function addManager(fd: FormData) {
  await run("/admin/settings", async () => {
    const s = await superAdmin(); const e = email(str(fd, "email"));
    const u = await prisma.user.upsert({ where: { email: e }, create: { email: e, role: "MANAGER", name: str(fd, "name") || null }, update: { active: true } });
    await audit(s.userId, "ADD_MANAGER", "User", u.id, null, { email: e });
  });
}
export async function toggleManager(fd: FormData) {
  await run("/admin/settings", async () => {
    const s = await superAdmin(); const u = await prisma.user.findUniqueOrThrow({ where: { id: str(fd, "id") } });
    if (u.role !== "MANAGER") throw new Error("Only manager accounts can be changed here.");
    await prisma.user.update({ where: { id: u.id }, data: { active: !u.active } }); await audit(s.userId, "TOGGLE_MANAGER", "User", u.id, { active: u.active }, { active: !u.active });
  });
}
