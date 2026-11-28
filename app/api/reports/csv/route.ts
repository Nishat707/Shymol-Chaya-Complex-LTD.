import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/session";

export async function GET(request: NextRequest) {
  const staff = await requireStaff();
  if (staff.role !== "SUPER_ADMIN" && staff.permissions.reports !== true) return new Response("Forbidden", { status: 403 });
  const month = request.nextUrl.searchParams.get("month") ?? new Date().toLocaleDateString("en-CA", { timeZone:"Asia/Dhaka" }).slice(0,7);
  const d = db();
  const [charges, expenses] = await Promise.all([
    d.orm.public.MonthlyCharge.where({ month }).include("allocations", (a) => a.where((x) => x.payment.some((p) => p.voidedAt.isNull()))).all(),
    d.orm.public.Expense.where({ status:"PAID" }).include("category").all(),
  ]);
  const monthExpenses = expenses.filter((e) => e.expenseDate.startsWith(month));
  const billed = charges.reduce((sum,c) => sum+Number(c.amount)-Number(c.waived),0);
  const collected = charges.reduce((sum,c) => sum+c.allocations.reduce((p,a)=>p+Number(a.amount),0),0);
  const expenseTotal = monthExpenses.reduce((sum,e)=>sum+Number(e.amount),0);
  const rows = [
    ["Metric","Value"],
    ["Month",month],
    ["Service charges billed",billed.toFixed(2)],
    ["Service charges collected",collected.toFixed(2)],
    ["Outstanding",Math.max(0,billed-collected).toFixed(2)],
    ["Apartment expenses",expenseTotal.toFixed(2)],
  ];
  const csv = rows.map((row)=>row.map((cell)=>`"${String(cell).replaceAll('"','""')}"`).join(",")).join("\n");
  return new Response(csv, { headers: { "Content-Type":"text/csv; charset=utf-8", "Content-Disposition":`attachment; filename="financial-report-${month}.csv"` } });
}
