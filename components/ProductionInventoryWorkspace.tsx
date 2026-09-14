"use client";

import { Boxes, CircleAlert, Plus, RefreshCw, Scale } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  addProductionInventoryCount,
  createProductionInventoryItem,
  listProductionInventory,
  type ProductionInventoryRecord,
} from "@/lib/productionInventoryBackend";
import type { WorkspaceContext } from "@/lib/workspaceBackend";

export function ProductionInventoryWorkspace({ workspace }: { workspace: WorkspaceContext }) {
  const [items, setItems] = useState<ProductionInventoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [itemFormOpen, setItemFormOpen] = useState(false);
  const [countTarget, setCountTarget] = useState<ProductionInventoryRecord | null>(null);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("kg");
  const [theoretical, setTheoretical] = useState(0);
  const [reorder, setReorder] = useState(0);
  const [unitCost, setUnitCost] = useState("");
  const [countQuantity, setCountQuantity] = useState(0);
  const [countNote, setCountNote] = useState("");
  const canWrite = ["owner", "manager", "inventory"].includes(workspace.authorizationRole);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setItems(await listProductionInventory(workspace));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load inventory.");
    } finally {
      setLoading(false);
    }
  }, [workspace]);

  useEffect(() => { void refresh(); }, [refresh]);

  const summary = useMemo(() => {
    const counted = items.filter((item) => item.physicalQuantity !== null);
    return {
      items: items.length,
      counted: counted.length,
      below: counted.filter((item) => Number(item.physicalQuantity) <= item.reorderQuantity).length,
      variance: counted.reduce((total, item) => total + Math.abs(Number(item.physicalQuantity) - item.theoreticalQuantity), 0),
    };
  }, [items]);

  async function createItem() {
    setSaving(true);
    setError("");
    try {
      await createProductionInventoryItem(workspace, {
        name,
        unit,
        theoreticalQuantity: theoretical,
        reorderQuantity: reorder,
        unitCost: unitCost.trim() ? Number(unitCost) : null,
      });
      setName("");
      setUnit("kg");
      setTheoretical(0);
      setReorder(0);
      setUnitCost("");
      setItemFormOpen(false);
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not create inventory item.");
    } finally {
      setSaving(false);
    }
  }

  function openCount(item: ProductionInventoryRecord) {
    setCountTarget(item);
    setCountQuantity(item.physicalQuantity ?? item.theoreticalQuantity);
    setCountNote("");
  }

  async function saveCount() {
    if (!countTarget) return;
    setSaving(true);
    setError("");
    try {
      await addProductionInventoryCount(workspace, countTarget.id, countQuantity, countNote);
      setCountTarget(null);
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not record inventory count.");
    } finally {
      setSaving(false);
    }
  }

  return <div className="module-page interactive-workspace production-inventory">
    <div className="module-heading"><Boxes size={24}/><div><span className="kicker">Production inventory</span><h2>Physical counts versus theoretical stock</h2><p>Real count events remain separate from theoretical usage so variance can be investigated without assigning a cause prematurely.</p></div></div>
    <div className="workspace-kpis"><Kpi label="Active items" value={String(summary.items)}/><Kpi label="Counted items" value={String(summary.counted)}/><Kpi label="Below reorder" value={String(summary.below)} warning={summary.below > 0}/><Kpi label="Absolute variance" value={summary.variance.toFixed(1)}/></div>
    <div className="production-toolbar"><div><b>{workspace.propertyName}</b><span>{workspace.city} · production inventory records</span></div><div><button type="button" onClick={() => void refresh()} disabled={loading}><RefreshCw size={14}/> Refresh</button>{canWrite && <button type="button" className="primary-action" onClick={() => setItemFormOpen((open) => !open)}><Plus size={14}/> New item</button>}</div></div>
    {!canWrite && <div className="settings-lock">Your authorization role is <b>{workspace.authorizationRole}</b>. Inventory records are read-only for this role; owners, managers and inventory staff can create items and record counts.</div>}
    {itemFormOpen && canWrite && <section className="production-task-form"><div className="settings-two"><label>Item name<input value={name} maxLength={160} onChange={(event) => setName(event.target.value)} placeholder="Paneer"/></label><label>Unit<input value={unit} maxLength={24} onChange={(event) => setUnit(event.target.value)} placeholder="kg"/></label></div><div className="inventory-create-grid"><label>Theoretical quantity<input type="number" min="0" step="0.001" value={theoretical} onChange={(event) => setTheoretical(Math.max(0, Number(event.target.value)))}/></label><label>Reorder quantity<input type="number" min="0" step="0.001" value={reorder} onChange={(event) => setReorder(Math.max(0, Number(event.target.value)))}/></label><label>Unit cost (optional)<input type="number" min="0" step="0.01" value={unitCost} onChange={(event) => setUnitCost(event.target.value)}/></label></div><div className="production-form-actions"><button type="button" onClick={() => setItemFormOpen(false)}>Cancel</button><button type="button" className="primary-action" disabled={saving || !name.trim() || !unit.trim()} onClick={() => void createItem()}>{saving ? "Creating…" : "Create item"}</button></div></section>}
    {countTarget && canWrite && <section className="production-task-form count-form"><header><div><small>New physical count</small><h3>{countTarget.name}</h3></div><span>Theoretical: {countTarget.theoreticalQuantity}{countTarget.unit}</span></header><div className="settings-two"><label>Physical quantity<input type="number" min="0" step="0.001" value={countQuantity} onChange={(event) => setCountQuantity(Math.max(0, Number(event.target.value)))}/></label><label>Count note<input value={countNote} maxLength={500} onChange={(event) => setCountNote(event.target.value)} placeholder="Optional count context"/></label></div><div className="production-form-actions"><button type="button" onClick={() => setCountTarget(null)}>Cancel</button><button type="button" className="primary-action" disabled={saving} onClick={() => void saveCount()}>{saving ? "Recording…" : "Record count"}</button></div></section>}
    {error && <div className="form-error production-error" role="alert">{error}</div>}
    {loading ? <div className="production-empty">Loading inventory records…</div> : items.length === 0 ? <div className="production-empty"><Scale size={24}/><b>No inventory items yet</b><span>Add the first real inventory item for this property. Munaffa does not seed production stock with fictional values.</span>{canWrite && <button className="primary-action" onClick={() => setItemFormOpen(true)}><Plus size={14}/> Add inventory item</button>}</div> : <div className="inventory-table"><div className="inventory-row production-inventory-head"><span>Ingredient</span><span>Theoretical</span><span>Latest physical</span><span>Variance</span><span>Action</span></div>{items.map((item) => { const variance = item.physicalQuantity === null ? null : Number((item.physicalQuantity - item.theoreticalQuantity).toFixed(3)); return <div className="inventory-row" key={item.id}><span><b>{item.name}</b><small>Reorder at {item.reorderQuantity}{item.unit}{item.countedAt ? ` · counted ${formatRelative(item.countedAt)}` : " · never counted"}</small></span><span>{item.theoreticalQuantity}{item.unit}</span><span>{item.physicalQuantity === null ? "Not counted" : `${item.physicalQuantity}${item.unit}`}</span><span className={variance === null ? "variance-neutral" : Math.abs(variance) >= 1 ? "variance-alert" : "variance-ok"}>{variance === null ? "—" : `${variance > 0 ? "+" : ""}${variance}${item.unit}`}</span><span>{canWrite ? <button className="inventory-count-action" onClick={() => openCount(item)}>Count</button> : <small>Read only</small>}</span></div>; })}</div>}
    <div className="demo-notice production-notice"><CircleAlert size={15}/><span>Variance is a review signal, not evidence of theft or waste. Physical count history is append-only; corrections create a new count event instead of rewriting the audit trail.</span></div>
  </div>;
}

function Kpi({ label, value, warning }: { label: string; value: string; warning?: boolean }) {
  return <article className={warning ? "workspace-kpi warning" : "workspace-kpi"}><small>{label}</small><b>{value}</b></article>;
}

function formatRelative(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "recently";
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(date);
}
