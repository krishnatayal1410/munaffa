"use client";

import Link from "next/link";
import { CheckCircle2, LogIn, ShieldCheck, UserPlus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { acceptTeamInvite } from "@/lib/teamBackend";
import { getCurrentUser } from "@/lib/workspaceBackend";
import { hasProductionBackend } from "@/lib/supabase";

export function InviteAccept({ token }: { token: string }) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [signedIn, setSignedIn] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState("");
  const production = hasProductionBackend();
  const nextPath = useMemo(() => `/invite/${encodeURIComponent(token)}`, [token]);
  const authNext = encodeURIComponent(nextPath);

  useEffect(() => {
    let cancelled = false;
    async function check() {
      if (!production) {
        setChecking(false);
        return;
      }
      const user = await getCurrentUser();
      if (!cancelled) {
        setSignedIn(Boolean(user));
        setChecking(false);
      }
    }
    void check();
    return () => { cancelled = true; };
  }, [production]);

  async function accept() {
    setAccepting(true);
    setError("");
    try {
      await acceptTeamInvite(token);
      setAccepted(true);
      window.setTimeout(() => router.replace("/app"), 900);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "This invitation could not be accepted.");
    } finally {
      setAccepting(false);
    }
  }

  return <main className="invite-page"><section className="invite-card"><Link href="/" className="brand"><span className="brand-glyph">M</span><span><b>munaffa</b><small>Hospitality Profit OS</small></span></Link><div className="invite-icon"><ShieldCheck size={28}/></div><span className="kicker">Secure team invitation</span><h1>Join a Munaffa workspace.</h1><p>This link contains a one-time invitation secret. Munaffa checks the token, expiry, optional email restriction and organization membership on the server before any access is granted.</p>
    {!production && <div className="form-error" role="alert">Production authentication is not configured on this deployment, so secure team invitations cannot be accepted here.</div>}
    {production && checking && <div className="invite-state">Checking your session…</div>}
    {production && !checking && !signedIn && <div className="invite-actions"><Link className="pill primary" href={`/auth/sign-in?next=${authNext}`}><LogIn size={15}/>Sign in to accept</Link><Link className="pill ghost" href={`/auth/sign-up?next=${authNext}`}><UserPlus size={15}/>Create account</Link><small>After authentication you will return to this same invitation. Creating an account does not accept the invitation automatically.</small></div>}
    {production && !checking && signedIn && !accepted && <div className="invite-actions"><button type="button" className="pill primary" disabled={accepting} onClick={() => void accept()}>{accepting ? "Accepting securely…" : "Accept invitation"}</button><Link className="pill ghost" href="/app">Not now</Link><small>Acceptance is explicit. Your server-side membership role will come from the invitation—not from a role selected in the browser.</small></div>}
    {accepted && <div className="form-success invite-success"><CheckCircle2 size={16}/>Invitation accepted. Opening your workspace…</div>}
    {error && <div className="form-error" role="alert">{error}</div>}
    <div className="privacy-hint"><ShieldCheck size={14}/><span>If you were not expecting this invitation, do not accept it. Ask the hospitality business owner or manager to verify the link through another channel.</span></div>
  </section></main>;
}
