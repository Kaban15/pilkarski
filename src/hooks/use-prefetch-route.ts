"use client";

import { useCallback } from "react";
import { api } from "@/lib/trpc-react";

const prefetchedRoutes = new Map<string, number>();
const PREFETCH_COOLDOWN = 60_000; // re-prefetch after 60s

export function usePrefetchRoute() {
  const utils = api.useUtils();

  const prefetch = useCallback(
    (href: string) => {
      const lastPrefetch = prefetchedRoutes.get(href) ?? 0;
      if (Date.now() - lastPrefetch < PREFETCH_COOLDOWN) return;
      prefetchedRoutes.set(href, Date.now());

      switch (href) {
        case "/feed":
          void utils.feed.get.prefetch({ limit: 30 });
          void utils.stats.dashboard.prefetch(undefined);
          break;
        case "/sparings":
          // Match SparingsClient initial input (sparings-client.tsx:133,147-157)
          void utils.sparing.list.prefetchInfinite({
            status: "OPEN",
            sortBy: "matchDate",
            sortOrder: "asc",
          });
          break;
        case "/events":
          // Match EventsPage initial input (events/page.tsx:104-105,123-138)
          void utils.event.list.prefetchInfinite({
            sortBy: "eventDate",
            sortOrder: "asc",
          });
          break;
        case "/transfers":
          void utils.transfer.list.prefetchInfinite({});
          break;
        case "/tournaments":
          // Tournaments client uses `{ regionId: undefined, status: undefined }`
          // which serializes identically to {} for TanStack cache key
          void utils.tournament.list.prefetchInfinite({});
          break;
        case "/messages":
          void utils.message.getConversations.prefetch(undefined);
          break;
        case "/community":
          void utils.clubPost.list.prefetch({});
          break;
        case "/ranking":
          void utils.gamification.leaderboard.prefetch({ limit: 20 });
          break;
        case "/notifications":
          void utils.notification.list.prefetch({ limit: 50 });
          break;
        case "/favorites":
          void utils.favorite.list.prefetchInfinite({});
          break;
      }
    },
    [utils],
  );

  return prefetch;
}
