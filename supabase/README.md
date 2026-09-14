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
9. `009_multi_property.sql` — active-property selection, property creation, active-location settings updates and multi-location workspace context.
10. `010_food_service_core.sql` — production menu/categories, recipe standards, staff orders/KDS status transitions and append-only theoretical ingredient movements when orders are completed.
11. `011_guest_qr_ordering.sql` — app-free guest ordering points with hashed bearer tokens, sanitized public menu RPCs, bounded public order creation and the same production KDS/order tables.
12. `012_ordering_point_rotation_and_status.sql` — immediate QR-secret rotation plus guest status lookup constrained to the exact ordering point that created the order.
13. `013_order_billing_and_payments.sql` — order bills, manually recorded settlement events and an append-only bridge from each captured settlement to exactly one financial revenue entry.

After applying all migrations:

- Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` for browser authentication and the public `/order/<token>` experience.
- Set `SUPABASE_SERVICE_ROLE_KEY` **server-side only** for `/api/leads`.
- Configure Supabase Auth Site URL and redirect URLs for the final production/preview domains, including `/auth/sign-in`, `/auth/update-password` and invite-return URLs.
- Keep email confirmation enabled for production unless there is a deliberate alternative verification policy.
- Test a new-account path, password recovery, onboarding, repeat sign-in and a non-owner invited-member path before accepting real customers.
- Test migrations `005` through `013` with at least two separate organizations: users must never see another organization's tasks, inventory counts/movements, feedback, financial entries, bills/payments, members, invitations, properties, menu items, recipes, orders or ordering points.
- Test at least two properties inside the same organization and verify that switching the active location changes the property scope for Operations, Menu & Orders, Guest QR, Inventory, Guests, Profit and grounded intelligence without merging records from the other property.
- Treat `inventory_counts` as append-only physical audit events. A correction should create a new count; management may delete an invalid event when necessary.
- Treat `inventory_movements` as append-only expected-stock events. Completing an order creates negative `order_usage` movements from recipe standards; physical stock is never rewritten by order completion.
- Verify idempotency by completing an order once and confirming that each recipe ingredient receives at most one `order_usage` movement for that order. Finalized orders must not be reopened through the production RPC.
- Treat recipes as theoretical standards, not measured plate consumption. A recipe line says what the item **should** consume; physical counts are what the restaurant **actually observes** later.
- Treat `financial_entries` as an append-only ledger. A correction should void the original entry and create a new corrected entry; amount/category/source/tenant/timestamp fields cannot be rewritten.
- Verify finance permissions separately: owner/manager/cashier may read and record financial entries; only owner/manager may void an entry.
- Verify billing separately: bill tax/service-charge/discount values are explicit recorded amounts, not inferred tax advice. After the first captured payment, bill amounts lock. A recorded payment may not exceed the remaining balance.
- Every captured `order_payment` must have exactly one linked `financial_entries` row with `source='payment'`. Voiding a payment must void the linked revenue entry and recompute the bill balance/status; it must not delete either audit event.
- Order settlement is **recording**, not processing. Cash/card/UPI/bank/other means staff says that money was already received. No card authorization, UPI collect request, gateway capture or bank settlement API is performed by migration `013`.
- Verify food-service permissions separately: owner/manager manage the menu; owner/manager/kitchen/inventory maintain recipe standards; owner/manager/front-desk/cashier/waiter/kitchen may create staff orders; kitchen/service transitions are constrained again inside `set_staff_order_status`.
- Verify guest QR permissions separately: only owner/manager may create, disable, enable or rotate an ordering point. Anonymous guests receive only sanitized active-menu data through `resolve_guest_ordering_point`; they do not receive direct table access.
- Treat QR ordering URLs as bearer secrets. `ordering_points` stores only SHA-256 token hashes; the raw token is returned only after creation or rotation. Rotate immediately if a QR/link is exposed outside its intended table/room/counter.
- Test rotation: scan the old QR, rotate the point, and verify that the old public menu/order link fails while the newly rendered QR works.
- Test the full guest loop: scan QR → active menu → create guest order → verify the order appears in the same production KDS marked `Guest QR` → advance statuses → verify the guest page reflects status → complete the order → verify theoretical `order_usage` movements are created once.
- Test the settlement loop: create/review bill → record partial/full settlement → verify bill balance/status → verify Profit revenue refreshes → void a settlement as owner/manager → verify its linked revenue entry becomes voided and recorded contribution recalculates.
- Public guest-order abuse controls are guardrails, not a complete anti-abuse system: each order is bounded by line count, item quantity and subtotal, and each ordering point caps recent concurrent open guest orders. Add edge/WAF rate limiting before high-volume public rollout.
- Guest QR does **not** collect payment. It submits the venue's menu subtotal into the service queue. Billing/settlement is performed later by authorized staff unless a verified external payment integration is added.
- Verify team permissions separately: owner/manager may manage ordinary staff invites/members, but only the owner may invite, promote, demote, revoke or remove a manager. The owner cannot be removed or reassigned through the team RPCs.
- Treat invite URLs as bearer secrets. The database stores only SHA-256 token hashes; the raw token is returned once when an invite is created. Revoke and recreate a link if it is exposed.
- Do not claim an invite email was sent until a real email-delivery integration exists. The current product deliberately generates a secure link for the manager/owner to share.
- The current membership model is organization-wide. All organization members may switch among organization properties they can read. Property-specific staff assignments are a separate access-control layer and must not be implied until implemented.

Do not ship a service-role key to the browser. Do not use the UI-selected `primary_role` as an authorization decision; authorization comes from `organization_members.role`.

## Current production-mode data paths

When Supabase mode is configured and migrations are applied:

- **Overview** computes operational attention indicators from real tenant-scoped Operations, Inventory and Guest Recovery records for the active property. It deliberately does not fabricate revenue or occupancy.
- **Locations** lists organization properties/outlets, lets members choose an active location and lets owners/managers create a new hotel, restaurant, café, QSR, cloud kitchen, resort, lounge or other hospitality property.
- **Operations** reads, creates and advances real `operational_tasks` scoped to the active property.
- **Menu & Orders** manages real menu categories/items, recipe standards and staff/guest-created orders. Its KDS/service queue uses server-validated status transitions and visibly tags orders created by Guest QR. Completing an order writes theoretical recipe consumption to `inventory_movements` exactly once per ingredient/order.
- **Guest QR** lets owners/managers create table/room/counter ordering points, render the QR locally in the browser, disable or rotate its secret, and expose an app-free public `/order/<token>` flow. Guest orders enter the same production KDS and guests can check the status of only orders created through that exact QR point.
- **Inventory** manages real `inventory_items`, append-only physical `inventory_counts`, and expected stock calculated as opening theoretical quantity plus append-only inventory movements. Variance is physical count minus expected stock and is never labelled theft automatically.
- **Guests** captures real `guest_feedback` and role-protected recovery status scoped to the active property.
- **Profit** combines the append-only financial ledger with order billing/settlement. Captured recorded settlements automatically create linked revenue events; manual finance entries remain available for authoritative non-order events. Recorded contribution is operational, not an audited P&L.
- **Munaffa AI** uses deterministic, permission-aware analysis over the authenticated user's allowed active-property records. It does not call an external generative model or export workspace records to one.
- **Team** lists real memberships, manages permitted roles, creates/revokes hashed expiring invitation links and accepts invitations only after authentication plus explicit user confirmation.
- **Notifications** are computed from permitted production Operations, Inventory and Guest Recovery records for the active property rather than fixed demo alerts.
- **Settings** updates the organization and currently active property instead of silently modifying the oldest property in a multi-location organization.

Demo mode remains browser-local and intentionally uses illustrative records rather than silently mixing sample and production data.
