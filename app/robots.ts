import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://munaffa-krishnatayal1410s-projects.vercel.app";
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/app", "/onboarding", "/auth/update-password"] }],
    sitemap: `${base.replace(/\/$/, "")}/sitemap.xml`,
  };
}
