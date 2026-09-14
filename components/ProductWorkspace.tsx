"use client";

import { useMemo, useState } from "react";
import { Bot, CheckCircle2, CircleAlert, ClipboardCheck, Clock3, IndianRupee, PackageCheck, RefreshCw, Send, Sparkles, Star, Users } from "lucide-react";

type WorkStatus = "Queued" | "In progress" | "Complete";

type WorkItem = {
  id: string;
  area: string;
  title: string;
  detail: string;
  status: WorkStatus;
  priority: "Normal" | "High";
};

const initialWork: WorkItem[] = [
  { id: "OP-204", area: "Hotel · Room 204", title: "Housekeeping turnover", detail: "Departure completed · room not released yet", status: "Queued", priority: "High" },
  { id: "OP-128", area: "Restaurant · Table 12", title: "Dinner order", detail: "3 items · kitchen acknowledged", status: "In progress", priority: "Normal" },
  { id: "OP-131", area: "Café · Counter", title: "Pickup order", detail: "2 beverages · 5 min target", status: "Queued", priority: "Normal" },
  { id: "OP-046", area: "Guest service", title: "AC temperature request", detail: "Assigned to engineering", status: "In progress", priority: "High" },
];

export function OperationsWorkspace() {
  const [items, setItems] = useState(initialWork);
  const counts = useMemo(() => ({
    queued: items.filter((item) => item.status === "Queued").length,
    active: items.filter((item) => item.status === "In progress").length,
    complete: items.filter((item) => item.status === "Complete").length,
  }), [items]);

  function advance(id: string) {
    setItems((current) => current.map((item) => item.id !== id ? item : {
      ...item,
      status: item.status === "Queued" ? "In progress" : item.status === "In progress" ? "Complete" : "Queued",
    }));
  }

  return <WorkspaceShell eyebrow="Interactive sample" title="Operations command queue" description="Move sample work through the same kind of operational queue Munaffa is designed to unify across rooms, tables, kitchen and guest service.">
    <div className="workspace-kpis"><Kpi label="Queued" value={String(counts.queued)} /><Kpi label="In progress" value={String(counts.active)} /><Kpi label="Completed" value={String(counts.complete)} /><Kpi label="SLA risk" value={String(items.filter((item) => item.priority === "High" && item.status !== "Complete").length)} tone="warning" /></div>
    <div className="work-list">{items.map((item) => <article key={item.id} className={`work-item status-${item.status.toLowerCase().replace(" ", "-")}`}><div className="work-icon">{item.status === "Complete" ? <CheckCircle2 size={18}/> : item.priority === "High" ? <CircleAlert size={18}/> : <Clock3 size={18}/>}</div><div className="work-copy"><small>{item.area} · {item.id}</small><b>{item.title}</b><span>{item.detail}</span></div><div className="work-status"><em>{item.status}</em><button onClick={() => advance(item.id)}>{item.status === "Complete" ? "Reopen" : item.status === "Queued" ? "Start" : "Complete"}</button></div></article>)}</div>
    <DemoNotice />
  </WorkspaceShell>;
}

type StockItem = { name: string; unit: string; theoretical: number; physical: number; reorder: number };
const initialStock: StockItem[] = [
  { name: "Paneer", unit: "kg", theoretical: 14.1, physical: 12.4, reorder: 8 },
  { name: "Coffee beans", unit: "kg", theoretical: 7.6, physical: 7.8, reorder: 4 },
  { name: "Cooking oil", unit: "L", theoretical: 18.2, physical: 16.9, reorder: 10 },
  { name: "Fresh cream", unit: "L", theoretical: 6.4, physical: 4.7, reorder: 5 },
];

export function InventoryWorkspace() {
  const [stock, setStock] = useState(initialStock);
  const [lastCount, setLastCount] = useState("Sample opening count");

  function adjust(index: number, change: number) {
    setStock((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, physical: Math.max(0, Number((item.physical + change).toFixed(1))) } : item));
    setLastCount("Edited just now");
  }

  const totalVariance = stock.reduce((total, item) => total + Math.abs(item.physical - item.theoretical), 0);

  return <WorkspaceShell eyebrow="Inventory intelligence" title="Count what exists. Compare what should exist." description="Munaffa keeps theoretical recipe consumption separate from physical stock so variance can be investigated without pretending every gram is measured perfectly.">
    <div className="workspace-kpis"><Kpi label="Items counted" value={String(stock.length)} /><Kpi label="Absolute variance" value={totalVariance.toFixed(1)} /><Kpi label="Below reorder" value={String(stock.filter((item) => item.physical <= item.reorder).length)} tone="warning" /><Kpi label="Last count" value={lastCount} compact /></div>
    <div className="inventory-table"><div className="inventory-row inventory-head"><span>Ingredient</span><span>Theoretical</span><span>Physical</span><span>Variance</span><span>Recount</span></div>{stock.map((item, index) => { const variance = Number((item.physical - item.theoretical).toFixed(1)); return <div className="inventory-row" key={item.name}><span><b>{item.name}</b><small>Reorder at {item.reorder}{item.unit}</small></span><span>{item.theoretical}{item.unit}</span><span>{item.physical}{item.unit}</span><span className={Math.abs(variance) >= 1 ? "variance-alert" : "variance-ok"}>{variance > 0 ? "+" : ""}{variance}{item.unit}</span><span className="count-controls"><button onClick={() => adjust(index, -0.1)}>−</button><button onClick={() => adjust(index, 0.1)}>+</button></span></div>; })}</div>
    <DemoNotice text="Variance is a signal to investigate. It is not proof of theft, waste or any single cause." />
  </WorkspaceShell>;
}

export function ProfitWorkspace() {
  const [revenue, setRevenue] = useState(850000);
  const [directCost, setDirectCost] = useState(31);
  const [labor, setLabor] = useState(18);
  const [overhead, setOverhead] = useState(22);
  const [variance, setVariance] = useState(2.5);
  const direct = revenue * directCost / 100;
  const laborCost = revenue * labor / 100;
  const overheadCost = revenue * overhead / 100;
  const possibleVariance = revenue * variance / 100;
  const operatingContribution = revenue - direct - laborCost - overheadCost;

  return <WorkspaceShell eyebrow="Illustrative profit model" title="See what happens after revenue." description="Change the sample assumptions and watch operating contribution and potential variance move. This is a planning model, not an audited P&L.">
    <div className="profit-layout"><section className="profit-controls"><Slider label="Monthly revenue" value={revenue} min={200000} max={3000000} step={50000} format={(value) => `₹${Math.round(value / 1000)}k`} onChange={setRevenue}/><Slider label="Direct / food cost" value={directCost} min={10} max={60} step={1} format={(value) => `${value}%`} onChange={setDirectCost}/><Slider label="Labor" value={labor} min={5} max={40} step={1} format={(value) => `${value}%`} onChange={setLabor}/><Slider label="Other operating overhead" value={overhead} min={5} max={45} step={1} format={(value) => `${value}%`} onChange={setOverhead}/><Slider label="Potential variance to investigate" value={variance} min={0} max={10} step={0.5} format={(value) => `${value}%`} onChange={setVariance}/></section><section className="profit-output"><div className="profit-hero"><small>Operating contribution</small><b>{money(operatingContribution)}</b><span>{((operatingContribution / revenue) * 100).toFixed(1)}% of revenue · illustrative</span></div><div className="profit-breakdown"><ResultLine label="Revenue" value={money(revenue)}/><ResultLine label="Direct cost" value={`− ${money(direct)}`}/><ResultLine label="Labor" value={`− ${money(laborCost)}`}/><ResultLine label="Other overhead" value={`− ${money(overheadCost)}`}/><ResultLine label="Potential variance signal" value={money(possibleVariance)} warning/></div></section></div>
    <DemoNotice text="This calculator demonstrates the product interaction only. It is not financial advice and does not estimate your real profit without verified business data." />
  </WorkspaceShell>;
}

type GuestItem = { id: number; guest: string; source: string; note: string; rating: number; resolved: boolean };
const initialGuests: GuestItem[] = [
  { id: 1, guest: "Guest A", source: "Hotel stay", note: "Check-in was smooth; room-service response felt slow.", rating: 4, resolved: false },
  { id: 2, guest: "Guest B", source: "Restaurant", note: "Loved the food and staff recommendation.", rating: 5, resolved: true },
  { id: 3, guest: "Guest C", source: "Café", note: "Pickup order was delayed beyond the promised time.", rating: 3, resolved: false },
];

export function GuestsWorkspace() {
  const [guests, setGuests] = useState(initialGuests);
  function resolve(id: number) { setGuests((current) => current.map((guest) => guest.id === id ? { ...guest, resolved: !guest.resolved } : guest)); }
  const open = guests.filter((guest) => !guest.resolved).length;
  const average = guests.reduce((sum, guest) => sum + guest.rating, 0) / guests.length;

  return <WorkspaceShell eyebrow="Guest intelligence" title="Turn feedback into service recovery." description="A sample feedback queue shows how guest sentiment can become an assigned action rather than a review that gets forgotten.">
    <div className="workspace-kpis"><Kpi label="Sample guests" value={String(guests.length)} /><Kpi label="Open recovery" value={String(open)} tone={open ? "warning" : undefined}/><Kpi label="Average rating" value={average.toFixed(1)} /><Kpi label="Resolved" value={String(guests.length - open)} /></div>
    <div className="guest-list">{guests.map((guest) => <article key={guest.id}><div className="guest-avatar"><Users size={17}/></div><div><small>{guest.source}</small><b>{guest.guest}</b><span>{guest.note}</span><em><Star size={12}/>{guest.rating}/5</em></div><button className={guest.resolved ? "resolved" : ""} onClick={() => resolve(guest.id)}>{guest.resolved ? "Resolved ✓" : "Resolve"}</button></article>)}</div>
    <DemoNotice />
  </WorkspaceShell>;
}

const aiPrompts = ["Why is food cost moving?", "What should I check today?", "Summarize the sample property"];

export function AIWorkspace() {
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState("Choose a sample question or ask about the illustrative workspace. This demo does not call an external AI model.");
  const [thinking, setThinking] = useState(false);

  function ask(input = query) {
    const normalized = input.trim().toLowerCase();
    if (!normalized) return;
    setQuery(input);
    setThinking(true);
    window.setTimeout(() => {
      if (normalized.includes("food") || normalized.includes("cost")) setAnswer("In the illustrative workspace, direct cost is sensitive to purchase-price movement, recipe assumptions and stock variance. I would first compare supplier price changes with theoretical-vs-physical usage before assuming a cause.");
      else if (normalized.includes("today") || normalized.includes("check")) setAnswer("Three sample checks stand out: review high-priority service items, recount ingredients below their reorder threshold, and investigate large theoretical-vs-physical inventory variance. These are demo signals, not live business alerts.");
      else setAnswer("The sample property combines hotel, restaurant and café operations in one workspace. The demo shows service queues, inventory variance, contribution modelling and guest recovery; none of the displayed values are real customer results.");
      setThinking(false);
    }, 420);
  }

  return <WorkspaceShell eyebrow="Munaffa AI · demo" title="Ask the operating system, not another generic chatbot." description="This local demonstration shows how Munaffa should answer from business context while being explicit about uncertainty and evidence.">
    <div className="ai-console"><div className="ai-orb"><Sparkles size={20}/></div><div className="ai-response"><small>Munaffa AI</small><p>{thinking ? "Reading the sample workspace…" : answer}</p></div><div className="ai-suggestions">{aiPrompts.map((prompt) => <button key={prompt} onClick={() => ask(prompt)}>{prompt}</button>)}</div><form onSubmit={(event) => { event.preventDefault(); ask(); }}><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ask about operations, cost, inventory or guests…"/><button type="submit" disabled={thinking || !query.trim()}><Send size={16}/></button></form></div>
    <DemoNotice text="The current AI console is deterministic sample logic. A production model should only be connected after permissions, retrieval boundaries and verified data sources are in place." />
  </WorkspaceShell>;
}

function WorkspaceShell({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children: React.ReactNode }) {
  return <div className="module-page interactive-workspace"><div className="module-heading"><ClipboardCheck size={24}/><div><span className="kicker">{eyebrow}</span><h2>{title}</h2><p>{description}</p></div></div>{children}</div>;
}
function Kpi({ label, value, tone, compact }: { label: string; value: string; tone?: "warning"; compact?: boolean }) { return <article className={tone === "warning" ? "workspace-kpi warning" : "workspace-kpi"}><small>{label}</small><b className={compact ? "compact" : ""}>{value}</b></article>; }
function DemoNotice({ text = "All records on this screen are sample data and can be safely changed while exploring the product." }: { text?: string }) { return <div className="demo-notice"><CircleAlert size={15}/><span>{text}</span></div>; }
function Slider({ label, value, min, max, step, format, onChange }: { label: string; value: number; min: number; max: number; step: number; format: (value: number) => string; onChange: (value: number) => void }) { return <label className="profit-slider"><span><b>{label}</b><em>{format(value)}</em></span><input type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))}/></label>; }
function ResultLine({ label, value, warning }: { label: string; value: string; warning?: boolean }) { return <div className={warning ? "result-line warning" : "result-line"}><span>{warning ? <CircleAlert size={14}/> : <IndianRupee size={14}/>} {label}</span><b>{value}</b></div>; }
function money(value: number) { return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value); }
