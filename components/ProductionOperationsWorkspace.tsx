"use client";

import { CheckCircle2, CircleAlert, ClipboardCheck, Clock3, Plus, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createOperationalTask,
  listOperationalTasks,
  setOperationalTaskStatus,
  type OperationalTaskPriority,
  type OperationalTaskRecord,
  type OperationalTaskStatus,
  type WorkspaceContext,
} from "@/lib/workspaceBackend";

const statusLabels: Record<OperationalTaskStatus, string> = {
  queued: "Queued",
  in_progress: "In progress",
  complete: "Complete",
  cancelled: "Cancelled",
};

function nextStatus(status: OperationalTaskStatus): OperationalTaskStatus {
  if (status === "queued") return "in_progress";
  if (status === "in_progress") return "complete";
  return "queued";
}

export function ProductionOperationsWorkspace({ workspace }: { workspace: WorkspaceContext }) {
  const [tasks, setTasks] = useState<OperationalTaskRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [area, setArea] = useState("Operations");
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");
  const [priority, setPriority] = useState<OperationalTaskPriority>("normal");
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setTasks(await listOperationalTasks(workspace));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load operational tasks.");
    } finally {
      setLoading(false);
    }
  }, [workspace]);

  useEffect(() => { void refresh(); }, [refresh]);

  const counts = useMemo(() => ({
    queued: tasks.filter((task) => task.status === "queued").length,
    active: tasks.filter((task) => task.status === "in_progress").length,
    complete: tasks.filter((task) => task.status === "complete").length,
    risk: tasks.filter((task) => ["high", "urgent"].includes(task.priority) && !["complete", "cancelled"].includes(task.status)).length,
  }), [tasks]);

  async function createTask() {
    if (title.trim().length < 2 || area.trim().length < 1) return;
    setSaving(true);
    setError("");
    try {
      const created = await createOperationalTask(workspace, { area, title, detail, priority });
      setTasks((current) => [created, ...current]);
      setTitle("");
      setDetail("");
      setPriority("normal");
      setFormOpen(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not create the task.");
    } finally {
      setSaving(false);
    }
  }

  async function advance(task: OperationalTaskRecord) {
    setUpdatingId(task.id);
    setError("");
    try {
      const updated = await setOperationalTaskStatus(workspace, task.id, nextStatus(task.status));
      setTasks((current) => current.map((item) => item.id === updated.id ? updated : item));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not update the task.");
    } finally {
      setUpdatingId(null);
    }
  }

  return <div className="module-page interactive-workspace production-operations">
    <div className="module-heading"><ClipboardCheck size={24}/><div><span className="kicker">Production operations</span><h2>Operations command queue</h2><p>These records come from your Supabase workspace and are protected by organization and property row-level security.</p></div></div>
    <div className="workspace-kpis"><Kpi label="Queued" value={String(counts.queued)}/><Kpi label="In progress" value={String(counts.active)}/><Kpi label="Completed" value={String(counts.complete)}/><Kpi label="Priority risk" value={String(counts.risk)} warning/></div>
    <div className="production-toolbar"><div><b>{workspace.propertyName}</b><span>{workspace.city} · live workspace records</span></div><div><button type="button" onClick={() => void refresh()} disabled={loading}><RefreshCw size={14}/> Refresh</button><button type="button" className="primary-action" onClick={() => setFormOpen((open) => !open)}><Plus size={14}/> New task</button></div></div>
    {formOpen && <section className="production-task-form"><div className="settings-two"><label>Area<input value={area} maxLength={120} onChange={(event) => setArea(event.target.value)} placeholder="Kitchen · pass"/></label><label>Priority<select value={priority} onChange={(event) => setPriority(event.target.value as OperationalTaskPriority)}><option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option><option value="urgent">Urgent</option></select></label></div><label>Task title<input value={title} maxLength={160} onChange={(event) => setTitle(event.target.value)} placeholder="What needs to happen?"/></label><label>Details<textarea value={detail} maxLength={1000} onChange={(event) => setDetail(event.target.value)} placeholder="Optional context for the team"/></label><div className="production-form-actions"><button type="button" onClick={() => setFormOpen(false)}>Cancel</button><button type="button" className="primary-action" disabled={saving || title.trim().length < 2 || area.trim().length < 1} onClick={() => void createTask()}>{saving ? "Creating…" : "Create task"}</button></div></section>}
    {error && <div className="form-error production-error" role="alert">{error}</div>}
    {loading ? <div className="production-empty">Loading operational records…</div> : tasks.length === 0 ? <div className="production-empty"><ClipboardCheck size={24}/><b>No operational tasks yet</b><span>Create the first real task for this property. Munaffa does not seed fake production records.</span><button className="primary-action" onClick={() => setFormOpen(true)}><Plus size={14}/> Create task</button></div> : <div className="work-list">{tasks.map((task) => <article key={task.id} className={`work-item status-${task.status.replace("_", "-")}`}><div className="work-icon">{task.status === "complete" ? <CheckCircle2 size={18}/> : ["high", "urgent"].includes(task.priority) ? <CircleAlert size={18}/> : <Clock3 size={18}/>}</div><div className="work-copy"><small>{task.area} · {task.priority} priority</small><b>{task.title}</b><span>{task.detail || "No additional detail"}</span></div><div className="work-status"><em>{statusLabels[task.status]}</em>{task.status !== "cancelled" && <button disabled={updatingId === task.id} onClick={() => void advance(task)}>{updatingId === task.id ? "Saving…" : task.status === "queued" ? "Start" : task.status === "in_progress" ? "Complete" : "Reopen"}</button>}</div></article>)}</div>}
    <div className="demo-notice production-notice"><CircleAlert size={15}/><span>Production mode never substitutes sample records if the operational schema is missing or unavailable. Errors are shown explicitly so real and illustrative data cannot be confused.</span></div>
  </div>;
}

function Kpi({ label, value, warning }: { label: string; value: string; warning?: boolean }) {
  return <article className={warning ? "workspace-kpi warning" : "workspace-kpi"}><small>{label}</small><b>{value}</b></article>;
}
