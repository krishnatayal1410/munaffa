"use client";

import { useEffect } from "react";
import { useExperience, type ExperienceScene } from "@/lib/experience";

export function ExperienceController() {
  const setScene = useExperience((s) => s.setScene);
  const setProgress = useExperience((s) => s.setProgress);
  const setLocalProgress = useExperience((s) => s.setLocalProgress);

  useEffect(() => {
    const sections = Array.from(document.querySelectorAll<HTMLElement>("[data-scene]"));
    const update = () => {
      const vh = window.innerHeight;
      const max = Math.max(1, document.documentElement.scrollHeight - vh);
      setProgress(window.scrollY / max);
      let winner = sections[0];
      let distance = Number.POSITIVE_INFINITY;
      for (const section of sections) {
        const rect = section.getBoundingClientRect();
        const d = Math.abs(rect.top - vh * 0.35);
        if (d < distance) { distance = d; winner = section; }
      }
      if (winner) {
        const rect = winner.getBoundingClientRect();
        const total = rect.height + vh;
        setLocalProgress(Math.min(1, Math.max(0, (vh - rect.top) / total)));
        setScene(winner.dataset.scene as ExperienceScene);
      }
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => { window.removeEventListener("scroll", update); window.removeEventListener("resize", update); };
  }, [setLocalProgress, setProgress, setScene]);

  return null;
}
