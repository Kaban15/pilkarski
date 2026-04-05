"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { api } from "@/lib/trpc-react";
import {
  SPARING_LEVEL_LABELS,
  AGE_CATEGORY_LABELS,
} from "@/lib/labels";
import {
  SPARING_LEVELS,
  AGE_CATEGORIES,
  type SparingLevel,
  type AgeCategory,
  type SparingSortBy,
  type SparingSortOrder,
} from "@/lib/validators/sparing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CardSkeleton } from "@/components/card-skeleton";
import { usePaginatedList } from "@/hooks/use-paginated-list";
import { EmptyState } from "@/components/empty-state";
import { SparingCard, type SparingCardItem } from "@/components/sparings/sparing-card";
import { ProcessSteps } from "@/components/process-steps";
import { Coachmark } from "@/components/coachmark";
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

  const pendingCount = api.stats.clubDashboard.useQuery(undefined, {
    enabled: isClub,
    staleTime: 30_000,
    select: (data) => data?.pendingApplications?.length ?? 0,
  });

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
            <TabsTrigger value="my">
              Moje sparingi
              {(pendingCount.data ?? 0) > 0 && (
                <span className="ml-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white">
                  {pendingCount.data}
                </span>
              )}
            </TabsTrigger>
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

  const [sortBy, sortOrder] = sortValue.split("-") as [SparingSortBy, SparingSortOrder];

  const { data: regions } = api.region.list.useQuery(undefined, { staleTime: Infinity });

  useEffect(() => {
    const t = setTimeout(() => setCity(cityInput), 400);
    return () => clearTimeout(t);
  }, [cityInput]);

  const queryInput = {
    regionId: regionId ? Number(regionId) : undefined,
    status: "OPEN" as const,
    level: (levelFilter || undefined) as SparingLevel | undefined,
    ageCategory: (ageCategoryFilter || undefined) as AgeCategory | undefined,
    city: city || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    sortBy,
    sortOrder,
  };

  const sparingsQuery = api.sparing.list.useInfiniteQuery(queryInput, {
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
  const { items: rawItems, isLoading, isError, refetch, sentinelRef, isFetchingNextPage } = usePaginatedList(sparingsQuery);
  const items = rawItems as SparingCardItem[];
  const itemIds = items.map((i) => i.id);

  const { data: favIds } = api.favorite.check.useQuery(
    { sparingOfferIds: itemIds },
    { enabled: itemIds.length > 0 },
  );
  const favoritedIds = new Set(favIds ?? []);

  const hasActiveFilters = cityInput || dateFrom || dateTo || levelFilter || ageCategoryFilter;

  return (
    <>
      <div className="mb-6 space-y-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <Select value={regionId || "__all__"} onValueChange={(v) => setRegionId(v === "__all__" ? "" : v)}>
            <SelectTrigger className="h-9 w-auto shrink-0 min-w-[180px]">
              <SelectValue placeholder="Wszystkie regiony" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Wszystkie regiony</SelectItem>
              {(regions ?? []).map((r) => (
                <SelectItem key={r.id} value={String(r.id)}>
                  {r.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortValue} onValueChange={setSortValue}>
            <SelectTrigger className="h-9 w-auto shrink-0 min-w-[180px]">
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
            className="shrink-0 gap-1.5"
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
                <Select value={levelFilter || "__all__"} onValueChange={(v) => setLevelFilter(v === "__all__" ? "" : v)}>
                  <SelectTrigger className="h-9 w-44 text-sm">
                    <SelectValue placeholder="Wszystkie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Wszystkie</SelectItem>
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
                <Select value={ageCategoryFilter || "__all__"} onValueChange={(v) => setAgeCategoryFilter(v === "__all__" ? "" : v)}>
                  <SelectTrigger className="h-9 w-48 text-sm">
                    <SelectValue placeholder="Wszystkie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Wszystkie</SelectItem>
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
          description="Nie udało się pobrać sparingów."
          actionLabel="Spróbuj ponownie"
          actionOnClick={() => refetch()}
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
        <div className="grid gap-4 sm:grid-cols-2">
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
  const { data: sparings, isLoading, isError, refetch } = api.sparing.my.useQuery();

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
        description="Nie udało się pobrać Twoich sparingów."
        actionLabel="Spróbuj ponownie"
        actionOnClick={() => refetch()}
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

  const open = sparings.filter((s) => s.status === "OPEN");
  const matched = sparings.filter((s) => s.status === "MATCHED");
  const completed = sparings.filter((s) => s.status === "COMPLETED");
  const cancelled = sparings.filter((s) => s.status === "CANCELLED");

  const now = new Date();
  const upcomingMatched = matched.filter((s) => new Date(s.matchDate) >= now);
  const pastMatched = matched.filter((s) => new Date(s.matchDate) < now);

  // Determine overall process step for the legend
  const hasOpen = open.length > 0;
  const hasMatched = matched.length > 0 || upcomingMatched.length > 0;
  const hasCompleted = completed.length > 0;
  const processStep = hasCompleted ? 3 : hasMatched ? 2 : hasOpen ? 1 : 0;

  const groups = [
    { label: "Nadchodzące mecze", items: upcomingMatched, highlight: true },
    { label: "Otwarte", items: open, highlight: false },
    { label: "Dopasowane (rozegrane)", items: pastMatched, highlight: false },
    { label: "Zakończone", items: completed, highlight: false },
    { label: "Anulowane", items: cancelled, highlight: false },
  ].filter((g) => g.items.length > 0);

  return (
    <div className="space-y-8">
      <Coachmark
        storageKey="ps_coachmark_sparings"
        title="Zarządzaj sparingami"
        description="Tu widzisz swoje ogłoszenia. Kliknij w sparing, żeby zobaczyć zgłoszenia, zaakceptować rywala lub ocenić mecz."
      />

      <ProcessSteps
        steps={[
          { label: "Ogłoszenie", description: "Dodaj sparing" },
          { label: "Zgłoszenia", description: "Wybierz rywala" },
          { label: "Rozegrany i oceniony" },
        ]}
        currentStep={processStep}
      />

      {groups.map((group) => (
        <div key={group.label}>
          <h2 className={`mb-3 text-lg font-semibold ${group.highlight ? "text-primary" : ""}`}>{group.label} ({group.items.length})</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {group.items.map((s) => (
              <SparingCard key={s.id} sparing={s as SparingCardItem} showFavorite={false} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
