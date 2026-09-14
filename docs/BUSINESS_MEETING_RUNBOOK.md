# Munaffa — Business Meeting Runbook

## One-sentence positioning
Munaffa is a hospitality profit operating system that connects guest ordering and service activity to recipe cost, inventory, purchasing, guest recovery and recorded money movement so owners can see where margin is being created or leaking.

## What to open before the meeting
1. `/meeting` — founder/business story.
2. `/` — cinematic reference-driven experience.
3. `/order/demo` — app-free guest ordering demo.
4. `/app` — operator workspace using the same browser demo state.
5. `/api/backend-status` — honest production-boundary status.

Keep `/order/demo` and `/app` open in separate tabs in the same browser profile. They share local demo state.

## 5-minute live demo
### 0:00–0:45 — problem
Say: "Hospitality owners can see sales quickly, but cost and operational leakage are usually spread across POS reports, kitchen workflows, recipe sheets, supplier purchases, stock counts and guest feedback. Munaffa connects those operational events around profit visibility."

### 0:45–1:30 — guest side
Open `/order/demo`.
- Add a menu item.
- Send the order.
- Explain that production QR links would map to a property/table/order point.
- Do not claim payment processing is integrated in this prototype.

### 1:30–2:30 — service/kitchen
Open `/app` → Orders & KDS.
- Point out the `Guest QR` source.
- Advance the new order: accepted → preparing → ready → completed.
- Explain that completion deducts recipe-defined theoretical ingredient usage and records the sale in the demo ledger.

### 2:30–3:20 — inventory + purchasing
Open Inventory.
- Explain theoretical quantity vs independent physical count.
- Change a physical count and show variance.
- Emphasise: variance is something to investigate, not automatically theft.

Open Purchasing.
- Receive stock from a supplier.
- Return to Inventory and show theoretical stock increase.
- Return to Profit and show the linked expense.

### 3:20–4:00 — profit + guest recovery
Open Profit.
- Show recorded revenue, recorded expenses and contribution.
- Explain that this is an operating ledger/profit visibility layer, not a replacement for statutory accounting.

Open Guests.
- Add or resolve an issue.
- Return to Overview and show the attention signal change.

### 4:00–5:00 — business ask
Say: "I am not asking you to replace your full stack tomorrow. I want one location, one painful workflow and permission to measure the before/after. If we can improve one measurable operating outcome, we expand from there."

## Initial customer wedge
Start with independent/small-chain restaurants and cafés in India.

Why:
- daily operational frequency creates fast feedback;
- easier on-site access to owner/manager;
- QR ordering, KDS, recipe/inventory and purchasing form a coherent pilot;
- shorter workflow than full hotel PMS replacement;
- expansion path to multi-location groups, hotels/resorts and broader hospitality.

## Pricing hypothesis — not validated willingness-to-pay
- Launch: ₹999/location/month.
- Growth: ₹2,499/location/month.
- Profit: ₹4,999/location/month.
- Hotels/groups: custom.

Treat these numbers as discovery anchors. Do not tell a prospect that this is proven market pricing.

## Revenue model direction
1. Per-location SaaS subscription.
2. Paid onboarding/data setup for complex locations.
3. Premium modules: advanced profit intelligence, multi-location controls, CRM, forecasting, AI assistance, integrations.
4. Later, only after licensing/compliance/partner architecture is ready: payment or financing economics.

## Evidence to use carefully
- Horwath HTL India Hotel Market Review 2025: 64% occupancy, ₹8,624 ADR and ₹5,522 RevPAR for India in 2025.
  Source: https://horwathhtl.com/publication/india-hotel-market-review-2025/
- Toast reported approximately 180,000 Locations and $215B trailing-twelve-month GPV as of June 30, 2026. Use this only as evidence that restaurant operating platforms can become large categories; it is not evidence of Munaffa demand.
  Source: Toast Q2 2026 SEC filing.
- Olo publicly describes an Order/Pay/Engage platform architecture for restaurant digital commerce, payments and guest engagement. Munaffa's proposed wedge is operational cost/inventory/profit visibility rather than copying that exact suite.
  Source: Olo public SEC filings.
- FSSAI menu-labelling rules apply to food service establishments with Central licences or outlets at 10+ locations for calorific values, allergen information and veg/non-veg indicators, subject to the regulation's scope/exceptions.
  Source: FSSAI Labelling and Display Regulations guidance.

## Competitor framing
Do not pitch "we have every feature they have". That is not credible.

### Petpooja / Restroworks / Rista / similar POS vendors
Strengths: billing, POS workflow, integrations, installed base, support, mature reporting.

Munaffa wedge: owner-facing profit visibility that connects recipe-derived expected consumption, independent physical counts, purchases, guest/service signals and recorded money events in one operating narrative.

### Toast / Olo
Use as category proof for integrated restaurant operating platforms, not as direct India-market equivalents.

## Questions to ask the business owner
1. What do you open first every morning to know yesterday's performance?
2. Where do you record purchases and vendor price changes?
3. Are recipes/BOMs defined anywhere digitally?
4. How often is physical stock counted?
5. When theoretical and physical stock differ, how do you investigate?
6. Which report do you trust the least?
7. How are discounts, comps and wastage approved?
8. How do online/QR/dine-in orders enter the kitchen?
9. What takes the manager the most time during closing?
10. If Munaffa solved only one problem in the next 30 days, what should it be?

## Objections
### "I already use a POS."
Response: Munaffa should not force a replacement during validation. The first pilot can sit alongside the current POS and focus on one profit/operations workflow. Integrations come after value is proven.

### "My chef knows the recipe; nobody weighs every plate."
Response: Munaffa uses recipe standards to calculate theoretical consumption from orders. It does not claim to measure exact grams consumed. Physical counts remain separate observations and variance is investigated.

### "Why should I enter data twice?"
Response: In the pilot, minimise the workflow to the smallest test. The product direction is to import/integrate source events; duplicate entry is not the long-term product proposition.

### "Will this tell me someone is stealing?"
Response: No. Variance is a signal. It can come from yield, waste, recipe drift, counting error, purchase-entry error, spoilage, staff meals, portion changes or shrinkage. Munaffa should help narrow the investigation, not make unsupported accusations.

### "What ROI do you guarantee?"
Response: None before baseline measurement. Agree on a measurable pilot KPI, establish the baseline, and evaluate actual change.

## Pilot success metrics
Pick 1–2, not all at once:
- order-to-ready time;
- direct/QR order adoption;
- stock count variance;
- supplier price-change visibility;
- waste recording compliance;
- recipe-cost accuracy;
- manager closing time;
- open guest recovery ageing;
- purchase-to-stock reconciliation.

## Production gaps that must stay honest
The current meeting prototype has a fully interactive local demo workspace but does not yet have production authentication, payment processing or a configured production MongoDB database. `/api/backend-status` exposes this explicitly. Production credentials/provider selection are required before real customer data is stored.
