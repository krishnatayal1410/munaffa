import type { ReactNode } from "react";

export type SceneCopy = {
  eyebrow: string;
  title: ReactNode;
  body: string;
  side: "left" | "right" | "center";
  tone?: "green" | "amber" | "red";
};

export const scenes: SceneCopy[] = [
  { eyebrow: "01 / Arrival", title: <>Hospitality is a<br/><em>living system.</em></>, body: "Enter the business itself. Every guest, table, room and service request starts a chain of operational events.", side: "left" },
  { eyebrow: "02 / Ordering", title: <>A table becomes<br/><em>a signal.</em></>, body: "An order leaves the guest environment and starts travelling through service in real time.", side: "right" },
  { eyebrow: "03 / Kitchen", title: <>The signal reaches<br/><em>the kitchen.</em></>, body: "Preparation, timing and hand-offs become one visible service path instead of isolated screens.", side: "left", tone: "amber" },
  { eyebrow: "04 / Recipe", title: <>Every plate has<br/><em>a theoretical cost.</em></>, body: "The dish separates into its recipe components so cost and expected ingredient usage can be understood without pretending every gram was physically measured.", side: "right", tone: "amber" },
  { eyebrow: "05 / Inventory", title: <>Expected stock meets<br/><em>physical truth.</em></>, body: "Opening stock, purchases and theoretical usage create an expectation. Physical counting remains an independent observation.", side: "left" },
  { eyebrow: "06 / Settlement", title: <>Revenue enters<br/><em>the operating story.</em></>, body: "Payment is not the end. It is the point where sales, service and cost can finally be traced together.", side: "right" },
  { eyebrow: "07 / Leakage", title: <>Profit does not vanish.<br/><em>It leaks.</em></>, body: "Waste, variance, discounting, service friction and inconsistency pull the system apart.", side: "left", tone: "red" },
  { eyebrow: "08 / Munaffa Core", title: <>Reconnect<br/><em>the whole business.</em></>, body: "The broken signals reconstruct around one operating model for hospitality profit visibility.", side: "center" },
  { eyebrow: "09 / Hospitality", title: <>Hotel. Restaurant. Café.<br/><em>Different rhythms.</em></>, body: "Resorts, QSRs, cloud kitchens and lounges move differently, but the operating language remains connected.", side: "left" },
  { eyebrow: "10 / Intelligence", title: <>From activity to<br/><em>decision support.</em></>, body: "Operations become explainable signals: what changed, where it happened and what deserves attention.", side: "right" },
  { eyebrow: "11 / Profit", title: <>Run hospitality<br/><em>with visibility.</em></>, body: "The final system is not a collection of dashboards. It is one connected story from guest experience to margin.", side: "center" }
];
