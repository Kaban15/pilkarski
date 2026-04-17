"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "pilkasport-sidebar-collapsed";

export function useSidebarState() {
  const [collapsed, setCollapsed] = useState(true);

  useEffect(() => {
    // Hydration: read localStorage after mount to avoid SSR mismatch.
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCollapsed(stored === "true");
    }
  }, []);

  const toggle = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  };

  return { collapsed, toggle };
}
