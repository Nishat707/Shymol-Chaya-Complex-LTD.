import { db } from "@/lib/db";
import { requireResident } from "@/lib/session";
import { submitMaintenance } from "@/lib/actions";

export default async function ResidentMaintenance() {
  const s = await requireResident();
  const resident = await db().orm.public.FlatResident.first({ email: s.email, active: true });
  const list = resident ? await db().orm.public.MaintenanceRequest.where({ residentId: resident.id }).orderBy((x) => x.updatedAt.desc()).all() : [];
  return <><h1>Maintenance Requests</h1><form className="grid card" action={submitMaintenance}><label>Title<input name="title" required /></label><label>Category<select name="category"><option>PLUMBING</option><option>ELECTRICAL</option><option>ELEVATOR</option><option>CLEANING</option><option>SECURITY</option><option>COMMON_AREA</option><option>OTHER</option></select></label><label>Photo URL (optional)<input name="photoUrl" type="url" /></label><label style={{ gridColumn: "1 / -1" }}>Description<textarea name="description" rows={4} required /></label><button>Submit request</button></form>
  {list.map((item) => <article className="card" key={item.id}><h2>{item.title}</h2><p>{item.description}</p><p><b>Status:</b> {item.status.replaceAll("_", " ")}</p><p><b>Management comment:</b> {item.adminComment || "Awaiting review"}</p><time>Submitted {item.submittedAt.toLocaleString("en-GB", { timeZone: "Asia/Dhaka" })}</time></article>)}{!list.length && <p className="card empty-state">No maintenance requests submitted yet.</p>}</>;
}
