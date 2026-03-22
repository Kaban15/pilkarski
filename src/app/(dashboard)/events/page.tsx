"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CardSkeleton } from "@/components/card-skeleton";
import { FavoriteButton } from "@/components/favorite-button";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";

type EventItem = {
  id: string;
  type: string;
  title: string;
  eventDate: string;
  location: string | null;
  maxParticipants: number | null;
  club: { id: string; name: string; city: string | null };
  region: { name: string } | null;
  _count: { applications: number };
};

import { EVENT_TYPE_LABELS, EVENT_TYPE_COLORS } from "@/lib/labels";

export default function EventsPage() {
  const [items, setItems] = useState<EventItem[]>([]);
  const [regionId, setRegionId] = useState<number | undefined>();
  const [type, setType] = useState<"OPEN_TRAINING" | "RECRUITMENT" | undefined>();
  const [cityInput, setCityInput] = useState("");
  const [city, setCity] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortBy, setSortBy] = useState<"eventDate" | "createdAt" | "title">("eventDate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [regions, setRegions] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | undefined>();
  const [showFilters, setShowFilters] = useState(false);
  const [favoritedIds, setFavoritedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    trpc.region.list.query().then(setRegions);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setCity(cityInput), 400);
    return () => clearTimeout(t);
  }, [cityInput]);

  useEffect(() => {
    setLoading(true);
    setNextCursor(undefined);
    trpc.event.list
      .query({
        regionId, type,
        city: city || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        sortBy, sortOrder,
      })
      .then((res) => {
        setItems(res.items as any);
        setNextCursor(res.nextCursor);
        const ids = (res.items as any[]).map((i: any) => i.id);
        if (ids.length) {
          trpc.favorite.check.query({ eventIds: ids }).then((favs) => setFavoritedIds(new Set(favs)));
        }
      })
      .finally(() => setLoading(false));
  }, [regionId, type, city, dateFrom, dateTo, sortBy, sortOrder]);

  const loadMore = useCallback(() => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    trpc.event.list
      .query({
        regionId, type, cursor: nextCursor,
        city: city || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        sortBy, sortOrder,
      })
      .then((res) => {
        setItems((prev) => [...prev, ...(res.items as any)]);
        setNextCursor(res.nextCursor);
      })
      .finally(() => setLoadingMore(false));
  }, [nextCursor, loadingMore, regionId, type, city, dateFrom, dateTo, sortBy, sortOrder]);

  const sentinelRef = useInfiniteScroll(loadMore, !!nextCursor, loadingMore);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Wydarzenia</h1>
        <Link href="/events/new">
          <Button>Dodaj wydarzenie</Button>
        </Link>
      </div>

      <div className="mb-4 space-y-3">
        <div className="flex flex-wrap gap-3">
          <select
            value={regionId ?? ""}
            onChange={(e) => setRegionId(e.target.value ? Number(e.target.value) : undefined)}
            className="rounded-md border bg-transparent px-3 py-1.5 text-sm"
          >
            <option value="">Wszystkie regiony</option>
            {regions.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
          <select
            value={type ?? ""}
            onChange={(e) => setType((e.target.value || undefined) as any)}
            className="rounded-md border bg-transparent px-3 py-1.5 text-sm"
          >
            <option value="">Wszystkie typy</option>
            <option value="OPEN_TRAINING">Treningi otwarte</option>
            <option value="RECRUITMENT">Nabory</option>
          </select>
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [sb, so] = e.target.value.split("-");
              setSortBy(sb as any);
              setSortOrder(so as any);
            }}
            className="rounded-md border bg-transparent px-3 py-1.5 text-sm"
          >
            <option value="eventDate-asc">Data (rosnąco)</option>
            <option value="eventDate-desc">Data (malejąco)</option>
            <option value="createdAt-desc">Najnowsze</option>
            <option value="createdAt-asc">Najstarsze</option>
            <option value="title-asc">Tytuł A-Z</option>
            <option value="title-desc">Tytuł Z-A</option>
          </select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            {showFilters ? "Ukryj filtry" : "Więcej filtrów"}
          </Button>
        </div>
        {showFilters && (
          <div className="flex flex-wrap gap-3 rounded-md border p-3">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Miasto</label>
              <Input
                value={cityInput}
                onChange={(e) => setCityInput(e.target.value)}
                placeholder="np. Kraków"
                className="h-8 w-40 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Data od</label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="h-8 w-40 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Data do</label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="h-8 w-40 text-sm"
              />
            </div>
            {(cityInput || dateFrom || dateTo) && (
              <Button
                variant="ghost"
                size="sm"
                className="self-end"
                onClick={() => { setCityInput(""); setCity(""); setDateFrom(""); setDateTo(""); }}
              >
                Wyczyść filtry
              </Button>
            )}
          </div>
        )}
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="text-muted-foreground">Brak wydarzeń.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((ev) => (
            <Link key={ev.id} href={`/events/${ev.id}`}>
              <Card className="transition hover:shadow-md">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{ev.title}</CardTitle>
                    <div className="flex items-center gap-1">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${EVENT_TYPE_COLORS[ev.type]}`}>
                        {EVENT_TYPE_LABELS[ev.type]}
                      </span>
                      <FavoriteButton eventId={ev.id} initialFavorited={favoritedIds.has(ev.id)} />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-1 text-sm text-muted-foreground">
                  <p><strong>{ev.club.name}</strong>{ev.club.city && ` · ${ev.club.city}`}</p>
                  <p>{formatDate(ev.eventDate)}</p>
                  {ev.location && <p>{ev.location}</p>}
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs text-muted-foreground">{ev.region?.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {ev._count.applications} zgłoszeń
                      {ev.maxParticipants && ` / ${ev.maxParticipants} miejsc`}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
          {loadingMore && (
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
