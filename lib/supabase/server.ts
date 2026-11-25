import { createServerClient, type SetAllCookies } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getAppConfig } from "../app-config";

export async function supabaseServer() {
  const store = await cookies();
  const config = getAppConfig();
  return createServerClient(config.supabaseUrl, config.supabaseAnonKey, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list: Parameters<SetAllCookies>[0]) => { try { list.forEach(c => store.set(c.name, c.value, c.options)); } catch {} },
    },
  });
}
