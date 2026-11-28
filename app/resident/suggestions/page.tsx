import { db } from "@/lib/db";
import { requireResident } from "@/lib/session";
import { submitSuggestion } from "@/lib/actions";

export default async function ResidentSuggestions() {
  const s = await requireResident();
  const resident = await db().orm.public.FlatResident.first({ email: s.email, active: true });
  const list = resident ? await db().orm.public.ResidentSuggestion.where({ residentId: resident.id }).orderBy((x) => x.updatedAt.desc()).all() : [];
  return <><h1>Suggestion Box</h1><form className="grid card" action={submitSuggestion}><label>Title<input name="title" required /></label><label>Category<select name="category"><option>MAINTENANCE</option><option>SECURITY</option><option>CLEANLINESS</option><option>MANAGEMENT</option><option>OTHER</option></select></label><label>Priority<select name="priority"><option>NORMAL</option><option>IMPORTANT</option><option>URGENT</option></select></label><label style={{ gridColumn: "1 / -1" }}>Description<textarea name="description" rows={4} required /></label><button>Submit suggestion</button></form>
  {list.map((item) => <article className="card" key={item.id}><h2>{item.title}</h2><p>{item.description}</p><p><b>Status:</b> {item.status.replaceAll("_", " ")}</p><p><b>Management response:</b> {item.adminResponse || "Awaiting response"}</p><time>Submitted {item.submittedAt.toLocaleString("en-GB", { timeZone: "Asia/Dhaka" })} · Updated {item.updatedAt.toLocaleString("en-GB", { timeZone: "Asia/Dhaka" })}</time></article>)}{!list.length && <p className="card empty-state">No suggestions submitted yet.</p>}</>;
}
