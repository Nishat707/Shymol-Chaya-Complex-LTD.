import { Suspense } from "react";
import service from "../../service.mjs";
import LoginForm from "./LoginForm";

export const dynamic = "force-dynamic";

export default function Page() {
  const input = service.input();
  return <Suspense><LoginForm supabaseUrl={input.supabaseUrl} supabaseAnonKey={input.supabaseAnonKey.expose()} /></Suspense>;
}
