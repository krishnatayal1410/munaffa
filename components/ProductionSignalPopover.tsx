"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { listProductionGuestFeedback } from "@/lib/productionGuestBackend";
import { listProductionInventory } from "@/lib/productionInventoryBackend";
import { listOperationalTasks, type WorkspaceContext } from "@/lib/workspaceBackend";

type Signal = {
  title: string;
  copy: string;
  href: string;
  tone: "danger" | "warning";
};

export function ProductionSignalPopover({ workspace, onClose }: { workspace: WorkspaceContext; onClose: () => void }) {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [tasks, inventory, feedback] = await Promise.all([
        listOperationalTasks(workspace),
        listProductionInventory(workspace),
        listProductionGuestFeedback(workspace),
      ]);

      const next: Signal[] = [];
      const priority = tasks.filter((task) => ["high", "urgent"].includes(task.priority) && !["complete", "cancelled"].includes(task.status));
      if (priority.length) next.push({ title: `${priority.length} priority task${priority.length === 1 ? "" : "s"} open`, copy: "High or urgent operational work is still unresolved.", href: "/app/operations", tone: "danger" });

      const below = inventory.filter((item) => item.physicalQuantity !== null && item.physicalQuantity <= item.reorderQuantity);
      if (below.length) next.push({ title: `${below.length} inventory item${below.length === 1 ? "" : "s"} at/below reorder`, copy: "Based on the latest recorded physical count.", href: "/app/inventory", tone: "warning" });

      const uncounted = inventory.filter((item) => item.physicalQuantity === null);
      if (uncounted.length) next.push({ title: `${uncounted.length} item${uncounted.length === 1 ? " has" : "s have"} no physical count`, copy: "Record a physical count before relying on variance signals.", href: "/app/inventory", tone: "warning" });

      const recovery = feedback.filter((item) => ["open", "in_progress"].includes(item.recoveryStatus));
      if (recovery.length) next.push({ title: `${recovery.length} guest recovery case${recovery.length === 1 ? "" : "s"} open`, copy: "Guest feedback is waiting for recovery action.", href: "/app/guests", tone: "warning" });

      const lowRatings = recovery.filter((item) => item.rating !== null && item.rating <= 3);
      if (lowRatings.length) next.push({ title: `${lowRatings.length} unresolved low-rating record${lowRatings.length === 1 ? "" : "s"}`, copy: "Recorded feedback rated 3/5 or below remains unresolved.", href: "/app/guests", tone: "danger" });

      setSignals(next.slice(0, 5));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not calculate workspace signals.");
    } finally {
      setLoading(false);
    }
  }, [workspace]);

  useEffect(() => { void load(); }, [load]);

  const primaryHref = useMemo(() => signals[0]?.href || "/app", [signals]);

  return <div className="notification-popover production-signal-popover" role="dialog" aria-label="Live workspace signals"><header><div><small>Live workspace</small><b>Needs attention</b></div><button type="button" aria-label="Close notifications" onClick={onClose}>×</button></header>{loading ? <div className="signal-popover-state">Calculating signals…</div> : error ? <div className="signal-popover-state error">{error}</div> : signals.length === 0 ? <div className="signal-popover-state">No attention signals from the connected operational tables right now.</div> : signals.map((signal) => <Link key={signal.title} href={signal.href} onClick={onClose} className="production-signal-row"><i className={signal.tone === "danger" ? "danger-dot" : "warn-dot"}/><div><b>{signal.title}</b><span>{signal.copy}</span><em>From recorded data</em></div></Link>)}<Link href={primaryHref} onClick={onClose}>Open workspace →</Link></div>;
}
