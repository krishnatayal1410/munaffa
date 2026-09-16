import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./workspace.css";
import "./guest.css";
import "./meeting.css";
import "./qr.css";
import "./pilot.css";
import "./account.css";

export const metadata: Metadata = {
  title: {
    default: "Munaffa — Restaurant Profit & Operations OS",
    template: "%s | Munaffa"
  },
  description: "Munaffa connects guest ordering, kitchen operations, recipes, inventory, billing, CRM and profit intelligence in one operating system for restaurants and cafés.",
  applicationName: "Munaffa",
  keywords: ["restaurant management", "restaurant profit", "restaurant inventory", "QR ordering", "kitchen display system", "restaurant CRM", "food cost", "restaurant operations"],
  openGraph: {
    title: "Munaffa — Restaurant Profit & Operations OS",
    description: "Know where every rupee goes. Connect the guest order to kitchen, stock, billing, guest memory and profit visibility.",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "Munaffa — Restaurant Profit & Operations OS",
    description: "Guest order to profit visibility — one connected restaurant operating layer."
  }
};

export const viewport: Viewport = { themeColor: "#050505", colorScheme: "dark" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
