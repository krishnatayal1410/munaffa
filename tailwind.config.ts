import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        munaffa: {
          bg: "#07100B",
          surface: "#0D1812",
          green: "#A8F36A",
          deep: "#37A966",
          mint: "#C6FF9C",
          warm: "#FFB55E",
          danger: "#FF6B62",
          muted: "#9BAAA0"
        }
      },
      fontFamily: {
        display: ["Sora", "Inter", "ui-sans-serif", "system-ui"],
        sans: ["Inter", "ui-sans-serif", "system-ui"]
      }
    }
  },
  plugins: []
} satisfies Config;
