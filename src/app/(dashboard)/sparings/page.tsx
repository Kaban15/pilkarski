"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { api } from "@/lib/trpc-react";
import {
  SPARING_LEVEL_LABELS,
  AGE_CATEGORY_LABELS,
} from "@/lib/labels";
import { SPARING_LEVELS, AGE_CATEGORIES } from "@/lib/validators/sparing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CardSkeleton } from "@/components/card-skeleton";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { EmptyState } from "@/components/empty-state";
import { SparingCard, type SparingCardItem } from "@/components/sparings/sparing-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  SlidersHorizontal,
  X,
  Swords,
  Search,
  Eye,
  Heart,
} from "lucide-react";

export default function SparingsPage() {
  const { data: session } = useSession();
  const isClub = session?.user?.role === "CLUB";
  const isPlayer = session?.user?.role === "PLAYER";
  const [tab, setTab] = useState<"search" | "my">("search");

  return (
    <div className="animate-fade-in">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Sparingi</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isPlayer
              ? "Przeglądaj sparingi i obserwuj interesujące mecze"
              : "Znajdź rywala na mecz sparingowy"}
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

      {isPlayer && (
        <Card className="mb-6 border-l-[3px] border-l-violet-500">
          <CardContent className="flex items-center gap-3 py-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-500/10">
              <Eye className="h-4 w-4 text-violet-500" />
            </div>
            <p className="text-sm text-muted-foreground">
              Obserwuj sparingi klikając <Heart className="inline h-3.5 w-3.5 text-rose-500" /> — znajdziesz je potem w{" "}
              <Link href="/favorites" className="font-medium text-primary hover:underline">
                Ulubionych
              </Link>
            </p>
          </CardContent>
        </Card>
      )}

      {isClub && (
        <Tabs value={tab} onValueChange={(v) => setTab(v as "search" | "my")} className="mb-6">
          <TabsList>
            <TabsTrigger value="search">Szukaj</TabsTrigger>
            <TabsTrigger value="my">Moje sparingi</TabsTrigger>
          </TabsList>
        </Tabs>
      )}

      {tab === "search" || !isClub ? <SearchTab /> : <MySparingsTab />}
    </div>
  );
}

function SearchTab() {
  const [regionId, setRegionId] = useState<string>("");
  const [cityInput, setCityInput] = useState("");
  const [city, setCity] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortValue, setSortValue] = useState("matchDate-asc");
  const [levelFilter, setLevelFilter] = useState("");
  const [ageCategoryFilter, setAgeCategoryFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const [sortBy, sortOrder] = sortValue.split("-") as [string, string];

  const { data: regions } = api.region.list.useQuery(undefined, { staleTime: Infinity });

  useEffect(() => {
    const t = setTimeout(() => setCity(cityInput), 400);
    return () => clearTimeout(t);
  }, [cityInput]);

  const queryInput = {
    regionId: regionId ? Number(regionId) : undefined,
    status: "OPEN" as const,
    level: (levelFilter || undefined) as any,
    ageCategory: (ageCategoryFilter || undefined) as any,
    city: city || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    sortBy: sortBy as any,
    sortOrder: sortOrder as any,
  };

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = api.sparing.list.useInfiniteQuery(queryInput, {
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });

  const items = (data?.pages.flatMap((p) => p.items) ?? []) as SparingCardItem[];
  const itemIds = items.map((i) => i.id);

  const { data: favIds } = api.favorite.check.useQuery(
    { sparingOfferIds: itemIds },
    { enabled: itemIds.length > 0 },
  );
  const favoritedIds = new Set(favIds ?? []);

  const sentinelRef = useInfiniteScroll(
    () => { fetchNextPage(); },
    !!hasNextPage,
    isFetchingNextPage,
  );

  const hasActiveFilters = cityInput || dateFrom || dateTo || levelFilter || ageCategoryFilter;

  return (
    <>
      <div className="mb-6 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Select value={regionId} onValueChange={setRegionId}>
            <SelectTrigger className="h-9 w-auto min-w-[180px]">
              <SelectValue placeholder="Wszystkie regiony" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Wszystkie regiony</SelectItem>
              {(regions ?? []).map((r) => (
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
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Poziom</label>
                <Select value={levelFilter} onValueChange={setLevelFilter}>
                  <SelectTrigger className="h-9 w-44 text-sm">
                    <SelectValue placeholder="Wszystkie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Wszystkie</SelectItem>
                    {SPARING_LEVELS.map((l) => (
                      <SelectItem key={l} value={l}>
                        {SPARING_LEVEL_LABELS[l]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Kategoria wiekowa</label>
                <Select value={ageCategoryFilter} onValueChange={setAgeCategoryFilter}>
                  <SelectTrigger className="h-9 w-48 text-sm">
                    <SelectValue placeholder="Wszystkie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Wszystkie</SelectItem>
                    {AGE_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {AGE_CATEGORY_LABELS[c]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                    setLevelFilter("");
                    setAgeCategoryFilter("");
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

      {isError ? (
        <EmptyState
          icon={Swords}
          title="Błąd ładowania"
          description="Nie udało się pobrać sparingów. Spróbuj odświeżyć stronę."
        />
      ) : isLoading ? (
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
          {isFetchingNextPage && (
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
  const { data: sparings, isLoading, isError } = api.sparing.my.useQuery();

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <EmptyState
        icon={Swords}
        title="Błąd ładowania"
        description="Nie udało się pobrać Twoich sparingów. Spróbuj odświeżyć stronę."
      />
    );
  }

  if (!sparings || sparings.length === 0) {
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
              <SparingCard key={s.id} sparing={s} showFavorite={false} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
