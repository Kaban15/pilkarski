"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CardSkeleton } from "@/components/card-skeleton";
import { FavoriteButton } from "@/components/favorite-button";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { EmptyState } from "@/components/empty-state";
import {
  Plus,
  Calendar,
  MapPin,
  Globe,
  Users,
  SlidersHorizontal,
  X,
  Swords,
  Search,
} from "lucide-react";

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
  const hasActiveFilters = cityInput || dateFrom || dateTo;

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Sparingi</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Znajdź rywala na mecz sparingowy
          </p>
        </div>
        <Link href="/sparings/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Dodaj sparing</span>
            <span className="sm:hidden">Dodaj</span>
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="mb-6 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={regionId ?? ""}
            onChange={(e) => setRegionId(e.target.value ? Number(e.target.value) : undefined)}
            className="h-9 rounded-lg border border-input bg-background px-3 text-sm transition focus:outline-none focus:ring-2 focus:ring-ring"
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
            className="h-9 rounded-lg border border-input bg-background px-3 text-sm transition focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="matchDate-asc">Data meczu (rosnąco)</option>
            <option value="matchDate-desc">Data meczu (malejąco)</option>
            <option value="createdAt-desc">Najnowsze</option>
            <option value="createdAt-asc">Najstarsze</option>
            <option value="title-asc">Tytuł A-Z</option>
            <option value="title-desc">Tytuł Z-A</option>
          </select>
          <Button
            variant={showFilters ? "secondary" : "outline"}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-1.5"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filtry
            {hasActiveFilters && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                !
              </span>
            )}
          </Button>
        </div>

        {showFilters && (
          <Card>
            <CardContent className="flex flex-wrap items-end gap-4 py-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Miasto</label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={cityInput}
                    onChange={(e) => setCityInput(e.target.value)}
                    placeholder="np. Poznań"
                    className="h-9 w-44 pl-8 text-sm"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Data od</label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="h-9 w-40 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Data do</label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="h-9 w-40 text-sm"
                />
              </div>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-muted-foreground"
                  onClick={() => { setCityInput(""); setCity(""); setDateFrom(""); setDateTo(""); }}
                >
                  <X className="h-3.5 w-3.5" />
                  Wyczyść
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* List */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Swords}
          title="Brak sparingów"
          description="Nie znaleziono sparingów z aktualnymi filtrami. Spróbuj zmienić region lub daty."
        />
      ) : (
        <div className="stagger-children grid gap-4 sm:grid-cols-2">
          {items.map((s) => (
            <Link key={s.id} href={`/sparings/${s.id}`} className="group">
              <Card className="h-full border-l-[3px] border-l-emerald-500 transition-all hover:shadow-md hover:-translate-y-0.5">
                <CardContent className="py-4">
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                      {s.title}
                    </h3>
                    <FavoriteButton sparingOfferId={s.id} initialFavorited={favoritedIds.has(s.id)} />
                  </div>
                  <p className="mb-3 text-sm font-medium">
                    {s.club.name}
                    {s.club.city && <span className="text-muted-foreground"> · {s.club.city}</span>}
                  </p>
                  <div className="space-y-1.5 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDate(s.matchDate)}
                    </div>
                    {s.location && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5" />
                        {s.location}
                      </div>
                    )}
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Globe className="h-3 w-3" />
                      {s.region?.name}
                    </div>
                    <Badge variant="secondary" className="gap-1 text-xs">
                      <Users className="h-3 w-3" />
                      {s._count.applications}
                    </Badge>
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
