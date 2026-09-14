"use client";

import { getSupabaseBrowserClient } from "./supabase";
import type { WorkspaceContext } from "./workspaceBackend";

export type GuestRecoveryStatus = "open" | "in_progress" | "resolved" | "closed";
export type ProductionGuestFeedback = {
  id: string;
  guestReference: string;
  source: string;
  rating: number | null;
  note: string;
  recoveryStatus: GuestRecoveryStatus;
  resolvedAt: string | null;
  createdAt: string;
};

function requireWorkspace(context: WorkspaceContext) {
  const client = getSupabaseBrowserClient();
  if (!client) throw new Error("Production backend is not configured.");
  if (!context.organizationId || !context.propertyId) {
    throw new Error("Production guest recovery is not initialized. Apply Supabase migrations through 006, then sign in again.");
  }
  return { client, organizationId: context.organizationId, propertyId: context.propertyId };
}

function mapFeedback(raw: Record<string, unknown>): ProductionGuestFeedback {
  return {
    id: String(raw.id),
    guestReference: String(raw.guest_reference || "Guest"),
    source: String(raw.source || "direct"),
    rating: raw.rating === null || raw.rating === undefined ? null : Number(raw.rating),
    note: String(raw.note || ""),
    recoveryStatus: String(raw.recovery_status || "open") as GuestRecoveryStatus,
    resolvedAt: raw.resolved_at ? String(raw.resolved_at) : null,
    createdAt: String(raw.created_at || ""),
  };
}

const feedbackColumns = "id,guest_reference,source,rating,note,recovery_status,resolved_at,created_at";

export async function listProductionGuestFeedback(context: WorkspaceContext): Promise<ProductionGuestFeedback[]> {
  const { client, organizationId, propertyId } = requireWorkspace(context);
  const { data, error } = await client
    .from("guest_feedback")
    .select(feedbackColumns)
    .eq("organization_id", organizationId)
    .eq("property_id", propertyId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw new Error(error.message);
  return (data || []).map((row) => mapFeedback(row as Record<string, unknown>));
}

export async function createProductionGuestFeedback(context: WorkspaceContext, input: {
  guestReference?: string;
  source: string;
  rating?: number | null;
  note: string;
}): Promise<ProductionGuestFeedback> {
  const { client, organizationId, propertyId } = requireWorkspace(context);
  const source = input.source.trim();
  const note = input.note.trim();
  if (!source || source.length > 80) throw new Error("Feedback source must be between 1 and 80 characters.");
  if (!note || note.length > 2000) throw new Error("Feedback note must be between 1 and 2000 characters.");
  if (input.rating !== null && input.rating !== undefined && (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5)) {
    throw new Error("Rating must be a whole number from 1 to 5.");
  }

  const { data, error } = await client
    .from("guest_feedback")
    .insert({
      organization_id: organizationId,
      property_id: propertyId,
      guest_reference: input.guestReference?.trim().slice(0, 160) || "Guest",
      source,
      rating: input.rating ?? null,
      note,
      recovery_status: "open",
    })
    .select(feedbackColumns)
    .single();
  if (error) throw new Error(error.message);
  return mapFeedback(data as Record<string, unknown>);
}

export async function setGuestRecoveryStatus(context: WorkspaceContext, feedbackId: string, recoveryStatus: GuestRecoveryStatus): Promise<ProductionGuestFeedback> {
  const { client, organizationId, propertyId } = requireWorkspace(context);
  const { data, error } = await client
    .from("guest_feedback")
    .update({ recovery_status: recoveryStatus })
    .eq("id", feedbackId)
    .eq("organization_id", organizationId)
    .eq("property_id", propertyId)
    .select(feedbackColumns)
    .single();
  if (error) throw new Error(error.message);
  return mapFeedback(data as Record<string, unknown>);
}
