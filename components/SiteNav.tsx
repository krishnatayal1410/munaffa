"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";

const links = [
  ["Product", "/product"],
  ["Industries", "/industries"],
  ["Pricing", "/pricing"],
  ["Resources", "/resources"],
  ["About", "/about"],
] as const;

export function SiteNav() {
  const [open, setOpen] = useState(false);
  const [solid, setSolid] = useState(false);

  useEffect(() => {
    const update = () => setSolid(window.scrollY > 24);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  return (
    <>
      <header className={`site-nav ${solid ? "is-solid" : ""}`}>
        <Link href="/" className="brand" aria-label="Munaffa home">
          <span className="brand-glyph">M</span>
          <span><b>munaffa</b><small>Hospitality Profit OS</small></span>
        </Link>
        <nav className="nav-links" aria-label="Primary navigation">
          {links.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}
        </nav>
        <div className="nav-actions">
          <Link className="nav-login" href="/auth/sign-in">Login</Link>
          <Link className="pill primary small" href="/auth/sign-up">Start free</Link>
          <button className="nav-menu" aria-label="Toggle menu" onClick={() => setOpen((v) => !v)}>{open ? <X size={18} /> : <Menu size={18} />}</button>
        </div>
      </header>
      {open && <div className="mobile-menu">{links.map(([label, href]) => <Link key={href} href={href} onClick={() => setOpen(false)}>{label}</Link>)}<Link href="/auth/sign-in" onClick={() => setOpen(false)}>Login</Link><Link href="/auth/sign-up" className="pill primary" onClick={() => setOpen(false)}>Start free</Link></div>}
    </>
  );
}
