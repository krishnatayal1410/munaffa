# Munaffa Supabase setup

Apply migrations in numeric order to a fresh Supabase project:

1. `001_initial_workspace.sql` — core account/workspace tables, RLS baseline and onboarding RPCs.
2. `002_rls_hardening.sql` — non-recursive organization membership helpers, policies and indexes.
3. `003_demo_requests.sql` — protected demo/contact lead storage.
4. `004_onboarding_role_security.sql` — separates primary operating role from RBAC authorization and prevents onboarding-based role escalation.
5. `005_operational_core.sql` — multi-tenant service tasks, inventory masters/count events and guest-recovery records with role-based RLS and immutable audit identity.
6. `006_workspace_context_ids.sql` — exposes authenticated organization/property IDs required by production modules without weakening RLS.
7. `007_financial_ledger.sql` — append-only revenue/expense events, finance-role RLS and management-only voiding for recorded contribution reporting.
8. `008_team_invites.sql` — hashed, expiring team invites plus owner/manager membership administration with manager-role escalation protections.

After applying all migrations:

- Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` for browser authentication.
- Set `SUPABASE_SERVICE_ROLE_KEY` **server-side only** for `/api/leads`.
- Configure Supabase Auth Site URL and redirect URLs for the final production/preview domains, including `/auth/sign-in`, `/auth/update-password` and invite-return URLs.
- Keep email confirmation enabled for production unless there is a deliberate alternative verification policy.
- Test a new-account path, password recovery, onboarding, repeat sign-in and a non-owner invited-member path before accepting real customers.
- Test migrations `005` through `008` with at least two separate organizations: users must never see another organization's tasks, inventory counts, feedback, financial entries, members or invitations.
- Treat `inventory_counts` as append-only audit events. A correction should create a new count; management may delete an invalid event when necessary.
- Treat `financial_entries` as an append-only ledger. A correction should void the original entry and create a new corrected entry; amount/category/source/tenant/timestamp fields cannot be rewritten.
- Verify finance permissions separately: owner/manager/cashier may read and record financial entries; only owner/manager may void an entry.
- Verify team permissions separately: owner/manager may manage ordinary staff invites/members, but only the owner may invite, promote, demote, revoke or remove a manager. The owner cannot be removed or reassigned through the team RPCs.
- Treat invite URLs as bearer secrets. The database stores only SHA-256 token hashes; the raw token is returned once when an invite is created. Revoke and recreate a link if it is exposed.
- Do not claim an invite email was sent until a real email-delivery integration exists. The current product deliberately generates a secure link for the manager/owner to share.

Do not ship a service-role key to the browser. Do not use the UI-selected `primary_role` as an authorization decision; authorization comes from `organization_members.role`.

## Current production-mode data paths

When Supabase mode is configured and migrations are applied:

- **Overview** computes operational attention indicators from real tenant-scoped Operations, Inventory and Guest Recovery records. It deliberately does not fabricate revenue or occupancy.
- **Operations** reads, creates and advances real `operational_tasks`.
- **Inventory** manages real `inventory_items` and append-only `inventory_counts`.
- **Guests** captures real `guest_feedback` and role-protected recovery status.
- **Profit** reads and records real `financial_entries` for the current month and reports **recorded contribution** (active recorded revenue minus active recorded expenses). This is not presented as an audited P&L.
- **Munaffa AI** uses deterministic, permission-aware analysis over the authenticated user's allowed production records. It does not call an external generative model or export workspace records to one.
- **Team** lists real memberships, manages permitted roles, creates/revokes hashed expiring invitation links and accepts invitations only after authentication plus explicit user confirmation.
- **Notifications** are computed from permitted production Operations, Inventory and Guest Recovery records rather than fixed demo alerts.

Demo mode remains browser-local and intentionally uses illustrative records rather than silently mixing sample and production data.
