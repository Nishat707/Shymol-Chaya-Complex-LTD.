import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { getSession } from "@/lib/session";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const sb = await supabaseServer();
  if (code) await sb.auth.exchangeCodeForSession(code);
  const s = await getSession();
  if (!s) {
    await sb.auth.signOut(); // Valid Supabase account but not approved: reject.
    return NextResponse.redirect(new URL("/login?error=unauthorized", url.origin));
  }
  return NextResponse.redirect(new URL(s.kind === "staff" ? "/admin" : "/resident", url.origin));
}
