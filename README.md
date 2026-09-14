# Munaffa — Cinematic Hospitality Experience

This repository is a fresh rebuild based on six user-supplied reference videos showing premium hotel, café, architectural walkthrough, product and AR-menu experiences.

## Direction

The implementation deliberately does **not** reuse the previous Munaffa visual system. It uses a hybrid approach:

- photoreal full-screen WebGL image portals for venue realism;
- scroll-driven 3D camera travel and parallax;
- floating product imagery inside the WebGL world;
- minimal editorial DOM typography over the experience;
- functioning interactive menu/cart/order demo;
- functioning camera-based AR-style ingredient lens with a clear non-recognition disclaimer;
- functioning illustrative profit exposure simulator;
- mobile, reduced-motion and WebGL fallbacks;
- privacy, terms, custom 404, sitemap, robots, security headers and health endpoint.

## Development

```bash
npm install
npm run dev
npm run typecheck
npm run build
```

## Prototype boundaries

The menu does not process real payments, the AR lens does not perform automated food recognition, and the profit scenario does not claim savings or customer outcomes. Before commercial launch, replace remote prototype imagery with an approved first-party asset pipeline and connect production authentication, data, analytics and form persistence as needed.
