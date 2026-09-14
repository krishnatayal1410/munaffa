import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Munaffa — Hospitality in motion",
  description: "An immersive 3D journey through the hospitality operating system — from guest interaction to profit visibility.",
  openGraph: {
    title: "Munaffa — Hospitality in motion",
    description: "A scroll-controlled 3D hospitality experience.",
    type: "website"
  }
};

export const viewport: Viewport = {
  themeColor: "#030504",
  colorScheme: "dark"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
