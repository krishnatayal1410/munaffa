# Munaffa — Restaurant Profit & Operations OS

Munaffa is an India-first operating system for independent restaurants, cafés and QSRs. The core product story is one connected flow:

**Guest → Order → Kitchen → Recipes → Inventory → Billing → CRM → Profit Intelligence**

## Cinematic homepage direction

The homepage uses spatial scroll storytelling without decorative 3D geometry.

- photoreal restaurant and hospitality imagery;
- CSS-perspective camera movement and depth transitions;
- real Munaffa product UI surfaces moving through the scene;
- no random spheres, tunnels, floating primitives or fake product models;
- scroll-linked chapter progression with reversible motion;
- pointer parallax on desktop and simplified mobile composition;
- reduced-motion handling;
- working guest ordering demo;
- working profit exposure simulator;
- deep links into the existing Munaffa OS routes.

## Product positioning

**Know where every rupee goes.**

Munaffa connects guest ordering, kitchen execution, recipe costing, stock movement, purchasing, billing, guest memory and owner-level profit visibility so operators can understand where contribution may be leaking.

Initial customer focus: independent owner-led restaurants, cafés, QSRs and small groups, usually 1–5 outlets and roughly 20–100 seats/tables, India/NCR first.

## Prototype routes already preserved

The repository includes product, ordering, dashboard/console, demo, auth and API surfaces. The homepage rebuild does not remove those flows.

## Development

```bash
npm install
npm run typecheck
npm run build
npm run dev
```

## Prototype boundaries

Current ordering/payment and profitability figures are demo/illustrative unless connected to production restaurant data. Before commercial launch, connect production authentication, persistent shared data, payments/POS, approved first-party imagery, analytics and required integrations.
