import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "72px", color: "#f5f8f5", background: "radial-gradient(circle at 72% 28%, rgba(157,245,111,.24), transparent 28%), linear-gradient(145deg,#07100b,#030705 72%)", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}><div style={{ width: 62, height: 62, borderRadius: 18, display: "flex", alignItems: "center", justifyContent: "center", background: "#9df56f", color: "#061008", fontSize: 34, fontWeight: 800 }}>M</div><div style={{ display: "flex", flexDirection: "column" }}><span style={{ fontSize: 34, fontWeight: 800 }}>munaffa</span><span style={{ fontSize: 15, color: "#9baaa0", letterSpacing: 2 }}>HOSPITALITY PROFIT OS</span></div></div>
      <div style={{ display: "flex", flexDirection: "column", maxWidth: 900 }}><span style={{ fontSize: 78, lineHeight: 1.02, fontWeight: 800, letterSpacing: -4 }}>Run hospitality on visibility, not guesswork.</span><span style={{ marginTop: 28, fontSize: 27, lineHeight: 1.4, color: "#b9c6bd" }}>Operations · Inventory · Guests · Profit intelligence</span></div>
      <div style={{ display: "flex", gap: 16, fontSize: 18, color: "#c8ffad" }}><span>Hotels</span><span>•</span><span>Restaurants</span><span>•</span><span>Cafés</span><span>•</span><span>Cloud kitchens</span><span>•</span><span>Resorts</span></div>
    </div>,
    size,
  );
}
