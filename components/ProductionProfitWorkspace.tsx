"use client";

import { CircleAlert, CircleDollarSign, Plus, RefreshCw, RotateCcw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createProductionFinancialEntry,
  listProductionFinancialEntries,
  voidProductionFinancialEntry,
  type FinancialDirection,
  type FinancialSource,
  type ProductionFinancialEntry,
} from "@/lib/productionFinanceBackend";
import type { WorkspaceContext } from "@/lib/workspaceBackend";

const financeRoles = new Set(["owner", "manager", "cashier"]);
const managementRoles = new Set(["owner", "manager"]);

function monthStartIso() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
}

function money(value: number, currency = "INR") {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 0 }).format(value);
}

export function ProductionProfitWorkspace({ workspace }: { workspace: WorkspaceContext }) {
  const [entries, setEntries] = useState<ProductionFinancialEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [direction, setDirection] = useState<FinancialDirection>("revenue");
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [source, setSource] = useState<FinancialSource>("manual");
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [voidingId, setVoidingId] = useState<string | null>(null);
  const canWrite = financeRoles.has(workspace.authorizationRole);
  const canVoid = managementRoles.has(workspace.authorizationRole);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setEntries(await listProductionFinancialEntries(workspace, { since: monthStartIso(), limit: 300 }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load financial entries.");
    } finally {
      setLoading(false);
    }
  }, [workspace]);

  useEffect(() => { void refresh(); }, [refresh]);

  const activeEntries = useMemo(() => entries.filter((entry) => entry.status === "active"), [entries]);
  const summary = useMemo(() => {
    const revenue = activeEntries.filter((entry) => entry.direction === "revenue").reduce((sum, entry) => sum + entry.amount, 0);
    const expense = activeEntries.filter((entry) => entry.direction === "expense").reduce((sum, entry) => sum + entry.amount, 0);
    const contribution = revenue - expense;
    return {
      revenue,
      expense,
      contribution,
      margin: revenue > 0 ? contribution / revenue * 100 : null,
    };
  }, [activeEntries]);

  async function addEntry() {
    const numericAmount = Number(amount);
    if (!category.trim() || !Number.isFinite(numericAmount) || numericAmount <= 0) return;
    setSaving(true);
    setError("");
    try {
      const created = await createProductionFinancialEntry(workspace, {
        direction,
        category,
        amount: numericAmount,
        source,
        externalReference: reference,
        note,
      });
      setEntries((current) => [created, ...current]);
      setCategory("");
      setAmount("");
      setReference("");
      setNote("");
      setFormOpen(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not record this financial entry.");
    } finally {
      setSaving(false);
    }
  }

  async function voidEntry(entry: ProductionFinancialEntry) {
    if (!canVoid || entry.status === "voided") return;
    setVoidingId(entry.id);
    setError("");
    try {
      const updated = await voidProductionFinancialEntry(workspace, entry.id);
      setEntries((current) => current.map((item) => item.id === updated.id ? updated : item));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not void this financial entry.");
    } finally {
      setVoidingId(null);
    }
  }

  return <div className="module-page interactive-workspace production-profit">
    <div className="module-heading"><CircleDollarSign size={24}/><div><span className="kicker">Recorded financials</span><h2>Contribution from entries you actually recorded.</h2><p>This view totals active revenue and expense entries for the current month. It is an operational ledger view, not an audited profit-and-loss statement.</p></div></div>

    <div className="workspace-kpis production-profit-kpis"><Kpi label="Recorded revenue" value={loading ? "—" : money(summary.revenue)}/><Kpi label="Recorded expenses" value={loading ? "—" : money(summary.expense)}/><Kpi label="Recorded contribution" value={loading ? "—" : money(summary.contribution)} warning={summary.contribution < 0}/><Kpi label="Contribution rate" value={loading ? "—" : summary.margin === null ? "N/A" : `${summary.margin.toFixed(1)}%`}/></div>

    <div className="production-toolbar"><div><b>{workspace.propertyName}</b><span>Current month · append-only financial events</span></div><div><button type="button" onClick={() => void refresh()} disabled={loading}><RefreshCw size={14}/> Refresh</button>{canWrite && <button type="button" className="primary-action" onClick={() => setFormOpen((open) => !open)}><Plus size={14}/> Record entry</button>}</div></div>

    {formOpen && canWrite && <section className="production-task-form production-finance-form"><div className="inventory-create-grid"><label>Direction<select value={direction} onChange={(event) => setDirection(event.target.value as FinancialDirection)}><option value="revenue">Revenue</option><option value="expense">Expense</option></select></label><label>Category<input value={category} maxLength={80} onChange={(event) => setCategory(event.target.value)} placeholder={direction === "revenue" ? "Room revenue" : "Utilities"}/></label><label>Amount (INR)<input inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0.00"/></label></div><div className="settings-two"><label>Source<select value={source} onChange={(event) => setSource(event.target.value as FinancialSource)}><option value="manual">Manual</option><option value="pos">POS</option><option value="pms">PMS</option><option value="payment">Payment</option><option value="accounting">Accounting</option><option value="delivery">Delivery</option><option value="other">Other</option></select></label><label>External reference<input value={reference} maxLength={200} onChange={(event) => setReference(event.target.value)} placeholder="Invoice / settlement / order reference"/></label></div><label>Note<textarea value={note} maxLength={1000} onChange={(event) => setNote(event.target.value)} placeholder="Optional context"/></label><div className="production-form-actions"><button type="button" onClick={() => setFormOpen(false)}>Cancel</button><button type="button" className="primary-action" disabled={saving || !category.trim() || !Number.isFinite(Number(amount)) || Number(amount) <= 0} onClick={() => void addEntry()}>{saving ? "Recording…" : "Record entry"}</button></div></section>}

    {error && <div className="form-error production-error" role="alert">{error}</div>}
    {!canWrite && <div className="settings-lock">Your authorization role is <b>{workspace.authorizationRole}</b>. Financial records are restricted to owners, managers and cashiers.</div>}

    {loading ? <div className="production-empty">Loading current-month financial entries…</div> : entries.length === 0 ? <div className="production-empty"><CircleDollarSign size={24}/><b>No financial entries this month</b><span>Munaffa will not invent revenue or expenses. Record a real entry or connect an authoritative POS/PMS/payment/accounting source later.</span>{canWrite && <button className="primary-action" onClick={() => setFormOpen(true)}><Plus size={14}/> Record first entry</button>}</div> : <div className="financial-ledger"><div className="financial-ledger-row financial-ledger-head"><span>Date</span><span>Type</span><span>Category</span><span>Source</span><span>Amount</span><span>Status</span></div>{entries.map((entry) => <div className={`financial-ledger-row ${entry.status === "voided" ? "voided" : ""}`} key={entry.id}><span>{new Date(entry.occurredAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</span><span className={entry.direction === "revenue" ? "finance-revenue" : "finance-expense"}>{entry.direction}</span><span><b>{entry.category}</b><small>{entry.externalReference || entry.note || "No reference"}</small></span><span>{entry.source}</span><span className={entry.direction === "revenue" ? "finance-revenue" : "finance-expense"}>{entry.direction === "revenue" ? "+" : "−"}{money(entry.amount, entry.currency)}</span><span>{entry.status === "voided" ? <em>Voided</em> : canVoid ? <button type="button" disabled={voidingId === entry.id} onClick={() => void voidEntry(entry)}><RotateCcw size={12}/>{voidingId === entry.id ? "Voiding…" : "Void"}</button> : <em>Active</em>}</span></div>)}</div>}

    <div className="demo-notice production-notice"><CircleAlert size={15}/><span>Recorded contribution equals active recorded revenue minus active recorded expenses for this period. It does not include unrecorded liabilities, taxes, depreciation, financing, accruals or other accounting adjustments unless those are entered or integrated.</span></div>
  </div>;
}

function Kpi({ label, value, warning }: { label: string; value: string; warning?: boolean }) {
  return <article className={warning ? "workspace-kpi warning" : "workspace-kpi"}><small>{label}</small><b>{value}</b></article>;
}
