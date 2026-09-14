"use client";

import { useEffect } from "react";
import { useExperience, type SceneName } from "@/lib/store";

export function ExperienceController() {
  const setScene = useExperience((state) => state.setScene);
  const setProgress = useExperience((state) => state.setProgress);
  const setSceneProgress = useExperience((state) => state.setSceneProgress);

  useEffect(() => {
    let raf = 0;

    const update = () => {
      raf = 0;
      const sections = Array.from(document.querySelectorAll<HTMLElement>("[data-scene]"));
      if (!sections.length) return;

      const viewport = window.innerHeight;
      const maxScroll = Math.max(1, document.documentElement.scrollHeight - viewport);
      const globalProgress = Math.min(1, Math.max(0, window.scrollY / maxScroll));
      setProgress(globalProgress);

      let active = sections[0];
      let nearest = Number.POSITIVE_INFINITY;

      for (const section of sections) {
        const rect = section.getBoundingClientRect();
        const centerDistance = Math.abs(rect.top + rect.height * 0.5 - viewport * 0.5);
        if (centerDistance < nearest) {
          nearest = centerDistance;
          active = section;
        }
      }

      const rect = active.getBoundingClientRect();
      const travel = rect.height + viewport;
      const local = Math.min(1, Math.max(0, (viewport - rect.top) / travel));
      const sceneName = active.dataset.scene as SceneName | undefined;

      if (sceneName) setScene(sceneName);
      setSceneProgress(local);
    };

    const schedule = () => {
      if (!raf) raf = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);

    return () => {
      if (raf) window.cancelAnimationFrame(raf);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [setProgress, setScene, setSceneProgress]);

  return null;
}
