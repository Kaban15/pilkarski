"use client";

import Link from "next/link";
import { api } from "@/lib/trpc-react";
import { formatDate } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CardSkeleton } from "@/components/card-skeleton";
import { FavoriteButton } from "@/components/favorite-button";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { EVENT_TYPE_LABELS, CLUB_POST_CATEGORY_LABELS, CLUB_POST_CATEGORY_COLORS } from "@/lib/labels";
import { EmptyState } from "@/components/empty-state";
import { Heart, Bookmark } from "lucide-react";

export default function FavoritesPage() {
  const { t } = useI18n();
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
      <h1 className="mb-6 text-2xl font-bold">{t("Ulubione")}</h1>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Heart}
          title={t("Brak ulubionych")}
          description={t("Kliknij serduszko na sparingu lub wydarzeniu, aby dodać je do ulubionych.")}
          actionLabel={t("Przeglądaj sparingi")}
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
                  <Card className="transition hover:border-border">
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
                        <span className="rounded-md bg-blue-50 dark:bg-blue-950 px-2 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-300">
                          {t("Sparing")}
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
                  <Card className="transition hover:border-border">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg">{event.title}</CardTitle>
                        <FavoriteButton eventId={event.id} initialFavorited={true} />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-1 text-sm text-muted-foreground">
                      <p><strong>{event.club?.name ?? t("Trener")}</strong>{event.club?.city && ` · ${event.club.city}`}</p>
                      <p>{formatDate(event.eventDate)}</p>
                      {event.location && <p>{event.location}</p>}
                      <div className="flex items-center justify-between pt-2">
                        <span className="text-xs text-muted-foreground">{event.region?.name}</span>
                        <span className="rounded-md bg-purple-50 dark:bg-purple-950 px-2 py-0.5 text-xs font-medium text-purple-700 dark:text-purple-300">
                          {t(EVENT_TYPE_LABELS[event.type] ?? event.type)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            }

            const clubPost = (fav as { clubPost?: { id: string; title: string; category: string; content: string | null; club: { id: string; name: string; city: string | null } } }).clubPost;
            if (clubPost) {
              return (
                <Card key={fav.id} className="transition hover:border-border">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{clubPost.title}</CardTitle>
                      <Bookmark className="h-4 w-4 text-primary fill-current" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-1 text-sm text-muted-foreground">
                    <p><strong>{clubPost.club.name}</strong>{clubPost.club.city && ` · ${clubPost.club.city}`}</p>
                    {clubPost.content && <p className="line-clamp-2">{clubPost.content}</p>}
                    <div className="flex items-center justify-between pt-2">
                      <span
                        className={`rounded-md px-2 py-0.5 text-xs font-medium ${
                          CLUB_POST_CATEGORY_COLORS[clubPost.category] || "bg-muted text-muted-foreground"
                        }`}
                      >
                        {t(CLUB_POST_CATEGORY_LABELS[clubPost.category] || "Post")}
                      </span>
                    </div>
                  </CardContent>
                </Card>
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
