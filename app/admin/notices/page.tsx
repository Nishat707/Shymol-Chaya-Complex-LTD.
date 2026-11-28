import { db } from "@/lib/db";
import { addNotice, deleteNotice, editNotice } from "@/lib/actions";
import { Msg } from "@/components/Msg";
import { requirePermission } from "@/lib/session";
export default async function Notices({ searchParams }: { searchParams: Promise<{ err?: string; ok?: string }> }) {
  await requirePermission("notices");
  const sp = await searchParams; const list = await db().orm.public.Notice.orderBy((n) => n.publishedAt.desc()).limit(30).all();
  return (
    <>
      <h1>Notices</h1><Msg sp={sp} />
      <form className="grid card" action={addNotice}>
        <label>Title<input name="title" required /></label>
        <label>Priority<select name="priority"><option value="NORMAL">Normal</option><option value="IMPORTANT">Important</option><option value="URGENT">Urgent</option></select></label>
        <label>Category<select name="category"><option value="GENERAL">General</option><option value="MAINTENANCE">Maintenance</option><option value="EMERGENCY">Emergency</option><option value="PAYMENT_REMINDER">Payment reminder</option></select></label>
        <label>Pin notice<select name="pinned"><option value="0">No</option><option value="1">Yes</option></select></label>
        <label>Expires on<input name="expires" type="date" /></label>
        <label style={{ gridColumn: "1 / -1" }}>Message<textarea name="body" rows={3} required /></label>
        <button>Publish notice</button>
      </form>
      {list.map(n => <div className="card" key={n.id}>
        <b>{n.pinned ? "📌 " : ""}{n.title}</b> <span className={`tag ${n.priority === "URGENT" ? "r" : n.priority === "IMPORTANT" ? "y" : "n"}`}>{n.priority.toLowerCase()}</span>
        <p>{n.body}</p>
        <form className="grid" action={editNotice}>
          <input type="hidden" name="id" value={n.id} />
          <label>Title<input name="title" defaultValue={n.title} required /></label>
          <label>Category<select name="category" defaultValue={n.category}><option value="GENERAL">General</option><option value="MAINTENANCE">Maintenance</option><option value="EMERGENCY">Emergency</option><option value="PAYMENT_REMINDER">Payment reminder</option></select></label>
          <label>Priority<select name="priority" defaultValue={n.priority}><option value="NORMAL">Normal</option><option value="IMPORTANT">Important</option><option value="URGENT">Urgent</option></select></label>
          <label>Pin<select name="pinned" defaultValue={n.pinned ? "1" : "0"}><option value="0">No</option><option value="1">Yes</option></select></label>
          <label>Expires<input name="expires" type="date" defaultValue={n.expiresAt ? n.expiresAt.toISOString().slice(0,10) : ""} /></label>
          <label style={{ gridColumn: "1 / -1" }}>Message<textarea name="body" defaultValue={n.body} required /></label>
          <button className="sec">Save changes</button>
        </form>
        <form action={deleteNotice}><input type="hidden" name="id" value={n.id} /><button className="sec">Delete notice</button></form>
      </div>)}
    </>
  );
}
