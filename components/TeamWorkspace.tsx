"use client";

import { Check, Copy, Link2, RefreshCw, ShieldCheck, Trash2, UserPlus, Users } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getCurrentUser, type WorkspaceContext } from "@/lib/workspaceBackend";
import {
  createTeamInvite,
  listTeamInvites,
  listTeamMembers,
  removeTeamMember,
  revokeTeamInvite,
  updateTeamMemberRole,
  type CreatedTeamInvite,
  type TeamInvite,
  type TeamMember,
  type TeamRole,
} from "@/lib/teamBackend";

const staffRoles: Exclude<TeamRole, "owner">[] = ["manager", "front-desk", "cashier", "waiter", "kitchen", "inventory"];

export function TeamWorkspace({ workspace }: { workspace: WorkspaceContext }) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invites, setInvites] = useState<TeamInvite[]>([]);
  const [currentUserId, setCurrentUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteRole, setInviteRole] = useState<Exclude<TeamRole, "owner">>(workspace.authorizationRole === "owner" ? "manager" : "front-desk");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteHours, setInviteHours] = useState(168);
  const [creating, setCreating] = useState(false);
  const [createdInvite, setCreatedInvite] = useState<CreatedTeamInvite | null>(null);
  const [copied, setCopied] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const canManageManagers = workspace.authorizationRole === "owner";

  const roleOptions = useMemo(() => canManageManagers ? staffRoles : staffRoles.filter((role) => role !== "manager"), [canManageManagers]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [memberRows, inviteRows, current] = await Promise.all([
        listTeamMembers(workspace),
        listTeamInvites(workspace),
        getCurrentUser(),
      ]);
      setMembers(memberRows);
      setInvites(inviteRows);
      setCurrentUserId(current?.id || "");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load the team workspace.");
    } finally {
      setLoading(false);
    }
  }, [workspace]);

  useEffect(() => { void refresh(); }, [refresh]);

  async function createInvite() {
    if (!roleOptions.includes(inviteRole)) return;
    setCreating(true);
    setError("");
    setCreatedInvite(null);
    setCopied(false);
    try {
      const created = await createTeamInvite(workspace, {
        role: inviteRole,
        email: inviteEmail,
        expiresHours: inviteHours,
      });
      setCreatedInvite(created);
      setInvites((current) => [{ id: created.id, role: created.role, email: created.email, expiresAt: created.expiresAt, createdAt: created.createdAt }, ...current]);
      setInviteEmail("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not create this invitation.");
    } finally {
      setCreating(false);
    }
  }

  function inviteUrl(invite: CreatedTeamInvite) {
    if (typeof window === "undefined") return `/invite/${invite.token}`;
    return `${window.location.origin}/invite/${invite.token}`;
  }

  async function copyInvite() {
    if (!createdInvite) return;
    try {
      await navigator.clipboard.writeText(inviteUrl(createdInvite));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setError("The browser blocked clipboard access. Copy the invite link manually.");
    }
  }

  async function changeRole(member: TeamMember, role: Exclude<TeamRole, "owner">) {
    if (member.userId === currentUserId || member.role === "owner") return;
    setUpdatingId(member.userId);
    setError("");
    try {
      await updateTeamMemberRole(workspace, member.userId, role);
      setMembers((current) => current.map((item) => item.userId === member.userId ? { ...item, role } : item));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not update this member role.");
    } finally {
      setUpdatingId(null);
    }
  }

  async function remove(member: TeamMember) {
    if (member.userId === currentUserId || member.role === "owner") return;
    if (typeof window !== "undefined" && !window.confirm(`Remove ${member.fullName} from ${workspace.organizationName}?`)) return;
    setUpdatingId(member.userId);
    setError("");
    try {
      await removeTeamMember(workspace, member.userId);
      setMembers((current) => current.filter((item) => item.userId !== member.userId));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not remove this team member.");
    } finally {
      setUpdatingId(null);
    }
  }

  async function revoke(invite: TeamInvite) {
    setRevokingId(invite.id);
    setError("");
    try {
      await revokeTeamInvite(workspace, invite.id);
      setInvites((current) => current.filter((item) => item.id !== invite.id));
      if (createdInvite?.id === invite.id) setCreatedInvite(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not revoke this invite.");
    } finally {
      setRevokingId(null);
    }
  }

  return <div className="module-page interactive-workspace team-workspace">
    <div className="module-heading"><Users size={24}/><div><span className="kicker">Team & access</span><h2>Give people only the access their job needs.</h2><p>Membership authorization is separate from a person’s preferred operating role. Invite links expire, can be email-restricted, and are stored server-side only as hashes.</p></div></div>

    <div className="team-summary"><article><small>Active members</small><b>{loading ? "—" : members.length}</b></article><article><small>Pending invites</small><b>{loading ? "—" : invites.length}</b></article><article><small>Your authorization</small><b>{workspace.authorizationRole.replace("-", " ")}</b></article><div><button type="button" onClick={() => void refresh()} disabled={loading}><RefreshCw size={14}/>Refresh</button><button type="button" className="primary-action" onClick={() => setInviteOpen((open) => !open)}><UserPlus size={14}/>Invite teammate</button></div></div>

    {inviteOpen && <section className="team-invite-form"><div className="settings-two"><label>Role<select value={inviteRole} onChange={(event) => setInviteRole(event.target.value as Exclude<TeamRole, "owner">)}>{roleOptions.map((role) => <option value={role} key={role}>{role.replace("-", " ")}</option>)}</select></label><label>Restrict to email (optional)<input type="email" value={inviteEmail} maxLength={320} onChange={(event) => setInviteEmail(event.target.value)} placeholder="teammate@business.com"/></label></div><label>Invite expiry<select value={inviteHours} onChange={(event) => setInviteHours(Number(event.target.value))}><option value={24}>24 hours</option><option value={72}>3 days</option><option value={168}>7 days</option><option value={336}>14 days</option><option value={720}>30 days</option></select></label><div className="privacy-hint"><ShieldCheck size={14}/><span>Munaffa creates a secure link for you to share. This screen does <b>not</b> claim an email was sent. The raw invite secret is shown only when the invite is created and cannot be recovered from the database later.</span></div><div className="production-form-actions"><button type="button" onClick={() => setInviteOpen(false)}>Close</button><button className="primary-action" type="button" disabled={creating || !roleOptions.includes(inviteRole)} onClick={() => void createInvite()}>{creating ? "Creating…" : "Create secure invite"}</button></div></section>}

    {createdInvite && <section className="created-invite"><div><Link2 size={17}/><span><small>One-time invite link</small><b>{createdInvite.email ? `Restricted to ${createdInvite.email}` : `Anyone with this link can accept as ${createdInvite.role.replace("-", " ")} until expiry.`}</b></span></div><div className="invite-link-row"><input readOnly value={inviteUrl(createdInvite)} aria-label="Secure team invite link"/><button type="button" onClick={() => void copyInvite()}>{copied ? <Check size={14}/> : <Copy size={14}/>} {copied ? "Copied" : "Copy"}</button></div><small>Expires {new Date(createdInvite.expiresAt).toLocaleString("en-IN")}. If this link is exposed accidentally, revoke it below and create a replacement.</small></section>}

    {error && <div className="form-error production-error" role="alert">{error}</div>}

    <section className="team-panel"><header><div><small>Members</small><h3>People with workspace access</h3></div></header>{loading ? <div className="team-empty">Loading members…</div> : members.length === 0 ? <div className="team-empty">No memberships were returned.</div> : <div className="team-member-list">{members.map((member) => {
      const isYou = member.userId === currentUserId;
      const lockedManager = workspace.authorizationRole === "manager" && member.role === "manager";
      const canEdit = member.role !== "owner" && !isYou && !lockedManager;
      return <article key={member.userId}><div className="team-avatar">{member.fullName.slice(0, 1).toUpperCase()}</div><div className="team-member-copy"><b>{member.fullName}{isYou ? " · You" : ""}</b><small>Joined {member.joinedAt ? new Date(member.joinedAt).toLocaleDateString("en-IN") : "workspace"}</small></div><div className="team-member-role">{member.role === "owner" ? <span className="role-badge owner">Owner</span> : canEdit ? <select value={member.role} disabled={updatingId === member.userId} onChange={(event) => void changeRole(member, event.target.value as Exclude<TeamRole, "owner">)}>{roleOptions.map((role) => <option key={role} value={role}>{role.replace("-", " ")}</option>)}{member.role === "manager" && !roleOptions.includes("manager") && <option value="manager">manager</option>}</select> : <span className="role-badge">{member.role.replace("-", " ")}</span>}</div><div className="team-member-actions">{canEdit && <button type="button" className="danger-action" disabled={updatingId === member.userId} onClick={() => void remove(member)}><Trash2 size={13}/>Remove</button>}</div></article>;
    })}</div>}</section>

    <section className="team-panel"><header><div><small>Pending invitations</small><h3>Unused secure invite links</h3></div></header>{loading ? <div className="team-empty">Loading invites…</div> : invites.length === 0 ? <div className="team-empty">No active invitations.</div> : <div className="team-invite-list">{invites.map((invite) => <article key={invite.id}><div><b>{invite.email || "Unrestricted email"}</b><small>{invite.role.replace("-", " ")} · expires {new Date(invite.expiresAt).toLocaleString("en-IN")}</small></div><button type="button" disabled={revokingId === invite.id || (workspace.authorizationRole !== "owner" && invite.role === "manager")} onClick={() => void revoke(invite)}>{revokingId === invite.id ? "Revoking…" : "Revoke"}</button></article>)}</div>}</section>

    <div className="demo-notice production-notice"><ShieldCheck size={15}/><span>Authorization comes from the server-side membership role, not from UI labels. An owner cannot be removed or reassigned through this screen, and managers cannot create, promote, revoke or remove other managers.</span></div>
  </div>;
}
