"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, Bot, Boxes, Building2, ChartNoAxesCombined, CircleDollarSign, House, LogOut, Menu, PackageSearch, Settings, Users, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { DemoUser } from "@/lib/domain";
import { backendMode, getCurrentUser, loadWorkspaceContext, signOutCurrentUser, type WorkspaceContext } from "@/lib/workspaceBackend";
import { AIWorkspace, GuestsWorkspace, InventoryWorkspace, OperationsWorkspace, ProfitWorkspace } from "@/components/ProductWorkspace";

const navigation = [
  ["overview", "Overview", House],
  ["operations", "Operations", Building2],
  ["inventory", "Inventory", Boxes],
  ["profit", "Profit", CircleDollarSign],
  ["guests", "Guests", Users],
  ["ai", "Munaffa AI", Bot],
  ["settings", "Settings", Settings],
] as const;

const demoMetrics = [
  ["Revenue", "₹8,42,520", "+8.4%"],
  ["Occupancy / Covers", "78%", "+5.2%"],
  ["Contribution", "₹2,18,640", "+3.1%"],
  ["Potential variance", "Review", "6 signals"],
];

export function DashboardApp({ section = "overview" }: { section?: string }) {
  const router = useRouter();
  const [user, setUser] = useState<DemoUser | null>(null);
  const [menu, setMenu] = useState(false);
  const [tourStep, setTourStep] = useState(-1);
  const [workspace, setWorkspace] = useState<WorkspaceContext | null>(null);
  const [loading, setLoading] = useState(true);
  const mode = backendMode();

  useEffect(() => {
    let cancelled = false;
    async function openWorkspace() {
      const current = await getCurrentUser();
      if (cancelled) return;
      if (!current) { router.replace("/auth/sign-in"); return; }
      const context = await loadWorkspaceContext();
      if (cancelled) return;
      if (mode === "supabase" && !context) { router.replace("/onboarding"); return; }
      setUser(current);
      setWorkspace(context);
      if (new URLSearchParams(window.location.search).get("tour") === "1") setTourStep(0);
      setLoading(false);
    }
    void openWorkspace();
    return () => { cancelled = true; };
  }, [mode, router]);

  if (loading || !user) return <div className="app-loading">Opening Munaffa workspace…</div>;

  async function signOut() {
    await signOutCurrentUser();
    router.push("/");
  }

  const normalizedSection = navigation.some(([key]) => key === section) ? section : "overview";
  const sectionTitle = navigation.find(([key]) => key === normalizedSection)?.[1] ?? "Overview";

  return <main className="dashboard-layout">
    <aside className={`dashboard-sidebar ${menu ? "open" : ""}`}>
      <div className="brand"><span className="brand-glyph">M</span><span><b>munaffa</b><small>Hospitality Profit OS</small></span></div>
      <div className="workspace-chip"><span>{workspace?.organizationName?.slice(0, 1) || "M"}</span><div><b>{workspace?.organizationName || "Demo Hospitality"}</b><small>{workspace?.propertyName || "Sample property"}</small></div></div>
      <nav>{navigation.map(([key, label, Icon]) => <Link key={key} href={`/app/${key === "overview" ? "" : key}`} className={normalizedSection === key ? "active" : ""} onClick={() => setMenu(false)}><Icon size={17}/>{label}</Link>)}</nav>
      <button className="sidebar-signout" onClick={() => void signOut()}><LogOut size={16}/>Sign out</button>
    </aside>

    <section className="dashboard-main">
      <header className="dashboard-topbar"><button className="mobile-dashboard-menu" onClick={() => setMenu((value) => !value)} aria-label="Toggle workspace navigation">{menu ? <X/> : <Menu/>}</button><div><small>{mode === "supabase" ? "Production account" : "Guided sample workspace"}</small><h1>{sectionTitle}</h1></div><div className="top-actions"><button aria-label="Notifications"><Bell size={17}/></button><span>{user.name.slice(0, 1).toUpperCase()}</span></div></header>
      {normalizedSection === "overview" && <Overview mode={mode} />}
      {normalizedSection === "operations" && <OperationsWorkspace />}
      {normalizedSection === "inventory" && <InventoryWorkspace />}
      {normalizedSection === "profit" && <ProfitWorkspace />}
      {normalizedSection === "guests" && <GuestsWorkspace />}
      {normalizedSection === "ai" && <AIWorkspace />}
      {normalizedSection === "settings" && <SettingsView user={user} mode={mode} />}
    </section>

    {tourStep >= 0 && <Tutorial step={tourStep} onNext={() => setTourStep((current) => current >= 3 ? -1 : current + 1)} onClose={() => setTourStep(-1)} />}
  </main>;
}

function Overview({ mode }: { mode: "supabase" | "demo" }) {
  return <div className="dashboard-content"><div className="welcome-row"><div><span className="kicker">{mode === "supabase" ? "Connected account" : "Interactive sample"}</span><h2>See the whole business before it becomes a problem.</h2><p>{mode === "supabase" ? "Your account and workspace setup are persisted. The operational values remain illustrative until POS, PMS, inventory and payment sources are connected." : "Use the left navigation to change service status, recount inventory, model contribution, resolve guest feedback and ask the sample Munaffa AI."}</p></div><Link href="/app/operations" className="pill primary">Explore live sample</Link></div><div className="metric-row">{demoMetrics.map(([label,value,change]) => <article key={label}><small>{label}</small><b>{value}</b><em>{change} · Illustrative</em></article>)}</div><div className="dashboard-grid"><article className="chart-card"><header><div><small>Revenue + contribution</small><b>Last 7 days · Illustrative</b></div><ChartNoAxesCombined size={18}/></header><div className="fake-chart">{[32,52,41,66,58,78,88,71,91,76,95,86].map((height,index)=><i key={index} style={{height:`${height}%`}} />)}</div></article><article className="attention-card"><header><PackageSearch size={18}/><div><small>Needs attention</small><b>Operational signals</b></div></header>{["High-volume ingredient variance", "Weekend demand above baseline", "Three service requests delayed", "Supplier cost increased"].map((signal,index)=><div key={signal}><span className={index===0?"danger-dot":"warn-dot"}/><b>{signal}</b><small>Illustrative signal</small></div>)}</article></div><div className="overview-next"><Link href="/app/operations"><Building2 size={18}/><span><b>Operate the sample</b><small>Advance rooms, orders and guest-service work.</small></span>→</Link><Link href="/app/inventory"><Boxes size={18}/><span><b>Recount inventory</b><small>See theoretical-vs-physical variance change.</small></span>→</Link><Link href="/app/profit"><CircleDollarSign size={18}/><span><b>Model contribution</b><small>Change revenue and cost assumptions interactively.</small></span>→</Link></div></div>;
}

function SettingsView({user, mode}:{user:DemoUser; mode:"supabase"|"demo"}) {
  const [saved, setSaved] = useState(false);
  return <div className="module-page"><div className="module-heading"><Settings size={24}/><div><span className="kicker">Workspace configuration</span><h2>Settings</h2><p>{mode === "supabase" ? "Your secure account is connected to the production workspace backend." : "Demo profile and production connection points."}</p></div></div><div className="settings-card"><label>Name<input defaultValue={user.name}/></label><label>Email<input defaultValue={user.email}/></label><button className="pill primary" onClick={() => { setSaved(true); window.setTimeout(() => setSaved(false), 1600); }}>Save sample changes</button>{saved && <div className="form-success">Saved in the current sample interface.</div>}<small>{mode === "supabase" ? "Authentication and onboarding are persisted in Supabase. Editable profile settings and external integrations are separate backend modules." : "Add the Supabase environment variables to enable production authentication and workspace persistence."}</small></div></div>;
}

function Tutorial({step,onNext,onClose}:{step:number;onNext:()=>void;onClose:()=>void}) {
  const items=[
    ["Welcome to Munaffa","This workspace lets you operate a safe sample before connecting hospitality data."],
    ["Start with operations","Move sample service work from queued to in progress to complete."],
    ["Test the profit loop","Recount inventory and change profit assumptions to see how the workspace responds."],
    ["Ask Munaffa AI","The current AI console is deterministic demo logic and is explicitly labelled until a real model and verified business retrieval are connected."],
  ];
  return <div className="tour-backdrop"><div className="tour-card"><button className="tour-close" onClick={onClose} aria-label="Close tutorial">×</button><span className="kicker">Quick tour · {step+1}/4</span><h2>{items[step][0]}</h2><p>{items[step][1]}</p><button className="pill primary full-width" onClick={onNext}>{step===3?"Start exploring":"Next"}</button></div></div>;
}
