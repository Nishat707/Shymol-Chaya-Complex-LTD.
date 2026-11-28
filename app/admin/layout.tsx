import Link from "next/link";
import { requireStaff } from "@/lib/session";
import { logout } from "@/app/auth/actions";
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const s = await requireStaff();
  return (
    <>
      <nav className="top"><b>Shymol Chaya Complex LTD.</b>
        <Link href="/admin">Overview</Link>
        {(s.role === "SUPER_ADMIN" || s.permissions.flats) && <Link href="/admin/flats">Flats</Link>}
        {(s.role === "SUPER_ADMIN" || s.permissions.payments) && <Link href="/admin/payments">Payments</Link>}
        {(s.role === "SUPER_ADMIN" || s.permissions.expenses) && <Link href="/admin/expenses">Expenses</Link>}
        {(s.role === "SUPER_ADMIN" || s.permissions.notices) && <Link href="/admin/notices">Notices</Link>}
        {(s.role === "SUPER_ADMIN" || s.permissions.reports) && <Link href="/admin/reports">Reports</Link>}
        {(s.role === "SUPER_ADMIN" || s.permissions.suggestions) && <Link href="/admin/suggestions">Suggestions</Link>}
        {(s.role === "SUPER_ADMIN" || s.permissions.maintenance) && <Link href="/admin/maintenance">Maintenance</Link>}
        {(s.role === "SUPER_ADMIN" || s.permissions.settings) && <Link href="/admin/settings">Settings</Link>}
        {(s.role === "SUPER_ADMIN" || s.permissions.audit) && <Link href="/admin/audit">Audit log</Link>}
        <span className="nav-identity">{s.email} · {s.role === "SUPER_ADMIN" ? "Super Admin" : "Manager"}</span>
        <form action={logout}><button className="nav-logout" type="submit">Log out</button></form>
      </nav>
      <div style={{ marginTop: 16 }}>{children}</div>
    </>
  );
}
