"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, Bot, Boxes, Building2, ChartNoAxesCombined, CircleDollarSign, House, LogOut, Menu, PackageSearch, Settings, Users, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { DemoUser, Role } from "@/lib/domain";
import { backendMode, getCurrentUser, loadWorkspaceContext, saveWorkspaceSetup, signOutCurrentUser, updateWorkspaceProfile, type WorkspaceContext } from "@/lib/workspaceBackend";
import { AIWorkspace, GuestsWorkspace, InventoryWorkspace, OperationsWorkspace, ProfitWorkspace } from "@/components/ProductWorkspace";
import { ProductionOperationsWorkspace } from "@/components/ProductionOperationsWorkspace";
import { ProductionInventoryWorkspace } from "@/components/ProductionInventoryWorkspace";
import { ProductionGuestsWorkspace } from "@/components/ProductionGuestsWorkspace";
import { ProductionOverviewWorkspace } from "@/components/ProductionOverviewWorkspace";
import { ProductionProfitWorkspace } from "@/components/ProductionProfitWorkspace";
import { ProductionSignalPopover } from "@/components/ProductionSignalPopover";

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

const workspaceRoles: Role[] = ["owner", "manager", "front-desk", "cashier", "waiter", "kitchen", "inventory"];
const moduleOptions = ["Revenue & analytics", "Orders / bookings", "Inventory & cost", "Kitchen / service operations", "Guests & CRM", "AI insights"];
const sectionModules: Record<string, string[]> = {
  operations: ["Orders / bookings", "Kitchen / service operations"],
  inventory: ["Inventory & cost"],
  profit: ["Revenue & analytics"],
  guests: ["Guests & CRM"],
  ai: ["AI insights"],
};

function sectionIsEnabled(key: string, workspace: WorkspaceContext | null) {
  if (key === "overview" || key === "settings") return true;
  if (key === "profit" && workspace?.organizationId && !["owner", "manager", "cashier"].includes(workspace.authorizationRole)) return false;
  if (!workspace || workspace.enabledModules.length === 0) return true;
  return (sectionModules[key] || []).some((module) => workspace.enabledModules.includes(module));
}

export function DashboardApp({ section = "overview" }: { section?: string }) {
  const router = useRouter();
  const [user, setUser] = useState<DemoUser | null>(null);
  const [menu, setMenu] = useState(false);
  const [tourStep, setTourStep] = useState(-1);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
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

  useEffect(() => {
    if (loading || !workspace) return;
    const knownSection = navigation.some(([key]) => key === section);
    if (!knownSection || !sectionIsEnabled(section, workspace)) router.replace("/app");
  }, [loading, router, section, workspace]);

  if (loading || !user) return <div className="app-loading">Opening Munaffa workspace…</div>;

  async function signOut() {
    await signOutCurrentUser();
    router.push("/");
  }

  const visibleNavigation = navigation.filter(([key]) => sectionIsEnabled(key, workspace));
  const normalizedSection = visibleNavigation.some(([key]) => key === section) ? section : "overview";
  const sectionTitle = navigation.find(([key]) => key === normalizedSection)?.[1] ?? "Overview";

  return <main className="dashboard-layout">
    <aside className={`dashboard-sidebar ${menu ? "open" : ""}`}>
      <div className="brand"><span className="brand-glyph">M</span><span><b>munaffa</b><small>Hospitality Profit OS</small></span></div>
      <div className="workspace-chip"><span>{workspace?.organizationName?.slice(0, 1) || "M"}</span><div><b>{workspace?.organizationName || "Demo Hospitality"}</b><small>{workspace?.propertyName || "Sample property"}</small></div></div>
      <nav>{visibleNavigation.map(([key, label, Icon]) => <Link key={key} href={`/app/${key === "overview" ? "" : key}`} className={normalizedSection === key ? "active" : ""} onClick={() => setMenu(false)}><Icon size={17}/>{label}</Link>)}</nav>
      <button className="sidebar-signout" onClick={() => void signOut()}><LogOut size={16}/>Sign out</button>
    </aside>

    <section className="dashboard-main">
      <header className="dashboard-topbar"><button className="mobile-dashboard-menu" onClick={() => setMenu((value) => !value)} aria-label="Toggle workspace navigation">{menu ? <X/> : <Menu/>}</button><div><small>{mode === "supabase" ? "Production account" : "Guided sample workspace"}</small><h1>{sectionTitle}</h1></div><div className="top-actions"><div className="notification-wrap"><button aria-label={mode === "supabase" ? "Open live workspace signals" : "Open illustrative signal preview"} aria-expanded={notificationsOpen} onClick={() => setNotificationsOpen((open) => !open)}><Bell size={17}/><i className={`notification-dot ${mode === "demo" ? "preview" : "live"}`} /></button>{notificationsOpen && (mode === "supabase" && workspace ? <ProductionSignalPopover workspace={workspace} onClose={() => setNotificationsOpen(false)} /> : <NotificationPopover workspace={workspace} onClose={() => setNotificationsOpen(false)} />)}</div><span>{user.name.slice(0, 1).toUpperCase()}</span></div></header>
      {normalizedSection === "overview" && (mode === "supabase" && workspace ? <ProductionOverviewWorkspace workspace={workspace}/> : <Overview mode={mode} workspace={workspace} />)}
      {normalizedSection === "operations" && (mode === "supabase" && workspace ? <ProductionOperationsWorkspace workspace={workspace}/> : <OperationsWorkspace />)}
      {normalizedSection === "inventory" && (mode === "supabase" && workspace ? <ProductionInventoryWorkspace workspace={workspace}/> : <InventoryWorkspace />)}
      {normalizedSection === "profit" && (mode === "supabase" && workspace ? <ProductionProfitWorkspace workspace={workspace}/> : <ProfitWorkspace />)}
      {normalizedSection === "guests" && (mode === "supabase" && workspace ? <ProductionGuestsWorkspace workspace={workspace}/> : <GuestsWorkspace />)}
      {normalizedSection === "ai" && <AIWorkspace />}
      {normalizedSection === "settings" && <SettingsView user={user} mode={mode} workspace={workspace} onUserChange={setUser} onWorkspaceChange={setWorkspace} />}
    </section>

    {tourStep >= 0 && <Tutorial step={tourStep} onNext={() => setTourStep((current) => current >= 3 ? -1 : current + 1)} onClose={() => setTourStep(-1)} />}
  </main>;
}

function NotificationPopover({ workspace, onClose }: { workspace: WorkspaceContext | null; onClose: () => void }) {
  const items = [
    ["Inventory variance needs review", "Compare theoretical and physical count before assigning a cause."],
    ["Service queue has high-priority work", "Two sample tasks are marked high priority and not complete."],
    ["Supplier cost signal moved", "Illustrative purchase-cost movement should be checked against recent invoices."],
  ];
  const target = sectionIsEnabled("operations", workspace) ? "/app/operations" : sectionIsEnabled("inventory", workspace) ? "/app/inventory" : sectionIsEnabled("profit", workspace) ? "/app/profit" : "/app";
  return <div className="notification-popover" role="dialog" aria-label="Illustrative signal preview"><header><div><small>Illustrative preview</small><b>Example attention signals</b></div><button type="button" aria-label="Close signal preview" onClick={onClose}>×</button></header>{items.map(([title, copy], index) => <article key={title}><i className={index === 0 ? "danger-dot" : "warn-dot"}/><div><b>{title}</b><span>{copy}</span><em>Illustrative</em></div></article>)}<Link href={target} onClick={onClose}>Open workspace →</Link></div>;
}

function Overview({ mode, workspace }: { mode: "supabase" | "demo"; workspace: WorkspaceContext | null }) {
  const quickLinks = [
    { key: "operations", href: "/app/operations", icon: Building2, title: mode === "supabase" ? "Open operations" : "Operate the sample", copy: mode === "supabase" ? "Work with real tenant-scoped operational tasks." : "Advance rooms, orders and guest-service work." },
    { key: "inventory", href: "/app/inventory", icon: Boxes, title: mode === "supabase" ? "Open inventory" : "Recount inventory", copy: mode === "supabase" ? "Record physical stock counts without rewriting the audit history." : "See theoretical-vs-physical variance change." },
    { key: "profit", href: "/app/profit", icon: CircleDollarSign, title: "Model contribution", copy: "Change revenue and cost assumptions interactively." },
  ].filter((item) => sectionIsEnabled(item.key, workspace));
  const firstHref = quickLinks[0]?.href || "/app/settings";

  return <div className="dashboard-content"><div className="welcome-row"><div><span className="kicker">{mode === "supabase" ? "Connected account" : "Interactive sample"}</span><h2>See the whole business before it becomes a problem.</h2><p>{mode === "supabase" ? "Your account, workspace, operations, inventory and guest recovery can be persisted. Profit analytics and AI stay illustrative until their production data sources are connected." : "Use the enabled modules to change service status, recount inventory, model contribution, resolve guest feedback and explore sample intelligence."}</p></div><Link href={firstHref} className="pill primary">Explore workspace</Link></div><div className="metric-row">{demoMetrics.map(([label,value,change]) => <article key={label}><small>{label}</small><b>{value}</b><em>{change} · Illustrative</em></article>)}</div><div className="dashboard-grid"><article className="chart-card"><header><div><small>Revenue + contribution</small><b>Last 7 days · Illustrative</b></div><ChartNoAxesCombined size={18}/></header><div className="fake-chart">{[32,52,41,66,58,78,88,71,91,76,95,86].map((height,index)=><i key={index} style={{height:`${height}%`}} />)}</div></article><article className="attention-card"><header><PackageSearch size={18}/><div><small>Needs attention</small><b>Illustrative signals</b></div></header>{["High-volume ingredient variance", "Weekend demand above baseline", "Three service requests delayed", "Supplier cost increased"].map((signal,index)=><div key={signal}><span className={index===0?"danger-dot":"warn-dot"}/><b>{signal}</b><small>Illustrative signal</small></div>)}</article></div>{quickLinks.length > 0 && <div className="overview-next">{quickLinks.map(({ href, icon: Icon, title, copy }) => <Link key={href} href={href}><Icon size={18}/><span><b>{title}</b><small>{copy}</small></span>→</Link>)}</div>}</div>;
}

function SettingsView({ user, mode, workspace, onUserChange, onWorkspaceChange }: { user: DemoUser; mode: "supabase" | "demo"; workspace: WorkspaceContext | null; onUserChange: (user: DemoUser) => void; onWorkspaceChange: (workspace: WorkspaceContext | null) => void }) {
  const [name, setName] = useState(user.name);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [organizationName, setOrganizationName] = useState(workspace?.organizationName || "");
  const [propertyName, setPropertyName] = useState(workspace?.propertyName || "");
  const [city, setCity] = useState(workspace?.city || "");
  const [role, setRole] = useState<Role>(workspace?.role || "owner");
  const [enabledModules, setEnabledModules] = useState<string[]>(workspace?.enabledModules || []);
  const [workspaceSaving, setWorkspaceSaving] = useState(false);
  const [workspaceSaved, setWorkspaceSaved] = useState(false);
  const [workspaceError, setWorkspaceError] = useState("");

  useEffect(() => setName(user.name), [user.name]);
  useEffect(() => {
    if (!workspace) return;
    setOrganizationName(workspace.organizationName);
    setPropertyName(workspace.propertyName);
    setCity(workspace.city);
    setRole(workspace.role);
    setEnabledModules(workspace.enabledModules);
  }, [workspace]);

  async function saveProfile() {
    setProfileSaving(true);
    setProfileSaved(false);
    setProfileError("");
    try {
      const result = await updateWorkspaceProfile({ name });
      onUserChange(result.user);
      setProfileSaved(true);
      window.setTimeout(() => setProfileSaved(false), 2400);
    } catch (cause) {
      setProfileError(cause instanceof Error ? cause.message : "Could not save your profile.");
    } finally {
      setProfileSaving(false);
    }
  }

  async function saveWorkspace() {
    if (!workspace) return;
    setWorkspaceSaving(true);
    setWorkspaceSaved(false);
    setWorkspaceError("");
    try {
      await saveWorkspaceSetup({
        organizationName: organizationName.trim(),
        hospitalityType: workspace.hospitalityType,
        role,
        propertyName: propertyName.trim(),
        city: city.trim(),
        enabledModules,
      });
      const refreshed = await loadWorkspaceContext();
      onWorkspaceChange(refreshed ?? { ...workspace, organizationName: organizationName.trim(), propertyName: propertyName.trim(), city: city.trim(), role, enabledModules });
      setWorkspaceSaved(true);
      window.setTimeout(() => setWorkspaceSaved(false), 2400);
    } catch (cause) {
      setWorkspaceError(cause instanceof Error ? cause.message : "Could not save workspace settings.");
    } finally {
      setWorkspaceSaving(false);
    }
  }

  const profileUnchanged = name.trim() === user.name.trim();
  const canManageBusiness = mode === "demo" || workspace?.authorizationRole === "owner";
  const workspaceValid = organizationName.trim().length > 1 && propertyName.trim().length > 1 && city.trim().length > 1;
  const workspaceChanged = useMemo(() => {
    if (!workspace) return false;
    const sameModules = [...enabledModules].sort().join("|") === [...workspace.enabledModules].sort().join("|");
    return organizationName.trim() !== workspace.organizationName || propertyName.trim() !== workspace.propertyName || city.trim() !== workspace.city || role !== workspace.role || !sameModules;
  }, [city, enabledModules, organizationName, propertyName, role, workspace]);

  return <div className="module-page"><div className="module-heading"><Settings size={24}/><div><span className="kicker">Workspace configuration</span><h2>Settings</h2><p>{mode === "supabase" ? "Manage your account identity, operating role and authorized workspace settings." : "Try account and workspace changes safely in this browser-only sample."}</p></div></div><div className="settings-layout"><section className="settings-card"><div className="settings-card-head"><div><small>Account</small><h3>Your profile</h3></div><span>{mode === "supabase" ? "Supabase" : "Local sample"}</span></div><label>Name<input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" maxLength={80}/></label><label>Email<input value={user.email} readOnly aria-readonly="true"/></label><small>{mode === "supabase" ? "Your display name is saved to Supabase Auth and your protected profile. Email changes stay inside the authentication flow so account confirmation is not bypassed." : "Sample name changes are stored only in this browser. The sample email is intentionally read-only."}</small><button className="pill primary" disabled={profileSaving || profileUnchanged || name.trim().length < 2} onClick={() => void saveProfile()}>{profileSaving ? "Saving…" : "Save profile"}</button>{profileSaved && <div className="form-success">Profile updated.</div>}{profileError && <div className="form-error" role="alert">{profileError}</div>}</section>{workspace && <section className="settings-card"><div className="settings-card-head"><div><small>Workspace</small><h3>Business configuration</h3></div><span>{workspace.authorizationRole}</span></div><div className="settings-two"><label>Business name<input value={organizationName} disabled={!canManageBusiness} onChange={(event) => setOrganizationName(event.target.value)} maxLength={120}/></label><label>Property / outlet<input value={propertyName} disabled={!canManageBusiness} onChange={(event) => setPropertyName(event.target.value)} maxLength={120}/></label></div><label>City<input value={city} disabled={!canManageBusiness} onChange={(event) => setCity(event.target.value)} maxLength={120}/></label><label>Preferred operating role<select value={role} onChange={(event) => setRole(event.target.value as Role)}>{workspaceRoles.map((item) => <option key={item} value={item}>{item.replace("-", " ")}</option>)}</select></label><div className="settings-modules"><small>Enabled modules</small>{moduleOptions.map((item) => { const active = enabledModules.includes(item); return <button key={item} type="button" disabled={!canManageBusiness} className={active ? "active" : ""} onClick={() => setEnabledModules((current) => active ? current.filter((value) => value !== item) : [...current, item])}><span>{active ? "✓" : "+"}</span>{item}</button>; })}</div>{!canManageBusiness && <div className="settings-lock">Your authorization role is <b>{workspace.authorizationRole}</b>. You can change your preferred operating role, but only the organization owner can rename the business, property, city or enabled modules.</div>}<button className="pill primary" disabled={workspaceSaving || !workspaceChanged || !workspaceValid} onClick={() => void saveWorkspace()}>{workspaceSaving ? "Saving…" : "Save workspace"}</button>{workspaceSaved && <div className="form-success">Workspace settings updated.</div>}{workspaceError && <div className="form-error" role="alert">{workspaceError}</div>}</section>}</div></div>;
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
