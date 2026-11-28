import { db } from "@/lib/db";
import { updateMaintenance } from "@/lib/actions";
import { requirePermission } from "@/lib/session";

export default async function AdminMaintenance() {
  await requirePermission("maintenance");
  const list = await db().orm.public.MaintenanceRequest.orderBy((r) => r.updatedAt.desc()).limit(200).all();
  return <><h1>Maintenance Requests</h1>{list.map((item) => <article className="card" key={item.id}><h2>{item.title}</h2><p>{item.description}</p><p>Category: {item.category.replaceAll("_"," ")}</p>{item.photoUrl && <p><a href={item.photoUrl} target="_blank">View attachment</a></p>}<form className="grid" action={updateMaintenance}><input type="hidden" name="id" value={item.id} /><label>Status<select name="status" defaultValue={item.status}><option>PENDING</option><option>IN_PROGRESS</option><option>COMPLETED</option><option>REJECTED</option></select></label><label style={{ gridColumn:"1 / -1" }}>Management comment<textarea name="comment" defaultValue={item.adminComment ?? ""} /></label><button>Update request</button></form></article>)}{!list.length && <p className="card empty-state">No maintenance requests submitted.</p>}</>;
}
