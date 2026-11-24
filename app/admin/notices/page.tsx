import { db } from "@/lib/db";
import { addNotice } from "@/lib/actions";
import { Msg } from "@/components/Msg";
export default async function Notices({ searchParams }: { searchParams: Promise<{ err?: string; ok?: string }> }) {
  const sp = await searchParams; const list = await db().orm.public.Notice.orderBy((n) => n.publishedAt.desc()).limit(30).all();
  return (
    <>
      <h1>Notices</h1><Msg sp={sp} />
      <form className="grid card" action={addNotice}>
        <label>Title<input name="title" required /></label>
        <label>Priority<select name="priority"><option value="NORMAL">Normal</option><option value="IMPORTANT">Important</option><option value="URGENT">Urgent</option></select></label>
        <label>Expires on<input name="expires" type="date" /></label>
        <label style={{ gridColumn: "1 / -1" }}>Message<textarea name="body" rows={3} required /></label>
        <button>Publish notice</button>
      </form>
      {list.map(n => <div className="card" key={n.id}><b>{n.title}</b> <span className={`tag ${n.priority === "URGENT" ? "r" : n.priority === "IMPORTANT" ? "y" : "n"}`}>{n.priority.toLowerCase()}</span><p>{n.body}</p></div>)}
    </>
  );
}
