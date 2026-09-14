import { Nav } from "@/components/Nav";
import Link from "next/link";

export function Subpage({ eyebrow, title, description, cards }: { eyebrow: string; title: string; description: string; cards: [string,string][] }) {
  return (
    <div className="subpage">
      <Nav />
      <main className="submain">
        <section className="max-w-[950px]">
          <div className="eyebrow">{eyebrow}</div>
          <h1 className="hero-title">{title}</h1>
          <p className="lede">{description}</p>
          <div className="flex flex-wrap gap-3">
            <Link href="/contact" className="cta primary">Book a Free Profit Audit</Link>
            <Link href="/" className="cta secondary">3D Experience</Link>
          </div>
        </section>
        <section className="subgrid">
          {cards.map(([name,text]) => <article key={name} className="subcard"><h3>{name}</h3><p>{text}</p></article>)}
        </section>
      </main>
    </div>
  );
}
