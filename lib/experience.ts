"use client";

import { create } from "zustand";

type ExperienceState = {
  progress: number;
  scene: number;
  localProgress: number;
  velocity: number;
  pointerX: number;
  pointerY: number;
  reducedMotion: boolean;
  update: (next: Partial<Omit<ExperienceState, "update">>) => void;
};

export const useExperience = create<ExperienceState>((set) => ({
  progress: 0,
  scene: 0,
  localProgress: 0,
  velocity: 0,
  pointerX: 0,
  pointerY: 0,
  reducedMotion: false,
  update: (next) => set(next)
}));
