import { create } from "zustand";

export type SceneName = "hero"|"problem"|"connect"|"ordering"|"kitchen"|"inventory"|"profit"|"leakage"|"command"|"roles"|"ai"|"simulator"|"integrations"|"pricing"|"final";

type State = {
  scene: SceneName;
  progress: number;
  leak: number;
  reducedMotion: boolean;
  setScene: (scene: SceneName) => void;
  setProgress: (progress: number) => void;
  setLeak: (leak: number) => void;
  toggleMotion: () => void;
};

export const useExperience = create<State>((set) => ({
  scene: "hero",
  progress: 0,
  leak: .35,
  reducedMotion: false,
  setScene: (scene) => set({scene}),
  setProgress: (progress) => set({progress}),
  setLeak: (leak) => set({leak}),
  toggleMotion: () => set((s) => ({reducedMotion: !s.reducedMotion}))
}));
