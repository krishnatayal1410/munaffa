"use client";

import { Bot, CircleAlert, RefreshCw, Send, ShieldCheck, Sparkles } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { listProductionFinancialEntries, type ProductionFinancialEntry } from "@/lib/productionFinanceBackend";
import { listProductionGuestFeedback, type ProductionGuestFeedback } from "@/lib/productionGuestBackend";
import { listProductionInventory, type ProductionInventoryRecord } from "@/lib/productionInventoryBackend";
import { listOperationalTasks, type OperationalTaskRecord, type WorkspaceContext } from "@/lib/workspaceBackend";

type GroundedState = {
  tasks: OperationalTaskRecord[];
  inventory: ProductionInventoryRecord[];
  feedback: ProductionGuestFeedback[];
  finance: ProductionFinancialEntry[];
};

const financeRoles = new Set(["owner", "manager", "cashier"]);

function monthStartIso() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
}

function money(value: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
}

export function ProductionAIWorkspace({ workspace }: { workspace: WorkspaceContext }) {
  const [data, setData] = useState<GroundedState>({ tasks: [], inventory: [], feedback: [], finance: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState("Loading your permitted workspace data…");
  const canSeeFinance = financeRoles.has(workspace.authorizationRole);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [tasks, inventory, feedback, finance] = await Promise.all([
        listOperationalTasks(workspace),
        listProductionInventory(workspace),
        listProductionGuestFeedback(workspace),
        canSeeFinance ? listProductionFinancialEntries(workspace, { since: monthStartIso(), limit: 300 }) : Promise.resolve([]),
      ]);
      const next = { tasks, inventory, feedback, finance };
      setData(next);
      setAnswer(buildAttentionAnswer(next, canSeeFinance));
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Could not load grounded workspace data.";
      setError(message);
      setAnswer("Munaffa cannot produce a grounded answer because the underlying workspace data could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [canSeeFinance, workspace]);

  useEffect(() => { void refresh(); }, [refresh]);

  const sources = useMemo(() => [
    ["Operations", data.tasks.length],
    ["Inventory", data.inventory.length],
    ["Guest recovery", data.feedback.length],
    ...(canSeeFinance ? [["Financial entries", data.finance.length] as [string, number]] : []),
  ], [canSeeFinance, data]);

  function ask(input = query) {
    const normalized = input.trim().toLowerCase();
    if (!normalized || loading) return;
    setQuery(input);
    if (normalized.includes("inventory") || normalized.includes("stock") || normalized.includes("reorder") || normalized.includes("variance")) setAnswer(buildInventoryAnswer(data.inventory));
    else if (normalized.includes("guest") || normalized.includes("review") || normalized.includes("rating") || normalized.includes("feedback")) setAnswer(buildGuestAnswer(data.feedback));
    else if (normalized.includes("revenue") || normalized.includes("expense") || normalized.includes("profit") || normalized.includes("contribution") || normalized.includes("financial")) setAnswer(canSeeFinance ? buildFinanceAnswer(data.finance) : "Your authorization role does not have access to the financial ledger, so I will not infer or expose financial information.");
    else if (normalized.includes("operation") || normalized.includes("task") || normalized.includes("service") || normalized.includes("today") || normalized.includes("attention")) setAnswer(buildAttentionAnswer(data, canSeeFinance));
    else setAnswer(buildSummaryAnswer(data, canSeeFinance));
  }

  const prompts = ["What needs attention today?", "Summarize inventory", "Summarize guest recovery", ...(canSeeFinance ? ["Summarize recorded contribution"] : [])];

  return <div className="module-page interactive-workspace production-ai">
    <div className="module-heading"><Bot size={24}/><div><span className="kicker">Grounded intelligence</span><h2>Ask about the records Munaffa is actually allowed to read.</h2><p>This mode analyzes tenant-scoped workspace data in the browser with deterministic rules. It does not send records to an external generative model or invent missing business facts.</p></div></div>

    <div className="production-ai-sources"><div><ShieldCheck size={16}/><span><b>Permission-aware sources</b><small>{workspace.propertyName} · {workspace.authorizationRole}</small></span></div>{sources.map(([label, count]) => <span key={label}>{label}<b>{count}</b></span>)}<button type="button" onClick={() => void refresh()} disabled={loading}><RefreshCw size={13}/>{loading ? "Refreshing" : "Refresh"}</button></div>

    {error && <div className="form-error production-error" role="alert">{error}</div>}

    <div className="ai-console production-ai-console"><div className="ai-orb"><Sparkles size={20}/></div><div className="ai-response"><small>Munaffa Intelligence · grounded</small><p>{answer}</p></div><div className="ai-suggestions">{prompts.map((prompt) => <button key={prompt} disabled={loading} onClick={() => ask(prompt)}>{prompt}</button>)}</div><form onSubmit={(event) => { event.preventDefault(); ask(); }}><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ask about operations, stock, guests or permitted financial records…"/><button type="submit" disabled={loading || !query.trim()}><Send size={16}/></button></form></div>

    <div className="demo-notice production-notice"><CircleAlert size={15}/><span>This is grounded deterministic analysis, not a large-language-model response. A future external model must use the same authorization boundaries and retrieval sources, and should be enabled only after data-processing/privacy controls are configured.</span></div>
  </div>;
}

function buildAttentionAnswer(data: GroundedState, includeFinance: boolean) {
  const priority = data.tasks.filter((task) => ["high", "urgent"].includes(task.priority) && !["complete", "cancelled"].includes(task.status)).length;
  const open = data.tasks.filter((task) => !["complete", "cancelled"].includes(task.status)).length;
  const below = data.inventory.filter((item) => item.physicalQuantity !== null && item.physicalQuantity <= item.reorderQuantity).length;
  const uncounted = data.inventory.filter((item) => item.physicalQuantity === null).length;
  const recovery = data.feedback.filter((item) => ["open", "in_progress"].includes(item.recoveryStatus)).length;
  const parts = [`${open} operational task${open === 1 ? " is" : "s are"} open, including ${priority} high/urgent.`];
  parts.push(`${below} inventory item${below === 1 ? " is" : "s are"} at or below reorder and ${uncounted} still lack a physical count.`);
  parts.push(`${recovery} guest recovery case${recovery === 1 ? " is" : "s are"} open.`);
  if (includeFinance) parts.push(buildFinanceAnswer(data.finance));
  return parts.join(" ");
}

function buildInventoryAnswer(inventory: ProductionInventoryRecord[]) {
  if (!inventory.length) return "No active inventory items are recorded for this property yet.";
  const below = inventory.filter((item) => item.physicalQuantity !== null && item.physicalQuantity <= item.reorderQuantity);
  const uncounted = inventory.filter((item) => item.physicalQuantity === null);
  const largestVariance = inventory.filter((item) => item.physicalQuantity !== null).sort((a, b) => Math.abs((b.physicalQuantity || 0) - b.theoreticalQuantity) - Math.abs((a.physicalQuantity || 0) - a.theoreticalQuantity))[0];
  let answer = `${inventory.length} active inventory items are configured. ${below.length} are at or below reorder and ${uncounted.length} have no physical count.`;
  if (largestVariance) answer += ` The largest absolute theoretical-vs-physical difference in the loaded records is ${largestVariance.name}: ${Math.abs((largestVariance.physicalQuantity || 0) - largestVariance.theoreticalQuantity).toFixed(2)} ${largestVariance.unit}. That is a variance signal to investigate, not proof of a cause.`;
  return answer;
}

function buildGuestAnswer(feedback: ProductionGuestFeedback[]) {
  if (!feedback.length) return "No guest feedback records are captured for this property yet.";
  const open = feedback.filter((item) => ["open", "in_progress"].includes(item.recoveryStatus));
  const rated = feedback.filter((item) => item.rating !== null);
  const average = rated.length ? rated.reduce((sum, item) => sum + (item.rating || 0), 0) / rated.length : null;
  const lowOpen = open.filter((item) => item.rating !== null && item.rating <= 3).length;
  return `${feedback.length} feedback records are loaded. ${open.length} recovery case${open.length === 1 ? " is" : "s are"} open${lowOpen ? `, including ${lowOpen} unresolved rating${lowOpen === 1 ? "" : "s"} of 3/5 or below` : ""}.${average === null ? " No ratings have been recorded." : ` The recorded average rating is ${average.toFixed(1)}/5.`}`;
}

function buildFinanceAnswer(entries: ProductionFinancialEntry[]) {
  const active = entries.filter((entry) => entry.status === "active");
  if (!active.length) return "No active financial entries are recorded for the current month.";
  const revenue = active.filter((entry) => entry.direction === "revenue").reduce((sum, entry) => sum + entry.amount, 0);
  const expense = active.filter((entry) => entry.direction === "expense").reduce((sum, entry) => sum + entry.amount, 0);
  const contribution = revenue - expense;
  return `Current-month recorded revenue is ${money(revenue)}, recorded expenses are ${money(expense)}, and recorded contribution is ${money(contribution)}. This is based only on active ledger entries and is not an audited P&L.`;
}

function buildSummaryAnswer(data: GroundedState, includeFinance: boolean) {
  const core = `${buildAttentionAnswer(data, false)} ${buildGuestAnswer(data.feedback)}`;
  return includeFinance ? `${core} ${buildFinanceAnswer(data.finance)}` : core;
}
