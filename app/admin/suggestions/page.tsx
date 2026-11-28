import { db } from "@/lib/db";
import { respondSuggestion } from "@/lib/actions";
import { requirePermission } from "@/lib/session";

export default async function AdminSuggestions() {
  await requirePermission("suggestions");
  const list = await db().orm.public.ResidentSuggestion.orderBy((s) => s.updatedAt.desc()).limit(200).all();
  return <><h1>Resident Suggestions</h1>{list.map((item) => <article className="card" key={item.id}><h2>{item.title}</h2><p>{item.description}</p><p>Category: {item.category} · Priority: {item.priority} · Status: {item.status.replaceAll("_"," ")}</p><form className="grid" action={respondSuggestion}><input type="hidden" name="id" value={item.id} /><label>Status<select name="status" defaultValue={item.status}><option>SUBMITTED</option><option>UNDER_REVIEW</option><option>IN_PROGRESS</option><option>RESOLVED</option><option>CLOSED</option></select></label><label style={{ gridColumn:"1 / -1" }}>Management response<textarea name="response" defaultValue={item.adminResponse ?? ""} /></label><button>Save response</button></form></article>)}{!list.length && <p className="card empty-state">No resident suggestions submitted.</p>}</>;
}
