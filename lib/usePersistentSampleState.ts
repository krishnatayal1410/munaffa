"use client";

import { useEffect, useState } from "react";

export function usePersistentSampleState<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(initialValue);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(key);
      if (stored) setValue(JSON.parse(stored) as T);
    } catch {
      // A corrupted or blocked localStorage entry should never break the sample workspace.
    } finally {
      setHydrated(true);
    }
  }, [key]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Browsing modes that block storage still get a functional in-memory sample.
    }
  }, [hydrated, key, value]);

  function reset() {
    setValue(initialValue);
    try {
      window.localStorage.removeItem(key);
    } catch {
      // Ignore storage failures; state is already reset in memory.
    }
  }

  return [value, setValue, reset] as const;
}
