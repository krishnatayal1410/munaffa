"use client";

import { create } from "zustand";

type ExperienceState = {
  progress: number;
  scene: number;
  localProgress: number;
  update: (next: Partial<Pick<ExperienceState, "progress" | "scene" | "localProgress">>) => void;
};

export const useExperience = create<ExperienceState>((set) => ({
  progress: 0,
  scene: 0,
  localProgress: 0,
  update: (next) => set(next)
}));
