import { summary } from "@/lib/finance";
import { taka } from "@/lib/dates";
import { db } from "@/lib/db";

export default async function Admin() {
  const d = db();
  const [m, flats, occupied] = await Promise.all([
    summary(),
    d.orm.public.Flat.aggregate((a) => ({ n: a.count() })),
    d.orm.public.Flat.where({ occupancy: "OCCUPIED" }).aggregate((a) => ({ n: a.count() })),
  ]);
  const cards: [string, string][] = [["Flats", `${flats.n} (${occupied.n} occupied)`], ["Received to date", taka(m.income)], ["Expenses paid", taka(m.expensesPaid)], ["Available balance", taka(m.balance)], ["Outstanding dues", taka(m.outstanding)]];
  return (
    <>
      <h1>Overview</h1>
      <div className="metric-grid">
        {cards.map(([k, v], i) => <div className={`card metric-card metric-${i}`} key={k}><div className="metric-label">{k}</div><div className="metric-value">{v}</div></div>)}
      </div>
      <p>Not built yet: charts, maintenance tasks, PDF/Excel export, file uploads. See README.</p>
    </>
  );
}
