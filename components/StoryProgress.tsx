"use client";

import { useExperience, type ExperienceScene } from "@/lib/experience";

const steps: { scene: ExperienceScene; label: string }[] = [
  { scene: "hero", label: "Hospitality" },
  { scene: "problem", label: "Profit leaks" },
  { scene: "platform", label: "Connected flow" },
  { scene: "industries", label: "Industries" },
  { scene: "intelligence", label: "AI intelligence" },
  { scene: "proof", label: "Command center" },
  { scene: "final", label: "Get started" },
];

export function StoryProgress() {
  const activeScene = useExperience((state) => state.scene);
  const progress = useExperience((state) => state.progress);
  const reducedMotion = useExperience((state) => state.reducedMotion);

  function goTo(scene: ExperienceScene) {
    document.querySelector<HTMLElement>(`[data-scene="${scene}"]`)?.scrollIntoView({
      behavior: reducedMotion ? "auto" : "smooth",
      block: "start",
    });
  }

  return <nav className="story-progress" aria-label="Munaffa story sections">
    <span className="story-progress-fill" style={{ height: `${Math.max(0, Math.min(1, progress)) * 76}%` }} />
    {steps.map((step) => <button key={step.scene} type="button" className={activeScene === step.scene ? "active" : ""} onClick={() => goTo(step.scene)} aria-label={`Jump to ${step.label}`} aria-current={activeScene === step.scene ? "step" : undefined}>
      <span className="story-progress-label">{step.label}</span>
    </button>)}
  </nav>;
}
