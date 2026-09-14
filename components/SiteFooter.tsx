import Link from "next/link";

const groups = [
  { title: "Platform", links: [["Product", "/product"], ["Industries", "/industries"], ["Pricing", "/pricing"], ["Demo", "/demo"]] },
  { title: "Learn", links: [["Resources", "/resources"], ["About", "/about"], ["Contact", "/contact"]] },
  { title: "Account", links: [["Create workspace", "/auth/sign-up"], ["Sign in", "/auth/sign-in"], ["Sample workspace", "/app"]] },
  { title: "Legal", links: [["Privacy", "/privacy"], ["Terms", "/terms"]] },
] as const;

export function SiteFooter() {
  return <footer className="site-footer">
    <div className="footer-brand"><Link href="/" className="brand"><span className="brand-glyph">M</span><span><b>munaffa</b><small>Hospitality Profit OS</small></span></Link><p>Connecting hospitality operations to cost, guest and profit visibility.</p><small>Munaffa is in product-validation stage. Sample metrics and AI outputs are labelled illustrative until verified customer data is connected.</small></div>
    <div className="footer-groups">{groups.map((group) => <section key={group.title}><b>{group.title}</b>{group.links.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}</section>)}</div>
    <div className="footer-bottom"><span>© {new Date().getFullYear()} Munaffa.</span><span>Built for hospitality operators.</span></div>
  </footer>;
}
