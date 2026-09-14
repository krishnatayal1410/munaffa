import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { LeadForm } from "@/components/LeadForm";
import { marketingPages } from "@/lib/content";
import { legalPages } from "@/lib/legal";

export function generateStaticParams() {
  return [...Object.keys(marketingPages), ...Object.keys(legalPages)].map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const marketing = marketingPages[slug];
  const legal = legalPages[slug];
  if (marketing) return { title: `${marketing.title} | Munaffa`, description: marketing.copy };
  if (legal) return { title: `${legal.title} | Munaffa`, description: legal.intro };
  return {};
}

export default async function MarketingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const legal = legalPages[slug];

  if (legal) {
    return <div className="standard-page"><SiteNav/><main className="standard-main legal-main"><section className="standard-hero legal-hero"><span className="kicker">Legal · launch-stage draft</span><h1>{legal.title}</h1><p>{legal.intro}</p><small>Last updated: {legal.updated}</small></section><div className="legal-sections">{legal.sections.map((section) => <section key={section.title}><h2>{section.title}</h2>{section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}{section.bullets && <ul>{section.bullets.map((item) => <li key={item}>{item}</li>)}</ul>}</section>)}</div><div className="legal-callout"><b>Before accepting paid production customers</b><p>Finalize these drafts with counsel for the legal entity, launch jurisdictions, payment model, processors, integrations and actual production data flows.</p><Link className="pill ghost" href="/contact">Contact Munaffa</Link></div></main><SiteFooter/></div>;
  }

  const page = marketingPages[slug];
  if (!page) notFound();
  const leadPage = slug === "demo" || slug === "contact";

  return <div className="standard-page"><SiteNav/><main className="standard-main">
    <section className="standard-hero"><span className="kicker">{page.kicker}</span><h1>{page.title}</h1><p>{page.copy}</p><div className="cta-row">{leadPage ? <><Link className="pill primary" href="#lead-form">{slug === "demo" ? "Request demo" : "Send a message"}</Link><Link className="pill ghost" href="/app">Explore sample workspace</Link></> : <><Link className="pill primary" href="/auth/sign-up">Start free</Link><Link className="pill ghost" href={slug === "pricing" ? "/demo" : "/"}>{slug === "pricing" ? "Request a demo" : "View 3D experience"}</Link></>}</div></section>
    <section className="standard-card-grid">{page.cards.map((card,index)=><article key={card.title}><span>0{index+1}</span><h2>{card.title}</h2><p>{card.text}</p></article>)}</section>
    {leadPage && <section id="lead-form" className="lead-section"><LeadForm source={slug as "demo" | "contact"}/></section>}
    {slug === "resources" && <section className="tutorial-section"><span className="kicker">Basic tutorial</span><h2>From account creation to first insight.</h2><ol><li>Create an account and choose your hospitality type.</li><li>Create a property or outlet.</li><li>Choose your operating modules.</li><li>Use the guided tour, operate the sample service queue and recount sample inventory.</li><li>Model contribution and test the explicitly labelled demo AI experience.</li><li>Connect verified business data only when production integrations are configured.</li></ol><div className="cta-row"><Link className="pill primary" href="/auth/sign-up">Create workspace</Link><Link className="pill ghost" href="/app">Open sample workspace</Link></div></section>}
  </main><SiteFooter/></div>;
}
