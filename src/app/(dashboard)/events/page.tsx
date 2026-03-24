"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { api } from "@/lib/trpc-react";
import { formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CardSkeleton } from "@/components/card-skeleton";
import { FavoriteButton } from "@/components/favorite-button";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { EVENT_TYPE_LABELS } from "@/lib/labels";
import { EmptyState } from "@/components/empty-state";
import {
  Plus,
  Calendar,
  MapPin,
  Globe,
  Users,
  SlidersHorizontal,
  X,
  Trophy,
  Search,
  Target,
} from "lucide-react";

type EventItem = {
  id: string;
  type: string;
  title: string;
  eventDate: string | Date;
  location: string | null;
  maxParticipants: number | null;
  club: { id: string; name: string; city: string | null };
  region: { name: string } | null;
  _count: { applications: number };
};

const EVENT_BADGE_STYLES: Record<string, string> = {
  OPEN_TRAINING: "bg-violet-500/10 text-violet-700 dark:text-violet-400",
  RECRUITMENT: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
};

export default function EventsPage() {
  const { data: session } = useSession();
  const isPlayer = session?.user?.role === "PLAYER";

  // Fetch player profile for matching badge (only for PLAYER)
  const { data: playerProfile } = api.player.me.useQuery(undefined, {
    enabled: isPlayer,
    staleTime: Infinity,
  });

  const [regionId, setRegionId] = useState<number | undefined>();
  const [type, setType] = useState<"OPEN_TRAINING" | "RECRUITMENT" | undefined>();
  const [cityInput, setCityInput] = useState("");
  const [city, setCity] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortBy, setSortBy] = useState<"eventDate" | "createdAt" | "title">("eventDate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [showFilters, setShowFilters] = useState(false);

  const { data: regions } = api.region.list.useQuery(undefined, { staleTime: Infinity });

  useEffect(() => {
    const t = setTimeout(() => setCity(cityInput), 400);
    return () => clearTimeout(t);
  }, [cityInput]);

  const queryInput = {
    regionId,
    type,
    city: city || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    sortBy,
    sortOrder,
  };

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = api.event.list.useInfiniteQuery(queryInput, {
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });

  const items = (data?.pages.flatMap((p) => p.items) ?? []) as EventItem[];
  const itemIds = items.map((i) => i.id);

  const { data: favIds } = api.favorite.check.useQuery(
    { eventIds: itemIds },
    { enabled: itemIds.length > 0 },
  );
  const favoritedIds = new Set(favIds ?? []);

  const sentinelRef = useInfiniteScroll(
    () => { fetchNextPage(); },
    !!hasNextPage,
    isFetchingNextPage,
  );

  const hasActiveFilters = cityInput || dateFrom || dateTo;

  return (
    <div className="animate-fade-in">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Wydarzenia</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Treningi otwarte i nabory w Twoim regionie
          </p>
        </div>
        <Link href="/events/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Dodaj wydarzenie</span>
            <span className="sm:hidden">Dodaj</span>
          </Button>
        </Link>
      </div>

      <div className="mb-6 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={regionId ?? ""}
            onChange={(e) => setRegionId(e.target.value ? Number(e.target.value) : undefined)}
            className="h-9 rounded-lg border border-input bg-background px-3 text-sm transition focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Wszystkie regiony</option>
            {(regions ?? []).map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
          <select
            value={type ?? ""}
            onChange={(e) => setType((e.target.value || undefined) as "OPEN_TRAINING" | "RECRUITMENT" | undefined)}
            className="h-9 rounded-lg border border-input bg-background px-3 text-sm transition focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Wszystkie typy</option>
            <option value="OPEN_TRAINING">Treningi otwarte</option>
            <option value="RECRUITMENT">Nabory</option>
          </select>
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [sb, so] = e.target.value.split("-");
              setSortBy(sb as "eventDate" | "createdAt" | "title");
              setSortOrder(so as "asc" | "desc");
            }}
            className="h-9 rounded-lg border border-input bg-background px-3 text-sm transition focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="eventDate-asc">Data (rosnąco)</option>
            <option value="eventDate-desc">Data (malejąco)</option>
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
                    placeholder="np. Kraków"
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

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="Brak wydarzeń"
          description="Nie znaleziono wydarzeń z aktualnymi filtrami. Spróbuj zmienić region lub typ."
        />
      ) : (
        <div className="stagger-children grid gap-4 sm:grid-cols-2">
          {items.map((ev) => (
            <Link key={ev.id} href={`/events/${ev.id}`} className="group">
              <Card className="h-full border-l-[3px] border-l-violet-500 transition-all hover:shadow-md hover:-translate-y-0.5">
                <CardContent className="py-4">
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                        <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ${EVENT_BADGE_STYLES[ev.type] ?? "bg-muted text-muted-foreground"}`}>
                          {EVENT_TYPE_LABELS[ev.type] ?? ev.type}
                        </span>
                        {isPlayer && ev.type === "RECRUITMENT" && playerProfile?.region && ev.region && playerProfile.region.name === ev.region.name && (
                          <span className="inline-flex items-center gap-0.5 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                            <Target className="h-2.5 w-2.5" />
                            Dopasowane
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                        {ev.title}
                      </h3>
                    </div>
                    <FavoriteButton eventId={ev.id} initialFavorited={favoritedIds.has(ev.id)} />
                  </div>
                  <p className="mb-3 text-sm font-medium">
                    {ev.club.name}
                    {ev.club.city && <span className="text-muted-foreground"> · {ev.club.city}</span>}
                  </p>
                  <div className="space-y-1.5 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDate(ev.eventDate)}
                    </div>
                    {ev.location && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5" />
                        {ev.location}
                      </div>
                    )}
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Globe className="h-3 w-3" />
                      {ev.region?.name}
                    </div>
                    <Badge variant="secondary" className="gap-1 text-xs">
                      <Users className="h-3 w-3" />
                      {ev._count.applications}
                      {ev.maxParticipants && ` / ${ev.maxParticipants}`}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
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
    </div>
  );
}
