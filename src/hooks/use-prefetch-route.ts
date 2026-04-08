"use client";

import { useCallback } from "react";
import { api } from "@/lib/trpc-react";

const prefetchedRoutes = new Set<string>();

export function usePrefetchRoute() {
  const utils = api.useUtils();

  const prefetch = useCallback(
    (href: string) => {
      if (prefetchedRoutes.has(href)) return;
      prefetchedRoutes.add(href);

      switch (href) {
        case "/feed":
          void utils.feed.get.prefetch({ limit: 30 });
          void utils.stats.dashboard.prefetch(undefined);
          break;
        case "/sparings":
          void utils.sparing.list.prefetchInfinite({});
          break;
        case "/events":
          void utils.event.list.prefetchInfinite({});
          break;
        case "/transfers":
          void utils.transfer.list.prefetchInfinite({});
          break;
        case "/tournaments":
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
