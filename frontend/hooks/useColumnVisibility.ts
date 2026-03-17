"use client";

import { useState, useCallback } from "react";

export function useColumnVisibility(storageKey: string, defaultCols: Set<string>) {
  const [visible, setVisible] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return defaultCols;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved) as string[];
        return new Set(parsed);
      }
    } catch {}
    return defaultCols;
  });

  const update = useCallback(
    (next: Set<string>) => {
      setVisible(next);
      try {
        localStorage.setItem(storageKey, JSON.stringify([...next]));
      } catch {}
    },
    [storageKey]
  );

  return [visible, update] as const;
}
