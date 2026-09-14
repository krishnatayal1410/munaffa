export type LegalSection = { title: string; paragraphs: string[]; bullets?: string[] };

export const legalPages: Record<string, { title: string; updated: string; intro: string; sections: LegalSection[] }> = {
  privacy: {
    title: "Privacy Policy",
    updated: "14 September 2026",
    intro: "This policy explains the categories of information Munaffa may process as the product moves from guided demos into production hospitality workspaces. The exact providers and data flows depend on which production integrations are enabled.",
    sections: [
      { title: "Information you provide", paragraphs: ["We may process information you submit when creating an account, configuring a workspace, requesting a demo or contacting us."], bullets: ["Name, work email and optional phone number", "Business, property or outlet details", "Role and workspace preferences", "Messages, demo requests and support information"] },
      { title: "Operational business data", paragraphs: ["When production integrations are enabled, Munaffa may process hospitality operational data needed to provide the selected features."], bullets: ["Orders, bookings, rooms, tables and service workflow data", "Inventory, recipes, purchasing, costs and stock counts", "Payment or revenue summaries supplied through authorized integrations", "Guest or CRM information that the business is authorized to process"] },
      { title: "How information is used", paragraphs: ["Information is used to provide and secure the service, configure workspaces, respond to requests, operate requested product features, troubleshoot problems, and improve the product."], bullets: ["We do not treat illustrative demo values as real customer results.", "AI or analytics features should be grounded in the data sources and permissions configured for the workspace."] },
      { title: "Service providers and hosting", paragraphs: ["Munaffa may use third-party infrastructure for hosting, authentication, databases, analytics, communications or integrations. Production deployments should document the providers actually enabled for that environment. Providers receive only the information needed to perform their contracted role, subject to their applicable terms and safeguards."] },
      { title: "Data retention and security", paragraphs: ["Information should be retained only as long as reasonably necessary for the service, legal obligations, dispute resolution and security. No online system can guarantee absolute security; production deployments should use access controls, encrypted transport, least-privilege credentials, backups and monitoring appropriate to the data involved."] },
      { title: "Your choices", paragraphs: ["You may request access, correction or deletion of personal information where applicable. Business customers remain responsible for configuring their own user permissions and for having a lawful basis to provide guest, staff or operational data to Munaffa."] },
      { title: "Contact", paragraphs: ["Privacy questions can be submitted through the Munaffa contact page. Before commercial launch, the final policy should include the legal entity name, registered address, applicable grievance/contact details and any jurisdiction-specific disclosures required for the markets served."] },
    ],
  },
  terms: {
    title: "Terms of Use",
    updated: "14 September 2026",
    intro: "These terms are a launch-stage product draft for the Munaffa website and guided sample workspace. Commercial customer terms should be finalized with legal counsel before accepting paid production customers.",
    sections: [
      { title: "Product status", paragraphs: ["Munaffa is being developed as a hospitality operating and profit-intelligence platform. Features, pricing, integrations and availability may change during validation and pilot stages."] },
      { title: "Accounts and authorized use", paragraphs: ["You are responsible for information submitted through your account and for keeping credentials secure. You may only connect systems and data that you are authorized to access and process."] },
      { title: "Demo and illustrative information", paragraphs: ["Sample dashboards, calculations, AI responses, potential variance and other demo values are illustrative unless explicitly identified as verified customer data. They are not evidence of savings, fraud, theft or guaranteed financial performance."] },
      { title: "Operational and financial decisions", paragraphs: ["Munaffa is a decision-support product, not a substitute for accounting, tax, legal, food-safety, employment or other professional advice. Hospitality operators remain responsible for reviewing source data and making business decisions."] },
      { title: "Acceptable use", paragraphs: ["You must not use the service to violate law, access data without authorization, interfere with the service, attempt to bypass security controls, introduce malicious code, or use another organization's confidential information without permission."] },
      { title: "Intellectual property", paragraphs: ["The Munaffa product, brand, interface and original software are intended to remain owned by their respective rights holders. Third-party libraries, 3D assets, fonts and infrastructure remain subject to their own licenses and terms."] },
      { title: "Availability and changes", paragraphs: ["During product validation, features may be added, changed, suspended or removed. Production service levels, support commitments, warranties, payment terms, liability limits and termination rights should be defined in the applicable commercial agreement before a paid rollout."] },
      { title: "Contact", paragraphs: ["Questions about these terms can be sent through the Munaffa contact page. The commercial version should be reviewed for the legal entity and jurisdictions in which Munaffa operates before launch to paying customers."] },
    ],
  },
};
