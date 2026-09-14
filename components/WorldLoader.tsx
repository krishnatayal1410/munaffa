"use client";

import { useProgress } from "@react-three/drei";

function assetLabel(item: string) {
  if (!item) return "Preparing immersive hospitality world";
  const clean = item.split("?")[0]?.split("/").pop() || "3D asset";
  return clean.replace(/[_-]+/g, " ").replace(/\.gltf$|\.glb$|\.hdr$/i, "");
}

export function WorldLoader() {
  const { active, progress, item, loaded, total } = useProgress();
  const percent = Math.max(0, Math.min(100, Number.isFinite(progress) ? progress : 0));

  if (!active && percent >= 100) return null;

  return <div className={`world-loader ${active || percent < 100 ? "is-visible" : ""}`} role="status" aria-live="polite">
    <div className="world-loader-card">
      <div className="world-loader-brand"><span className="brand-glyph">M</span><span><b>munaffa</b><small>Building the hospitality world</small></span></div>
      <div className="world-loader-copy"><b>{assetLabel(item)}</b><span>{total > 0 ? `${loaded}/${total} assets` : "Initializing renderer"}</span></div>
      <div className="world-loader-track"><i style={{ width: `${Math.max(percent, 4)}%` }} /></div>
      <small>{Math.round(percent)}% · real-time 3D assets load progressively</small>
    </div>
  </div>;
}
