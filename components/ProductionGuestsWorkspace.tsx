"use client";

import { CircleAlert, MessageSquarePlus, RefreshCw, Star, Users } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createProductionGuestFeedback,
  listProductionGuestFeedback,
  setGuestRecoveryStatus,
  type GuestRecoveryStatus,
  type ProductionGuestFeedback,
} from "@/lib/productionGuestBackend";
import type { WorkspaceContext } from "@/lib/workspaceBackend";

const statusLabel: Record<GuestRecoveryStatus, string> = {
  open: "Open",
  in_progress: "In progress",
  resolved: "Resolved",
  closed: "Closed",
};

function nextRecovery(status: GuestRecoveryStatus): GuestRecoveryStatus {
  if (status === "open") return "in_progress";
  if (status === "in_progress") return "resolved";
  return "open";
}

export function ProductionGuestsWorkspace({ workspace }: { workspace: WorkspaceContext }) {
  const [feedback, setFeedback] = useState<ProductionGuestFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [guestReference, setGuestReference] = useState("");
  const [source, setSource] = useState("direct");
  const [rating, setRating] = useState("");
  const [note, setNote] = useState("");
  const canResolve = ["owner", "manager", "front-desk"].includes(workspace.authorizationRole);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setFeedback(await listProductionGuestFeedback(workspace));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load guest feedback.");
    } finally {
      setLoading(false);
    }
  }, [workspace]);

  useEffect(() => { void refresh(); }, [refresh]);

  const summary = useMemo(() => {
    const rated = feedback.filter((item) => item.rating !== null);
    return {
      total: feedback.length,
      open: feedback.filter((item) => ["open", "in_progress"].includes(item.recoveryStatus)).length,
      resolved: feedback.filter((item) => ["resolved", "closed"].includes(item.recoveryStatus)).length,
      average: rated.length ? rated.reduce((sum, item) => sum + Number(item.rating), 0) / rated.length : null,
    };
  }, [feedback]);

  async function submitFeedback() {
    setSaving(true);
    setError("");
    try {
      const created = await createProductionGuestFeedback(workspace, {
        guestReference,
        source,
        rating: rating ? Number(rating) : null,
        note,
      });
      setFeedback((current) => [created, ...current]);
      setGuestReference("");
      setSource("direct");
      setRating("");
      setNote("");
      setFormOpen(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save guest feedback.");
    } finally {
      setSaving(false);
    }
  }

  async function advance(item: ProductionGuestFeedback) {
    setUpdatingId(item.id);
    setError("");
    try {
      const updated = await setGuestRecoveryStatus(workspace, item.id, nextRecovery(item.recoveryStatus));
      setFeedback((current) => current.map((entry) => entry.id === updated.id ? updated : entry));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not update recovery status.");
    } finally {
      setUpdatingId(null);
    }
  }

  return <div className="module-page interactive-workspace production-guests">
    <div className="module-heading"><Users size={24}/><div><span className="kicker">Production guest recovery</span><h2>Turn feedback into accountable follow-up.</h2><p>These records belong to your authenticated workspace. Resolution actions are limited to front desk, managers and owners by row-level security.</p></div></div>
    <div className="workspace-kpis"><Kpi label="Feedback records" value={String(summary.total)}/><Kpi label="Open recovery" value={String(summary.open)} warning={summary.open > 0}/><Kpi label="Resolved" value={String(summary.resolved)}/><Kpi label="Average rating" value={summary.average === null ? "—" : summary.average.toFixed(1)}/></div>
    <div className="production-toolbar"><div><b>{workspace.propertyName}</b><span>{workspace.city} · production guest-recovery records</span></div><div><button type="button" onClick={() => void refresh()} disabled={loading}><RefreshCw size={14}/> Refresh</button><button type="button" className="primary-action" onClick={() => setFormOpen((open) => !open)}><MessageSquarePlus size={14}/> Add feedback</button></div></div>
    {formOpen && <section className="production-task-form"><div className="settings-two"><label>Guest reference<input value={guestReference} maxLength={160} onChange={(event) => setGuestReference(event.target.value)} placeholder="Reservation or internal reference"/></label><label>Source<input value={source} maxLength={80} onChange={(event) => setSource(event.target.value)} placeholder="direct, stay, restaurant…"/></label></div><div className="settings-two"><label>Rating (optional)<select value={rating} onChange={(event) => setRating(event.target.value)}><option value="">No rating</option>{[1,2,3,4,5].map((value) => <option key={value} value={value}>{value}/5</option>)}</select></label><label>Feedback note<textarea value={note} maxLength={2000} onChange={(event) => setNote(event.target.value)} placeholder="What did the guest report?"/></label></div><div className="privacy-hint"><CircleAlert size={13}/><span>Use an internal guest or reservation reference where possible. Avoid placing unnecessary sensitive personal information in free-text notes.</span></div><div className="production-form-actions"><button type="button" onClick={() => setFormOpen(false)}>Cancel</button><button type="button" className="primary-action" disabled={saving || note.trim().length < 1 || source.trim().length < 1} onClick={() => void submitFeedback()}>{saving ? "Saving…" : "Save feedback"}</button></div></section>}
    {!canResolve && <div className="settings-lock">Your authorization role is <b>{workspace.authorizationRole}</b>. You can capture feedback, but only front desk, managers and owners can change recovery status.</div>}
    {error && <div className="form-error production-error" role="alert">{error}</div>}
    {loading ? <div className="production-empty">Loading guest recovery records…</div> : feedback.length === 0 ? <div className="production-empty"><Users size={24}/><b>No guest feedback yet</b><span>Capture the first real feedback record. Munaffa does not seed production guest history with fictional people or reviews.</span><button className="primary-action" onClick={() => setFormOpen(true)}><MessageSquarePlus size={14}/> Add feedback</button></div> : <div className="guest-list production-guest-list">{feedback.map((item) => <article key={item.id}><div className="guest-avatar"><Users size={17}/></div><div><small>{item.source} · {formatDate(item.createdAt)}</small><b>{item.guestReference || "Guest"}</b><span>{item.note}</span>{item.rating !== null && <em><Star size={12}/>{item.rating}/5</em>}</div><div className="guest-recovery-action"><small>{statusLabel[item.recoveryStatus]}</small>{canResolve && item.recoveryStatus !== "closed" && <button className={["resolved","closed"].includes(item.recoveryStatus) ? "resolved" : ""} disabled={updatingId === item.id} onClick={() => void advance(item)}>{updatingId === item.id ? "Saving…" : item.recoveryStatus === "open" ? "Start recovery" : item.recoveryStatus === "in_progress" ? "Resolve" : "Reopen"}</button>}</div></article>)}</div>}
    <div className="demo-notice production-notice"><CircleAlert size={15}/><span>Production guest feedback is real workspace data. Munaffa keeps recovery status factual and does not invent sentiment, outcomes or guest identities.</span></div>
  </div>;
}

function Kpi({ label, value, warning }: { label: string; value: string; warning?: boolean }) {
  return <article className={warning ? "workspace-kpi warning" : "workspace-kpi"}><small>{label}</small><b>{value}</b></article>;
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "recent";
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(date);
}
