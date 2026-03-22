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

type SparingItem = {
  id: string;
  title: string;
  matchDate: string;
  location: string | null;
  status: string;
  club: { id: string; name: string; city: string | null };
  region: { name: string } | null;
  _count: { applications: number };
};

export default function SparingsPage() {
  const [items, setItems] = useState<SparingItem[]>([]);
  const [regionId, setRegionId] = useState<number | undefined>();
  const [cityInput, setCityInput] = useState("");
  const [city, setCity] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortBy, setSortBy] = useState<"matchDate" | "createdAt" | "title">("matchDate");
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
    trpc.sparing.list
      .query({
        regionId, status: "OPEN",
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
          trpc.favorite.check.query({ sparingOfferIds: ids }).then((favs) => setFavoritedIds(new Set(favs)));
        }
      })
      .finally(() => setLoading(false));
  }, [regionId, city, dateFrom, dateTo, sortBy, sortOrder]);

  const loadMore = useCallback(() => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    trpc.sparing.list
      .query({
        regionId, status: "OPEN", cursor: nextCursor,
        city: city || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        sortBy, sortOrder,
      })
      .then((res) => {
        const newItems = res.items as any[];
        setItems((prev) => [...prev, ...newItems]);
        setNextCursor(res.nextCursor);
        const newIds = newItems.map((i) => i.id);
        if (newIds.length) {
          trpc.favorite.check.query({ sparingOfferIds: newIds }).then((favs) =>
            setFavoritedIds((prev) => new Set([...prev, ...favs]))
          );
        }
      })
      .finally(() => setLoadingMore(false));
  }, [nextCursor, loadingMore, regionId, city, dateFrom, dateTo, sortBy, sortOrder]);

  const sentinelRef = useInfiniteScroll(loadMore, !!nextCursor, loadingMore);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Sparingi</h1>
        <Link href="/sparings/new">
          <Button>Dodaj sparing</Button>
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
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [sb, so] = e.target.value.split("-");
              setSortBy(sb as any);
              setSortOrder(so as any);
            }}
            className="rounded-md border bg-transparent px-3 py-1.5 text-sm"
          >
            <option value="matchDate-asc">Data meczu (rosnąco)</option>
            <option value="matchDate-desc">Data meczu (malejąco)</option>
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
                placeholder="np. Poznań"
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
        <p className="text-muted-foreground">Brak sparingów w tym regionie.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((s) => (
            <Link key={s.id} href={`/sparings/${s.id}`}>
              <Card className="transition hover:shadow-md">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{s.title}</CardTitle>
                    <FavoriteButton sparingOfferId={s.id} initialFavorited={favoritedIds.has(s.id)} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-1 text-sm text-muted-foreground">
                  <p><strong>{s.club.name}</strong>{s.club.city && ` · ${s.club.city}`}</p>
                  <p>{formatDate(s.matchDate)}</p>
                  {s.location && <p>{s.location}</p>}
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs text-muted-foreground">{s.region?.name}</span>
                    <span className="rounded-full bg-blue-50 dark:bg-blue-950 px-2 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-300">
                      {s._count.applications} {s._count.applications === 1 ? "zgłoszenie" : "zgłoszeń"}
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
