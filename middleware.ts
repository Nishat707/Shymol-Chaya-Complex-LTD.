import { createServerClient, type SetAllCookies } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import service from "./service.mjs";

// Keeps the Supabase session cookie fresh. Authorization itself happens in lib/session.ts.
export async function middleware(req: NextRequest) {
  let res = NextResponse.next({ request: req });
  // The middleware bundle is a separate artifact whose process may not carry the
  // service's stashed input, and one failed refresh must not 5xx the request:
  // authorization never depends on it (lib/session.ts re-checks every request).
  try {
    const input = service.input();
    const sb = createServerClient(input.supabaseUrl, input.supabaseAnonKey.expose(), {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (list: Parameters<SetAllCookies>[0]) => { list.forEach(c => req.cookies.set(c.name, c.value)); res = NextResponse.next({ request: req }); list.forEach(c => res.cookies.set(c.name, c.value, c.options)); },
      },
    });
    await sb.auth.getUser();
  } catch {}
  return res;
}
export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"], runtime: "nodejs" };
