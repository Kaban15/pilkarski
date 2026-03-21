import { useEffect, useRef, useCallback } from "react";

export function useInfiniteScroll(
  onLoadMore: () => void,
  hasMore: boolean,
  loading: boolean
) {
  const observerRef = useRef<HTMLDivElement | null>(null);

  const setRef = useCallback(
    (node: HTMLDivElement | null) => {
      observerRef.current = node;
    },
    []
  );

  useEffect(() => {
    const node = observerRef.current;
    if (!node || !hasMore || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [onLoadMore, hasMore, loading]);

  return setRef;
}
