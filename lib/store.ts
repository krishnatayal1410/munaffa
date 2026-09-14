import { create } from "zustand";

export type SceneName =
  | "hero"
  | "problem"
  | "connect"
  | "ordering"
  | "kitchen"
  | "inventory"
  | "profit"
  | "command"
  | "ai"
  | "final";

type State = {
  scene: SceneName;
  progress: number;
  sceneProgress: number;
  leak: number;
  reducedMotion: boolean;
  setScene: (scene: SceneName) => void;
  setProgress: (progress: number) => void;
  setSceneProgress: (sceneProgress: number) => void;
  setLeak: (leak: number) => void;
  toggleMotion: () => void;
};

export const useExperience = create<State>((set) => ({
  scene: "hero",
  progress: 0,
  sceneProgress: 0,
  leak: 0.35,
  reducedMotion: false,
  setScene: (scene) => set({ scene }),
  setProgress: (progress) => set({ progress }),
  setSceneProgress: (sceneProgress) => set({ sceneProgress }),
  setLeak: (leak) => set({ leak }),
  toggleMotion: () => set((state) => ({ reducedMotion: !state.reducedMotion })),
}));
