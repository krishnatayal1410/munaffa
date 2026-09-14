"use client";

import { getSupabaseBrowserClient } from "./supabase";
import type { WorkspaceContext } from "./workspaceBackend";

export type FinancialDirection = "revenue" | "expense";
export type FinancialSource = "manual" | "pos" | "pms" | "payment" | "accounting" | "delivery" | "other";
export type FinancialStatus = "active" | "voided";

export type ProductionFinancialEntry = {
  id: string;
  direction: FinancialDirection;
  category: string;
  amount: number;
  currency: string;
  source: FinancialSource;
  externalReference: string;
  note: string;
  occurredAt: string;
  status: FinancialStatus;
  createdAt: string;
};

function requireWorkspace(context: WorkspaceContext) {
  const client = getSupabaseBrowserClient();
  if (!client) throw new Error("Production backend is not configured.");
  if (!context.organizationId || !context.propertyId) {
    throw new Error("Production finance is not initialized. Apply Supabase migrations through 007, then sign in again.");
  }
  return { client, organizationId: context.organizationId, propertyId: context.propertyId };
}

function mapEntry(raw: Record<string, unknown>): ProductionFinancialEntry {
  return {
    id: String(raw.id),
    direction: String(raw.direction || "expense") as FinancialDirection,
    category: String(raw.category || "Uncategorized"),
    amount: Number(raw.amount || 0),
    currency: String(raw.currency || "INR"),
    source: String(raw.source || "manual") as FinancialSource,
    externalReference: String(raw.external_reference || ""),
    note: String(raw.note || ""),
    occurredAt: String(raw.occurred_at || ""),
    status: String(raw.status || "active") as FinancialStatus,
    createdAt: String(raw.created_at || ""),
  };
}

const entryColumns = "id,direction,category,amount,currency,source,external_reference,note,occurred_at,status,created_at";

export async function listProductionFinancialEntries(context: WorkspaceContext, options?: { since?: string; limit?: number }): Promise<ProductionFinancialEntry[]> {
  const { client, organizationId, propertyId } = requireWorkspace(context);
  let query = client
    .from("financial_entries")
    .select(entryColumns)
    .eq("organization_id", organizationId)
    .eq("property_id", propertyId)
    .order("occurred_at", { ascending: false })
    .limit(options?.limit ?? 250);
  if (options?.since) query = query.gte("occurred_at", options.since);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data || []).map((row) => mapEntry(row as Record<string, unknown>));
}

export async function createProductionFinancialEntry(context: WorkspaceContext, input: {
  direction: FinancialDirection;
  category: string;
  amount: number;
  currency?: string;
  source?: FinancialSource;
  externalReference?: string;
  note?: string;
  occurredAt?: string;
}): Promise<ProductionFinancialEntry> {
  const { client, organizationId, propertyId } = requireWorkspace(context);
  const category = input.category.trim();
  const currency = (input.currency || "INR").trim().toUpperCase();
  if (category.length < 1 || category.length > 80) throw new Error("Category must be between 1 and 80 characters.");
  if (!Number.isFinite(input.amount) || input.amount <= 0) throw new Error("Amount must be greater than zero.");
  if (!/^[A-Z]{3}$/.test(currency)) throw new Error("Currency must be a three-letter ISO code such as INR.");

  const { data, error } = await client
    .from("financial_entries")
    .insert({
      organization_id: organizationId,
      property_id: propertyId,
      direction: input.direction,
      category,
      amount: input.amount,
      currency,
      source: input.source || "manual",
      external_reference: input.externalReference?.trim().slice(0, 200) || "",
      note: input.note?.trim().slice(0, 1000) || "",
      occurred_at: input.occurredAt || new Date().toISOString(),
      status: "active",
    })
    .select(entryColumns)
    .single();
  if (error) throw new Error(error.message);
  return mapEntry(data as Record<string, unknown>);
}

export async function voidProductionFinancialEntry(context: WorkspaceContext, entryId: string): Promise<ProductionFinancialEntry> {
  const { client, organizationId, propertyId } = requireWorkspace(context);
  const { data, error } = await client
    .from("financial_entries")
    .update({ status: "voided" })
    .eq("id", entryId)
    .eq("organization_id", organizationId)
    .eq("property_id", propertyId)
    .select(entryColumns)
    .single();
  if (error) throw new Error(error.message);
  return mapEntry(data as Record<string, unknown>);
}
