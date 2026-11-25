import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { getSession } from "@/lib/session";
import { getAppConfig } from "@/lib/app-config";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const siteUrl = new URL(getAppConfig().siteUrl);
  if (siteUrl.protocol !== "http:" && siteUrl.protocol !== "https:") {
    throw new Error("NEXT_PUBLIC_SITE_URL must use HTTP or HTTPS");
  }
  const origin = siteUrl.origin;
  const code = url.searchParams.get("code");
  const sb = await supabaseServer();
  if (code) {
    const { error } = await sb.auth.exchangeCodeForSession(code);
    if (error) return NextResponse.redirect(new URL("/login?error=auth", origin));
  }
  const s = await getSession();
  if (!s) {
    await sb.auth.signOut(); // Valid Supabase account but not approved: reject.
    return NextResponse.redirect(new URL("/login?error=unauthorized", origin));
  }
  if (url.searchParams.get("next") === "/auth/update-password") {
    return NextResponse.redirect(new URL("/auth/update-password", origin));
  }
  return NextResponse.redirect(new URL(s.kind === "staff" ? "/admin" : "/resident", origin));
}
