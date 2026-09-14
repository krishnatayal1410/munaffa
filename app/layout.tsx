import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Munaffa — Immersive Hospitality Experience",
  description: "A cinematic hospitality experience connecting venue, menu, AR-style dish exploration and profit visibility.",
  openGraph: {
    title: "Munaffa — Immersive Hospitality Experience",
    description: "Step inside a cinematic hospitality system built around real spaces and working interactions.",
    type: "website"
  }
};

export const viewport: Viewport = { themeColor: "#050505", colorScheme: "dark" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
