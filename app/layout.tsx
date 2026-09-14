import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Munaffa — Hospitality, connected to profit",
  description: "A cinematic product story for a hospitality operating system that connects orders, kitchen, inventory, payments and profit visibility.",
  openGraph: {
    title: "Munaffa — Hospitality, connected to profit",
    description: "See how hospitality operations connect to margin, one scroll at a time.",
    type: "website"
  }
};

export const viewport: Viewport = {
  themeColor: "#050706",
  colorScheme: "dark"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
