"use client";

import { getSupabaseBrowserClient } from "./supabase";
import type { Role } from "./domain";
import type { WorkspaceContext } from "./workspaceBackend";

export type TeamRole = Exclude<Role, "owner"> | "owner";

export type TeamMember = {
  userId: string;
  role: TeamRole;
  fullName: string;
  joinedAt: string;
};

export type TeamInvite = {
  id: string;
  role: Exclude<TeamRole, "owner">;
  email: string | null;
  expiresAt: string;
  createdAt: string;
};

export type CreatedTeamInvite = TeamInvite & {
  token: string;
};

function requireManagementWorkspace(context: WorkspaceContext) {
  const client = getSupabaseBrowserClient();
  if (!client) throw new Error("Production backend is not configured.");
  if (!context.organizationId) throw new Error("Team management is not initialized. Apply Supabase migrations through 008, then sign in again.");
  if (!["owner", "manager"].includes(context.authorizationRole)) throw new Error("Only owners and managers can manage the team.");
  return { client, organizationId: context.organizationId };
}

export async function listTeamMembers(context: WorkspaceContext): Promise<TeamMember[]> {
  const { client, organizationId } = requireManagementWorkspace(context);
  const { data: memberships, error: membershipError } = await client
    .from("organization_members")
    .select("user_id,role,created_at")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: true });
  if (membershipError) throw new Error(membershipError.message);

  const ids = (memberships || []).map((row) => String((row as Record<string, unknown>).user_id || "")).filter(Boolean);
  const profiles = new Map<string, string>();
  if (ids.length) {
    const { data: profileRows, error: profileError } = await client
      .from("user_profiles")
      .select("id,full_name")
      .in("id", ids);
    if (profileError) throw new Error(profileError.message);
    for (const row of profileRows || []) {
      const raw = row as Record<string, unknown>;
      profiles.set(String(raw.id), String(raw.full_name || ""));
    }
  }

  return (memberships || []).map((row) => {
    const raw = row as Record<string, unknown>;
    const userId = String(raw.user_id);
    return {
      userId,
      role: String(raw.role || "waiter") as TeamRole,
      fullName: profiles.get(userId) || `Member ${userId.slice(0, 8)}`,
      joinedAt: String(raw.created_at || ""),
    };
  });
}

export async function listTeamInvites(context: WorkspaceContext): Promise<TeamInvite[]> {
  const { client, organizationId } = requireManagementWorkspace(context);
  const { data, error } = await client
    .from("organization_invites")
    .select("id,role,email,expires_at,created_at")
    .eq("organization_id", organizationId)
    .is("accepted_at", null)
    .is("revoked_at", null)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []).map((row) => {
    const raw = row as Record<string, unknown>;
    return {
      id: String(raw.id),
      role: String(raw.role) as TeamInvite["role"],
      email: raw.email ? String(raw.email) : null,
      expiresAt: String(raw.expires_at || ""),
      createdAt: String(raw.created_at || ""),
    };
  });
}

export async function createTeamInvite(context: WorkspaceContext, input: { role: TeamInvite["role"]; email?: string; expiresHours?: number }): Promise<CreatedTeamInvite> {
  const { client } = requireManagementWorkspace(context);
  const { data, error } = await client.rpc("create_organization_invite", {
    p_role: input.role,
    p_email: input.email?.trim() || null,
    p_expires_hours: input.expiresHours ?? 168,
  });
  if (error) throw new Error(error.message);
  if (!data || typeof data !== "object") throw new Error("Invite could not be created.");
  const raw = data as Record<string, unknown>;
  if (!raw.id || !raw.token) throw new Error("Invite response was incomplete.");
  return {
    id: String(raw.id),
    token: String(raw.token),
    role: String(raw.role) as CreatedTeamInvite["role"],
    email: raw.email ? String(raw.email) : null,
    expiresAt: String(raw.expires_at || ""),
    createdAt: new Date().toISOString(),
  };
}

export async function revokeTeamInvite(context: WorkspaceContext, inviteId: string) {
  const { client } = requireManagementWorkspace(context);
  const { error } = await client.rpc("revoke_organization_invite", { p_invite_id: inviteId });
  if (error) throw new Error(error.message);
}

export async function updateTeamMemberRole(context: WorkspaceContext, userId: string, role: Exclude<TeamRole, "owner">) {
  const { client } = requireManagementWorkspace(context);
  const { error } = await client.rpc("update_organization_member_role", { p_user_id: userId, p_role: role });
  if (error) throw new Error(error.message);
}

export async function removeTeamMember(context: WorkspaceContext, userId: string) {
  const { client } = requireManagementWorkspace(context);
  const { error } = await client.rpc("remove_organization_member", { p_user_id: userId });
  if (error) throw new Error(error.message);
}

export async function acceptTeamInvite(token: string) {
  const client = getSupabaseBrowserClient();
  if (!client) throw new Error("Production authentication is not configured on this deployment.");
  const normalized = token.trim();
  if (normalized.length < 32) throw new Error("This invitation link is invalid.");
  const { data, error } = await client.rpc("accept_organization_invite", { p_token: normalized });
  if (error) throw new Error(error.message);
  return data;
}
