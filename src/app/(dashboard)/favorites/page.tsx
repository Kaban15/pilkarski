"use client";

import Link from "next/link";
import { api } from "@/lib/trpc-react";
import { formatDate } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CardSkeleton } from "@/components/card-skeleton";
import { FavoriteButton } from "@/components/favorite-button";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { EVENT_TYPE_LABELS } from "@/lib/labels";
import { EmptyState } from "@/components/empty-state";
import { Heart } from "lucide-react";

export default function FavoritesPage() {
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    api.favorite.list.useInfiniteQuery(
      {},
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
      },
    );

  const items = data?.pages.flatMap((p) => p.items) ?? [];

  const sentinelRef = useInfiniteScroll(
    () => { fetchNextPage(); },
    !!hasNextPage,
    isFetchingNextPage,
  );

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Ulubione</h1>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="Brak ulubionych"
          description="Kliknij serduszko na sparingu lub wydarzeniu, aby dodać je do ulubionych."
          actionLabel="Przeglądaj sparingi"
          actionHref="/sparings"
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((fav) => {
            const sparing = fav.sparingOffer;
            const event = fav.event;

            if (sparing) {
              return (
                <Link key={fav.id} href={`/sparings/${sparing.id}`}>
                  <Card className="transition hover:shadow-md">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg">{sparing.title}</CardTitle>
                        <FavoriteButton sparingOfferId={sparing.id} initialFavorited={true} />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-1 text-sm text-muted-foreground">
                      <p><strong>{sparing.club.name}</strong>{sparing.club.city && ` · ${sparing.club.city}`}</p>
                      <p>{formatDate(sparing.matchDate)}</p>
                      {sparing.location && <p>{sparing.location}</p>}
                      <div className="flex items-center justify-between pt-2">
                        <span className="text-xs text-muted-foreground">{sparing.region?.name}</span>
                        <span className="rounded-full bg-blue-50 dark:bg-blue-950 px-2 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-300">
                          Sparing
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            }

            if (event) {
              return (
                <Link key={fav.id} href={`/events/${event.id}`}>
                  <Card className="transition hover:shadow-md">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg">{event.title}</CardTitle>
                        <FavoriteButton eventId={event.id} initialFavorited={true} />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-1 text-sm text-muted-foreground">
                      <p><strong>{event.club.name}</strong>{event.club.city && ` · ${event.club.city}`}</p>
                      <p>{formatDate(event.eventDate)}</p>
                      {event.location && <p>{event.location}</p>}
                      <div className="flex items-center justify-between pt-2">
                        <span className="text-xs text-muted-foreground">{event.region?.name}</span>
                        <span className="rounded-full bg-purple-50 dark:bg-purple-950 px-2 py-0.5 text-xs font-medium text-purple-700 dark:text-purple-300">
                          {EVENT_TYPE_LABELS[event.type]}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            }

            return null;
          })}
          {isFetchingNextPage && (
            <>
              <CardSkeleton />
              <CardSkeleton />
            </>
          )}
          <div ref={sentinelRef} />
        </div>
      )}
    </div>
  );
}
