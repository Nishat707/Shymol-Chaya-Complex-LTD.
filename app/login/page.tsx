import { Suspense } from "react";
import { getAppConfig } from "@/lib/app-config";
import LoginForm from "./LoginForm";

export const dynamic = "force-dynamic";

export default function Page() {
  const config = getAppConfig();
  return <Suspense><LoginForm supabaseUrl={config.supabaseUrl} supabaseAnonKey={config.supabaseAnonKey} /></Suspense>;
}
