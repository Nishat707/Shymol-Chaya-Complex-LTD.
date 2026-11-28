import { db } from "@/lib/db";
import { taka } from "@/lib/dates";
import { requireResident } from "@/lib/session";

export default async function ResidentExpenses({ searchParams }: { searchParams: Promise<{ month?: string; year?: string; q?: string }> }) {
  await requireResident();
  const sp = await searchParams;
  const expenses = await db().orm.public.Expense.where({ status: "PAID" }).orderBy((e) => e.expenseDate.desc()).include("category").all();
  const filtered = expenses.filter((e) => (!sp.month || e.expenseDate.startsWith(`-${sp.month}`) || e.expenseDate.slice(5, 7) === sp.month) && (!sp.year || e.expenseDate.startsWith(sp.year)) && (!sp.q || `${e.title} ${e.vendor ?? ""} ${e.description ?? ""} ${e.category.name}`.toLowerCase().includes(sp.q.toLowerCase())));
  const total = filtered.reduce((sum, e) => sum + Number(e.amount), 0);
  return <><h1>Apartment Expenses</h1><form className="grid card"><label>Month<select name="month" defaultValue={sp.month ?? ""}><option value="">All</option>{Array.from({ length: 12 }, (_, i) => <option key={i} value={String(i + 1).padStart(2, "0")}>{String(i + 1).padStart(2, "0")}</option>)}</select></label><label>Year<input name="year" defaultValue={sp.year ?? ""} placeholder="2026" /></label><label>Search<input name="q" defaultValue={sp.q ?? ""} /></label><button>Filter</button></form>
  <div className="card"><b>Selected period total: {taka(total)}</b></div>
  <div className="card tw"><table><thead><tr><th>Date</th><th>Title</th><th>Category</th><th>Vendor</th><th className="n">Amount</th></tr></thead><tbody>{filtered.map((e) => <tr key={e.id}><td>{e.expenseDate}</td><td>{e.title}</td><td>{e.category.name}</td><td>{e.vendor ?? "—"}</td><td className="n">{taka(e.amount)}</td></tr>)}</tbody></table>{!filtered.length && <p className="empty-state">No authorized expenses match these filters.</p>}</div></>;
}
