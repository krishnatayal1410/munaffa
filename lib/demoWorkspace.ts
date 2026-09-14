"use client";

import type { DemoUser, HospitalityType, Role } from "./domain";

const PROFILE_KEY = "munaffa.demo.profile.v2";
const SETUP_KEY = "munaffa.demo.setup.v2";

export type SetupState = {
  organizationName: string;
  hospitalityType: HospitalityType;
  role: Role;
  propertyName: string;
  city: string;
  enabledModules: string[];
};

export function readDemoProfile(): DemoUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PROFILE_KEY);
    return raw ? (JSON.parse(raw) as DemoUser) : null;
  } catch {
    return null;
  }
}

export function writeDemoProfile(user: DemoUser) {
  window.localStorage.setItem(PROFILE_KEY, JSON.stringify(user));
}

export function clearDemoProfile() {
  window.localStorage.removeItem(PROFILE_KEY);
}

export function saveDemoSetup(state: SetupState) {
  window.localStorage.setItem(SETUP_KEY, JSON.stringify(state));
  const user = readDemoProfile();
  if (user) writeDemoProfile({ ...user, organizationName: state.organizationName, hospitalityType: state.hospitalityType, role: state.role, onboardingComplete: true });
}

export function readDemoSetup(): SetupState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SETUP_KEY);
    return raw ? (JSON.parse(raw) as SetupState) : null;
  } catch {
    return null;
  }
}
