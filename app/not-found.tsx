import Link from "next/link";

export default function NotFound() {
  return <main className="not-found">
    <span className="brand-glyph">M</span>
    <span className="kicker">404 · Lost in hospitality</span>
    <h1>This route is not part of the Munaffa workspace.</h1>
    <p>Return to the hospitality experience or open the guided sample workspace.</p>
    <div className="cta-row centered-row"><Link className="pill primary" href="/">Go home</Link><Link className="pill ghost" href="/app">Open workspace</Link></div>
  </main>;
}
