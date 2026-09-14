"use client";

import type { DemoUser } from "./domain";
import {
  clearDemoProfile,
  readDemoProfile,
  readDemoSetup,
  saveDemoSetup,
  type SetupState,
} from "./demoWorkspace";
import { getSupabaseBrowserClient, hasProductionBackend } from "./supabase";

export type WorkspaceContext = {
  organizationName: string;
  hospitalityType: SetupState["hospitalityType"];
  role: SetupState["role"];
  propertyName: string;
  city: string;
  enabledModules: string[];
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
    return setup ? { ...setup } : null;
  }

  const { data, error } = await client.rpc("get_workspace_context");
  if (error || !data || typeof data !== "object") return null;

  const raw = data as Record<string, unknown>;
  if (!raw.organization_name || !raw.property_name) return null;

  return {
    organizationName: String(raw.organization_name),
    hospitalityType: String(raw.hospitality_type) as WorkspaceContext["hospitalityType"],
    role: String(raw.role) as WorkspaceContext["role"],
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

export async function signOutCurrentUser() {
  const client = getSupabaseBrowserClient();
  if (client) await client.auth.signOut();
  clearDemoProfile();
}
