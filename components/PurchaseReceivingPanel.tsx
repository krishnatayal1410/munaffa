"use client";

import { CircleAlert, PackagePlus, Plus, RefreshCw, RotateCcw, Truck } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createPurchaseReceipt,
  createSupplier,
  loadPurchaseSnapshot,
  receivePurchaseReceipt,
  voidPurchaseReceipt,
  type PurchaseSnapshot,
} from "@/lib/purchaseBackend";
import type { WorkspaceContext } from "@/lib/workspaceBackend";

type DraftLine = { inventoryItemId: string; quantity: number; unitCost: number };

export function PurchaseReceivingPanel({ workspace, onInventoryChange }: { workspace: WorkspaceContext; onInventoryChange: () => void | Promise<void> }) {
  const [snapshot, setSnapshot] = useState<PurchaseSnapshot>({ suppliers: [], inventoryItems: [], receipts: [], receiptItems: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const [supplierOpen, setSupplierOpen] = useState(false);
  const [supplierId, setSupplierId] = useState("");
  const [invoiceReference, setInvoiceReference] = useState("");
  const [purchaseNote, setPurchaseNote] = useState("");
  const [lines, setLines] = useState<DraftLine[]>([]);
  const [lineItemId, setLineItemId] = useState("");
  const [lineQuantity, setLineQuantity] = useState(1);
  const [lineUnitCost, setLineUnitCost] = useState(0);
  const [supplierName, setSupplierName] = useState("");
  const [supplierPhone, setSupplierPhone] = useState("");
  const [supplierEmail, setSupplierEmail] = useState("");

  const canWrite = ["owner", "manager", "inventory"].includes(workspace.authorizationRole);
  const canVoid = ["owner", "manager"].includes(workspace.authorizationRole);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const next = await loadPurchaseSnapshot(workspace);
      setSnapshot(next);
      if (!lineItemId && next.inventoryItems[0]) {
        setLineItemId(next.inventoryItems[0].id);
        setLineUnitCost(next.inventoryItems[0].unitCost || 0);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load supplier purchases.");
    } finally {
      setLoading(false);
    }
  }, [lineItemId, workspace]);

  useEffect(() => { void refresh(); }, [refresh]);

  const supplierById = useMemo(() => new Map(snapshot.suppliers.map((supplier) => [supplier.id, supplier])), [snapshot.suppliers]);
  const inventoryById = useMemo(() => new Map(snapshot.inventoryItems.map((item) => [item.id, item])), [snapshot.inventoryItems]);
  const draftTotal = useMemo(() => lines.reduce((sum, line) => sum + line.quantity * line.unitCost, 0), [lines]);

  function selectLineItem(id: string) {
    setLineItemId(id);
    const item = inventoryById.get(id);
    setLineUnitCost(item?.unitCost || 0);
  }

  function addLine() {
    if (!lineItemId || lineQuantity <= 0 || lineUnitCost < 0) return;
    setLines((current) => {
      const existing = current.find((line) => line.inventoryItemId === lineItemId);
      if (existing) return current.map((line) => line.inventoryItemId === lineItemId ? { inventoryItemId: lineItemId, quantity: lineQuantity, unitCost: lineUnitCost } : line);
      return [...current, { inventoryItemId: lineItemId, quantity: lineQuantity, unitCost: lineUnitCost }];
    });
  }

  async function addSupplier() {
    if (!supplierName.trim()) return;
    setSaving(true);
    setError("");
    try {
      const id = await createSupplier(workspace, { name: supplierName, phone: supplierPhone, email: supplierEmail });
      setSupplierName(""); setSupplierPhone(""); setSupplierEmail(""); setSupplierOpen(false);
      await refresh();
      setSupplierId(id);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not create supplier.");
    } finally {
      setSaving(false);
    }
  }

  async function savePurchase() {
    if (lines.length === 0) return;
    setSaving(true);
    setError("");
    try {
      await createPurchaseReceipt(workspace, {
        supplierId: supplierId || null,
        invoiceReference,
        note: purchaseNote,
        items: lines,
      });
      setLines([]); setInvoiceReference(""); setPurchaseNote(""); setPurchaseOpen(false);
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not create purchase draft.");
    } finally {
      setSaving(false);
    }
  }

  async function receive(receiptId: string) {
    if (typeof window !== "undefined" && !window.confirm("Receive this purchase? Expected inventory will increase and a linked expense will be recorded.")) return;
    setSaving(true);
    setError("");
    try {
      await receivePurchaseReceipt(workspace, receiptId);
      await refresh();
      await onInventoryChange();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not receive this purchase.");
    } finally {
      setSaving(false);
    }
  }

  async function voidReceipt(receiptId: string) {
    if (!canVoid) return;
    if (typeof window !== "undefined" && !window.confirm("Void this purchase? If it was received, Munaffa will append reversing stock movements and void the linked expense.")) return;
    setSaving(true);
    setError("");
    try {
      await voidPurchaseReceipt(workspace, receiptId);
      await refresh();
      await onInventoryChange();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not void this purchase.");
    } finally {
      setSaving(false);
    }
  }

  return <section className="purchase-section">
    <div className="purchase-head"><div><span className="kicker">Purchasing</span><h3>Receive supplier stock once. Update inventory and expense together.</h3><p>Drafts have no stock or financial effect. Receiving writes positive purchase movements and one linked expense. Voiding a received purchase reverses both through audit events.</p></div><div><button onClick={() => void refresh()} disabled={loading}><RefreshCw size={14}/>Refresh</button>{canWrite && <button className="primary-action" onClick={() => setPurchaseOpen((open) => !open)}><PackagePlus size={14}/>New purchase</button>}</div></div>

    {error && <div className="form-error production-error" role="alert">{error}</div>}

    {supplierOpen && canWrite && <div className="purchase-inline-form"><input value={supplierName} maxLength={160} onChange={(event) => setSupplierName(event.target.value)} placeholder="Supplier name"/><input value={supplierPhone} maxLength={40} onChange={(event) => setSupplierPhone(event.target.value)} placeholder="Phone (optional)"/><input type="email" value={supplierEmail} maxLength={320} onChange={(event) => setSupplierEmail(event.target.value)} placeholder="Email (optional)"/><button disabled={saving || !supplierName.trim()} onClick={() => void addSupplier()}><Plus size={13}/>Save supplier</button></div>}

    {purchaseOpen && canWrite && <div className="purchase-form"><div className="settings-two"><label>Supplier<select value={supplierId} onChange={(event) => setSupplierId(event.target.value)}><option value="">No supplier selected</option>{snapshot.suppliers.filter((supplier) => supplier.active).map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}</select></label><label>Invoice / purchase reference<input value={invoiceReference} maxLength={200} onChange={(event) => setInvoiceReference(event.target.value)} placeholder="INV-2026-001"/></label></div><button className="supplier-add-link" onClick={() => setSupplierOpen((open) => !open)}><Truck size={13}/>{supplierOpen ? "Close supplier form" : "Add supplier"}</button><div className="purchase-line-builder"><label>Ingredient<select value={lineItemId} onChange={(event) => selectLineItem(event.target.value)}>{snapshot.inventoryItems.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.unit}</option>)}</select></label><label>Quantity<input type="number" min="0.001" step="0.001" value={lineQuantity} onChange={(event) => setLineQuantity(Math.max(.001, Number(event.target.value)))}/></label><label>Unit cost (INR)<input type="number" min="0" step="0.01" value={lineUnitCost} onChange={(event) => setLineUnitCost(Math.max(0, Number(event.target.value)))}/></label><button disabled={!lineItemId} onClick={addLine}><Plus size={13}/>Add line</button></div>{lines.length > 0 && <div className="purchase-draft-lines">{lines.map((line) => { const item = inventoryById.get(line.inventoryItemId); return <div key={line.inventoryItemId}><span><b>{item?.name || "Ingredient"}</b><small>{line.quantity}{item?.unit || "unit"} × {money(line.unitCost)}</small></span><strong>{money(line.quantity * line.unitCost)}</strong><button onClick={() => setLines((current) => current.filter((itemLine) => itemLine.inventoryItemId !== line.inventoryItemId))}>Remove</button></div>; })}<footer><span>Draft total</span><b>{money(draftTotal)}</b></footer></div>}<label>Purchase note<textarea value={purchaseNote} maxLength={1000} onChange={(event) => setPurchaseNote(event.target.value)} placeholder="Optional receiving context"/></label><div className="production-form-actions"><button onClick={() => setPurchaseOpen(false)}>Cancel</button><button className="primary-action" disabled={saving || lines.length === 0 || draftTotal <= 0} onClick={() => void savePurchase()}>{saving ? "Saving…" : "Save draft purchase"}</button></div></div>}

    {loading ? <div className="billing-empty">Loading supplier purchases…</div> : snapshot.receipts.length === 0 ? <div className="purchase-empty"><Truck size={22}/><b>No supplier purchases yet</b><span>Draft a real ingredient purchase when stock arrives from a supplier.</span></div> : <div className="purchase-list">{snapshot.receipts.map((receipt) => { const items = snapshot.receiptItems.filter((item) => item.receiptId === receipt.id); const calculatedTotal = items.reduce((sum, item) => sum + item.lineTotal, 0); return <article key={receipt.id} className={receipt.status === "voided" ? "voided" : ""}><div className="purchase-main"><div><small>{supplierById.get(receipt.supplierId || "")?.name || "Supplier not recorded"} · {receipt.status}</small><b>{receipt.invoiceReference || `Purchase ${receipt.id.slice(0,8).toUpperCase()}`}</b><span>{items.length} ingredient line{items.length === 1 ? "" : "s"} · {money(receipt.status === "draft" ? calculatedTotal : receipt.totalAmount)}</span></div><div>{receipt.status === "draft" && canWrite && <button className="primary-action" disabled={saving} onClick={() => void receive(receipt.id)}>Receive</button>}{receipt.status !== "voided" && canVoid && <button disabled={saving} onClick={() => void voidReceipt(receipt.id)}><RotateCcw size={12}/>Void</button>}</div></div><div className="purchase-items">{items.map((line) => { const item = inventoryById.get(line.inventoryItemId); return <span key={line.id}>{item?.name || "Ingredient"} · {line.quantity}{item?.unit || "unit"} · {money(line.lineTotal)}</span>; })}</div></article>; })}</div>}

    <div className="privacy-hint purchase-hint"><CircleAlert size={14}/><span>Receiving a draft is the irreversible operational checkpoint. Later management corrections are represented by reversal movements and voided financial entries—not by deleting stock or expense history.</span></div>
  </section>;
}

function money(value: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(value || 0);
}
