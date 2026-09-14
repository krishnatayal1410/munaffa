# Munaffa Supabase setup

Apply migrations in numeric order to a fresh Supabase project:

1. `001_initial_workspace.sql` — core account/workspace tables, RLS baseline and onboarding RPCs.
2. `002_rls_hardening.sql` — non-recursive organization membership helpers, policies and indexes.
3. `003_demo_requests.sql` — protected demo/contact lead storage.
4. `004_onboarding_role_security.sql` — separates primary operating role from RBAC authorization and prevents onboarding-based role escalation.
5. `005_operational_core.sql` — multi-tenant service tasks, inventory masters/count events and guest-recovery records with role-based RLS and immutable audit identity.

After applying all migrations:

- Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` for browser authentication.
- Set `SUPABASE_SERVICE_ROLE_KEY` **server-side only** for `/api/leads`.
- Configure Supabase Auth Site URL and redirect URLs for the final production/preview domains.
- Keep email confirmation enabled for production unless there is a deliberate alternative verification policy.
- Test a new-account path, password recovery, onboarding, repeat sign-in and a non-owner invited-member path before accepting real customers.
- Test `005` with at least two separate organizations before connecting the production operations UI: members must not see another organization's tasks, stock counts or feedback.
- Treat `inventory_counts` as append-only audit events. A correction should create a new count; management may delete an invalid event when necessary.

Do not ship a service-role key to the browser. Do not use the UI-selected `primary_role` as an authorization decision; authorization comes from `organization_members.role`.

The current product UI still labels operations, inventory, profit and guest records as sample/illustrative until these production tables are explicitly wired and verified. Applying the schema alone does not turn sample values into production data.
