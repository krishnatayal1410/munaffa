"use client";

import { useEffect } from "react";
import { useExperience, type SceneName } from "@/lib/store";

export function ExperienceController() {
  const setScene = useExperience((state) => state.setScene);
  const setProgress = useExperience((state) => state.setProgress);

  useEffect(() => {
    function update() {
      const elements = Array.from(document.querySelectorAll<HTMLElement>("[data-scene]"));
      const viewport = window.innerHeight;
      const total = document.documentElement.scrollHeight - viewport;
      setProgress(total > 0 ? window.scrollY / total : 0);

      let current = elements[0];
      let distance = Number.POSITIVE_INFINITY;
      for (const element of elements) {
        const next = Math.abs(element.getBoundingClientRect().top - viewport * 0.35);
        if (next < distance) {
          distance = next;
          current = element;
        }
      }
      const name = current?.dataset.scene as SceneName | undefined;
      if (name) setScene(name);
    }

    update();
    window.addEventListener("scroll", update);
    return () => window.removeEventListener("scroll", update);
  }, [setProgress, setScene]);

  return null;
}
