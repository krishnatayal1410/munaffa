import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return { name: "Munaffa", short_name: "Munaffa", description: "Immersive hospitality experience", start_url: "/", display: "standalone", background_color: "#050505", theme_color: "#050505" };
}
