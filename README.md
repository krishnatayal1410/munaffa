# Munaffa — Hospitality Profit OS

Munaffa is an AI-powered operating-system concept for hospitality businesses: hotels, restaurants, cafés/QSRs, cloud kitchens, resorts, bars/lounges and related operators.

The current repository contains both a cinematic public website and an interactive product workspace. Demo/illustrative values are intentionally labelled and are not presented as real customer results.

## What is implemented

### Public experience
- Immersive scroll-driven homepage with GSAP ScrollTrigger
- Persistent React Three Fiber hospitality world
- Architectural hotel, restaurant, café, operations and profit-command zones
- Real CC0 furniture assets instead of primitive furniture
- Poly Haven CC0 HDR environment lighting
- Curved scroll-driven camera path and operational data-flow particles
- Adaptive desktop/mobile rendering quality
- WebGL detection and graceful fallback
- System + manual reduced-motion support
- Story-progress navigation rail
- Product, Industries, Pricing, Resources, About, Demo and Contact pages
- Privacy and Terms launch-stage drafts
- Page-level metadata
- Responsive navigation and footer

### Account + onboarding
- Sign up / sign in
- Forgot-password + secure update-password flow
- Four-step onboarding
- Hospitality business type selection
- Role selection
- Property/outlet creation
- Module selection
- Guided first-run tutorial

### Interactive workspace
- Overview
- Operations queue with state transitions
- Inventory recount with theoretical-vs-physical variance
- Interactive contribution/profit model
- Guest-feedback / service-recovery flow
- Deterministic sample Munaffa AI console
- Settings sample state

### Production backend path
The same UI automatically switches between two modes:

1. **Demo mode** — when Supabase environment variables are absent, safe local browser demo state is used.
2. **Production account mode** — when Supabase is configured, authentication and workspace setup use Supabase.

Implemented backend building blocks:
- Supabase browser auth adapter
- User/workspace backend abstraction
- Organization, membership, property and workspace settings schema
- Row Level Security and hardened membership helpers
- Server-side validated demo/contact lead API
- Protected `demo_requests` table

Operational POS/PMS/payment/inventory integrations are **not** implemented yet. Dashboard operating metrics remain illustrative until verified external data is connected.

## Environment variables

Copy `.env.example` and configure as needed:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

`SUPABASE_SERVICE_ROLE_KEY` is server-only. Never expose it through a `NEXT_PUBLIC_` variable or client component.

## Supabase setup

Create a Supabase project and apply the migrations in order:

```text
supabase/migrations/001_initial_workspace.sql
supabase/migrations/002_rls_hardening.sql
supabase/migrations/003_demo_requests.sql
```

Then configure the public URL/anon key for account auth and the server-only service-role key for demo/contact lead storage.

Configure the appropriate Site URL / redirect URLs in Supabase Auth for the production domain before enabling email confirmation/password recovery.

## 3D asset provenance

See [`THIRD_PARTY_ASSETS.md`](./THIRD_PARTY_ASSETS.md).

The current development build references 1K model files from a public GitHub mirror whose asset identifiers correspond to Poly Haven CC0 assets. Before significant production traffic, download approved source assets from Poly Haven, optimize them, and host them in Munaffa-controlled storage/CDN rather than depending on third-party raw URLs.

## Development

Requirements: Node.js 22+

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

Production verification:

```bash
npm run typecheck
npm run build
```

GitHub Actions runs both checks on every `main` push. Stale in-progress builds are cancelled automatically.

## Vercel deployment

The repository is production-buildable, but deploying still requires an authorized Vercel project/account connection.

Recommended production configuration:
1. Import `krishnatayal1410/munaffa` into Vercel.
2. Use Node.js 22.
3. Add the required environment variables in Production and Preview as appropriate.
4. Set the production domain.
5. Update Supabase Auth Site URL and allowed redirect URLs to that domain.
6. Deploy `main` only after GitHub CI is green.
7. Test sign-up, email confirmation, sign-in, password reset, onboarding and `/api/leads` end to end.

## Still required before accepting paying customers

- Run the SQL migrations in a real Supabase project and perform an RLS/security review.
- Connect verified POS/PMS/order/payment/inventory sources rather than sample metrics.
- Add production audit logging and organization invitation/member management.
- Add rate limiting / bot protection for public lead endpoints.
- Add transactional email and support operations.
- Vendor and optimize the final 3D asset set into first-party storage.
- Test physical low/mid/high-end mobile and desktop GPUs.
- Finalize Privacy Policy, Terms and commercial customer terms with legal counsel for the actual legal entity/jurisdictions.
- Validate pricing with real design partners rather than treating the current tiers as proven willingness-to-pay.
- Build the mobile app against the same domain/API contracts after the web product flow is locked.
