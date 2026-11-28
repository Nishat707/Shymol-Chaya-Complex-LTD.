import { db } from "@/lib/db";
import { requirePermission } from "@/lib/session";
export default async function Audit() {
  await requirePermission("audit");
  const rows = await db().orm.public.AuditLog.orderBy((r) => r.at.desc()).limit(200).all();
  return (
    <>
      <h1>Audit log</h1>
      <div className="card tw"><table><thead><tr><th>Time (Dhaka)</th><th>Action</th><th>Record</th><th>Before</th><th>After</th><th>Reason</th></tr></thead>
        <tbody>{rows.map(r => <tr key={r.id}><td>{r.at.toLocaleString("en-GB", { timeZone: "Asia/Dhaka" })}</td><td>{r.action}</td><td>{r.entity}</td>
          <td style={{ whiteSpace: "normal", maxWidth: 220 }}>{r.before ? JSON.stringify(r.before) : ""}</td><td style={{ whiteSpace: "normal", maxWidth: 220 }}>{r.after ? JSON.stringify(r.after) : ""}</td><td>{r.reason}</td></tr>)}</tbody></table>
        {!rows.length && <p>No changes recorded yet.</p>}</div>
    </>
  );
}
