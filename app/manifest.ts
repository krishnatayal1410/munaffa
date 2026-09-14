import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Munaffa — Hospitality Profit OS",
    short_name: "Munaffa",
    description: "Connected operations, cost, guest and profit visibility for hospitality businesses.",
    start_url: "/",
    display: "standalone",
    background_color: "#050b08",
    theme_color: "#07100b",
    categories: ["business", "productivity"],
  };
}
