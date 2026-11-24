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
  const [resetPending, setResetPending] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

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

  const sendPasswordReset = async () => {
    setError(null);
    setResetMessage(null);
    if (!email.trim()) {
      setError("Enter your email address first.");
      return;
    }

    setResetPending(true);
    try {
      const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
      const { error: resetError } = await sb.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent("/auth/update-password")}`,
      });
      if (resetError) {
        setError(resetError.message);
        return;
      }
      setResetMessage("If an account exists for this email, Supabase will send a password reset link.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to request a password reset. Please try again.");
    } finally {
      setResetPending(false);
    }
  };

  return (
    <section className="login-card">
      <h1>Shymol Chaya Complex LTD.</h1>
      <p>Sign in with the email account registered for your flat or staff role.</p>
      {err === "unauthorized" && <p className="login-error" role="alert">This email is not approved for access. Ask the building manager to check your account.</p>}
      {err === "auth" && <p className="login-error" role="alert">That sign-in or password-reset link could not be verified. Request a new link and try again.</p>}
      {error && <p className="login-error" role="alert">{error}</p>}
      <form className="login-form" onSubmit={signIn}>
        <label>Email<input type="email" autoComplete="username" value={email} onChange={event => setEmail(event.target.value)} required /></label>
        <label>Password<input type="password" autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} required /></label>
        <button type="submit" disabled={pending}>{pending ? "Signing in..." : "Sign in"}</button>
        <button className="login-reset" type="button" onClick={sendPasswordReset} disabled={resetPending}>
          {resetPending ? "Sending reset link..." : "Forgot or need to set your password?"}
        </button>
      </form>
      {resetMessage && <p className="login-success" role="status">{resetMessage}</p>}
      <p className="login-help">Only active, approved email accounts can access the app. Contact the building manager if you need an account.</p>
    </section>
  );
}
export default function Page() { return <Suspense><Login /></Suspense>; }
