import service from "../service.mjs";

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required when running on Vercel`);
  return value;
}

export function getAppConfig() {
  if (process.env.VERCEL === "1") {
    return {
      siteUrl: requiredEnv("NEXT_PUBLIC_SITE_URL"),
      supabaseUrl: requiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
      supabaseAnonKey: requiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    };
  }

  const input = service.input();
  return {
    siteUrl: input.siteUrl,
    supabaseUrl: input.supabaseUrl,
    supabaseAnonKey: input.supabaseAnonKey.expose(),
  };
}
