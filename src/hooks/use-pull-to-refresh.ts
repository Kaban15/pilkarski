"use client";

import { useRef, useCallback, useEffect, useState } from "react";

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void> | void;
  threshold?: number;
}

export function usePullToRefresh({ onRefresh, threshold = 80 }: UsePullToRefreshOptions) {
  const [pulling, setPulling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef(0);
  const currentY = useRef(0);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (window.scrollY > 0) return;
    startY.current = e.touches[0].clientY;
    setPulling(true);
  }, []);

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!pulling || refreshing) return;
      currentY.current = e.touches[0].clientY;
      const diff = Math.max(0, currentY.current - startY.current);
      const dampened = Math.min(diff * 0.5, threshold * 1.5);
      setPullDistance(dampened);
    },
    [pulling, refreshing, threshold],
  );

  const handleTouchEnd = useCallback(async () => {
    if (!pulling) return;
    setPulling(false);

    if (pullDistance >= threshold && !refreshing) {
      setRefreshing(true);
      await onRefresh();
      setRefreshing(false);
    }

    setPullDistance(0);
  }, [pulling, pullDistance, threshold, refreshing, onRefresh]);

  useEffect(() => {
    const opts = { passive: true } as AddEventListenerOptions;
    document.addEventListener("touchstart", handleTouchStart, opts);
    document.addEventListener("touchmove", handleTouchMove, opts);
    document.addEventListener("touchend", handleTouchEnd);

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  const progress = Math.min(pullDistance / threshold, 1);

  return { pullDistance, refreshing, progress };
}
