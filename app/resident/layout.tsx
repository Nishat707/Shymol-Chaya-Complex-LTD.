import { logout } from "@/app/auth/actions";
import { requireResident } from "@/lib/session";
import { db } from "@/lib/db";
import Link from "next/link";

export default async function ResidentLayout({ children }: { children: React.ReactNode }) {
  const session = await requireResident();
  const unread = await db().orm.public.Notification.where({ recipientEmail: session.email }).all();
  const unreadCount = unread.filter((n) => !n.readAt).length;
  return (
    <>
      <nav className="top">
        <b>Shymol Chaya Complex LTD.</b>
        <Link href="/resident">Dashboard</Link>
        <Link href="/resident/notices">Notices</Link>
        <Link href="/resident/expenses">Expenses</Link>
        <Link href="/resident/suggestions">Suggestions</Link>
        <Link href="/resident/maintenance">Maintenance</Link>
        <Link href="/resident/profile">Profile</Link>
        <Link href="/resident/notifications">Notifications{unreadCount ? ` (${unreadCount})` : ""}</Link>
        <span className="nav-identity">{session.email} · Resident</span>
        <form action={logout}><button className="nav-logout" type="submit">Log out</button></form>
      </nav>
      <div className="app-content">{children}</div>
    </>
  );
}
