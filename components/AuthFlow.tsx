"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { z } from "zod";
import { writeDemoProfile } from "@/lib/demoWorkspace";
import { getSupabaseBrowserClient, hasProductionBackend } from "@/lib/supabase";

export type AuthMode = "sign-in" | "sign-up" | "forgot-password" | "update-password";

const emailSchema = z.string().email("Enter a valid email");
const passwordSchema = z.string().min(8, "Password must be at least 8 characters");
const signInSchema = z.object({ email: emailSchema, password: passwordSchema });
const signUpSchema = signInSchema.extend({ name: z.string().min(2, "Enter your name") });

export function AuthFlow({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const production = hasProductionBackend();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const title = useMemo(() => {
    if (mode === "sign-up") return "Create your Munaffa workspace";
    if (mode === "sign-in") return "Welcome back";
    if (mode === "update-password") return "Choose a new password";
    return "Reset your password";
  }, [mode]);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const client = getSupabaseBrowserClient();

      if (mode === "forgot-password") {
        const parsed = emailSchema.safeParse(email);
        if (!parsed.success) throw new Error(parsed.error.issues[0]?.message || "Invalid email");

        if (!client) {
          setMessage("Demo mode: no email was sent. Connect the production backend to enable secure password recovery.");
          return;
        }

        const { error: resetError } = await client.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/update-password`,
        });
        if (resetError) throw resetError;
        setMessage("Check your email for the secure password reset link.");
        return;
      }

      if (mode === "update-password") {
        const parsed = passwordSchema.safeParse(password);
        if (!parsed.success) throw new Error(parsed.error.issues[0]?.message || "Invalid password");
        if (!client) throw new Error("Production authentication is not configured on this deployment.");

        const { error: updateError } = await client.auth.updateUser({ password });
        if (updateError) throw updateError;
        setMessage("Password updated. Opening your workspace…");
        router.replace("/app");
        return;
      }

      const parsed = (mode === "sign-up" ? signUpSchema : signInSchema).safeParse(
        mode === "sign-up" ? { name, email, password } : { email, password },
      );
      if (!parsed.success) throw new Error(parsed.error.issues[0]?.message || "Check the form");

      if (!client) {
        writeDemoProfile({
          id: crypto.randomUUID(),
          name: mode === "sign-up" ? name : email.split("@")[0] || "Hospitality Owner",
          email,
          onboardingComplete: mode === "sign-in",
        });
        router.push(mode === "sign-up" ? "/onboarding" : "/app");
        return;
      }

      if (mode === "sign-up") {
        const { data, error: signUpError } = await client.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name },
            emailRedirectTo: `${window.location.origin}/auth/sign-in`,
          },
        });
        if (signUpError) throw signUpError;

        if (data.session) {
          router.push("/onboarding");
        } else {
          setMessage("Account created. Check your email to confirm your address, then sign in to finish setup.");
        }
        return;
      }

      const { error: signInError } = await client.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;
      router.push("/app");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const showEmail = mode !== "update-password";
  const showPassword = mode !== "forgot-password";
  const kicker = mode === "sign-up" ? "Start free" : mode === "sign-in" ? "Secure workspace" : mode === "update-password" ? "Account security" : "Account recovery";
  const submitLabel = loading ? "Please wait…" : mode === "sign-up" ? "Create workspace" : mode === "sign-in" ? "Sign in" : mode === "update-password" ? "Update password" : "Send reset link";

  return <main className="auth-page">
    <section className="auth-art">
      <div className="auth-art-overlay" />
      <Link href="/" className="brand auth-brand"><span className="brand-glyph">M</span><span><b>munaffa</b><small>Hospitality Profit OS</small></span></Link>
      <div className="auth-art-copy"><span className="kicker">One operating system</span><h1>Hospitality operations.<br/><em>Finally connected.</em></h1><p>Connect revenue, service, inventory and profit intelligence across your hospitality business.</p></div>
    </section>
    <section className="auth-panel"><div className="auth-box">
      <span className="kicker">{kicker}</span>
      <h2>{title}</h2>
      <p className="auth-sub">{production ? "Production authentication is enabled for this deployment." : "Demo mode is active. Add the Supabase environment variables to switch this exact flow to secure production accounts."}</p>
      <form onSubmit={submit} className="auth-form">
        {mode === "sign-up" && <label>Full name<input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" autoComplete="name" /></label>}
        {showEmail && <label>Email<input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@business.com" type="email" autoComplete="email" /></label>}
        {showPassword && <label>{mode === "update-password" ? "New password" : "Password"}<input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" type="password" autoComplete={mode === "sign-up" || mode === "update-password" ? "new-password" : "current-password"} /></label>}
        {error && <div className="form-error">{error}</div>}
        {message && <div className="form-success">{message}</div>}
        <button className="pill primary full-width" type="submit" disabled={loading}>{submitLabel}</button>
      </form>
      <div className="auth-links">
        {mode === "sign-in" && <><Link href="/auth/forgot-password">Forgot password?</Link><span>New to Munaffa? <Link href="/auth/sign-up">Create account</Link></span></>}
        {mode === "sign-up" && <span>Already have an account? <Link href="/auth/sign-in">Sign in</Link></span>}
        {(mode === "forgot-password" || mode === "update-password") && <Link href="/auth/sign-in">Back to sign in</Link>}
      </div>
    </div></section>
  </main>;
}
