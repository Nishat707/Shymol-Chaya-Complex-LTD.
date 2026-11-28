import { redirect } from "next/navigation";
import { supabaseServer } from "./supabase/server";
import { db } from "./db";

export type Session =
  | { kind: "staff"; role: "SUPER_ADMIN" | "MANAGER"; userId: string; email: string; permissions: Record<string, boolean> }
  | { kind: "resident"; flatIds: string[]; email: string };

// Single source of truth for "who is this?". Always checks the approved-email lists in our own
// database, so a valid Supabase account alone never grants access.
export async function getSession(): Promise<Session | null> {
  const { data } = await (await supabaseServer()).auth.getUser();
  const u = data.user;
  const email = u?.email?.toLowerCase();
  if (!u || !email || !u.email_confirmed_at) return null;
  const staff = await db().orm.public.User.where({ email, active: true }).first();
  if (staff) return { kind: "staff", role: staff.role, userId: staff.id, email, permissions: (staff.permissions as Record<string, boolean>) ?? {} };
  const rows = await db().orm.public.FlatResident.where({ email, active: true }).all();
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

export async function requirePermission(permission: string) {
  const s = await requireStaff();
  if (s.role !== "SUPER_ADMIN" && s.permissions[permission] !== true) {
    throw new Error("You do not have permission to perform this action.");
  }
  return s;
}
