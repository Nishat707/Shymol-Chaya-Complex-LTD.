import Link from "next/link";
import { db } from "@/lib/db";
import { taka } from "@/lib/dates";
import { requireResident } from "@/lib/session";

export default async function Resident() {
  const session = await requireResident();
  const d = db();
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Dhaka" });
  const thisMonth = today.slice(0, 7);
  const flatId = session.flatIds[0];
  const resident = await d.orm.public.FlatResident.first({ email: session.email, active: true });
  const [flat, charges, payments, expenses, notices, suggestions, maintenance] = await Promise.all([
    d.orm.public.Flat.first({ id: flatId }),
    d.orm.public.MonthlyCharge.where({ flatId }).include("allocations", (al) => al.where((x) => x.payment.some((p) => p.voidedAt.isNull()))).all(),
    d.orm.public.Payment.where({ flatId }).where((p) => p.voidedAt.isNull()).orderBy((p) => p.receivedOn.desc()).limit(12).all(),
    d.orm.public.Expense.where({ status: "PAID" }).orderBy((e) => e.expenseDate.desc()).limit(10).include("category").all(),
    d.orm.public.Notice.orderBy((n) => n.publishedAt.desc()).limit(10).all(),
    resident ? d.orm.public.ResidentSuggestion.where({ residentId: resident.id }).orderBy((s) => s.updatedAt.desc()).limit(10).all() : [],
    resident ? d.orm.public.MaintenanceRequest.where({ residentId: resident.id }).orderBy((r) => r.updatedAt.desc()).limit(10).all() : [],
  ]);
  const thisCharge = charges.find((charge) => charge.month === thisMonth);
  const currentCharge = thisCharge ? Number(thisCharge.amount) - Number(thisCharge.waived) : 0;
  const outstanding = charges.reduce((sum, charge) => sum + Number(charge.amount) - Number(charge.waived) -
    charge.allocations.reduce((paid, allocation) => paid + Number(allocation.amount), 0), 0);
  const totalPaid = payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
  const latestPayment = payments[0];
  const cards: [string, string][] = [
    ["Current month service charge", taka(currentCharge)],
    ["Total outstanding dues", taka(Math.max(0, outstanding))],
    ["Total amount paid", taka(totalPaid)],
    ["Latest payment status", latestPayment ? "Recorded" : "No payment"],
  ];
  const history = [...charges].sort((a, b) => a.month.localeCompare(b.month)).slice(-12);

  return (
    <>
      <h1>Resident Dashboard</h1>
      {flat && <p>Flat {flat.number} · {resident?.name ?? session.email}</p>}
      <div className="metric-grid">{cards.map(([label, amount], i) => <div className={`card metric-card metric-${i}`} key={label}><div className="metric-label">{label}</div><div className="metric-value">{amount}</div></div>)}</div>
      <div className="chart-grid">
        <section className="card tw"><h2>Monthly overview</h2><table><thead><tr><th>Month</th><th className="n">Charged</th><th className="n">Paid</th><th className="n">Balance</th></tr></thead><tbody>{history.map((charge) => {
          const paid = charge.allocations.reduce((sum, allocation) => sum + Number(allocation.amount), 0);
          return <tr key={charge.id}><td>{charge.month}</td><td className="n">{taka(Number(charge.amount) - Number(charge.waived))}</td><td className="n">{taka(paid)}</td><td className="n">{taka(Math.max(0, Number(charge.amount) - Number(charge.waived) - paid))}</td></tr>;
        })}</tbody></table>{!history.length && <p className="empty-state">No service charge history yet.</p>}</section>
        <section className="card tw"><h2>Latest payments</h2><table><thead><tr><th>Date</th><th className="n">Amount</th><th>Status</th></tr></thead><tbody>{payments.slice(0, 6).map((payment) => <tr key={payment.id}><td>{payment.receivedOn}</td><td className="n">{taka(payment.amount)}</td><td>Recorded</td></tr>)}</tbody></table>{!payments.length && <p className="empty-state">No payments recorded for this flat.</p>}</section>
      </div>
      <div className="chart-grid">
        <section className="card notice-board"><div className="section-heading"><h2>Apartment notices</h2><Link href="/resident/notices">View all</Link></div>{notices.map((notice) => <article className="resident-notice" key={notice.id}><div className="notice-title"><strong>{notice.title}</strong><span className={`tag ${notice.priority === "URGENT" ? "r" : notice.priority === "IMPORTANT" ? "y" : "g"}`}>{notice.priority.toLowerCase()}</span></div><p>{notice.body}</p><time>{notice.publishedAt.toLocaleDateString("en-GB", { timeZone: "Asia/Dhaka" })}</time></article>)}{!notices.length && <p className="empty-state">No active notices.</p>}</section>
        <section className="card"><h2>Latest authorized expenses</h2>{expenses.map((expense) => <p key={expense.id}><b>{expense.title}</b><br /><span>{expense.expenseDate} · {expense.category.name} · {taka(expense.amount)}</span></p>)}{!expenses.length && <p className="empty-state">No paid expenses recorded.</p>}<Link className="btn sec" href="/resident/expenses">View expense history</Link></section>
      </div>
      <div className="chart-grid">
        <section className="card"><h2>My suggestions</h2>{suggestions.map((suggestion) => <p key={suggestion.id}><b>{suggestion.title}</b><br /><span>{suggestion.status.replaceAll("_", " ")} · {suggestion.adminResponse || "Awaiting management response"}</span></p>)}{!suggestions.length && <p className="empty-state">No suggestions submitted.</p>}<Link className="btn sec" href="/resident/suggestions">Manage suggestions</Link></section>
        <section className="card"><h2>My maintenance requests</h2>{maintenance.map((request) => <p key={request.id}><b>{request.title}</b><br /><span>{request.status.replaceAll("_", " ")} · {request.adminComment || "Awaiting review"}</span></p>)}{!maintenance.length && <p className="empty-state">No maintenance requests.</p>}<Link className="btn sec" href="/resident/maintenance">Manage requests</Link></section>
      </div>
    </>
  );
}
