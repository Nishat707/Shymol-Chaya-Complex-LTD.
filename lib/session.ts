import { redirect } from "next/navigation";
import { supabaseServer } from "./supabase/server";
import { prisma } from "./db";

export type Session =
  | { kind: "staff"; role: "SUPER_ADMIN" | "MANAGER"; userId: string; email: string }
  | { kind: "resident"; flatIds: string[]; email: string };

// Single source of truth for "who is this?". Always checks the approved-email lists in our own
// database, so a valid Google login alone never grants access.
export async function getSession(): Promise<Session | null> {
  const { data } = await (await supabaseServer()).auth.getUser();
  const u = data.user;
  const email = u?.email?.toLowerCase();
  if (!u || !email || !u.email_confirmed_at) return null;
  const staff = await prisma.user.findFirst({ where: { email, active: true } });
  if (staff) return { kind: "staff", role: staff.role, userId: staff.id, email };
  const rows = await prisma.flatResident.findMany({ where: { email, active: true } });
  if (rows.length) return { kind: "resident", flatIds: rows.map(r => r.flatId), email };
  return null;
}

export async function requireStaff() {
  const s = await getSession();
  if (!s || s.kind !== "staff") redirect("/login?error=unauthorized");
  return s;
}
export async function requireResident() {
  const s = await getSession();
  if (!s || s.kind !== "resident") redirect("/login?error=unauthorized");
  return s;
}
