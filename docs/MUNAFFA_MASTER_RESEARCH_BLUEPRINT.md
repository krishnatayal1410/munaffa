# Munaffa — Master Research, Product, Business & Immersive Experience Blueprint

**Status:** Research-first startup specification for the complete Munaffa rebuild.  
**Purpose:** Define what Munaffa is, why it should exist, how it makes money, what the immersive website must look and feel like, what the working product must do, how the system should be engineered, how the startup should be sold, and what must be ready for the business meeting/demo.

---

## 0. Executive decision

Munaffa should **not** begin as another generic restaurant POS or another hotel PMS. Those categories already contain mature incumbents such as Petpooja, Restroworks, Hotelogix, Stayflexi and new AI-first hotel tools. The initial strategic wedge should be a **Hospitality Profit Intelligence OS** that sits above or alongside existing operating systems and gives owners one answer that most software still makes hard to obtain:

> **Where is my profit going, why is it happening, and what should I do next?**

The product should connect the operational chain:

**Guest / booking / order → service / kitchen → recipe or service consumption → inventory → purchases → payment → guest feedback → cost / revenue → profit signal → recommended action**

The public-facing website must communicate this chain as a cinematic experience, not as a SaaS template. The product demo must prove that the idea is real by allowing a visitor or business owner to interact with a live, simulated operating workspace.

Munaffa therefore has two surfaces:

1. **Cinematic acquisition experience** — premium immersive scrolling website that makes the startup memorable.
2. **Operational product** — a real owner/manager workspace that demonstrates the business value.

---

# 1. Research conclusions

## 1.1 Why the market is attractive

India's hospitality and food-service sectors are large, growing and increasingly digital. IBEF projects continued expansion in tourism and hospitality, while recent food-service research points to strong organized-sector growth, especially QSR, cafés and cloud kitchens. The strategic implication is not simply “there are many restaurants,” but that more businesses are becoming digitally operated, multi-outlet and data-rich while still struggling to convert operating data into reliable unit economics.

Recent Indian hospitality commentary emphasizes several recurring demands:

- unified operations rather than disconnected tools;
- real-time visibility rather than month-end reports;
- digital ordering and guest self-service;
- inventory and procurement visibility;
- faster staff training and simpler workflows;
- AI as an operator assistant rather than a novelty;
- profitability and unit economics rather than order volume alone.

This aligns directly with Munaffa's opportunity.

## 1.2 Why not compete head-on with POS/PMS incumbents first

Current operators already have many options for billing, POS, PMS, channel management, inventory, QR ordering and CRM. Petpooja and Restroworks offer broad restaurant stacks. Hotelogix and Stayflexi cover hotel operations. Newer products are already adding AI assistants.

Replacing an incumbent operating system creates a high-friction sale because the buyer worries about:

- migration risk;
- staff retraining;
- hardware compatibility;
- aggregator integrations;
- billing disruption;
- accounting / GST workflows;
- historical data;
- downtime.

Munaffa's lower-friction wedge is therefore:

> **Connect to what the business already uses, create a normalized operating model, expose profit leakage, then progressively become the system of action.**

Over time Munaffa can absorb more operational modules, but it should earn that right through visibility and ROI first.

## 1.3 Research-backed web experience principles

Scrollytelling research shows that scroll can work well as a narrative control because the interaction is familiar while still giving users control over pace. The best reference experiences supplied for Munaffa use that principle at a cinematic level: instead of showing page sections, they reveal a sequence of spaces, products and transitions.

The new site must therefore be designed around **continuous narrative state**, not “section cards.”

Key experience rules:

- scrolling controls the narrative timeline;
- each scene must materially transform the visual world;
- large-scale camera or object motion should have purpose;
- text should explain what the viewer is seeing rather than compete with it;
- one visual hero at a time;
- quiet scenes are necessary between high-energy scenes;
- interaction should remain understandable without instructions;
- the page must support reduced motion and weak GPUs;
- the page must never become a blank black WebGL canvas.

## 1.4 Performance research conclusions

Immersive sites fail when the GPU workload is treated like desktop game development. Browser research and WebGL guidance reinforce several rules:

- keep draw calls low;
- instance repeated objects;
- reuse geometry/materials;
- avoid mounting/unmounting large Three.js graphs during scroll;
- compress glTF geometry using Draco or Meshopt where appropriate;
- use KTX2/Basis compressed GPU textures;
- load heavy scenes progressively;
- maintain a VRAM budget;
- reduce render resolution on weaker devices;
- avoid synchronous WebGL API stalls;
- keep the DOM and GPU render loops separated;
- never update React state at 60 FPS for scene transforms;
- use requestAnimationFrame / useFrame mutation for animation;
- measure INP in addition to initial load performance;
- preserve native scrolling and avoid aggressive scroll hijacking.

## 1.5 Accessibility conclusions

Large panning, zooming and scale motion can trigger vestibular discomfort. The experience must respect `prefers-reduced-motion` and provide a calmer presentation that preserves all information.

Reduced-motion mode should:

- stop camera fly-throughs;
- eliminate aggressive depth movement;
- replace transforms with fades/dissolves;
- allow conventional vertical navigation;
- keep all content and CTAs functional.

---

# 2. Product definition

## 2.1 Name

**Munaffa**

Meaning / positioning: profit, margin, operating intelligence.

## 2.2 Category

**Hospitality Profit Intelligence OS**

Long-term category ambition: **Hospitality Operating System for Profit**.

## 2.3 Target customers

Primary launch segment:

- independent restaurants;
- cafés;
- small restaurant groups;
- QSR outlets;
- cloud kitchens;
- boutique hotels / independent hotels with F&B operations.

Expansion segments:

- resorts;
- bars and lounges;
- multi-property hotel groups;
- franchises;
- food courts;
- caterers;
- co-living / serviced apartments with hospitality operations.

## 2.4 Economic buyer

Primary buyer:

- owner;
- founder;
- operating partner;
- general manager.

Secondary users:

- restaurant manager;
- hotel manager;
- inventory manager;
- chef / kitchen manager;
- cashier;
- front desk;
- procurement manager;
- accountant / finance lead;
- waiter / captain;
- housekeeping or service staff.

## 2.5 Core problem

Hospitality businesses often collect large amounts of operational data but still cannot answer, in real time:

- Which outlet is actually profitable today?
- Why did food cost move?
- Is stock variance caused by recipe usage, purchase price movement, waste, counting error or unexplained variance?
- Which menu items look popular but destroy margin?
- Which guest problems are costing repeat business?
- Are discounts helping revenue or hiding weak operations?
- Are supplier price changes eroding contribution?
- Is service speed damaging table turns or reviews?
- Which property deserves management attention right now?

Munaffa should make these questions visible and actionable.

---

# 3. Value proposition

## 3.1 One-line pitch

**Munaffa connects hospitality operations to profit, so owners can see where margin is leaking and what to fix next.**

## 3.2 Owner promise

Munaffa does not promise magical savings. It provides:

- one operational picture;
- traceable revenue and cost events;
- explainable variance;
- faster anomaly detection;
- actionable attention queues;
- less spreadsheet reconciliation;
- easier multi-outlet comparison;
- clearer unit economics.

## 3.3 Product moat direction

The moat is not “we have a dashboard.” It should become:

1. **Normalized hospitality event graph** — a common model across POS/PMS/order/inventory/payment systems.
2. **Operational provenance** — every financial number can be traced to the event that created it.
3. **Hospitality-specific anomaly models** — recipe variance, supplier drift, discount patterns, service bottlenecks, occupancy / outlet economics.
4. **Cross-property benchmark intelligence** — private benchmarking across a customer's own estate, then anonymous aggregate benchmarks only when legally and contractually allowed.
5. **Workflow action layer** — recommendations can turn into assigned tasks, approvals or checks.

---

# 4. What the immersive website must look like

## 4.1 Visual benchmark

The six uploaded reference videos are the visual benchmark. Their shared qualities are:

- real-looking environments;
- full-viewport storytelling;
- slow cinematic push-ins;
- architectural scale;
- macro food/product imagery;
- editorial type;
- object-led transitions;
- restrained UI;
- transitions that feel like camera direction, not component animation;
- premium use of darkness, cream, warm light and negative space;
- mobile-friendly but cinematic composition.

The new Munaffa experience must **not** look like:

- furniture on floating planes;
- primitive geometry rooms;
- a black 3D sandbox;
- a normal SaaS landing page with a rotating object;
- glass cards everywhere;
- random particles without narrative meaning;
- fake 3D generated only with CSS transforms.

## 4.2 Rendering strategy

The website should use a **hybrid rendering pipeline**.

### Layer A — photoreal cinematic media

Use Blender/Cycles or professionally licensed photographic/video assets for:

- hotel lobby;
- restaurant dining environment;
- café macro product scenes;
- kitchen cinematic shots;
- hotel room / resort sequences;
- ingredient macro closeups;
- premium architectural transitions.

Where possible, pre-render difficult photoreal scenes instead of forcing everything into realtime WebGL.

Formats:

- AV1 / WebM video;
- optimized MP4 fallback;
- AVIF / WebP image sequences;
- depth maps for parallax where useful.

### Layer B — real-time WebGL

Use Three.js / React Three Fiber for elements that benefit from interaction:

- Munaffa Core;
- profit leak visualization;
- ingredient explosion;
- payment / revenue flow;
- portal transitions;
- graph / signal networks;
- pointer-reactive product objects;
- AR-style dish / product viewer;
- optional 3D menu item previews.

### Layer C — DOM editorial interface

Use HTML/CSS/React for:

- all typography;
- buttons;
- navigation;
- forms;
- pricing;
- accessibility;
- product UI previews;
- menu/cart/order interactions.

This keeps type crisp and the product usable even if WebGL is unavailable.

---

# 5. Scroll narrative — complete homepage storyboard

The homepage should behave like a short interactive film.

## Scene 0 — Arrival

Visual: exterior or doorway of a premium hospitality venue. Very little UI. Slow forward camera movement.

Copy:

**Hospitality moves fast. Profit disappears quietly.**

Interaction: scroll begins the camera journey.

Goal: immediately establish that this is not a typical SaaS site.

## Scene 1 — Guest moment

Camera enters a real restaurant/hotel environment.

Small operational events appear almost invisibly:

- guest seated;
- room checked in;
- waiter takes order;
- QR scanned;
- service requested.

Narrative:

**Every guest interaction creates an operational event.**

## Scene 2 — Order

Macro transition into a phone / menu / order ticket.

User can interact with a real demo menu.

Functions:

- item selection;
- quantity;
- modifiers;
- cart;
- submit demo order;
- order state visible later in story.

## Scene 3 — Kitchen

The submitted order becomes the transition object.

Order ticket travels into kitchen / KDS environment.

States:

- new;
- preparing;
- ready;
- served.

Scroll drives transition; demo order state can also advance with UI controls.

## Scene 4 — Recipe / ingredient decomposition

Dish fills the viewport.

On scroll, dish ingredients separate spatially.

Each ingredient can show:

- recipe quantity;
- current ingredient cost;
- theoretical contribution to plate cost;
- allergen / diet tags where applicable.

Important wording:

This is theoretical consumption based on recipe standard, not physical measurement per dish.

## Scene 5 — Inventory / purchase

Ingredients visually transition into inventory / receiving environment.

Show:

- opening theoretical stock;
- purchase receipts;
- theoretical consumption;
- expected remaining stock;
- latest physical count;
- variance.

Variance must be called **variance to investigate**, not theft.

## Scene 6 — Payment

Guest bill / payment terminal / UPI QR enters frame.

For real implementation, payment integration should use Razorpay test/live modes and current UPI Intent / QR flows rather than deprecated UPI Collect flows.

Public demo can use test mode or simulated recorded settlement.

## Scene 7 — Leakage

The visual world fractures.

Potential leak channels appear:

- waste;
- stock variance;
- purchase price increase;
- recipe inconsistency;
- excessive discounting;
- cancellations;
- service delays;
- guest recovery costs;
- payment reconciliation differences.

No leak is automatically called theft or fraud.

## Scene 8 — Munaffa Core

All operating signals converge into the Munaffa visual identity.

Core states:

- Revenue
- Cost
- Inventory
- Service
- Guests
- Profit

The Core should be photoreal / machined / glass-metal and premium, not a generic glowing sphere.

## Scene 9 — Hospitality worlds

Full-screen transformations between:

- restaurant;
- café;
- hotel;
- resort;
- QSR;
- cloud kitchen;
- bar/lounge.

Each gets one concise use case, not a card grid.

## Scene 10 — Profit intelligence

Transition from cinematic world into actual product interface.

Display real demo data:

- today's recorded revenue;
- inventory exposure;
- open operational issues;
- supplier cost movement;
- service / guest recovery signals;
- outlet comparison.

## Scene 11 — AI operator

Munaffa Intelligence should answer questions using the permitted workspace data.

Examples:

- “Why did food cost rise this week?”
- “Which items had the worst margin deterioration?”
- “Which supplier prices increased most?”
- “Which outlet needs attention first?”
- “What happened after 7 PM yesterday?”

Generative answers must cite the underlying records or calculations where possible.

## Scene 12 — Profit leak simulator

Interactive inputs:

- monthly sales;
- food cost;
- waste assumption;
- inventory variance assumption;
- discount leakage;
- purchase inflation;
- labour / service friction estimate.

Output:

- illustrative annual exposure;
- scenario comparison;
- biggest modeled contributor.

Clear disclaimer: scenario, not guaranteed saving.

## Scene 13 — Final CTA

Visual returns to the original venue, now with connected signals visible.

Copy:

**Run hospitality on profit, not guesswork.**

CTA:

- Book a demo
- Start a pilot
- Explore live demo

---

# 6. Functional product scope

## 6.1 Launch MVP

### Organization and property management

- organizations;
- multi-property / multi-outlet support;
- active location switching;
- roles and permissions;
- owner / manager / finance / inventory / kitchen / service roles;
- secure team invitations.

### Operations

- task / issue queue;
- priority;
- assignee;
- status;
- due time;
- linked property;
- linked source event;
- audit trail.

### Menu and recipe intelligence

- categories;
- menu items;
- price;
- taxes;
- allergens / diet metadata;
- recipes / BOM;
- ingredient quantity;
- unit conversion;
- theoretical recipe cost;
- gross contribution estimate.

### Orders

- dine-in;
- takeaway;
- QR ordering;
- table / room / counter reference;
- order status;
- kitchen state;
- modifiers;
- notes;
- demo KDS.

### Inventory

- ingredient master;
- UOM;
- opening balance;
- theoretical movements;
- purchases;
- waste events;
- physical counts;
- expected remaining;
- variance to investigate;
- reorder thresholds.

### Suppliers and purchasing

- supplier master;
- purchase receipts;
- line-item price history;
- stock movements;
- linked expense event;
- reversal / void audit flow.

### Billing and settlement

- bills;
- tax / service charge;
- discount;
- cash / card / UPI / recorded payment;
- partial settlement;
- remaining balance;
- linked revenue ledger;
- void instead of destructive delete.

### Guest recovery

- feedback / rating;
- complaint / recovery record;
- status;
- owner / manager resolution;
- optional guest contact data with consent;
- recovery cost where relevant.

### Profit ledger

- recorded revenue;
- purchase expenses;
- adjustments;
- reversals;
- source provenance;
- period view;
- property view;
- contribution summary.

### Signals

- low stock;
- count variance;
- unresolved guest issue;
- supplier price jump;
- open high-priority operation task;
- unusual discount level;
- margin deterioration;
- payment discrepancy;
- slow kitchen / service queue.

### Intelligence

Phase 1: deterministic / rules-based grounded intelligence.

Phase 2: LLM natural-language interface over authorized records.

The model must not receive unrestricted customer data by default.

---

# 7. What should NOT be in the first meeting MVP

Do not waste time before the business meeting on:

- complete hotel PMS replacement;
- OTA channel manager;
- enterprise accounting replacement;
- payroll;
- complex loyalty engine;
- native Android + iOS apps simultaneously;
- computer vision claiming to know actual plate consumption;
- automated fraud accusation;
- production AI with uncontrolled customer data;
- dozens of integrations;
- custom hardware.

The meeting MVP should demonstrate the **profit loop** convincingly.

---

# 8. Recommended technical architecture

## 8.1 Frontend

Primary:

- TypeScript
- React
- Next.js
- React Three Fiber / Three.js
- Drei
- GSAP ScrollTrigger
- CSS Modules / Tailwind only where useful
- Zustand for local experience state
- TanStack Query for server state in the product app

Why TypeScript: fewer interface mistakes across complex operational models.

## 8.2 3D / cinematic pipeline

Creation:

- Blender for authored cinematic scenes and asset optimization;
- Cycles for premium pre-rendered hero media;
- glTF / GLB for realtime assets;
- Draco or Meshopt geometry compression;
- KTX2 / Basis textures;
- baked light where possible;
- LODs for heavy models;
- instancing for repeated objects.

Runtime:

- Three.js / R3F;
- WebGL 2 baseline;
- WebGPU can be explored later but must not be required for launch;
- adaptive DPR;
- device-tier quality settings;
- lazy scene activation;
- preload only the next narrative chapter.

## 8.3 Backend

Recommended launch architecture:

- Node.js + TypeScript
- Fastify or Express for API services
- PostgreSQL as primary transactional database
- Redis for queues / sessions / rate limits if needed
- object storage for media / receipts / exports

Why not MongoDB as the default system of record:

Munaffa has strong relational requirements: organizations, properties, memberships, orders, recipes, movements, bills, payments, suppliers and auditable financial links. PostgreSQL fits these consistency requirements better.

MongoDB is still useful if later needed for:

- raw integration event payloads;
- flexible external-source snapshots;
- high-volume semi-structured logs.

## 8.4 Python services

Python should be used for workloads where it is strongest:

- forecasting;
- anomaly detection;
- optimization;
- supplier / menu analytics;
- ML experimentation;
- RAG / AI data preparation;
- batch analytical jobs.

Suggested:

- FastAPI;
- Pandas / Polars;
- NumPy;
- scikit-learn;
- PyTorch only when justified;
- background workers.

## 8.5 Java

Do not add Java just because it is available. It adds operational complexity.

Use Java/Kotlin only if one of these becomes real:

- native Android POS application;
- device / printer SDK requiring Java/Kotlin;
- high-throughput service team already standardized on JVM;
- Android payment / hardware integration.

For the first product, TypeScript + Python is sufficient.

## 8.6 Mobile

After web product validation:

- React Native / Expo for owner/manager mobile app;
- native modules only where camera, printer, payment or hardware integration requires them;
- shared TypeScript domain models and API client.

---

# 9. Logical system architecture

```text
Guest / Staff / Owner
        |
        v
Web / Mobile / QR / AR interface
        |
        v
API Gateway / Auth / RBAC
        |
  +-----+---------------------------+
  |     |           |               |
Orders  Inventory   Guests        Finance
  |     |           |               |
  +-----+-----------+---------------+
        |
        v
Hospitality Event Layer
        |
        +--> Operational Rules / Signals
        +--> Profit Engine
        +--> Analytics Warehouse
        +--> AI / RAG Service
        +--> Task / Action Engine
        |
        v
PostgreSQL + event/audit storage
        |
        +--> POS/PMS integrations
        +--> Razorpay / payment webhooks
        +--> Accounting integrations
        +--> Delivery / aggregator integrations
```

---

# 10. Core data model

Every business record must carry tenant context.

Essential entities:

- organization;
- property;
- user_profile;
- membership;
- role;
- invitation;
- menu_category;
- menu_item;
- ingredient;
- recipe;
- recipe_line;
- supplier;
- purchase;
- purchase_line;
- inventory_movement;
- physical_count;
- order;
- order_line;
- kitchen_event;
- bill;
- payment;
- financial_event;
- guest;
- feedback;
- recovery_case;
- operation_task;
- signal;
- integration;
- integration_event;
- audit_log.

Key principle:

**Do not overwrite financial or inventory history. Append events or reversals.**

---

# 11. Profit engine

The profit engine should calculate and explain, not merely display totals.

## 11.1 Restaurant / café model

For a period:

```text
Recorded revenue
- discounts
- tax/pass-through where relevant
- ingredient theoretical cost
- recorded waste
- purchase price movement
- labour allocation (when available)
- platform commissions
- payment fees
- other operating costs
= modeled contribution / operating profit view
```

The model must distinguish:

- theoretical food cost;
- actual purchase cost;
- physical count variance;
- recorded waste;
- unexplained variance.

## 11.2 Hotel model

Later expansion:

- room revenue;
- occupancy;
- ADR;
- RevPAR;
- room-level operating cost;
- housekeeping cost;
- F&B revenue;
- OTA commission;
- payment cost;
- service recovery;
- ancillary revenue;
- property contribution.

---

# 12. AI architecture

## 12.1 What AI should do

- answer operational questions;
- explain changes;
- summarize exceptions;
- prioritize attention;
- forecast likely stock-outs;
- flag unusual discount / cancellation behavior;
- suggest purchasing actions;
- draft owner summaries;
- compare properties;
- generate daily / weekly operating briefs.

## 12.2 What AI must not do

- invent financial numbers;
- infer theft without evidence;
- send private guest data outside approved boundaries;
- autonomously refund / pay / purchase without authorization;
- alter financial history;
- claim guaranteed savings;
- make food-safety claims from images without validated models.

## 12.3 Grounding

Every AI answer should resolve through tools / queries over permitted workspace data.

Ideal answer format:

```text
Finding
Evidence
Possible explanation
Recommended check
Confidence / limitation
```

---

# 13. AR / camera experience

The reference videos show that an AR menu can be useful as a real product feature, but the first implementation should be truthful.

Phase 1:

- camera permission;
- live camera feed;
- choose a menu item manually;
- overlay dish name / ingredients / allergen information / nutrition data from the menu database;
- 3D product model if one exists;
- add to cart;
- fallback when camera unavailable.

Phase 2:

- marker / QR-linked item detection;
- image classification only after collecting/validating training data;
- depth / plane placement where device APIs support it.

Never claim automatic recognition before it works reliably.

---

# 14. Payments

India launch recommendation:

- Razorpay Standard Checkout or equivalent regulated gateway;
- server creates payment order;
- frontend receives safe checkout token/order ID;
- webhook verifies final status;
- server verifies signatures;
- never expose secret keys in frontend;
- use UPI Intent / QR flows for new UPI implementations, not deprecated UPI Collect flows;
- support recorded offline cash/card payment separately from processed online payment.

---

# 15. Compliance and trust

## 15.1 Privacy

India DPDP compliance must be designed into the system.

Needs:

- clear purpose for data collection;
- consent where required;
- minimal guest PII;
- deletion / retention policy;
- access controls;
- audit logs;
- breach response process;
- vendor / subprocessors list;
- privacy policy;
- terms;
- consent / communication preferences.

## 15.2 Food menu information

For businesses to which FSSAI menu-display rules apply, digital menu support should be able to store/display:

- serving size;
- calories;
- veg/non-veg indicator;
- allergen information;
- additional nutrition information where required.

## 15.3 Billing

GST rules vary by hospitality service and property context. Tax logic must be configurable and reviewed by a qualified accountant before production rollout.

---

# 16. Security architecture

Minimum launch controls:

- HTTPS only;
- secure cookies;
- CSRF protection where relevant;
- strong password / SSO options;
- MFA for owners / finance roles;
- RBAC;
- tenant isolation;
- database row-level access rules or equivalent service enforcement;
- server-only secrets;
- encrypted backups;
- rate limiting;
- input validation;
- output encoding;
- webhook signature verification;
- audit logs;
- dependency scanning;
- secret scanning;
- production error monitoring;
- least-privilege service accounts;
- no direct client access to privileged database credentials.

---

# 17. Performance budget for the immersive site

Desktop premium target:

- initial critical experience should become visually meaningful quickly;
- defer heavy worlds until required;
- adaptive DPR 1.0–1.75;
- target 60 FPS on capable devices;
- acceptable adaptive floor around 30 FPS on weaker supported devices;
- avoid giant uncompressed textures;
- avoid loading every scene at startup.

Mobile:

- simplified 3D scene;
- smaller textures;
- fewer post effects;
- no unnecessary shadow maps;
- pre-rendered cinematic media preferred over heavy realtime geometry;
- conventional fallback when device memory / GPU is weak.

Asset guidance:

- GLB rather than fragmented glTF for owned production assets;
- Draco/Meshopt geometry compression;
- KTX2/Basis textures;
- AVIF/WebP stills;
- AV1/WebM video plus fallback;
- progressive loading;
- CDN / first-party hosting;
- no long-term dependency on raw GitHub asset URLs.

---

# 18. Website technology choreography

Recommended runtime:

```text
Native scroll
   ↓
GSAP ScrollTrigger timeline
   ↓
Scene state / progress store
   ├── DOM text masks / reveals
   ├── video / image-sequence scrub
   ├── R3F camera + object animation
   └── audio ambience (optional, opt-in)
```

Important:

Do not synchronize every effect independently to scroll. Use a master narrative timeline with named scene states.

---

# 19. Design system

## 19.1 Color

Primary cinematic base:

- near black `#050605`
- warm charcoal `#11130F`
- cream `#F3EFE6`
- profit green `#A8F36A`
- operational green `#3FAE68`
- hospitality amber `#D99A52`
- leakage red `#FF5B4D`

Green appears only where it has semantic meaning.

## 19.2 Typography

Editorial display:

- Instrument Serif or similarly elegant licensed/open serif.

UI:

- Sora / Inter / Geist / equivalent modern grotesk.

Rules:

- very large display headings;
- short copy;
- no 12-card grids over cinematic scenes;
- UI typography is quiet and precise;
- product app can be denser than public site.

## 19.3 Motion language

- slow camera pushes;
- object masks;
- depth reveals;
- match cuts;
- object-to-object transformations;
- macro zooms;
- controlled horizontal drift;
- occasional explosive sequence only when explaining leakage;
- no constant floating animation.

---

# 20. Monetization

## 20.1 Recommended initial business model

Subscription SaaS + onboarding/integration services.

### Pilot

Target:

- single outlet;
- owner dashboard;
- inventory/profit intelligence;
- QR ordering/demo integrations.

Possible validation price band:

**₹1,500–₹3,000 / outlet / month**

### Growth

- multiple modules;
- purchasing;
- team roles;
- alerts;
- multiple locations;
- integrations.

Possible band:

**₹4,000–₹8,000 / outlet / month**

### Group / Enterprise

- multi-property;
- data integrations;
- SSO;
- advanced analytics;
- custom support;
- SLA.

Custom annual contract.

These are validation hypotheses, not final market prices.

## 20.2 Additional revenue

Later:

- implementation / migration;
- premium integrations;
- advanced AI add-on;
- forecasting / benchmarking pack;
- white-label guest ordering;
- payment / fintech partnerships where legally and commercially appropriate;
- procurement intelligence;
- enterprise support.

---

# 21. How Munaffa helps make money

Munaffa itself earns subscription revenue.

The customer should see value through combinations of:

- fewer unnoticed margin leaks;
- faster detection of supplier price movement;
- reduced spreadsheet/admin time;
- better recipe cost visibility;
- lower stock-out risk;
- better purchasing discipline;
- clearer discount visibility;
- faster guest issue recovery;
- multi-outlet comparison;
- more direct ordering / lower reliance on manual ordering where appropriate.

Do not sell “we guarantee X% more profit.” Sell **visibility + action + measurable operational outcomes**, then prove ROI during pilots.

---

# 22. Go-to-market

## 22.1 Beachhead

Start with owner-operated restaurants/cafés in NCR and nearby markets where founder-led selling is possible.

Ideal first customer:

- 1–5 outlets;
- owner still involved in operations;
- uses a POS but still relies on spreadsheets / WhatsApp / manual stock checks;
- feels food-cost or stock-control pain;
- willing to share operational data for a pilot.

## 22.2 Sales motion

1. 20-minute discovery.
2. Ask for one painful example from the last month.
3. Reconstruct the event chain with their data.
4. Show the Munaffa demo.
5. Offer a 30-day pilot with one clearly measured outcome.
6. Weekly owner report.
7. Convert to subscription only if value is visible.

## 22.3 Pilot metrics

- inventory counting time;
- unexplained variance rate;
- purchase price change detection time;
- time to produce weekly profitability view;
- number of high-priority operational issues detected;
- owner dashboard usage;
- task resolution rate;
- guest recovery closure time.

---

# 23. Business meeting demo — required flow

The meeting demo should be 5–7 minutes.

## Minute 0–1 — cinematic hook

Open immersive homepage.

Say:

> “Hospitality software records activity. Munaffa connects activity to profit.”

Scroll through order → kitchen → recipe → inventory → payment → leakage.

## Minute 1–2 — problem

Show one simple scenario:

- Paneer dish sells well.
- Supplier price increased.
- Physical count differs from theoretical stock.
- Discounts also rose.
- Revenue looks fine.
- Profit is worse.

## Minute 2–4 — owner workspace

Show:

- order;
- recipe cost;
- inventory expected vs physical;
- purchase price trend;
- profit event;
- attention signal;
- recommended check.

## Minute 4–5 — guest experience

Show QR order / AR-style ingredient lens.

## Minute 5–6 — business model

Explain subscription + pilot.

## Minute 6–7 — ask

Depending on meeting:

- pilot customer;
- mentor / incubator support;
- data/integration partner;
- investment / grant;
- introductions to hospitality operators.

---

# 24. Build priorities before the meeting

**P0 — must work**

- cinematic home loads reliably;
- no black screen;
- menu demo works;
- cart works;
- order confirmation works;
- AR/camera page requests permission and has fallback;
- profit simulator works;
- owner workspace contains coherent demo data;
- responsive desktop/tablet;
- health route;
- build/typecheck green.

**P1 — highly valuable**

- login/demo workspace;
- one restaurant dataset;
- order → recipe → stock → payment trace;
- live profit signal;
- supplier purchase example;
- owner daily brief.

**P2 — after meeting**

- real POS integration;
- real payments;
- real multi-tenant production database;
- advanced AI;
- mobile application;
- hotel PMS integrations;
- accounting integrations.

---

# 25. Development phases

## Phase A — cinematic founder demo

Goal: meeting-ready.

Deliver:

- reference-quality public site;
- functional product demo;
- coherent fake-but-clearly-labeled demo dataset;
- meeting script;
- pilot form.

## Phase B — restaurant pilot

Goal: first paying outlet.

Deliver:

- production authentication;
- real DB;
- manual/imported sales feed;
- inventory;
- purchases;
- recipe costing;
- alerts;
- weekly report.

## Phase C — integration layer

Goal: reduce onboarding friction.

Deliver:

- POS adapters;
- CSV ingestion;
- webhook ingestion;
- accounting exports;
- payment reconciliation.

## Phase D — AI operator

Goal: turn visibility into action.

Deliver:

- natural language questions;
- grounded explanations;
- anomaly summaries;
- forecasting;
- action recommendations.

## Phase E — multi-hospitality

Goal: hotel/resort groups.

Add:

- rooms / bookings;
- occupancy / ADR / RevPAR;
- housekeeping;
- room service;
- property profitability;
- OTA/channel data connectors.

---

# 26. Testing strategy

## Unit

- pricing / recipe calculations;
- unit conversion;
- tax / discount calculations;
- inventory movement math;
- financial linking;
- permission checks.

## Integration

- order completion → inventory usage;
- purchase receipt → inventory movement + expense;
- payment capture → revenue event;
- reversal behavior;
- tenant isolation.

## End-to-end

- signup / demo;
- menu order;
- KDS state change;
- inventory count;
- payment;
- signal generation;
- owner dashboard.

## Visual / experience

- Safari desktop;
- Chrome desktop;
- iPhone Safari;
- Android Chrome;
- tablet;
- WebGL disabled;
- reduced motion;
- slow 4G;
- low-memory device;
- portrait / landscape.

---

# 27. Launch checklist

Before calling the public site finished:

1. Privacy policy.
2. Terms.
3. Secrets server-side only.
4. HTTPS.
5. Cookie/analytics consent if non-essential tracking is used.
6. Meta titles/descriptions.
7. Social preview image.
8. Favicon/manifest.
9. Sitemap/robots.
10. Alt text / accessible equivalents.
11. Asset compression.
12. Load/performance testing.
13. Color contrast.
14. Mobile QA.
15. Custom 404.
16. Broken-link test.
17. Form validation.
18. Spam/rate limiting.
19. Analytics / error monitoring.
20. One dominant CTA.
21. Keyboard navigation.
22. Reduced motion.
23. WebGL fallback.
24. Core Web Vitals / INP monitoring.
25. Security headers.
26. Dependency / secret scanning.
27. Browser/device matrix.
28. Production logging.
29. Backup / recovery verification.
30. No fake customer claims or fake metrics.

---

# 28. Success metrics

## Product

- weekly active owners;
- daily dashboard opens;
- alerts reviewed;
- tasks created/resolved;
- inventory counts completed;
- variance trend;
- supplier price alerts acted upon;
- time saved producing operating reports;
- number of connected data sources.

## Business

- demos booked;
- demo → pilot conversion;
- pilot → paid conversion;
- monthly recurring revenue;
- churn;
- expansion revenue;
- CAC;
- payback period;
- gross margin;
- implementation time;
- number of outlets per account.

## Website

- scroll completion;
- CTA click rate;
- demo-start rate;
- mobile completion;
- WebGL fallback rate;
- loading abandonment;
- LCP;
- INP;
- CLS;
- crash/context-loss rate.

---

# 29. Research sources used for this blueprint

Primary technical / academic references:

- ScrollyVis: Interactive visual authoring of guided dynamic narratives for scientific scrollytelling — arXiv 2207.03616
- How Does Automation Shape the Process of Narrative Visualization — arXiv 2206.12118
- Scrollytelling as an Alternative Format for Privacy Policies — arXiv 2603.04367
- Decomposing Browser Pipeline Architectures for DOM-Sourced Particle Effects — arXiv 2608.23609
- GSAP ScrollTrigger documentation — https://gsap.com/docs/v3/Plugins/ScrollTrigger/
- React Three Fiber performance documentation — https://r3f.docs.pmnd.rs/advanced/scaling-performance
- React Three Fiber performance pitfalls — https://r3f.docs.pmnd.rs/advanced/pitfalls
- Three.js GLTFLoader — https://threejs.org/docs/pages/GLTFLoader.html
- Three.js DRACOLoader — https://threejs.org/docs/pages/DRACOLoader.html
- Three.js KTX2Loader — https://threejs.org/docs/pages/KTX2Loader.html
- MDN WebGL best practices — https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices
- MDN prefers-reduced-motion — https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion
- web.dev Interaction to Next Paint — https://web.dev/articles/inp

Market / product references:

- IBEF Tourism & Hospitality Industry in India
- IBEF hotel industry FY26 outlook
- NRAI / Redseer food-service market reporting
- SEBI-hosted foodservice market overview using NRAI / Frost & Sullivan data
- Economic Times Hospitality reporting on AI, integrated POS and hotel systems
- Petpooja pricing/features
- Restroworks pricing/features
- Hotelogix India PMS guidance
- Razorpay payment / UPI documentation
- FSSAI digital-menu information guidance
- CBIC GST service-rate guidance
- MeitY Digital Personal Data Protection Rules 2025

---

# 30. Final product principle

Every Munaffa decision should pass this test:

> **Does this make hospitality operations easier to understand, easier to act on, or easier to turn into profit?**

If the answer is no, it is decoration or scope creep.

The immersive website is justified because it creates memorability and communicates the product model. The product itself must justify the startup by creating operational clarity and measurable owner value.
