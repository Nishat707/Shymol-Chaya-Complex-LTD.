"use client";
import { createBrowserClient } from "@supabase/ssr";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function Login() {
  const err = useSearchParams().get("error");
  const go = () => {
    const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    sb.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${location.origin}/auth/callback` } });
  };
  return (
    <>
      <h1>Shymol Chaya Complex LTD.</h1>
      <p>Sign in with the Google account registered for your flat.</p>
      {err && <p role="alert" style={{ color: "#b3402f" }}>This Google account is not registered. Ask the building manager to add it.</p>}
      <button onClick={go} style={{ padding: "10px 16px", fontSize: 16 }}>Continue with Google</button>
    </>
  );
}
export default function Page() { return <Suspense><Login /></Suspense>; }
