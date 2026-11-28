import { db } from "@/lib/db";
import { requireResident } from "@/lib/session";
import { markNotificationsRead } from "@/lib/actions";

export default async function Notifications() {
  const s = await requireResident();
  const list = await db().orm.public.Notification.where({ recipientEmail: s.email }).orderBy((n) => n.createdAt.desc()).limit(100).all();
  return <><h1>Notifications</h1><form action={markNotificationsRead}><button>Mark all as read</button></form><section>{list.map((n) => <article className="card" key={n.id}><b>{n.title}</b>{n.readAt ? "" : " · Unread"}<p>{n.body}</p><time>{n.createdAt.toLocaleString("en-GB", { timeZone: "Asia/Dhaka" })}</time>{n.href && <><br /><a href={n.href}>Open</a></>}{!n.readAt && <form action={markNotificationsRead}><input type="hidden" name="id" value={n.id} /><button className="sec">Mark read</button></form>}</article>)}</section>{!list.length && <p className="card empty-state">No notifications yet.</p>}</>;
}
