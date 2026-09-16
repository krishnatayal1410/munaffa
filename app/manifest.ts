import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Munaffa — Restaurant Profit & Operations OS",
    short_name: "Munaffa",
    description: "Restaurant operations from guest order to profit visibility.",
    start_url: "/",
    display: "standalone",
    background_color: "#050505",
    theme_color: "#050505"
  };
}
