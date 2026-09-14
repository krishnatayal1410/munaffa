import type { MetadataRoute } from "next";

const publicRoutes = ["", "/product", "/industries", "/pricing", "/resources", "/about", "/demo", "/contact", "/privacy", "/terms"];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "https://munaffa.vercel.app").replace(/\/$/, "");
  const now = new Date();
  return publicRoutes.map((route, index) => ({
    url: `${base}${route}`,
    lastModified: now,
    changeFrequency: index === 0 ? "weekly" : "monthly",
    priority: index === 0 ? 1 : route === "/product" || route === "/demo" ? 0.85 : 0.7,
  }));
}
