import { create } from "zustand";

export type ExperienceScene = "hero" | "problem" | "platform" | "industries" | "intelligence" | "proof" | "final";

type ExperienceState = {
  scene: ExperienceScene;
  progress: number;
  localProgress: number;
  reducedMotion: boolean;
  setScene: (scene: ExperienceScene) => void;
  setProgress: (progress: number) => void;
  setLocalProgress: (progress: number) => void;
  setReducedMotion: (reducedMotion: boolean) => void;
  toggleReducedMotion: () => void;
};

export const useExperience = create<ExperienceState>((set) => ({
  scene: "hero",
  progress: 0,
  localProgress: 0,
  reducedMotion: false,
  setScene: (scene) => set({ scene }),
  setProgress: (progress) => set({ progress }),
  setLocalProgress: (localProgress) => set({ localProgress }),
  setReducedMotion: (reducedMotion) => set({ reducedMotion }),
  toggleReducedMotion: () => set((state) => ({ reducedMotion: !state.reducedMotion })),
}));
