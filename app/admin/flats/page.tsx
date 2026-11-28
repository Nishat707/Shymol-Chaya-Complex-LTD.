import Link from "next/link";
import { db } from "@/lib/db";
import { taka } from "@/lib/dates";
import { requirePermission } from "@/lib/session";

export default async function Flats() {
  await requirePermission("flats");
  const flats = await db().orm.public.Flat
    .orderBy((f) => f.floor.asc()).orderBy((f) => f.number.asc())
    .include("residents", (r) => r.where({ active: true }))
    .include("charges", (c) => c.include("allocations", (al) => al.where((x) => x.payment.some((p) => p.voidedAt.isNull()))))
    .all();
  const rows = flats.map(f => ({ f, due: f.charges.reduce((a, c) => a + Number(c.amount) - Number(c.waived) - c.allocations.reduce((x, y) => x + Number(y.amount), 0), 0) }));
  return (
    <>
      <h1>Flats</h1>
      <div className="card tw"><table>
        <thead><tr><th>Flat</th><th>Owner</th><th>Status</th><th className="n">Monthly charge</th><th className="n">Dues</th><th>Residents</th></tr></thead>
        <tbody>{rows.map(({ f, due }) => (
          <tr key={f.id}>
            <td><Link href={`/admin/flats/${f.number}`}>{f.number}</Link></td><td>{f.ownerName ?? "—"}</td>
            <td><span className={`tag ${f.occupancy === "VACANT" ? "n" : due <= 0 ? "g" : "r"}`}>{f.occupancy === "VACANT" ? "Vacant" : due <= 0 ? "No dues" : "Dues"}</span></td>
            <td className="n">{f.customCharge ? taka(f.customCharge) : "default"}</td><td className="n">{taka(due)}</td><td>{f.residents.length}</td>
          </tr>))}</tbody>
      </table></div>
    </>
  );
}
