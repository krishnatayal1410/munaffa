"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { z } from "zod";
import { writeDemoProfile } from "@/lib/demoWorkspace";

const signInSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
const signUpSchema = signInSchema.extend({ name: z.string().min(2, "Enter your name") });

export function AuthFlow({ mode }: { mode: "sign-in" | "sign-up" | "forgot-password" }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const title = useMemo(() => mode === "sign-up" ? "Create your Munaffa workspace" : mode === "sign-in" ? "Welcome back" : "Reset your password", [mode]);

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setMessage("");
    if (mode === "forgot-password") {
      const parsed = z.string().email("Enter a valid email").safeParse(email);
      if (!parsed.success) return setError(parsed.error.issues[0]?.message || "Invalid email");
      setMessage("Demo reset flow created. Production email delivery will be connected with the real auth provider.");
      return;
    }
    const parsed = (mode === "sign-up" ? signUpSchema : signInSchema).safeParse(mode === "sign-up" ? { name, email, password } : { email, password });
    if (!parsed.success) { setError(parsed.error.issues[0]?.message || "Check the form"); return; }
    writeDemoProfile({ id: crypto.randomUUID(), name: mode === "sign-up" ? name : email.split("@")[0] || "Hospitality Owner", email, onboardingComplete: mode === "sign-in" });
    router.push(mode === "sign-up" ? "/onboarding" : "/app");
  }

  return <main className="auth-page">
    <section className="auth-art"><div className="auth-art-overlay" /><Link href="/" className="brand auth-brand"><span className="brand-glyph">M</span><span><b>munaffa</b><small>Hospitality Profit OS</small></span></Link><div className="auth-art-copy"><span className="kicker">One operating system</span><h1>Hospitality operations.<br/><em>Finally connected.</em></h1><p>Use the demo workspace to explore revenue, service, inventory and profit intelligence before connecting real business data.</p></div></section>
    <section className="auth-panel"><div className="auth-box"><span className="kicker">{mode === "sign-up" ? "Start free" : mode === "sign-in" ? "Secure workspace" : "Account recovery"}</span><h2>{title}</h2><p className="auth-sub">This launch build uses persistent demo authentication in your browser. Real production auth is isolated behind the same UI so it can be connected without redesigning the flow.</p><form onSubmit={submit} className="auth-form">{mode === "sign-up" && <label>Full name<input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" autoComplete="name" /></label>}<label>Email<input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@business.com" type="email" autoComplete="email" /></label>{mode !== "forgot-password" && <label>Password<input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" type="password" autoComplete={mode === "sign-up" ? "new-password" : "current-password"} /></label>}{error && <div className="form-error">{error}</div>}{message && <div className="form-success">{message}</div>}<button className="pill primary full-width" type="submit">{mode === "sign-up" ? "Create workspace" : mode === "sign-in" ? "Sign in" : "Create reset request"}</button></form><div className="auth-links">{mode === "sign-in" && <><Link href="/auth/forgot-password">Forgot password?</Link><span>New to Munaffa? <Link href="/auth/sign-up">Create account</Link></span></>}{mode === "sign-up" && <span>Already have an account? <Link href="/auth/sign-in">Sign in</Link></span>}{mode === "forgot-password" && <Link href="/auth/sign-in">Back to sign in</Link>}</div></div></section>
  </main>;
}
