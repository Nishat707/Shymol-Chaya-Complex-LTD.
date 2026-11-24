import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/session";
const q = (v: unknown) => `"${String(v ?? "").replaceAll('"', '""')}"`;
export async function GET() {
  await requireStaff();
  const pays = await prisma.payment.findMany({ orderBy: { createdAt: "asc" }, include: { flat: true } });
  const csv = ["Receipt,Flat,Date,Amount,Method,Reference,Status", ...pays.map(p => [p.receiptNo, p.flat.number, p.receivedOn.toISOString().slice(0, 10), p.amount.toString(), p.method, p.reference, p.voidedAt ? "VOID" : "RECEIVED"].map(q).join(","))].join("\n");
  return new Response(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="payments.csv"' } });
}
