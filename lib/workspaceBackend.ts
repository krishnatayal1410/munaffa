"use client";

import type { DemoUser } from "./domain";
import {
  clearDemoProfile,
  readDemoProfile,
  readDemoSetup,
  saveDemoSetup,
  writeDemoProfile,
  type SetupState,
} from "./demoWorkspace";
import { getSupabaseBrowserClient, hasProductionBackend } from "./supabase";

export type WorkspaceContext = {
  organizationId?: string;
  organizationName: string;
  hospitalityType: SetupState["hospitalityType"];
  role: SetupState["role"];
  authorizationRole: SetupState["role"];
  propertyId?: string;
  propertyName: string;
  city: string;
  enabledModules: string[];
};

export type OperationalTaskStatus = "queued" | "in_progress" | "complete" | "cancelled";
export type OperationalTaskPriority = "low" | "normal" | "high" | "urgent";
export type OperationalTaskRecord = {
  id: string;
  area: string;
  title: string;
  detail: string;
  status: OperationalTaskStatus;
  priority: OperationalTaskPriority;
  dueAt: string | null;
  createdAt: string;
};

export function backendMode(): "supabase" | "demo" {
  return hasProductionBackend() ? "supabase" : "demo";
}

export async function getCurrentUser(): Promise<DemoUser | null> {
  const client = getSupabaseBrowserClient();
  if (!client) return readDemoProfile();

  const { data, error } = await client.auth.getUser();
  if (error || !data.user) return null;

  const fullName =
    typeof data.user.user_metadata?.full_name === "string"
      ? data.user.user_metadata.full_name
      : typeof data.user.user_metadata?.name === "string"
        ? data.user.user_metadata.name
        : data.user.email?.split("@")[0] || "Hospitality Owner";

  return {
    id: data.user.id,
    name: fullName,
    email: data.user.email || "",
    onboardingComplete: false,
  };
}

export async function loadWorkspaceContext(): Promise<WorkspaceContext | null> {
  const client = getSupabaseBrowserClient();
  if (!client) {
    const setup = readDemoSetup();
    return setup ? { ...setup, authorizationRole: setup.role } : null;
  }

  const { data, error } = await client.rpc("get_workspace_context");
  if (error || !data || typeof data !== "object") return null;

  const raw = data as Record<string, unknown>;
  if (!raw.organization_name || !raw.property_name) return null;

  return {
    organizationId: raw.organization_id ? String(raw.organization_id) : undefined,
    organizationName: String(raw.organization_name),
    hospitalityType: String(raw.hospitality_type) as WorkspaceContext["hospitalityType"],
    role: String(raw.role) as WorkspaceContext["role"],
    authorizationRole: String(raw.authorization_role || raw.role) as WorkspaceContext["authorizationRole"],
    propertyId: raw.property_id ? String(raw.property_id) : undefined,
    propertyName: String(raw.property_name),
    city: String(raw.city || ""),
    enabledModules: Array.isArray(raw.enabled_modules)
      ? raw.enabled_modules.map(String)
      : [],
  };
}

export async function saveWorkspaceSetup(state: SetupState) {
  const client = getSupabaseBrowserClient();
  if (!client) {
    saveDemoSetup(state);
    return { mode: "demo" as const };
  }

  const { data: authData, error: authError } = await client.auth.getUser();
  if (authError || !authData.user) {
    throw new Error("Your session expired. Please sign in again.");
  }

  const { error } = await client.rpc("complete_onboarding", {
    p_organization_name: state.organizationName,
    p_hospitality_type: state.hospitalityType,
    p_role: state.role,
    p_property_name: state.propertyName,
    p_city: state.city,
    p_enabled_modules: state.enabledModules,
  });

  if (error) throw new Error(error.message);
  return { mode: "supabase" as const };
}

export async function saveWorkspaceConfiguration(state: SetupState) {
  const client = getSupabaseBrowserClient();
  if (!client) {
    saveDemoSetup(state);
    return { mode: "demo" as const };
  }

  const { data: authData, error: authError } = await client.auth.getUser();
  if (authError || !authData.user) throw new Error("Your session expired. Please sign in again.");

  const { error } = await client.rpc("save_workspace_configuration", {
    p_organization_name: state.organizationName,
    p_hospitality_type: state.hospitalityType,
    p_role: state.role,
    p_property_name: state.propertyName,
    p_city: state.city,
    p_enabled_modules: state.enabledModules,
  });
  if (error) {
    if (/function .*save_workspace_configuration/i.test(error.message) || /could not find.*function/i.test(error.message)) {
      throw new Error("Workspace settings need the latest database migration. Apply Supabase migrations through 009.");
    }
    throw new Error(error.message);
  }
  return { mode: "supabase" as const };
}

export async function updateWorkspaceProfile(input: { name: string }) {
  const name = input.name.trim();
  if (name.length < 2 || name.length > 80) {
    throw new Error("Name must be between 2 and 80 characters.");
  }

  const client = getSupabaseBrowserClient();
  if (!client) {
    const current = readDemoProfile();
    if (!current) throw new Error("No sample profile is available.");
    const next = { ...current, name };
    writeDemoProfile(next);
    return { mode: "demo" as const, user: next };
  }

  const { data: authData, error: authError } = await client.auth.getUser();
  if (authError || !authData.user) {
    throw new Error("Your session expired. Please sign in again.");
  }

  const { error: metadataError } = await client.auth.updateUser({
    data: { full_name: name, name },
  });
  if (metadataError) throw new Error(metadataError.message);

  const { error: profileError } = await client.from("user_profiles").upsert({
    id: authData.user.id,
    full_name: name,
    updated_at: new Date().toISOString(),
  });
  if (profileError) throw new Error(profileError.message);

  return {
    mode: "supabase" as const,
    user: {
      id: authData.user.id,
      name,
      email: authData.user.email || "",
      onboardingComplete: true,
    } satisfies DemoUser,
  };
}

function requireProductionWorkspace(context: WorkspaceContext) {
  const client = getSupabaseBrowserClient();
  if (!client) throw new Error("Production backend is not configured.");
  if (!context.organizationId || !context.propertyId) {
    throw new Error("Production operations are not initialized. Apply Supabase migrations through 006, then sign in again.");
  }
  return { client, organizationId: context.organizationId, propertyId: context.propertyId };
}

function mapOperationalTask(raw: Record<string, unknown>): OperationalTaskRecord {
  return {
    id: String(raw.id),
    area: String(raw.area || "Operations"),
    title: String(raw.title || "Untitled task"),
    detail: String(raw.detail || ""),
    status: String(raw.status || "queued") as OperationalTaskStatus,
    priority: String(raw.priority || "normal") as OperationalTaskPriority,
    dueAt: raw.due_at ? String(raw.due_at) : null,
    createdAt: String(raw.created_at || ""),
  };
}

const operationalTaskColumns = "id,area,title,detail,status,priority,due_at,created_at";

export async function listOperationalTasks(context: WorkspaceContext): Promise<OperationalTaskRecord[]> {
  const { client, organizationId, propertyId } = requireProductionWorkspace(context);
  const { data, error } = await client
    .from("operational_tasks")
    .select(operationalTaskColumns)
    .eq("organization_id", organizationId)
    .eq("property_id", propertyId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw new Error(error.message);
  return (data || []).map((row) => mapOperationalTask(row as Record<string, unknown>));
}

export async function createOperationalTask(context: WorkspaceContext, input: { area: string; title: string; detail?: string; priority?: OperationalTaskPriority }): Promise<OperationalTaskRecord> {
  const { client, organizationId, propertyId } = requireProductionWorkspace(context);
  const title = input.title.trim();
  const area = input.area.trim();
  if (title.length < 2 || title.length > 160) throw new Error("Task title must be between 2 and 160 characters.");
  if (area.length < 1 || area.length > 120) throw new Error("Task area must be between 1 and 120 characters.");

  const { data, error } = await client
    .from("operational_tasks")
    .insert({
      organization_id: organizationId,
      property_id: propertyId,
      area,
      title,
      detail: input.detail?.trim() || "",
      priority: input.priority || "normal",
      status: "queued",
    })
    .select(operationalTaskColumns)
    .single();
  if (error) throw new Error(error.message);
  return mapOperationalTask(data as Record<string, unknown>);
}

export async function setOperationalTaskStatus(context: WorkspaceContext, taskId: string, status: OperationalTaskStatus): Promise<OperationalTaskRecord> {
  const { client, organizationId, propertyId } = requireProductionWorkspace(context);
  const { data, error } = await client
    .from("operational_tasks")
    .update({ status })
    .eq("id", taskId)
    .eq("organization_id", organizationId)
    .eq("property_id", propertyId)
    .select(operationalTaskColumns)
    .single();
  if (error) throw new Error(error.message);
  return mapOperationalTask(data as Record<string, unknown>);
}

export async function signOutCurrentUser() {
  const client = getSupabaseBrowserClient();
  if (client) await client.auth.signOut();
  clearDemoProfile();
}
