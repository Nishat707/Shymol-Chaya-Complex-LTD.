import { createServerClient, type SetAllCookies } from "@supabase/ssr";
import { cookies } from "next/headers";
import service from "../../service.mjs";

export async function supabaseServer() {
  const store = await cookies();
  const input = service.input();
  return createServerClient(input.supabaseUrl, input.supabaseAnonKey.expose(), {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list: Parameters<SetAllCookies>[0]) => { try { list.forEach(c => store.set(c.name, c.value, c.options)); } catch {} },
    },
  });
}
