"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "pilkasport-sidebar-collapsed";

export function useSidebarState() {
  const [collapsed, setCollapsed] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
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
