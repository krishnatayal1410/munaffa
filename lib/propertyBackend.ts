"use client";

import type { HospitalityType } from "./domain";
import { getSupabaseBrowserClient } from "./supabase";
import type { WorkspaceContext } from "./workspaceBackend";

export type WorkspaceProperty = {
  id: string;
  name: string;
  city: string;
  hospitalityType: HospitalityType;
  createdAt: string;
};

function requireWorkspace(context: WorkspaceContext) {
  const client = getSupabaseBrowserClient();
  if (!client) throw new Error("Production backend is not configured.");
  if (!context.organizationId) throw new Error("Multi-property workspace is not initialized. Apply Supabase migrations through 009, then sign in again.");
  return { client, organizationId: context.organizationId };
}

export async function listWorkspaceProperties(context: WorkspaceContext): Promise<WorkspaceProperty[]> {
  const { client, organizationId } = requireWorkspace(context);
  const { data, error } = await client
    .from("properties")
    .select("id,name,city,hospitality_type,created_at")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data || []).map((row) => {
    const raw = row as Record<string, unknown>;
    return {
      id: String(raw.id),
      name: String(raw.name || "Property"),
      city: String(raw.city || ""),
      hospitalityType: String(raw.hospitality_type || "other") as HospitalityType,
      createdAt: String(raw.created_at || ""),
    };
  });
}

export async function createWorkspaceProperty(context: WorkspaceContext, input: { name: string; city: string; hospitalityType: HospitalityType }) {
  const { client } = requireWorkspace(context);
  const { data, error } = await client.rpc("create_workspace_property", {
    p_name: input.name.trim(),
    p_city: input.city.trim(),
    p_hospitality_type: input.hospitalityType,
  });
  if (error) throw new Error(error.message);
  if (!data || typeof data !== "object") throw new Error("Property could not be created.");
  const raw = data as Record<string, unknown>;
  return String(raw.property_id || "");
}

export async function setActiveWorkspaceProperty(context: WorkspaceContext, propertyId: string) {
  const { client } = requireWorkspace(context);
  const { error } = await client.rpc("set_active_property", { p_property_id: propertyId });
  if (error) throw new Error(error.message);
}
