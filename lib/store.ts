"use client";

import { create } from "zustand";

type State = {
  progress: number;
  scene: number;
  local: number;
  velocity: number;
  pointerX: number;
  pointerY: number;
  reducedMotion: boolean;
  set: (next: Partial<Omit<State, "set">>) => void;
};

export const useExperience = create<State>((set) => ({
  progress: 0,
  scene: 0,
  local: 0,
  velocity: 0,
  pointerX: 0,
  pointerY: 0,
  reducedMotion: false,
  set: (next) => set(next)
}));
