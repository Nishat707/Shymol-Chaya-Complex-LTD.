import { logout } from "@/app/auth/actions";
import { requireResident } from "@/lib/session";
import { db } from "@/lib/db";
import Link from "next/link";
import { monthOf, taka } from "@/lib/dates";
import { residentFinancialMetrics } from "@/lib/resident-finance";

export default async function ResidentLayout({ children }: { children: React.ReactNode }) {
  const session = await requireResident();
  const flatId = session.flatIds[0];
  if (!flatId) throw new Error("Resident account has no assigned flat.");

  const d = db();
  const [unread, flat, charges, paid, latestPayments] = await Promise.all([
    d.orm.public.Notification.where({ recipientEmail: session.email }).all(),
    d.orm.public.Flat.firstOrThrow({ id: flatId }),
    d.orm.public.MonthlyCharge.where({ flatId }).include(
      "allocations",
      (allocation) => allocation.where((item) => item.payment.some((payment) => payment.voidedAt.isNull())),
    ).all(),
    d.orm.public.Payment.where({ flatId })
      .where((payment) => payment.voidedAt.isNull())
      .aggregate((aggregate) => ({ total: aggregate.sum("amount") })),
    d.orm.public.Payment.where({ flatId })
      .where((payment) => payment.voidedAt.isNull())
      .orderBy((payment) => payment.receivedOn.desc())
      .limit(1)
      .all(),
  ]);
  const unreadCount = unread.filter((n) => !n.readAt).length;
  const metrics = residentFinancialMetrics(
    charges,
    paid.total ?? 0,
    monthOf(new Date()),
    latestPayments.length > 0,
  );
  const cards: [string, string][] = [
    ["Current month service charge", taka(metrics.currentCharge)],
    ["Current balance due", taka(metrics.outstanding)],
    ["Total amount paid", taka(metrics.totalPaid)],
    ["Latest payment", metrics.latestPaymentStatus],
  ];

  return (
    <>
      <nav className="top">
        <b>Shymol Chaya Complex LTD.</b>
        <Link href="/resident">Dashboard</Link>
        <Link href="/resident/notices">Notices</Link>
        <Link href="/resident/expenses">Expenses</Link>
        <Link href="/resident/suggestions">Suggestions</Link>
        <Link href="/resident/maintenance">Maintenance</Link>
        <Link href="/resident/profile">Profile</Link>
        <Link href="/resident/notifications">Notifications{unreadCount ? ` (${unreadCount})` : ""}</Link>
        <span className="nav-identity">{session.email} · Resident</span>
        <form action={logout}><button className="nav-logout" type="submit">Log out</button></form>
      </nav>
      <section className="resident-account-summary" aria-label={`Financial summary for flat ${flat.number}`}>
        <h2>My account · Flat {flat.number}</h2>
        <div className="metric-grid">{cards.map(([label, value], i) => <div className={`card metric-card metric-${i}`} key={label}>
          <div className="metric-label">{label}</div><div className="metric-value">{value}</div>
        </div>)}</div>
      </section>
      <div className="app-content">{children}</div>
    </>
  );
}
