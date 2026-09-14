# Munaffa Supabase setup

Apply migrations in numeric order to a fresh Supabase project:

1. `001_initial_workspace.sql` — core account/workspace tables, RLS baseline and onboarding RPCs.
2. `002_rls_hardening.sql` — non-recursive organization membership helpers, policies and indexes.
3. `003_demo_requests.sql` — protected demo/contact lead storage.
4. `004_onboarding_role_security.sql` — separates primary operating role from RBAC authorization and prevents onboarding-based role escalation.
5. `005_operational_core.sql` — multi-tenant service tasks, inventory masters/count events and guest-recovery records with role-based RLS and immutable audit identity.
6. `006_workspace_context_ids.sql` — exposes the authenticated organization/property IDs required by production modules without weakening RLS.
7. `007_financial_ledger.sql` — append-only revenue/expense events, finance-role RLS and management-only voiding for recorded contribution reporting.

After applying all migrations:

- Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` for browser authentication.
- Set `SUPABASE_SERVICE_ROLE_KEY` **server-side only** for `/api/leads`.
- Configure Supabase Auth Site URL and redirect URLs for the final production/preview domains.
- Keep email confirmation enabled for production unless there is a deliberate alternative verification policy.
- Test a new-account path, password recovery, onboarding, repeat sign-in and a non-owner invited-member path before accepting real customers.
- Test migrations `005` through `007` with at least two separate organizations: users must never see another organization's tasks, inventory counts, feedback or financial entries.
- Treat `inventory_counts` as append-only audit events. A correction should create a new count; management may delete an invalid event when necessary.
- Treat `financial_entries` as an append-only ledger. A correction should void the original entry and create a new corrected entry; amount/category/source/tenant/timestamp fields cannot be rewritten.
- Verify finance permissions separately: owner/manager/cashier may read and record financial entries; only owner/manager may void an entry.

Do not ship a service-role key to the browser. Do not use the UI-selected `primary_role` as an authorization decision; authorization comes from `organization_members.role`.

## Current production-mode data paths

When Supabase mode is configured and migrations are applied:

- **Overview** computes operational attention indicators from real tenant-scoped Operations, Inventory and Guest Recovery records. It deliberately does not fabricate revenue or occupancy.
- **Operations** reads, creates and advances real `operational_tasks`.
- **Inventory** manages real `inventory_items` and append-only `inventory_counts`.
- **Guests** captures real `guest_feedback` and role-protected recovery status.
- **Profit** reads and records real `financial_entries` for the current month and reports **recorded contribution** (active recorded revenue minus active recorded expenses). This is not presented as an audited P&L.
- **Munaffa AI** remains an explicitly labelled deterministic sample until grounded retrieval, permissions and verified production sources are connected.

Demo mode remains browser-local and intentionally uses illustrative records rather than silently mixing sample and production data.
