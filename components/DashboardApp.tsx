"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, Bot, Boxes, Building2, ChartNoAxesCombined, CircleDollarSign, House, LogOut, Menu, PackageSearch, Settings, Sparkles, Users, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { ComponentType } from "react";
import type { DemoUser } from "@/lib/domain";
import { backendMode, getCurrentUser, loadWorkspaceContext, signOutCurrentUser, type WorkspaceContext } from "@/lib/workspaceBackend";

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

      if (!current) {
        router.replace("/auth/sign-in");
        return;
      }

      const context = await loadWorkspaceContext();
      if (cancelled) return;

      if (mode === "supabase" && !context) {
        router.replace("/onboarding");
        return;
      }

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

  const sectionTitle = navigation.find(([key]) => key === section)?.[1] ?? "Overview";

  return (
    <main className="dashboard-layout">
      <aside className={`dashboard-sidebar ${menu ? "open" : ""}`}>
        <div className="brand"><span className="brand-glyph">M</span><span><b>munaffa</b><small>Hospitality Profit OS</small></span></div>
        <div className="workspace-chip"><span>{workspace?.organizationName?.slice(0, 1) || "M"}</span><div><b>{workspace?.organizationName || "Demo Hospitality"}</b><small>{workspace?.propertyName || "Sample property"}</small></div></div>
        <nav>{navigation.map(([key, label, Icon]) => <Link key={key} href={`/app/${key === "overview" ? "" : key}`} className={section === key || (section === "overview" && key === "overview") ? "active" : ""} onClick={() => setMenu(false)}><Icon size={17}/>{label}</Link>)}</nav>
        <button className="sidebar-signout" onClick={() => void signOut()}><LogOut size={16}/>Sign out</button>
      </aside>

      <section className="dashboard-main">
        <header className="dashboard-topbar"><button className="mobile-dashboard-menu" onClick={() => setMenu((v) => !v)}>{menu ? <X/> : <Menu/>}</button><div><small>{mode === "supabase" ? "Production workspace" : "Demo workspace"}</small><h1>{sectionTitle}</h1></div><div className="top-actions"><button aria-label="Notifications"><Bell size={17}/></button><span>{user.name.slice(0, 1).toUpperCase()}</span></div></header>
        {section === "overview" && <Overview mode={mode} />}
        {section === "operations" && <Operations />}
        {section === "inventory" && <Inventory />}
        {section === "profit" && <Profit />}
        {section === "guests" && <Guests />}
        {section === "ai" && <AI />}
        {section === "settings" && <SettingsView user={user} mode={mode} />}
      </section>

      {tourStep >= 0 && <Tutorial step={tourStep} onNext={() => setTourStep((s) => s >= 3 ? -1 : s + 1)} onClose={() => setTourStep(-1)} />}
    </main>
  );
}

function Overview({ mode }: { mode: "supabase" | "demo" }) {
  return <div className="dashboard-content"><div className="welcome-row"><div><span className="kicker">{mode === "supabase" ? "Connected workspace" : "Live sample workspace"}</span><h2>See the whole business before it becomes a problem.</h2><p>{mode === "supabase" ? "Your account and workspace are connected. Operational cards remain illustrative until real POS, inventory and booking integrations are added." : "All values below are clearly marked demo data until a real property is connected."}</p></div><button className="pill primary">Integrations coming next</button></div><div className="metric-row">{demoMetrics.map(([a,b,c]) => <article key={a}><small>{a}</small><b>{b}</b><em>{c} · Illustrative</em></article>)}</div><div className="dashboard-grid"><article className="chart-card"><header><div><small>Revenue + contribution</small><b>Last 7 days · Illustrative</b></div><ChartNoAxesCombined size={18}/></header><div className="fake-chart">{[32,52,41,66,58,78,88,71,91,76,95,86].map((h,i)=><i key={i} style={{height:`${h}%`}} />)}</div></article><article className="attention-card"><header><PackageSearch size={18}/><div><small>Needs attention</small><b>Operational signals</b></div></header>{["High-volume ingredient variance", "Weekend demand above baseline", "Three service requests delayed", "Supplier cost increased"].map((x,i)=><div key={x}><span className={i===0?"danger-dot":"warn-dot"}/><b>{x}</b><small>Illustrative signal</small></div>)}</article></div></div>;
}
function Operations(){ return <ModulePage icon={Building2} title="Operations" copy="A single live view for rooms, tables, orders, bookings, service requests and kitchen/front-desk activity." cards={["Live service queue","Bookings / orders","Rooms / tables","Staff handoffs","Delayed service","Property status"]}/>; }
function Inventory(){ return <ModulePage icon={Boxes} title="Inventory & cost" copy="Keep theoretical consumption, purchases and physical counts separate so variance is visible rather than guessed." cards={["Physical stock","Theoretical usage","Recipe / BOM cost","Waste log","Purchase cost","Days remaining"]}/>; }
function Profit(){ return <ModulePage icon={CircleDollarSign} title="Profit intelligence" copy="Connect revenue to the operating costs and activity that created it." cards={["Food / service cost","Contribution","Occupancy economics","Menu / service mix","Potential variance","Cost movement"]}/>; }
function Guests(){ return <ModulePage icon={Users} title="Guest intelligence" copy="Understand repeat visits, feedback, service recovery and guest value with consent-aware workflows." cards={["Guest profiles","Feedback","Repeat visits","Segments","Service recovery","Loyalty"]}/>; }
function AI(){ return <ModulePage icon={Sparkles} title="Munaffa AI" copy="A decision-support layer designed to explain signals, not invent certainty." cards={["Explain this change","Forecast demand","Investigate variance","Recommend purchase","Review pricing","Summarize property"]}/>; }
function SettingsView({user, mode}:{user:DemoUser; mode:"supabase"|"demo"}) { return <div className="module-page"><div className="module-heading"><Settings size={24}/><div><h2>Workspace settings</h2><p>{mode === "supabase" ? "Your secure account is connected to the production workspace backend." : "Demo profile and future production connection points."}</p></div></div><div className="settings-card"><label>Name<input defaultValue={user.name}/></label><label>Email<input defaultValue={user.email}/></label><button className="pill primary">Save changes</button><small>{mode === "supabase" ? "Workspace identity is stored in Supabase. Settings persistence is the next backend module." : "Add the Supabase environment variables to enable production accounts and workspace persistence."}</small></div></div>; }
function ModulePage({icon:Icon,title,copy,cards}:{icon:ComponentType<{size?:number}>,title:string,copy:string,cards:string[]}) { return <div className="module-page"><div className="module-heading"><Icon size={24}/><div><h2>{title}</h2><p>{copy}</p></div></div><div className="module-card-grid">{cards.map((card,i)=><article key={card}><small>0{i+1}</small><b>{card}</b><p>Production module scaffold with explicit empty-state behavior until a real business data source is connected.</p><button>Open →</button></article>)}</div></div>; }
function Tutorial({step,onNext,onClose}:{step:number;onNext:()=>void;onClose:()=>void}) {
  const items=[
    ["Welcome to Munaffa","This workspace lets you explore the product before connecting operational hospitality data."],
    ["Start with the owner view","Revenue, operations, inventory and attention signals are brought into one command center."],
    ["Drill into modules","Use the left navigation to inspect operations, inventory, profit, guests and AI."],
    ["Illustrative data is labelled","Nothing on the sample cards is presented as a real customer result. Verified business integrations come next."],
  ];
  return <div className="tour-backdrop"><div className="tour-card"><button className="tour-close" onClick={onClose}>×</button><span className="kicker">Quick tour · {step+1}/4</span><h2>{items[step][0]}</h2><p>{items[step][1]}</p><button className="pill primary full-width" onClick={onNext}>{step===3?"Finish tour":"Next"}</button></div></div>;
}
