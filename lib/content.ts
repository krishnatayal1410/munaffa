export const industries = [
  { key: "hotels", title: "Hotels", description: "Rooms, F&B, services, housekeeping, guest experience and profitability in one operating view." },
  { key: "restaurants", title: "Restaurants", description: "Table operations, kitchen flow, inventory, recipes, guests and margin visibility." },
  { key: "cafes", title: "Cafés & QSRs", description: "Fast ordering, repeatable recipes, stock alerts, demand patterns and loyalty." },
  { key: "cloud-kitchens", title: "Cloud Kitchens", description: "Multi-brand order flow, kitchen load, ingredient usage and unit economics." },
  { key: "resorts", title: "Resorts", description: "Rooms, activities, F&B and property operations across one guest journey." },
  { key: "bars-lounges", title: "Bars & Lounges", description: "Fast service, bottle inventory, menu contribution and repeat-guest intelligence." },
];

export const marketingPages: Record<string, { kicker: string; title: string; copy: string; cards: { title: string; text: string }[] }> = {
  product: {
    kicker: "The platform",
    title: "One operating system for hospitality.",
    copy: "Munaffa connects revenue, operations, cost control, guests and AI signals so owners can see what is happening and what it means for profit.",
    cards: [
      { title: "Operations", text: "Orders, bookings, rooms, tables, kitchen, service requests and staff workflows." },
      { title: "Cost & inventory", text: "Recipe costing, purchasing, stock, waste and theoretical-vs-actual variance." },
      { title: "Revenue intelligence", text: "Occupancy, menu contribution, demand, repeat guests and pricing signals." },
      { title: "AI co-pilot", text: "Explain changes, surface anomalies and suggest actions using verified business data." },
    ],
  },
  industries: {
    kicker: "Industries",
    title: "Different hospitality businesses. One profit goal.",
    copy: "Munaffa is designed as a flexible operating layer for hospitality businesses rather than a restaurant-only point solution.",
    cards: industries.map(({ title, description }) => ({ title, text: description })),
  },
  pricing: {
    kicker: "Validation pricing",
    title: "Start lean. Add intelligence as you grow.",
    copy: "These tiers are working validation prices and will change as real pilots establish willingness-to-pay. No plan is presented as proven market pricing yet.",
    cards: [
      { title: "Launch — ₹999/mo", text: "Core ordering/service flows, basic operations and analytics for one location." },
      { title: "Growth — ₹2,499/mo", text: "Inventory, recipes, KDS/ops controls, advanced reports and guest workflows." },
      { title: "Profit — ₹4,999/mo", text: "Profit intelligence, AI insights, advanced CRM and multi-location capabilities." },
    ],
  },
  resources: {
    kicker: "Resources",
    title: "Learn Munaffa from zero to operating rhythm.",
    copy: "Product tours, setup checklists and practical hospitality operating guides are built into the experience.",
    cards: [
      { title: "5-minute setup", text: "Create your business, property or outlet, choose modules and load starter data." },
      { title: "Profit visibility basics", text: "Understand contribution, theoretical consumption, stock variance and demand signals." },
      { title: "Role guides", text: "Separate owner, manager, front desk, kitchen, waiter, cashier and inventory workflows." },
    ],
  },
  about: {
    kicker: "About Munaffa",
    title: "A more profitable hospitality industry.",
    copy: "Munaffa is being built around a simple idea: operational data should help hospitality businesses make better decisions before profit disappears.",
    cards: [
      { title: "India first", text: "Start close to customers, learn quickly and solve real owner-led hospitality workflows." },
      { title: "Evidence over hype", text: "Demo values are labelled. Variance is not called theft. AI signals require real data validation." },
      { title: "One connected flow", text: "Avoid another isolated dashboard by connecting activity to cost, guest and profit outcomes." },
    ],
  },
  demo: {
    kicker: "Guided product demo",
    title: "Show us how your hospitality business actually runs.",
    copy: "Request a focused Munaffa walkthrough around the problems you care about: operations, inventory, cost control, guest workflows, profit visibility or multi-location management.",
    cards: [
      { title: "Your workflow first", text: "The conversation starts with how your team currently handles rooms, orders, kitchen, stock, billing and reporting." },
      { title: "No fake ROI", text: "Sample values are illustrative. Any savings or profit opportunity should be calculated from your verified operating data." },
      { title: "Pilot-ready", text: "If the fit is strong, define a narrow design-partner pilot rather than forcing a full rollout immediately." },
    ],
  },
  contact: {
    kicker: "Contact",
    title: "Talk to the team building Munaffa.",
    copy: "Use this for pilot interest, product questions, integrations, partnerships or feedback from hospitality operators.",
    cards: [
      { title: "Operators", text: "Tell us where your team loses time, stock visibility or profit clarity today." },
      { title: "Pilot partners", text: "Work with Munaffa on a small, measurable workflow before committing to a larger rollout." },
      { title: "Integrations", text: "Discuss POS, PMS, payment, accounting, supplier or operational data connections." },
    ],
  },
};
