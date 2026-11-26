import { logout } from "@/app/auth/actions";
import { requireResident } from "@/lib/session";

export default async function ResidentLayout({ children }: { children: React.ReactNode }) {
  const session = await requireResident();
  return (
    <>
      <nav className="top">
        <b>Shymol Chaya Complex LTD.</b>
        <span className="nav-identity">{session.email} · Resident</span>
        <form action={logout}><button className="nav-logout" type="submit">Log out</button></form>
      </nav>
      <div className="app-content">{children}</div>
    </>
  );
}
