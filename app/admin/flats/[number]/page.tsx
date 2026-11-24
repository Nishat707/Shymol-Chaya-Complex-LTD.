import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { taka } from "@/lib/dates";
import { saveFlat, addResident, toggleResident } from "@/lib/actions";
import { Msg } from "@/components/Msg";

export default async function FlatPage({ params, searchParams }: { params: Promise<{ number: string }>; searchParams: Promise<{ err?: string; ok?: string }> }) {
  const { number } = await params; const sp = await searchParams;
  const f = await db().orm.public.Flat
    .include("residents")
    .include("charges", (c) => c.orderBy((ch) => ch.month.desc()).include("allocations", (al) => al.where((x) => x.payment.some((p) => p.voidedAt.isNull()))))
    .first({ number });
  if (!f) notFound();
  return (
    <>
      <h1>Flat {f.number} · Floor {f.floor}</h1><Msg sp={sp} />
      <form className="grid card" action={saveFlat}>
        <input type="hidden" name="number" value={f.number} />
        <label>Owner<input name="ownerName" defaultValue={f.ownerName ?? ""} /></label>
        <label>Tenant<input name="tenantName" defaultValue={f.tenantName ?? ""} /></label>
        <label>Phone<input name="phone" defaultValue={f.phone ?? ""} /></label>
        <label>Status<select name="occupancy" defaultValue={f.occupancy}><option value="OCCUPIED">Occupied</option><option value="VACANT">Vacant</option></select></label>
        <label>Custom monthly charge (blank = default)<input name="customCharge" inputMode="decimal" defaultValue={f.customCharge ?? ""} /></label>
        <button>Save flat</button>
      </form>
      <h2>Approved resident accounts</h2>
      <div className="card">
        <p>After adding a resident here, create a confirmed Supabase Auth user with the same email so they can sign in.</p>
        {f.residents.map(r => (
          <form key={r.id} action={toggleResident} className="inline" style={{ display: "flex", gap: 8, marginBottom: 6 }}>
            <input type="hidden" name="number" value={f.number} /><input type="hidden" name="id" value={r.id} />
            <span style={{ flex: 1 }} className={r.active ? "" : "void"}>{r.email} {r.name ? `(${r.name})` : ""}</span>
            <button className="sec">{r.active ? "Deactivate" : "Activate"}</button>
          </form>))}
        {!f.residents.length && <p>No resident can sign in to this flat yet.</p>}
        <form className="grid" action={addResident}><input type="hidden" name="number" value={f.number} />
          <label>Email<input name="email" type="email" required /></label><label>Name<input name="name" /></label><button>Add resident</button></form>
      </div>
      <h2>Ledger</h2>
      <div className="card tw"><table><thead><tr><th>Month</th><th className="n">Charge</th><th className="n">Paid</th><th className="n">Due</th></tr></thead>
        <tbody>{f.charges.map(c => { const net = Number(c.amount) - Number(c.waived), paid = c.allocations.reduce((a, x) => a + Number(x.amount), 0);
          return <tr key={c.id}><td>{c.month}</td><td className="n">{taka(net)}</td><td className="n">{taka(paid)}</td><td className="n">{taka(net - paid)}</td></tr>; })}</tbody></table>
        {!f.charges.length && <p>No bills yet. Generate a month under Settings.</p>}</div>
    </>
  );
}
