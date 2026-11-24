"use client";
import { createBrowserClient } from "@supabase/ssr";
import { useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";

function Login() {
  const err = useSearchParams().get("error");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const signIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setPending(true);
    try {
      const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
      const { data, error: signInError } = await sb.auth.signInWithPassword({ email: email.trim(), password });
      if (signInError) {
        setError(signInError.message);
        return;
      }
      if (!data.session) {
        setError("Sign in failed because no session was created. Please try again.");
        return;
      }
      window.location.assign("/auth/callback");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to sign in. Please try again.");
    } finally {
      setPending(false);
    }
  };

  return (
    <section className="login-card">
      <h1>Shymol Chaya Complex LTD.</h1>
      <p>Sign in with the email account registered for your flat or staff role.</p>
      {err && <p className="login-error" role="alert">This email is not approved for access. Ask the building manager to check your account.</p>}
      {error && <p className="login-error" role="alert">{error}</p>}
      <form className="login-form" onSubmit={signIn}>
        <label>Email<input type="email" autoComplete="username" value={email} onChange={event => setEmail(event.target.value)} required /></label>
        <label>Password<input type="password" autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} required /></label>
        <button type="submit" disabled={pending}>{pending ? "Signing in..." : "Sign in"}</button>
      </form>
      <p className="login-help">Only active, approved email accounts can access the app. Contact the building manager if you need an account.</p>
    </section>
  );
}
export default function Page() { return <Suspense><Login /></Suspense>; }
