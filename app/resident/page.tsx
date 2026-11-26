import { or } from "@prisma/orm-postgres/orm-client";
import { db } from "@/lib/db";
import { summary } from "@/lib/finance";
import { taka } from "@/lib/dates";
import { topExpenseCategories, topPayers } from "@/lib/dashboard-analytics";

function RankingChart({ title, subtitle, entries }: { title: string; subtitle: string; entries: { label: string; total: number }[] }) {
  const max = Math.max(0, ...entries.map((entry) => entry.total));
  return (
    <section className="card chart-card">
      <div className="chart-heading"><h2>{title}</h2><p>{subtitle}</p></div>
      {entries.length ? <ol className="rank-list">{entries.map((entry, index) => (
        <li key={entry.label}>
          <div className="rank-line"><span><i className={`rank-number rank-${index}`}>{index + 1}</i>{entry.label}</span><strong>{taka(entry.total)}</strong></div>
          <div className="chart-track"><span className={`chart-bar chart-bar-${index}`} style={{ width: `${max ? entry.total / max * 100 : 0}%` }} /></div>
        </li>
      ))}</ol> : <p className="empty-state">No data recorded for this chart yet.</p>}
    </section>
  );
}

export default async function Resident() {
  const d = db();
  const todayInDhaka = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Dhaka" });
  const noticeExpiryCutoff = new Date(`${todayInDhaka}T00:00:00.000Z`);
  noticeExpiryCutoff.setUTCDate(noticeExpiryCutoff.getUTCDate() - 1);
  const [totals, flats, payments, expenses, notices] = await Promise.all([
    summary(),
    d.orm.public.Flat
      .orderBy((f) => f.floor.asc()).orderBy((f) => f.number.asc())
      .include("charges", (c) => c.include("allocations", (al) => al.where((x) => x.payment.some((p) => p.voidedAt.isNull()))))
      .all(),
    d.orm.public.Payment.where((p) => p.voidedAt.isNull()).include("flat").all(),
    d.orm.public.Expense
      .where({ status: "PAID" })
      .orderBy((e) => e.expenseDate.desc())
      .include("category")
      .all(),
    d.orm.public.Notice
      .where((n) => or(n.expiresAt.isNull(), n.expiresAt.gt(noticeExpiryCutoff)))
      .orderBy((n) => n.publishedAt.desc())
      .limit(5)
      .all(),
  ]);
  const dues = flats.map((flat) => ({
    flat,
    due: flat.charges.reduce((sum, charge) =>
      sum + Number(charge.amount) - Number(charge.waived) -
        charge.allocations.reduce((paid, allocation) => paid + Number(allocation.amount), 0), 0),
  }));
  const cards: [string, number][] = [
    ["Received to date", totals.income],
    ["Total outstanding dues", totals.outstanding],
    ["Current balance", totals.balance],
    ["Expenses paid", totals.expensesPaid],
  ];
  const payerRankings = topPayers(payments);
  const expenseRankings = topExpenseCategories(expenses);

  return (
    <>
      <h1>Community Dashboard</h1>
      <div className="metric-grid">
        {cards.map(([label, amount], i) => (
          <div className={`card metric-card metric-${i}`} key={label}>
            <div className="metric-label">{label}</div>
            <div className="metric-value">{taka(amount)}</div>
          </div>
        ))}
      </div>

      <h2 className="dashboard-section-title">All-time financial analytics</h2>
      <div className="chart-grid">
        <RankingChart title="Top paying flats" subtitle="Payments received, excluding voided entries" entries={payerRankings} />
        <RankingChart title="Top expense categories" subtitle="Paid expenses grouped by category" entries={expenseRankings} />
      </div>

      <section className="card tw">
        <h2>Outstanding dues by flat</h2>
        <table>
          <thead><tr><th>Flat</th><th>Owner</th><th className="n">Due</th></tr></thead>
          <tbody>{dues.map(({ flat, due }) => (
            <tr key={flat.id}>
              <td>{flat.number}</td>
              <td>{flat.ownerName ?? "Owner not set"}</td>
              <td className="n">{taka(due)}</td>
            </tr>
          ))}</tbody>
        </table>
      </section>

      <section className="card tw">
        <h2>Recent paid expenses</h2>
        <table>
          <thead><tr><th>Date</th><th>Expense</th><th>Category</th><th className="n">Amount</th></tr></thead>
          <tbody>{expenses.length ? expenses.slice(0, 10).map((expense) => (
            <tr key={expense.id}>
              <td>{expense.expenseDate}</td>
              <td>{expense.title}</td>
              <td>{expense.category.name}</td>
              <td className="n">{taka(expense.amount)}</td>
            </tr>
          )) : <tr><td colSpan={4}>No paid expenses recorded.</td></tr>}</tbody>
        </table>
        <p>Showing the latest 10 paid expenses.</p>
      </section>

      <section className="card notice-board">
        <div className="section-heading"><h2>Building notices</h2><span className="notice-count">{notices.length} current</span></div>
        {notices.length ? notices.map((notice) => (
          <article className="resident-notice" key={notice.id}>
            <div className="notice-title">
              <strong>{notice.title}</strong>
              <span className={`tag ${notice.priority === "URGENT" ? "r" : notice.priority === "IMPORTANT" ? "y" : "g"}`}>{notice.priority.toLowerCase()}</span>
            </div>
            <p>{notice.body}</p>
            <time dateTime={notice.publishedAt.toISOString()}>{notice.publishedAt.toLocaleDateString("en-GB", { timeZone: "Asia/Dhaka" })}</time>
          </article>
        )) : <p className="empty-state">No active notices right now.</p>}
      </section>
    </>
  );
}
