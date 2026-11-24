import { or } from "@prisma/orm-postgres/orm-client";
import { db } from "@/lib/db";
import { requireResident } from "@/lib/session";
import { taka } from "@/lib/dates";

export default async function Resident() {
  const s = await requireResident();
  const d = db();
  // Scoped by the session's flat ids. Residents can never query another flat.
  const flats = await d.orm.public.Flat
    .where((f) => f.id.in(s.flatIds))
    .include("charges", (c) => c.orderBy((ch) => ch.month.desc()).include("allocations", (al) => al.where((x) => x.payment.some((p) => p.voidedAt.isNull()))))
    .all();
  const notices = await d.orm.public.Notice
    .where((n) => or(n.expiresAt.isNull(), n.expiresAt.gt(new Date())))
    .orderBy((n) => n.publishedAt.desc())
    .limit(5)
    .all();
  return (
    <>
      <h1>Welcome to Shymol Chaya Complex LTD.</h1>
      {flats.map(f => {
        const rows = f.charges.map(c => {
          const net = Number(c.amount) - Number(c.waived), paid = c.allocations.reduce((a, x) => a + Number(x.amount), 0);
          return { m: c.month, net, paid, due: net - paid };
        });
        return (
          <section key={f.id}>
            <h2>Flat {f.number} · Outstanding {taka(rows.reduce((a, r) => a + r.due, 0))}</h2>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr><th align="left">Month</th><th align="right">Charge</th><th align="right">Paid</th><th align="right">Due</th><th align="left">Status</th></tr></thead>
              <tbody>{rows.map(r => (
                <tr key={r.m}><td>{r.m}</td><td align="right">{taka(r.net)}</td><td align="right">{taka(r.paid)}</td><td align="right">{taka(r.due)}</td><td>{r.due <= 0 ? "Paid" : r.paid > 0 ? "Partial" : "Unpaid"}</td></tr>
              ))}</tbody>
            </table>
          </section>
        );
      })}
      <h2>Announcements</h2>
      {notices.length ? notices.map(n => <p key={n.id}><b>{n.title}</b><br />{n.body}</p>) : <p>No announcements right now.</p>}
    </>
  );
}
