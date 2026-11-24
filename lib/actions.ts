"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "./db";
import { requireStaff } from "./session";
import { PAY_METHODS, recordPayment, voidPayment, type PayMethod } from "./payments";
import { generateMonth } from "./billing";
import { monthOfDate } from "./dates";

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const day = (v: string) => { if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) throw new Error("Enter a valid date."); return v; };
const amount = (v: string) => { if (!/^\d+(\.\d{1,2})?$/.test(v) || Number(v) <= 0) throw new Error("Enter an amount greater than zero (up to 2 decimals)."); return v; };
const method = (v: string) => { if (!PAY_METHODS.includes(v as PayMethod)) throw new Error("Choose a payment method."); return v as PayMethod; };
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
async function assertOpen(d: string) { const m = monthOfDate(d); if (await db().orm.public.MonthClose.first({ month: m })) throw new Error(`${m} is closed.`); }
const audit = (actorId: string, action: string, entity: string, entityId: string, before?: unknown, after?: unknown, reason?: string) =>
  db().orm.public.AuditLog.create({ actorId, action, entity, entityId, before: before === undefined ? undefined : JSON.parse(JSON.stringify(before)), after: after === undefined ? undefined : JSON.parse(JSON.stringify(after)), reason });

export async function addPayment(fd: FormData) {
  await run("/admin/payments", async () => {
    const s = await requireStaff();
    const p = await recordPayment({ flatNumber: str(fd, "flat"), amount: amount(str(fd, "amount")), receivedOn: new Date(day(str(fd, "date")) + "T00:00:00Z"), method: method(str(fd, "method")), reference: str(fd, "reference") || undefined, notes: str(fd, "notes") || undefined, actorId: s.userId });
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
    const e = await db().orm.public.Expense.create({ title: str(fd, "title"), categoryId: str(fd, "category"), amount: amount(str(fd, "amount")), expenseDate: d, vendor: str(fd, "vendor") || null, description: str(fd, "description") || null, method: paid ? method(str(fd, "method")) : null, status: paid ? "PAID" : "RECORDED", paidOn: paid ? d : null, createdById: s.userId });
    await audit(s.userId, "ADD_EXPENSE", "Expense", e.id, null, { title: e.title, amount: e.amount, status: e.status });
  });
}
export async function payExpense(fd: FormData) {
  await run("/admin/expenses", async () => {
    const s = await requireStaff(); const e = await db().orm.public.Expense.firstOrThrow({ id: str(fd, "id") });
    if (e.status !== "RECORDED") throw new Error("Only unpaid expenses can be marked paid.");
    const d = day(str(fd, "date")); await assertOpen(d);
    await db().orm.public.Expense.where({ id: e.id }).update({ status: "PAID", paidOn: d, method: method(str(fd, "method")) });
    await audit(s.userId, "PAY_EXPENSE", "Expense", e.id, { status: e.status }, { status: "PAID", paidOn: str(fd, "date") });
  });
}
export async function voidExpense(fd: FormData) {
  await run("/admin/expenses", async () => {
    const s = await requireStaff(); const reason = str(fd, "reason"); if (!reason) throw new Error("A reason is required.");
    const e = await db().orm.public.Expense.firstOrThrow({ id: str(fd, "id") });
    if (e.status === "VOID") throw new Error("Already voided."); await assertOpen(e.expenseDate);
    await db().orm.public.Expense.where({ id: e.id }).update({ status: "VOID", voidReason: reason });
    await audit(s.userId, "VOID_EXPENSE", "Expense", e.id, { status: e.status, amount: e.amount }, null, reason);
  });
}

export async function saveFlat(fd: FormData) {
  const n = str(fd, "number");
  await run(`/admin/flats/${n}`, async () => {
    const s = await requireStaff(); const f = await db().orm.public.Flat.firstOrThrow({ number: n });
    const cc = str(fd, "customCharge");
    const data = { ownerName: str(fd, "ownerName") || null, tenantName: str(fd, "tenantName") || null, phone: str(fd, "phone") || null, occupancy: str(fd, "occupancy") === "VACANT" ? "VACANT" as const : "OCCUPIED" as const, customCharge: cc ? amount(cc) : null };
    await db().orm.public.Flat.where({ id: f.id }).update(data);
    await audit(s.userId, "EDIT_FLAT", "Flat", f.id, { ...f, customCharge: f.customCharge ?? undefined }, data);
  });
}
export async function addResident(fd: FormData) {
  const n = str(fd, "number");
  await run(`/admin/flats/${n}`, async () => {
    const s = await requireStaff(); const f = await db().orm.public.Flat.firstOrThrow({ number: n });
    const r = await db().orm.public.FlatResident.create({ flatId: f.id, email: email(str(fd, "email")), name: str(fd, "name") || null });
    await audit(s.userId, "ADD_RESIDENT", "FlatResident", r.id, null, { flat: n, email: r.email });
  });
}
export async function toggleResident(fd: FormData) {
  const n = str(fd, "number");
  await run(`/admin/flats/${n}`, async () => {
    const s = await requireStaff(); const r = await db().orm.public.FlatResident.firstOrThrow({ id: str(fd, "id") });
    await db().orm.public.FlatResident.where({ id: r.id }).update({ active: !r.active });
    await audit(s.userId, r.active ? "DEACTIVATE_RESIDENT" : "ACTIVATE_RESIDENT", "FlatResident", r.id, { active: r.active }, { active: !r.active });
  });
}

export async function addNotice(fd: FormData) {
  await run("/admin/notices", async () => {
    const s = await requireStaff(); if (!str(fd, "title") || !str(fd, "body")) throw new Error("Enter a title and message.");
    const pr = str(fd, "priority"); const exp = str(fd, "expires");
    const n = await db().orm.public.Notice.create({ title: str(fd, "title"), body: str(fd, "body"), priority: pr === "URGENT" ? "URGENT" : pr === "IMPORTANT" ? "IMPORTANT" : "NORMAL", expiresAt: exp ? new Date(day(exp) + "T00:00:00Z") : null, createdById: s.userId });
    await audit(s.userId, "ADD_NOTICE", "Notice", n.id, null, { title: n.title });
  });
}

export async function generateBills(fd: FormData) {
  await run("/admin/settings", async () => { const s = await requireStaff(); await generateMonth(month(str(fd, "month")), s.userId); });
}
export async function setDefaultCharge(fd: FormData) {
  await run("/admin/settings", async () => {
    const s = await superAdmin(); const a = amount(str(fd, "amount")); const from = day(str(fd, "from"));
    const c = await db().orm.public.ChargeSetting.create({ amount: a, effectiveFrom: from });
    await audit(s.userId, "SET_DEFAULT_CHARGE", "ChargeSetting", c.id, null, { amount: a, from: str(fd, "from") });
  });
}
export async function setOpening(fd: FormData) {
  await run("/admin/settings", async () => {
    const s = await superAdmin(); const v = str(fd, "value"); if (!/^-?\d+(\.\d{1,2})?$/.test(v)) throw new Error("Enter a number.");
    const existing = await db().orm.public.Setting.first({ key: "opening_balance" });
    const old = existing?.value;
    if (existing) await db().orm.public.Setting.where({ key: "opening_balance" }).update({ value: v });
    else await db().orm.public.Setting.create({ key: "opening_balance", value: v });
    await audit(s.userId, "SET_OPENING_BALANCE", "Setting", "opening_balance", old === undefined ? undefined : { value: old }, { value: v }, str(fd, "reason") || undefined);
  });
}
export async function closeMonth(fd: FormData) {
  await run("/admin/settings", async () => {
    const s = await superAdmin(); const m = month(str(fd, "month"));
    await db().orm.public.MonthClose.create({ month: m, closedById: s.userId }); await audit(s.userId, "CLOSE_MONTH", "MonthClose", m);
  });
}
export async function reopenMonth(fd: FormData) {
  await run("/admin/settings", async () => {
    const s = await superAdmin(); const m = month(str(fd, "month")); const reason = str(fd, "reason"); if (!reason) throw new Error("A reason is required to reopen a month.");
    await db().orm.public.MonthClose.where({ month: m }).delete(); await audit(s.userId, "REOPEN_MONTH", "MonthClose", m, null, null, reason);
  });
}
export async function addManager(fd: FormData) {
  await run("/admin/settings", async () => {
    const s = await superAdmin(); const e = email(str(fd, "email"));
    const existing = await db().orm.public.User.first({ email: e });
    let userId: string;
    if (existing) { await db().orm.public.User.where({ id: existing.id }).update({ active: true }); userId = existing.id; }
    else { const u = await db().orm.public.User.create({ email: e, role: "MANAGER", name: str(fd, "name") || null }); userId = u.id; }
    await audit(s.userId, "ADD_MANAGER", "User", userId, null, { email: e });
  });
}
export async function toggleManager(fd: FormData) {
  await run("/admin/settings", async () => {
    const s = await superAdmin(); const u = await db().orm.public.User.firstOrThrow({ id: str(fd, "id") });
    if (u.role !== "MANAGER") throw new Error("Only manager accounts can be changed here.");
    await db().orm.public.User.where({ id: u.id }).update({ active: !u.active }); await audit(s.userId, "TOGGLE_MANAGER", "User", u.id, { active: u.active }, { active: !u.active });
  });
}
