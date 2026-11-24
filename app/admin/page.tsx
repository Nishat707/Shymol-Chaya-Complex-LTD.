import { summary } from "@/lib/finance";
import { taka } from "@/lib/dates";
import { prisma } from "@/lib/db";

export default async function Admin() {
  const [m, flats, occupied] = await Promise.all([summary(), prisma.flat.count(), prisma.flat.count({ where: { occupancy: "OCCUPIED" } })]);
  const cards: [string, string][] = [["Flats", `${flats} (${occupied} occupied)`], ["Received to date", taka(m.income)], ["Expenses paid", taka(m.expensesPaid)], ["Available balance", taka(m.balance)], ["Outstanding dues", taka(m.outstanding)]];
  return (
    <>
      <h1>Overview</h1>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 12 }}>
        {cards.map(([k, v]) => <div className="card" key={k}><div style={{ color: "#66736c", fontSize: 13 }}>{k}</div><div style={{ fontSize: 22, fontWeight: 700 }}>{v}</div></div>)}
      </div>
      <p>Not built yet: charts, maintenance tasks, PDF/Excel export, file uploads. See README.</p>
    </>
  );
}
