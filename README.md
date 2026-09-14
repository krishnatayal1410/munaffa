# Munaffa — Hospitality Profit OS

Munaffa is being rebuilt as an AI-powered operating system for hospitality businesses: hotels, restaurants, cafés/QSRs, cloud kitchens, resorts, bars/lounges and related operators.

## Included in this rebuild

- Cinematic scroll-driven marketing homepage
- Persistent React Three Fiber world
- Real licensed furniture models instead of primitive box furniture
- Hotel, restaurant, café and operations visual stages
- HDRI environment lighting
- Multi-industry product positioning
- Product / Industries / Pricing / Resources / About pages
- Sign up, sign in and password-reset UX
- Persistent browser demo profile
- Four-step onboarding wizard
- Hospitality type + role selection
- Property/outlet setup
- Guided first-run tutorial
- Working dashboard shell
- Operations, inventory, profit, guests, AI and settings modules
- Honest demo-data labeling
- Reduced-motion support and responsive layouts

## Production boundary

The current authentication/session implementation is intentionally a local browser demo. It makes the full flow testable without pretending that a secure backend exists. Before public launch, replace `lib/demoWorkspace.ts` with production authentication and persistence, then connect verified property data and integrations.

## 3D asset provenance

The current web prototype loads furniture assets from the public `Teetertater/Floorplan2Walkthru` repository. That project documents its furniture library as CC-licensed and identifies Poly Haven as a source for a subset of its assets. The HDR environment is `warm_restaurant` from Poly Haven.

Before commercial hardening, vendor every approved model and texture into Munaffa-controlled storage, optimize it for the web, and retain exact per-asset license records instead of depending on third-party raw URLs.

## Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

Production checks:

```bash
npm run typecheck
npm run build
```

## Launch-critical work after design approval

1. Vendor and optimize final GLB/glTF assets using Draco/Meshopt/KTX2 where useful.
2. Connect real production authentication and role-based access.
3. Add persistent data for organizations, properties/outlets, users, rooms/services/menu, orders/bookings, inventory, costs, payments and guest profiles.
4. Replace demo analytics with verified event/data pipelines.
5. Add payment, POS, channel-manager and supplier integrations only when actually implemented.
6. Test the 3D experience on physical low/mid/high-end mobile and desktop GPUs.
7. Build the mobile app against the same domain/API contracts after the web experience and product flow are approved.
