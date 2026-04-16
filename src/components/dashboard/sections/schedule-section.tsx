"use client";

import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/trpc-react";
import { useI18n } from "@/lib/i18n";
import { formatDate } from "@/lib/format";
import { EventCard } from "@/components/events/event-card";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FeedCard, type FeedItem } from "@/components/feed/feed-card-router";
import { CalendarDays, Plus, Swords, Users } from "lucide-react";

type FilterType = "all" | "sparings" | "events";

const SCHEDULE_FEED_TYPES = new Set(["sparing", "tournament"]);

export function ScheduleSection() {
  const { t } = useI18n();
  const [filter, setFilter] = useState<FilterType>("all");

  const { data, isLoading } = api.stats.clubDashboard.useQuery(undefined, {
    staleTime: 120_000,
  });
  const feed = api.feed.get.useQuery({ limit: 30 }, { staleTime: 300_000 });

  if (isLoading || !data) return null;

  const { activeSparings, upcomingEvents } = data;

  const feedItems = (feed.data?.items as FeedItem[] | undefined)?.filter((i) =>
    SCHEDULE_FEED_TYPES.has(i.type)
  ) ?? [];

  const sparingItems = activeSparings.map((s) => ({
    type: "sparing" as const,
    id: s.id,
    date: new Date(s.matchDate),
    data: s,
  }));

  const eventItems = upcomingEvents.map((e) => ({
    type: "event" as const,
    id: e.id,
    date: new Date(e.eventDate),
    data: e,
  }));

  const allItems = [...sparingItems, ...eventItems].sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  );

  const filteredItems =
    filter === "all"
      ? allItems
      : filter === "sparings"
        ? sparingItems
        : eventItems;

  const filters: { key: FilterType; label: string }[] = [
    { key: "all", label: t("Wszystko") },
    { key: "sparings", label: t("Sparingi") },
    { key: "events", label: t("Wydarzenia") },
  ];

  return (
    <section>
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
          <CalendarDays className="h-4 w-4 text-primary" />
          {t("Terminarz")}
        </h2>
        <div className="flex items-center gap-2">
          <Link href="/sparings/new">
            <Button size="sm" variant="outline" className="gap-1.5 rounded-lg">
              <Plus className="h-3.5 w-3.5" />
              {t("Dodaj")}
            </Button>
          </Link>
          <Link href="/sparings" className="text-xs font-medium text-primary hover:underline">
            {t("Zobacz wszystko →")}
          </Link>
        </div>
      </div>

      {/* Filter pills */}
      <div className="mb-4 flex gap-2">
        {filters.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={[
              "rounded-full px-3 py-1 text-xs font-medium transition-colors",
              filter === key
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80",
            ].join(" ")}
          >
            {label}
          </button>
        ))}
      </div>

      {/* List */}
      {filteredItems.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title={t("Brak pozycji w terminarzu")}
          description={t("Dodaj sparing lub wydarzenie, aby zobaczyć je tutaj.")}
          actionLabel={t("Dodaj sparing")}
          actionHref="/sparings/new"
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((item) => {
            if (item.type === "event") {
              return <EventCard key={`event-${item.id}`} event={item.data} />;
            }

            const s = item.data;
            return (
              <Link key={`sparing-${s.id}`} href={`/sparings/${s.id}`} className="group block">
                <Card className="h-full rounded-xl transition-colors hover:border-primary/40">
                  <CardContent className="p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <Swords className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                      <h3 className="text-sm font-semibold group-hover:text-primary transition-colors line-clamp-1">
                        {s.title}
                      </h3>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" />
                        {formatDate(s.matchDate)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {s._count.applications}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      {/* Feed: sparingi + turnieje z regionu */}
      {feedItems.length > 0 && (
        <div className="mt-6">
          <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {t("Z regionu")}
          </h3>
          <div className="space-y-3">
            {feedItems.map((item) => (
              <FeedCard key={`${item.type}-${item.data.id}`} item={item} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
