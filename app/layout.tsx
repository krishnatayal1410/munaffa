import type { Metadata, Viewport } from "next";
import { Inter, Sora } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const sora = Sora({ subsets: ["latin"], variable: "--font-sora", display: "swap" });
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://munaffa-krishnatayal1410s-projects.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Munaffa — Hospitality Profit OS",
    template: "%s | Munaffa",
  },
  description: "AI-powered operating system connecting operations, cost, guests and profit visibility for hotels, restaurants, cafes, cloud kitchens, resorts and modern hospitality businesses.",
  keywords: ["hospitality software", "hotel operations", "restaurant operations", "inventory control", "profit intelligence", "hospitality AI", "Munaffa"],
  applicationName: "Munaffa",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Munaffa",
    title: "Munaffa — Hospitality Profit OS",
    description: "Connect hospitality operations to cost, guest and profit visibility.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Munaffa — Hospitality Profit OS",
    description: "Connect hospitality operations to cost, guest and profit visibility.",
  },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#07100b",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <html lang="en"><body className={`${inter.variable} ${sora.variable}`}>{children}</body></html>;
}
