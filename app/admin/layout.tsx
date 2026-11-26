import Link from "next/link";
import { requireStaff } from "@/lib/session";
import { logout } from "@/app/auth/actions";
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const s = await requireStaff();
  return (
    <>
      <nav className="top"><b>Shymol Chaya Complex LTD.</b>
        <Link href="/admin">Overview</Link><Link href="/admin/flats">Flats</Link><Link href="/admin/payments">Payments</Link>
        <Link href="/admin/expenses">Expenses</Link><Link href="/admin/notices">Notices</Link><Link href="/admin/settings">Settings</Link><Link href="/admin/audit">Audit log</Link>
        <span className="nav-identity">{s.email} · {s.role === "SUPER_ADMIN" ? "Super Admin" : "Manager"}</span>
        <form action={logout}><button className="nav-logout" type="submit">Log out</button></form>
      </nav>
      <div style={{ marginTop: 16 }}>{children}</div>
    </>
  );
}
