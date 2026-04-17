import { useCallback, useMemo } from "react";
import { useInfiniteScroll } from "./use-infinite-scroll";

interface PaginatedQuery<T> {
  data: { pages: Array<{ items: T[]; nextCursor?: string | null }> } | undefined;
  isLoading: boolean;
  isError: boolean;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  refetch: () => void;
}

interface UsePaginatedListResult<T> {
  items: T[];
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
  sentinelRef: (node: HTMLDivElement | null) => void;
  hasMore: boolean;
  isFetchingNextPage: boolean;
}

export function usePaginatedList<T>(query: PaginatedQuery<T>): UsePaginatedListResult<T> {
  const items = useMemo(
    () => query.data?.pages.flatMap((p) => p.items) ?? [],
    [query.data]
  );

  const { fetchNextPage } = query;
  const fetchNext = useCallback(() => {
    fetchNextPage();
  }, [fetchNextPage]);

  const sentinelRef = useInfiniteScroll(
    fetchNext,
    !!query.hasNextPage,
    query.isFetchingNextPage
  );

  return {
    items,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    sentinelRef,
    hasMore: !!query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
  };
}
