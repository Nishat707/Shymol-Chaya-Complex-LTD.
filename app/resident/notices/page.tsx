import { db } from "@/lib/db";
import { requireResident } from "@/lib/session";

export default async function ResidentNotices() {
  await requireResident();
  const notices = await db().orm.public.Notice.orderBy((n) => n.publishedAt.desc()).all();
  return <><h1>Apartment Notice Board</h1>{notices.map((notice) => <article className="card" key={notice.id}>
    <div className="section-heading"><h2>{notice.pinned ? "📌 " : ""}{notice.title}</h2><span className={`tag ${notice.priority === "URGENT" ? "r" : notice.priority === "IMPORTANT" ? "y" : "g"}`}>{notice.priority.toLowerCase()}</span></div>
    <p>{notice.category.replaceAll("_", " ").toLowerCase()} · Published {notice.publishedAt.toLocaleString("en-GB", { timeZone: "Asia/Dhaka" })}{notice.expiresAt ? ` · Expires ${notice.expiresAt}` : ""}</p>
    <p style={{ whiteSpace: "pre-wrap" }}>{notice.body}</p>
  </article>)}{!notices.length && <p className="card empty-state">No notices have been published.</p>}</>;
}
