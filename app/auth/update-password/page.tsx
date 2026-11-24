"use client";
import { createBrowserClient } from "@supabase/ssr";
import { useState, type FormEvent } from "react";

export default function UpdatePassword() {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const updatePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    if (password !== confirmation) {
      setError("The passwords do not match.");
      return;
    }

    setPending(true);
    try {
      const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
      const { error: updateError } = await sb.auth.updateUser({ password });
      if (updateError) {
        setError(updateError.message);
        return;
      }
      window.location.assign("/auth/callback");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to update your password. Request a new reset link.");
    } finally {
      setPending(false);
    }
  };

  return (
    <section className="login-card">
      <h1>Set a new password</h1>
      <p>Choose a password for your Shymol Chaya account.</p>
      {error && <p className="login-error" role="alert">{error}</p>}
      <form className="login-form" onSubmit={updatePassword}>
        <label>New password<input type="password" autoComplete="new-password" minLength={8} value={password} onChange={event => setPassword(event.target.value)} required /></label>
        <label>Confirm password<input type="password" autoComplete="new-password" minLength={8} value={confirmation} onChange={event => setConfirmation(event.target.value)} required /></label>
        <button type="submit" disabled={pending}>{pending ? "Updating password..." : "Save password"}</button>
      </form>
    </section>
  );
}
