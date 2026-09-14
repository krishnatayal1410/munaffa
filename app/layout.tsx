import type { Metadata } from "next";
import { Inter, Sora } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const sora = Sora({ subsets: ["latin"], variable: "--font-sora" });

export const metadata: Metadata = {
  title: "Munaffa — Hospitality Profit OS",
  description: "AI-powered operating system for hotels, restaurants, cafes, cloud kitchens, resorts, bars and hospitality businesses.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className={`${inter.variable} ${sora.variable}`}>{children}</body></html>;
}
