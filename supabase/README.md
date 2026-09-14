# Munaffa Supabase setup

Apply migrations in numeric order to a fresh Supabase project:

1. `001_initial_workspace.sql` — core account/workspace tables, RLS baseline and onboarding RPCs.
2. `002_rls_hardening.sql` — non-recursive organization membership helpers, policies and indexes.
3. `003_demo_requests.sql` — protected demo/contact lead storage.
4. `004_onboarding_role_security.sql` — separates primary operating role from RBAC authorization and prevents onboarding-based role escalation.

After applying all migrations:

- Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` for browser authentication.
- Set `SUPABASE_SERVICE_ROLE_KEY` **server-side only** for `/api/leads`.
- Configure Supabase Auth Site URL and redirect URLs for the final production/preview domains.
- Keep email confirmation enabled for production unless there is a deliberate alternative verification policy.
- Test a new-account path, password recovery, onboarding, repeat sign-in and a non-owner invited-member path before accepting real customers.

Do not ship a service-role key to the browser. Do not use the UI-selected `primary_role` as an authorization decision; authorization comes from `organization_members.role`.
