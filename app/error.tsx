"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function GlobalRouteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") console.error("Munaffa route error", error);
  }, [error]);

  return <main className="not-found">
    <span className="brand-glyph">M</span>
    <span className="kicker">Recovery mode</span>
    <h1>This part of Munaffa did not load correctly.</h1>
    <p>The rest of the site is still available. Retry the route or return to the homepage.</p>
    <div className="cta-row centered-row"><button className="pill primary" onClick={reset}>Try again</button><Link className="pill ghost" href="/">Go home</Link></div>
  </main>;
}
