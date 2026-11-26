import { db } from "@/lib/db";
import { summary } from "@/lib/finance";
import { taka } from "@/lib/dates";

export default async function Resident() {
  const d = db();
  const [totals, flats, expenses] = await Promise.all([
    summary(),
    d.orm.public.Flat
      .orderBy((f) => f.floor.asc()).orderBy((f) => f.number.asc())
      .include("charges", (c) => c.include("allocations", (al) => al.where((x) => x.payment.some((p) => p.voidedAt.isNull()))))
      .all(),
    d.orm.public.Expense
      .where({ status: "PAID" })
      .orderBy((e) => e.expenseDate.desc())
      .limit(80)
      .include("category")
      .all(),
  ]);
  const dues = flats.map((flat) => ({
    flat,
    due: flat.charges.reduce((sum, charge) =>
      sum + Number(charge.amount) - Number(charge.waived) -
        charge.allocations.reduce((paid, allocation) => paid + Number(allocation.amount), 0), 0),
  }));
  const cards: [string, number][] = [
    ["Total outstanding dues", totals.outstanding],
    ["Current balance", totals.balance],
    ["Expenses paid", totals.expensesPaid],
  ];

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
          <tbody>{expenses.length ? expenses.map((expense) => (
            <tr key={expense.id}>
              <td>{expense.expenseDate}</td>
              <td>{expense.title}</td>
              <td>{expense.category.name}</td>
              <td className="n">{taka(expense.amount)}</td>
            </tr>
          )) : <tr><td colSpan={4}>No paid expenses recorded.</td></tr>}</tbody>
        </table>
        <p>Showing up to the latest 80 paid expenses.</p>
      </section>
    </>
  );
}
