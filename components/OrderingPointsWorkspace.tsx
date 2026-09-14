"use client";

import { Check, Copy, Plus, QrCode, RefreshCw, RotateCw, ShieldCheck } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useCallback, useEffect, useState } from "react";
import {
  createOrderingPoint,
  listOrderingPoints,
  rotateOrderingPoint,
  setOrderingPointActive,
  type CreatedOrderingPoint,
  type OrderingPointRecord,
  type OrderingPointServiceType,
} from "@/lib/guestOrderingBackend";
import type { WorkspaceContext } from "@/lib/workspaceBackend";

const serviceLabels: Record<OrderingPointServiceType, string> = {
  dine_in: "Dine in / table",
  room_service: "Room service",
  counter: "Counter",
  takeaway: "Takeaway",
  other: "Other",
};

export function OrderingPointsWorkspace({ workspace }: { workspace: WorkspaceContext }) {
  const [points, setPoints] = useState<OrderingPointRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [serviceType, setServiceType] = useState<OrderingPointServiceType>("dine_in");
  const [maxOpenOrders, setMaxOpenOrders] = useState(5);
  const [secretPoint, setSecretPoint] = useState<CreatedOrderingPoint | null>(null);
  const [copied, setCopied] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const canManage = ["owner", "manager"].includes(workspace.authorizationRole);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setPoints(await listOrderingPoints(workspace));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load QR ordering points.");
    } finally {
      setLoading(false);
    }
  }, [workspace]);

  useEffect(() => { void refresh(); }, [refresh]);

  function orderingUrl(point: CreatedOrderingPoint) {
    if (typeof window === "undefined") return `/order/${point.token}`;
    return `${window.location.origin}/order/${point.token}`;
  }

  async function createPoint() {
    if (!label.trim()) return;
    setSaving(true);
    setError("");
    setSecretPoint(null);
    try {
      const created = await createOrderingPoint(workspace, { label, serviceType, maxOpenOrders });
      setSecretPoint(created);
      setLabel("");
      setFormOpen(false);
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not create ordering point.");
    } finally {
      setSaving(false);
    }
  }

  async function rotate(point: OrderingPointRecord) {
    if (typeof window !== "undefined" && !window.confirm(`Rotate the QR for ${point.label}? The old QR will stop working immediately.`)) return;
    setUpdatingId(point.id);
    setError("");
    try {
      const rotated = await rotateOrderingPoint(workspace, point.id);
      setSecretPoint(rotated);
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not rotate this QR link.");
    } finally {
      setUpdatingId(null);
    }
  }

  async function togglePoint(point: OrderingPointRecord) {
    setUpdatingId(point.id);
    setError("");
    try {
      await setOrderingPointActive(workspace, point.id, !point.active);
      setPoints((current) => current.map((item) => item.id === point.id ? { ...item, active: !item.active } : item));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not update this ordering point.");
    } finally {
      setUpdatingId(null);
    }
  }

  async function copyLink() {
    if (!secretPoint) return;
    try {
      await navigator.clipboard.writeText(orderingUrl(secretPoint));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setError("Clipboard access was blocked. Copy the secure link from the field manually.");
    }
  }

  return <div className="module-page interactive-workspace ordering-points-workspace">
    <div className="module-heading"><QrCode size={24}/><div><span className="kicker">Guest QR ordering</span><h2>Turn each table, room or counter into an app-free ordering point.</h2><p>QR secrets are generated locally from a one-time bearer link. Munaffa stores only the SHA-256 hash, so a lost QR secret must be rotated rather than retrieved from the database.</p></div></div>

    <div className="production-toolbar qr-toolbar"><div><b>{workspace.propertyName}</b><span>{workspace.city} · {points.length} ordering point{points.length === 1 ? "" : "s"}</span></div><div><button onClick={() => void refresh()} disabled={loading}><RefreshCw size={14}/>Refresh</button>{canManage && <button className="primary-action" onClick={() => setFormOpen((open) => !open)}><Plus size={14}/>New QR point</button>}</div></div>

    {formOpen && canManage && <section className="production-task-form"><div className="settings-two"><label>Label<input value={label} maxLength={120} onChange={(event) => setLabel(event.target.value)} placeholder="Table 01"/></label><label>Service type<select value={serviceType} onChange={(event) => setServiceType(event.target.value as OrderingPointServiceType)}>{Object.entries(serviceLabels).map(([value, text]) => <option key={value} value={value}>{text}</option>)}</select></label></div><label>Maximum concurrent open guest orders<input type="number" min="1" max="20" value={maxOpenOrders} onChange={(event) => setMaxOpenOrders(Math.min(20, Math.max(1, Number(event.target.value))))}/></label><div className="privacy-hint"><ShieldCheck size={14}/><span>The open-order cap is an abuse-control guardrail. For a table QR, 3–5 is usually enough while still allowing guests to place a follow-up order.</span></div><div className="production-form-actions"><button onClick={() => setFormOpen(false)}>Cancel</button><button className="primary-action" disabled={saving || !label.trim()} onClick={() => void createPoint()}>{saving ? "Creating…" : "Create QR point"}</button></div></section>}

    {secretPoint && <section className="qr-secret-card"><div className="qr-preview"><QRCodeSVG value={orderingUrl(secretPoint)} size={190} level="M" marginSize={2}/></div><div className="qr-secret-copy"><span className="kicker">Save or print now</span><h3>{secretPoint.label}</h3><p>This raw QR secret is shown only after creation or rotation. Existing database records contain only its hash.</p><input value={orderingUrl(secretPoint)} readOnly aria-label="Guest ordering URL"/><div><button onClick={() => void copyLink()}>{copied ? <Check size={14}/> : <Copy size={14}/>} {copied ? "Copied" : "Copy link"}</button><button onClick={() => window.print()}><QrCode size={14}/>Print QR</button></div><small>If this QR is photographed or shared outside the venue, rotate it. The previous QR becomes invalid immediately.</small></div></section>}

    {error && <div className="form-error production-error" role="alert">{error}</div>}

    {loading ? <div className="production-empty">Loading ordering points…</div> : points.length === 0 ? <div className="production-empty"><QrCode size={24}/><b>No guest QR points yet</b><span>Create one for a table, room or counter after your production menu is ready.</span>{canManage && <button className="primary-action" onClick={() => setFormOpen(true)}><Plus size={14}/>Create first QR point</button>}</div> : <div className="ordering-point-grid">{points.map((point) => <article key={point.id} className={!point.active ? "inactive" : ""}><div className="ordering-point-icon"><QrCode size={19}/></div><div className="ordering-point-copy"><small>{serviceLabels[point.serviceType]}</small><b>{point.label}</b><span>Up to {point.maxOpenOrders} concurrent open guest orders · {point.active ? "QR active" : "QR disabled"}</span></div><div className="ordering-point-actions">{canManage && <><button disabled={updatingId === point.id} onClick={() => void rotate(point)}><RotateCw size={13}/>Rotate</button><button disabled={updatingId === point.id} className={point.active ? "danger-action" : ""} onClick={() => void togglePoint(point)}>{point.active ? "Disable" : "Enable"}</button></>}</div></article>)}</div>}

    <div className="demo-notice production-notice"><ShieldCheck size={15}/><span>Public guests cannot query Munaffa tables directly. The QR route receives only sanitized active-menu data through scoped RPCs, and guest orders are limited by line quantity, subtotal and concurrent-open-order controls.</span></div>
  </div>;
}
