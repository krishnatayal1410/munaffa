"use client";

import Link from "next/link";
import { Activity, Boxes, CircleAlert, ClipboardCheck, RefreshCw, Star, Users } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { listProductionGuestFeedback, type ProductionGuestFeedback } from "@/lib/productionGuestBackend";
import { listProductionInventory, type ProductionInventoryRecord } from "@/lib/productionInventoryBackend";
import { listOperationalTasks, type OperationalTaskRecord, type WorkspaceContext } from "@/lib/workspaceBackend";

export function ProductionOverviewWorkspace({ workspace }: { workspace: WorkspaceContext }) {
  const [tasks, setTasks] = useState<OperationalTaskRecord[]>([]);
  const [inventory, setInventory] = useState<ProductionInventoryRecord[]>([]);
  const [feedback, setFeedback] = useState<ProductionGuestFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [taskRows, inventoryRows, feedbackRows] = await Promise.all([
        listOperationalTasks(workspace),
        listProductionInventory(workspace),
        listProductionGuestFeedback(workspace),
      ]);
      setTasks(taskRows);
      setInventory(inventoryRows);
      setFeedback(feedbackRows);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load production overview data.");
    } finally {
      setLoading(false);
    }
  }, [workspace]);

  useEffect(() => { void refresh(); }, [refresh]);

  const metrics = useMemo(() => {
    const openTasks = tasks.filter((task) => !["complete", "cancelled"].includes(task.status)).length;
    const priorityRisk = tasks.filter((task) => ["high", "urgent"].includes(task.priority) && !["complete", "cancelled"].includes(task.status)).length;
    const belowReorder = inventory.filter((item) => item.physicalQuantity !== null && item.physicalQuantity <= item.reorderQuantity).length;
    const missingCounts = inventory.filter((item) => item.physicalQuantity === null).length;
    const openRecovery = feedback.filter((item) => ["open", "in_progress"].includes(item.recoveryStatus)).length;
    const rated = feedback.filter((item) => item.rating !== null);
    const averageRating = rated.length ? rated.reduce((sum, item) => sum + (item.rating || 0), 0) / rated.length : null;
    return { openTasks, priorityRisk, belowReorder, missingCounts, openRecovery, averageRating };
  }, [feedback, inventory, tasks]);

  const attention = useMemo(() => {
    const signals: { title: string; copy: string; href: string; tone: "warning" | "danger" }[] = [];
    if (metrics.priorityRisk > 0) signals.push({ title: `${metrics.priorityRisk} priority task${metrics.priorityRisk === 1 ? "" : "s"} need attention`, copy: "High/urgent work is still open in the operational queue.", href: "/app/operations", tone: "danger" });
    if (metrics.belowReorder > 0) signals.push({ title: `${metrics.belowReorder} item${metrics.belowReorder === 1 ? " is" : "s are"} at or below reorder`, copy: "Based on the latest recorded physical count and configured reorder level.", href: "/app/inventory", tone: "warning" });
    if (metrics.missingCounts > 0) signals.push({ title: `${metrics.missingCounts} inventory item${metrics.missingCounts === 1 ? " has" : "s have"} no physical count`, copy: "Add a count before relying on theoretical-vs-physical variance.", href: "/app/inventory", tone: "warning" });
    if (metrics.openRecovery > 0) signals.push({ title: `${metrics.openRecovery} guest recovery case${metrics.openRecovery === 1 ? "" : "s"} open`, copy: "Open or in-progress guest feedback is awaiting recovery action.", href: "/app/guests", tone: "warning" });
    return signals.slice(0, 5);
  }, [metrics]);

  const recentTasks = tasks.slice(0, 4);

  return <div className="dashboard-content production-overview">
    <div className="welcome-row"><div><span className="kicker">Production workspace</span><h2>What needs attention right now.</h2><p>These operational, inventory and guest-recovery signals are calculated from records in <b>{workspace.propertyName}</b>. Revenue and profit are intentionally not shown as live until a verified financial source is connected.</p></div><button type="button" className="pill primary production-overview-refresh" onClick={() => void refresh()} disabled={loading}><RefreshCw size={14}/>{loading ? "Refreshing…" : "Refresh"}</button></div>

    {error && <div className="form-error production-error" role="alert">{error}</div>}

    <div className="metric-row production-metric-row">
      <article><small>Open operational work</small><b>{loading ? "—" : metrics.openTasks}</b><em>{metrics.priorityRisk > 0 ? `${metrics.priorityRisk} priority risk` : "No high-priority risk"}</em></article>
      <article><small>At / below reorder</small><b>{loading ? "—" : metrics.belowReorder}</b><em>{metrics.missingCounts > 0 ? `${metrics.missingCounts} missing counts` : "Latest counts available"}</em></article>
      <article><small>Open guest recovery</small><b>{loading ? "—" : metrics.openRecovery}</b><em>{metrics.openRecovery > 0 ? "Action required" : "No open recovery"}</em></article>
      <article><small>Recorded guest rating</small><b>{loading ? "—" : metrics.averageRating === null ? "N/A" : metrics.averageRating.toFixed(1)}</b><em>{metrics.averageRating === null ? "No rated feedback yet" : "From recorded feedback"}</em></article>
    </div>

    <div className="dashboard-grid production-overview-grid">
      <article className="chart-card production-activity-card"><header><div><small>Recent operations</small><b>Latest tenant-scoped tasks</b></div><Activity size={18}/></header>{loading ? <div className="production-overview-empty">Loading records…</div> : recentTasks.length === 0 ? <div className="production-overview-empty"><ClipboardCheck size={20}/><span>No operational tasks have been created yet.</span><Link href="/app/operations">Create the first task →</Link></div> : <div className="production-activity-list">{recentTasks.map((task) => <Link href="/app/operations" key={task.id}><i className={["high", "urgent"].includes(task.priority) && !["complete", "cancelled"].includes(task.status) ? "danger-dot" : "warn-dot"}/><span><b>{task.title}</b><small>{task.area} · {task.status.replace("_", " ")}</small></span><em>{task.priority}</em></Link>)}</div>}</article>

      <article className="attention-card production-attention-card"><header><div><small>Needs attention</small><b>Computed from live records</b></div><CircleAlert size={18}/></header>{loading ? <div className="production-overview-empty">Calculating signals…</div> : attention.length === 0 ? <div className="production-overview-empty"><span>No current attention signals from the connected operational tables.</span></div> : attention.map((signal) => <Link key={signal.title} href={signal.href} className="production-signal"><i className={signal.tone === "danger" ? "danger-dot" : "warn-dot"}/><span><b>{signal.title}</b><small>{signal.copy}</small></span></Link>)}</article>
    </div>

    <div className="overview-next production-overview-links"><Link href="/app/operations"><ClipboardCheck size={18}/><span><b>Operations</b><small>{metrics.openTasks} open work item{metrics.openTasks === 1 ? "" : "s"}.</small></span>→</Link><Link href="/app/inventory"><Boxes size={18}/><span><b>Inventory</b><small>{inventory.length} active item{inventory.length === 1 ? "" : "s"} configured.</small></span>→</Link><Link href="/app/guests"><Users size={18}/><span><b>Guest recovery</b><small>{feedback.length} feedback record{feedback.length === 1 ? "" : "s"} captured.</small></span>→</Link></div>

    <div className="demo-notice production-notice"><Star size={15}/><span>No revenue, contribution, occupancy, covers or AI conclusions are fabricated here. Those indicators will appear as production metrics only after their authoritative sources are connected.</span></div>
  </div>;
}
