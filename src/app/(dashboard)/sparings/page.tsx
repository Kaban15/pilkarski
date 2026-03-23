"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { trpc } from "@/lib/trpc";
import { formatDate } from "@/lib/format";
import { SPARING_STATUS_LABELS, SPARING_STATUS_COLORS } from "@/lib/labels";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CardSkeleton } from "@/components/card-skeleton";
import { FavoriteButton } from "@/components/favorite-button";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { EmptyState } from "@/components/empty-state";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  const { data: session } = useSession();
  const isClub = session?.user?.role === "CLUB";
  const [tab, setTab] = useState<"search" | "my">("search");

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
        {isClub && (
          <Link href="/sparings/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Dodaj sparing</span>
              <span className="sm:hidden">Dodaj</span>
            </Button>
          </Link>
        )}
      </div>

      {isClub && (
        <Tabs value={tab} onValueChange={(v) => setTab(v as "search" | "my")} className="mb-6">
          <TabsList>
            <TabsTrigger value="search">Szukaj</TabsTrigger>
            <TabsTrigger value="my">Moje sparingi</TabsTrigger>
          </TabsList>
        </Tabs>
      )}

      {tab === "search" ? <SearchTab /> : <MySparingsTab />}
    </div>
  );
}

function SearchTab() {
  const [items, setItems] = useState<SparingItem[]>([]);
  const [regionId, setRegionId] = useState<string>("");
  const [cityInput, setCityInput] = useState("");
  const [city, setCity] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortValue, setSortValue] = useState("matchDate-asc");
  const [regions, setRegions] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | undefined>();
  const [showFilters, setShowFilters] = useState(false);
  const [favoritedIds, setFavoritedIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState(false);

  const [sortBy, sortOrder] = sortValue.split("-") as [string, string];

  useEffect(() => {
    trpc.region.list.query().then(setRegions).catch(() => {});
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
        regionId: regionId ? Number(regionId) : undefined,
        status: "OPEN",
        city: city || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        sortBy: sortBy as any,
        sortOrder: sortOrder as any,
      })
      .then((res) => {
        setItems(res.items as any);
        setNextCursor(res.nextCursor);
        setError(false);
        const ids = (res.items as any[]).map((i: any) => i.id);
        if (ids.length) {
          trpc.favorite.check
            .query({ sparingOfferIds: ids })
            .then((favs) => setFavoritedIds(new Set(favs)))
            .catch(() => {});
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [regionId, city, dateFrom, dateTo, sortBy, sortOrder]);

  const loadMore = useCallback(() => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    trpc.sparing.list
      .query({
        regionId: regionId ? Number(regionId) : undefined,
        status: "OPEN",
        cursor: nextCursor,
        city: city || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        sortBy: sortBy as any,
        sortOrder: sortOrder as any,
      })
      .then((res) => {
        const newItems = res.items as any[];
        setItems((prev) => [...prev, ...newItems]);
        setNextCursor(res.nextCursor);
        const newIds = newItems.map((i) => i.id);
        if (newIds.length) {
          trpc.favorite.check
            .query({ sparingOfferIds: newIds })
            .then((favs) =>
              setFavoritedIds((prev) => new Set([...prev, ...favs]))
            )
            .catch(() => {});
        }
      })
      .finally(() => setLoadingMore(false));
  }, [nextCursor, loadingMore, regionId, city, dateFrom, dateTo, sortBy, sortOrder]);

  const sentinelRef = useInfiniteScroll(loadMore, !!nextCursor, loadingMore);
  const hasActiveFilters = cityInput || dateFrom || dateTo;

  return (
    <>
      {/* Filters */}
      <div className="mb-6 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Select value={regionId} onValueChange={setRegionId}>
            <SelectTrigger className="h-9 w-auto min-w-[180px]">
              <SelectValue placeholder="Wszystkie regiony" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Wszystkie regiony</SelectItem>
              {regions.map((r) => (
                <SelectItem key={r.id} value={String(r.id)}>
                  {r.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortValue} onValueChange={setSortValue}>
            <SelectTrigger className="h-9 w-auto min-w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="matchDate-asc">Data meczu (rosnąco)</SelectItem>
              <SelectItem value="matchDate-desc">Data meczu (malejąco)</SelectItem>
              <SelectItem value="createdAt-desc">Najnowsze</SelectItem>
              <SelectItem value="createdAt-asc">Najstarsze</SelectItem>
              <SelectItem value="title-asc">Tytuł A-Z</SelectItem>
              <SelectItem value="title-desc">Tytuł Z-A</SelectItem>
            </SelectContent>
          </Select>
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
                  onClick={() => {
                    setCityInput("");
                    setCity("");
                    setDateFrom("");
                    setDateTo("");
                  }}
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
      {error ? (
        <EmptyState
          icon={Swords}
          title="Błąd ładowania"
          description="Nie udało się pobrać sparingów. Spróbuj odświeżyć stronę."
        />
      ) : loading ? (
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
            <SparingCard key={s.id} sparing={s} favorited={favoritedIds.has(s.id)} />
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
    </>
  );
}

function MySparingsTab() {
  const [sparings, setSparings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    trpc.sparing.my
      .query()
      .then(setSparings)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon={Swords}
        title="Błąd ładowania"
        description="Nie udało się pobrać Twoich sparingów. Spróbuj odświeżyć stronę."
      />
    );
  }

  if (sparings.length === 0) {
    return (
      <EmptyState
        icon={Swords}
        title="Brak sparingów"
        description="Nie masz jeszcze żadnych sparingów. Utwórz pierwszy!"
        actionLabel="Dodaj sparing"
        actionHref="/sparings/new"
      />
    );
  }

  // Group by status
  const open = sparings.filter((s: any) => s.status === "OPEN");
  const matched = sparings.filter((s: any) => s.status === "MATCHED");
  const completed = sparings.filter((s: any) => s.status === "COMPLETED");
  const cancelled = sparings.filter((s: any) => s.status === "CANCELLED");

  const groups = [
    { label: "Otwarte", items: open },
    { label: "Dopasowane", items: matched },
    { label: "Zakończone", items: completed },
    { label: "Anulowane", items: cancelled },
  ].filter((g) => g.items.length > 0);

  return (
    <div className="space-y-8">
      {groups.map((group) => (
        <div key={group.label}>
          <h2 className="mb-3 text-lg font-semibold">{group.label} ({group.items.length})</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {group.items.map((s: any) => (
              <Link key={s.id} href={`/sparings/${s.id}`} className="group">
                <Card className="h-full border-l-[3px] border-l-emerald-500 transition-all hover:shadow-md hover:-translate-y-0.5">
                  <CardContent className="py-4">
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                        {s.title}
                      </h3>
                      <Badge
                        variant="secondary"
                        className={`text-xs ${SPARING_STATUS_COLORS[s.status]}`}
                      >
                        {SPARING_STATUS_LABELS[s.status]}
                      </Badge>
                    </div>
                    <div className="space-y-1.5 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(s.matchDate)}
                      </div>
                      {s.region && (
                        <div className="flex items-center gap-1.5">
                          <Globe className="h-3 w-3" />
                          {s.region.name}
                        </div>
                      )}
                    </div>
                    <div className="mt-3 flex items-center gap-1.5 border-t border-border pt-3 text-xs text-muted-foreground">
                      <Users className="h-3 w-3" />
                      {s._count.applications} zgłoszeń
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function SparingCard({ sparing, favorited }: { sparing: SparingItem; favorited: boolean }) {
  return (
    <Link href={`/sparings/${sparing.id}`} className="group">
      <Card className="h-full border-l-[3px] border-l-emerald-500 transition-all hover:shadow-md hover:-translate-y-0.5">
        <CardContent className="py-4">
          <div className="mb-3 flex items-start justify-between gap-2">
            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
              {sparing.title}
            </h3>
            <FavoriteButton sparingOfferId={sparing.id} initialFavorited={favorited} />
          </div>
          <p className="mb-3 text-sm font-medium">
            {sparing.club.name}
            {sparing.club.city && (
              <span className="text-muted-foreground"> · {sparing.club.city}</span>
            )}
          </p>
          <div className="space-y-1.5 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              {formatDate(sparing.matchDate)}
            </div>
            {sparing.location && (
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                {sparing.location}
              </div>
            )}
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Globe className="h-3 w-3" />
              {sparing.region?.name}
            </div>
            <Badge variant="secondary" className="gap-1 text-xs">
              <Users className="h-3 w-3" />
              {sparing._count.applications}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
