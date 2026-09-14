"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, Bot, Boxes, Building2, ChartNoAxesCombined, CircleDollarSign, House, LogOut, Menu, PackageSearch, Settings, Sparkles, Users, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { ComponentType } from "react";
import { readDemoSetup, readDemoProfile, clearDemoProfile } from "@/lib/demoWorkspace";
import type { DemoUser } from "@/lib/domain";

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
  const [onboarding, setOnboarding] = useState<ReturnType<typeof readDemoSetup>>(null);

  useEffect(() => {
    const current = readDemoProfile();
    setOnboarding(readDemoSetup());
    if (new URLSearchParams(window.location.search).get("tour") === "1") setTourStep(0);
    if (!current) router.replace("/auth/sign-in");
    else setUser(current);
  }, [router]);

  if (!user) return <div className="app-loading">Opening Munaffa workspace…</div>;

  function signOut() {
    clearDemoProfile();
    router.push("/");
  }

  const sectionTitle = navigation.find(([key]) => key === section)?.[1] ?? "Overview";

  return (
    <main className="dashboard-layout">
      <aside className={`dashboard-sidebar ${menu ? "open" : ""}`}>
        <div className="brand"><span className="brand-glyph">M</span><span><b>munaffa</b><small>Hospitality Profit OS</small></span></div>
        <div className="workspace-chip"><span>{onboarding?.organizationName?.slice(0, 1) || "M"}</span><div><b>{onboarding?.organizationName || "Demo Hospitality"}</b><small>{onboarding?.propertyName || "Sample property"}</small></div></div>
        <nav>{navigation.map(([key, label, Icon]) => <Link key={key} href={`/app/${key === "overview" ? "" : key}`} className={section === key || (section === "overview" && key === "overview") ? "active" : ""} onClick={() => setMenu(false)}><Icon size={17}/>{label}</Link>)}</nav>
        <button className="sidebar-signout" onClick={signOut}><LogOut size={16}/>Sign out</button>
      </aside>

      <section className="dashboard-main">
        <header className="dashboard-topbar"><button className="mobile-dashboard-menu" onClick={() => setMenu((v) => !v)}>{menu ? <X/> : <Menu/>}</button><div><small>Workspace</small><h1>{sectionTitle}</h1></div><div className="top-actions"><button aria-label="Notifications"><Bell size={17}/></button><span>{user.name.slice(0, 1).toUpperCase()}</span></div></header>
        {section === "overview" && <Overview />}
        {section === "operations" && <Operations />}
        {section === "inventory" && <Inventory />}
        {section === "profit" && <Profit />}
        {section === "guests" && <Guests />}
        {section === "ai" && <AI />}
        {section === "settings" && <SettingsView user={user} />}
      </section>

      {tourStep >= 0 && <Tutorial step={tourStep} onNext={() => setTourStep((s) => s >= 3 ? -1 : s + 1)} onClose={() => setTourStep(-1)} />}
    </main>
  );
}

function Overview() {
  return <div className="dashboard-content"><div className="welcome-row"><div><span className="kicker">Live sample workspace</span><h2>See the whole business before it becomes a problem.</h2><p>All values below are clearly marked demo data until a real property is connected.</p></div><button className="pill primary">Connect real data later</button></div><div className="metric-row">{demoMetrics.map(([a,b,c]) => <article key={a}><small>{a}</small><b>{b}</b><em>{c} · Demo</em></article>)}</div><div className="dashboard-grid"><article className="chart-card"><header><div><small>Revenue + contribution</small><b>Last 7 days · Demo</b></div><ChartNoAxesCombined size={18}/></header><div className="fake-chart">{[32,52,41,66,58,78,88,71,91,76,95,86].map((h,i)=><i key={i} style={{height:`${h}%`}} />)}</div></article><article className="attention-card"><header><PackageSearch size={18}/><div><small>Needs attention</small><b>Operational signals</b></div></header>{["High-volume ingredient variance", "Weekend demand above baseline", "Three service requests delayed", "Supplier cost increased"].map((x,i)=><div key={x}><span className={i===0?"danger-dot":"warn-dot"}/><b>{x}</b><small>Illustrative signal</small></div>)}</article></div></div>;
}
function Operations(){ return <ModulePage icon={Building2} title="Operations" copy="A single live view for rooms, tables, orders, bookings, service requests and kitchen/front-desk activity." cards={["Live service queue","Bookings / orders","Rooms / tables","Staff handoffs","Delayed service","Property status"]}/>; }
function Inventory(){ return <ModulePage icon={Boxes} title="Inventory & cost" copy="Keep theoretical consumption, purchases and physical counts separate so variance is visible rather than guessed." cards={["Physical stock","Theoretical usage","Recipe / BOM cost","Waste log","Purchase cost","Days remaining"]}/>; }
function Profit(){ return <ModulePage icon={CircleDollarSign} title="Profit intelligence" copy="Connect revenue to the operating costs and activity that created it." cards={["Food / service cost","Contribution","Occupancy economics","Menu / service mix","Potential variance","Cost movement"]}/>; }
function Guests(){ return <ModulePage icon={Users} title="Guest intelligence" copy="Understand repeat visits, feedback, service recovery and guest value with consent-aware workflows." cards={["Guest profiles","Feedback","Repeat visits","Segments","Service recovery","Loyalty"]}/>; }
function AI(){ return <ModulePage icon={Sparkles} title="Munaffa AI" copy="A decision-support layer designed to explain signals, not invent certainty." cards={["Explain this change","Forecast demand","Investigate variance","Recommend purchase","Review pricing","Summarize property"]}/>; }
function SettingsView({user}:{user:DemoUser}) { return <div className="module-page"><div className="module-heading"><Settings size={24}/><div><h2>Workspace settings</h2><p>Demo profile and future production connection points.</p></div></div><div className="settings-card"><label>Name<input defaultValue={user.name}/></label><label>Email<input defaultValue={user.email}/></label><button className="pill primary">Save demo changes</button><small>Production account changes will use the real authentication provider when connected.</small></div></div>; }
function ModulePage({icon:Icon,title,copy,cards}:{icon:ComponentType<{size?:number}>,title:string,copy:string,cards:string[]}) { return <div className="module-page"><div className="module-heading"><Icon size={24}/><div><h2>{title}</h2><p>{copy}</p></div></div><div className="module-card-grid">{cards.map((card,i)=><article key={card}><small>0{i+1}</small><b>{card}</b><p>Interactive production module scaffold with demo state and clear empty-state behavior.</p><button>Open →</button></article>)}</div></div>; }
function Tutorial({step,onNext,onClose}:{step:number;onNext:()=>void;onClose:()=>void}) {
  const items=[
    ["Welcome to Munaffa","This sample workspace lets you explore the product before connecting real hospitality data."],
    ["Start with the owner view","Revenue, operations, inventory and attention signals are brought into one command center."],
    ["Drill into modules","Use the left navigation to inspect operations, inventory, profit, guests and AI."],
    ["Demo data is labelled","Nothing here is presented as a real customer result. Connect verified business data before making real decisions."],
  ];
  return <div className="tour-backdrop"><div className="tour-card"><button className="tour-close" onClick={onClose}>×</button><span className="kicker">Quick tour · {step+1}/4</span><h2>{items[step][0]}</h2><p>{items[step][1]}</p><button className="pill primary full-width" onClick={onNext}>{step===3?"Finish tour":"Next"}</button></div></div>;
}
