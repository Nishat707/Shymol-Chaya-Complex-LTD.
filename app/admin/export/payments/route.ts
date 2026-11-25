import { db } from "@/lib/db";
import { requireStaff } from "@/lib/session";
const q = (v: unknown) => `"${String(v ?? "").replaceAll('"', '""')}"`;
export async function GET() {
  await requireStaff();
  const pays = await db().orm.public.Payment.orderBy((p) => p.createdAt.asc()).include("flat").all();
  const csv = ["Receipt,Flat,Date,Amount,Method,Reference,Status", ...pays.map(p => [p.receiptNo, p.flat.number, p.receivedOn, p.amount, p.method, p.reference, p.voidedAt ? "VOID" : "RECEIVED"].map(q).join(","))].join("\n");
  return new Response(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="payments.csv"' } });
}
