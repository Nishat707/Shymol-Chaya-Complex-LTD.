import { db } from "@/lib/db";
import { taka } from "@/lib/dates";
import { requirePermission } from "@/lib/session";

export default async function Reports({ searchParams }: { searchParams: Promise<{ month?: string; year?: string }> }) {
  await requirePermission("reports");
  const sp = await searchParams;
  const now = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Dhaka" }).slice(0, 7);
  const selected = sp.month && sp.year ? `${sp.year}-${sp.month.padStart(2,"0")}` : now;
  const previousParts = selected.split("-");
  const previousDate = new Date(Number(previousParts[0]), Number(previousParts[1]) - 2, 1);
  const previous = `${previousDate.getFullYear()}-${String(previousDate.getMonth()+1).padStart(2,"0")}`;
  const d = db();
  const [charges, chargesPrev, expenses, expensesPrev, allocations, flats] = await Promise.all([
    d.orm.public.MonthlyCharge.where({ month: selected }).include("allocations", (a) => a.where((x) => x.payment.some((p) => p.voidedAt.isNull()))).all(),
    d.orm.public.MonthlyCharge.where({ month: previous }).include("allocations", (a) => a.where((x) => x.payment.some((p) => p.voidedAt.isNull()))).all(),
    d.orm.public.Expense.where({ status:"PAID" }).include("category").all(),
    d.orm.public.Expense.where({ status:"PAID" }).include("category").all(),
    d.orm.public.PaymentAllocation.where((a) => a.payment.some((p) => p.voidedAt.isNull())).all(),
    d.orm.public.Flat.all(),
  ]);
  const monthExpenses = expenses.filter((e) => e.expenseDate.startsWith(selected));
  const previousExpenses = expensesPrev.filter((e) => e.expenseDate.startsWith(previous));
  const billed = charges.reduce((sum, c) => sum + Number(c.amount) - Number(c.waived), 0);
  const collected = charges.reduce((sum, c) => sum + c.allocations.reduce((p, a) => p + Number(a.amount), 0), 0);
  const outstanding = Math.max(0, billed - collected);
  const expenseTotal = monthExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const expensePrev = previousExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const billedPrev = chargesPrev.reduce((sum, c) => sum + Number(c.amount) - Number(c.waived), 0);
  const collectedPrev = chargesPrev.reduce((sum, c) => sum + c.allocations.reduce((p, a) => p + Number(a.amount), 0), 0);
  const paidFlats = charges.filter((c) => { const paid = c.allocations.reduce((p,a) => p+Number(a.amount),0); return paid >= Number(c.amount)-Number(c.waived); }).length;
  const categoryTotals = new Map<string, number>();
  monthExpenses.forEach((e) => categoryTotals.set(e.category.name, (categoryTotals.get(e.category.name) ?? 0) + Number(e.amount)));
  const params = new URLSearchParams({ month:selected, year:"" });
  return <><h1>Monthly Financial Reports</h1><form className="grid card"><label>Month<select name="month" defaultValue={selected.slice(5)}>{Array.from({length:12},(_,i)=>{const m=String(i+1).padStart(2,"0");return <option key={m} value={m}>{m}</option>})}</select></label><label>Year<input name="year" defaultValue={selected.slice(0,4)} /></label><button>View report</button></form>
  <div className="metric-grid">
    <div className="card metric-card"><div className="metric-label">Collected</div><div className="metric-value">{taka(collected)}</div></div>
    <div className="card metric-card"><div className="metric-label">Outstanding</div><div className="metric-value">{taka(outstanding)}</div></div>
    <div className="card metric-card"><div className="metric-label">Apartment expenses</div><div className="metric-value">{taka(expenseTotal)}</div></div>
    <div className="card metric-card"><div className="metric-label">Income less expenses</div><div className="metric-value">{taka(collected-expenseTotal)}</div></div>
  </div>
  <div className="chart-grid"><section className="card"><h2>Flats</h2><p><b>{paidFlats}</b> paid · <b>{Math.max(0, charges.length-paidFlats)}</b> unpaid · <b>{flats.length}</b> total flats</p></section><section className="card"><h2>Previous month comparison</h2><p>Collection: {taka(collectedPrev)} → {taka(collected)}</p><p>Expenses: {taka(expensePrev)} → {taka(expenseTotal)}</p><p>Previous billed: {taka(billedPrev)}</p></section></div>
  <section className="card tw"><h2>Expense breakdown</h2><table><thead><tr><th>Category</th><th className="n">Amount</th></tr></thead><tbody>{Array.from(categoryTotals).map(([category, amount]) => <tr key={category}><td>{category}</td><td className="n">{taka(amount)}</td></tr>)}</tbody></table></section>
  <a className="btn" href={`/api/reports/csv?month=${encodeURIComponent(selected)}`}>Export CSV</a></>;
}
