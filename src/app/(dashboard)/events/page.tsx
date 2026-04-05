"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { api } from "@/lib/trpc-react";
import { formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CardSkeleton } from "@/components/card-skeleton";
import { FavoriteButton } from "@/components/favorite-button";
import { usePaginatedList } from "@/hooks/use-paginated-list";
import { EVENT_TYPE_LABELS } from "@/lib/labels";
import type { EventTypeValue } from "@/lib/validators/event";
import { EmptyState } from "@/components/empty-state";
import { ProcessSteps } from "@/components/process-steps";
import { Coachmark } from "@/components/coachmark";
import {
  Plus,
  Calendar,
  MapPin,
  Users,
  SlidersHorizontal,
  X,
  Trophy,
  Search,
  Target,
  Banknote,
} from "lucide-react";

type EventItem = {
  id: string;
  type: string;
  title: string;
  eventDate: string | Date;
  location: string | null;
  maxParticipants: number | null;
  costPerPerson: number | null;
  club: { id: string; name: string; city: string | null };
  region: { name: string } | null;
};

const EVENT_BADGE_STYLES: Record<string, string> = {
  OPEN_TRAINING: "bg-violet-500/10 text-violet-700 dark:text-violet-400",
  RECRUITMENT: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  TRYOUT: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
  CAMP: "bg-sky-500/10 text-sky-700 dark:text-sky-400",
  CONTINUOUS_RECRUITMENT: "bg-rose-500/10 text-rose-700 dark:text-rose-400",
  INDIVIDUAL_TRAINING: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400",
  GROUP_TRAINING: "bg-teal-500/10 text-teal-700 dark:text-teal-400",
};

export default function EventsPage() {
  const { data: session } = useSession();
  const isPlayer = session?.user?.role === "PLAYER";
  const isClub = session?.user?.role === "CLUB";
  const isCoach = session?.user?.role === "COACH";
  const [eventsTab, setEventsTab] = useState<"search" | "my">("search");

  // Fetch player profile for matching badge (only for PLAYER)
  const { data: playerProfile } = api.player.me.useQuery(undefined, {
    enabled: isPlayer,
    staleTime: Infinity,
  });

  // Check if coach has event management permission
  const { data: myClub } = api.clubMembership.myClub.useQuery(undefined, {
    enabled: isCoach,
    staleTime: 60_000,
  });
  const canCreateEvents = isClub || (isCoach && myClub?.canManageEvents);

  const [regionId, setRegionId] = useState<number | undefined>();
  const [type, setType] = useState<EventTypeValue | undefined>();
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

  const eventsQuery = api.event.list.useInfiniteQuery(queryInput, {
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
  const { items: rawItems, isLoading, isError, refetch, sentinelRef, isFetchingNextPage } = usePaginatedList(eventsQuery);
  const items = rawItems as EventItem[];
  const itemIds = items.map((i) => i.id);

  const { data: favIds } = api.favorite.check.useQuery(
    { eventIds: itemIds },
    { enabled: itemIds.length > 0 },
  );
  const favoritedIds = new Set(favIds ?? []);

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
        {canCreateEvents && (
          <Link href="/events/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Dodaj wydarzenie</span>
              <span className="sm:hidden">Dodaj</span>
            </Button>
          </Link>
        )}
      </div>

      {canCreateEvents && (
        <Tabs value={eventsTab} onValueChange={(v) => setEventsTab(v as "search" | "my")} className="mb-6">
          <TabsList>
            <TabsTrigger value="search">Szukaj</TabsTrigger>
            <TabsTrigger value="my">Moje wydarzenia</TabsTrigger>
          </TabsList>
        </Tabs>
      )}

      {eventsTab === "search" || !canCreateEvents ? (
      <>
      <div className="mb-6 space-y-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <Select value={regionId !== undefined ? String(regionId) : "__all__"} onValueChange={(v) => setRegionId(v === "__all__" ? undefined : Number(v))}>
            <SelectTrigger className="h-9 w-auto shrink-0 min-w-[180px]">
              <SelectValue placeholder="Wszystkie regiony" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Wszystkie regiony</SelectItem>
              {(regions ?? []).map((r) => (
                <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={type ?? "__all__"} onValueChange={(v) => setType(v === "__all__" ? undefined : v as EventTypeValue)}>
            <SelectTrigger className="h-9 w-auto shrink-0 min-w-[180px]">
              <SelectValue placeholder="Wszystkie typy" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Wszystkie typy</SelectItem>
              {Object.entries(EVENT_TYPE_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={`${sortBy}-${sortOrder}`} onValueChange={(v) => { const [sb, so] = v.split("-"); setSortBy(sb as "eventDate" | "createdAt" | "title"); setSortOrder(so as "asc" | "desc"); }}>
            <SelectTrigger className="h-9 w-auto shrink-0 min-w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="eventDate-asc">Data (rosnąco)</SelectItem>
              <SelectItem value="eventDate-desc">Data (malejąco)</SelectItem>
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

      {isError ? (
        <EmptyState
          icon={Trophy}
          title="Błąd ładowania"
          description="Nie udało się pobrać wydarzeń."
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
          icon={Trophy}
          title="Brak wydarzeń"
          description="Nie znaleziono wydarzeń z aktualnymi filtrami. Spróbuj zmienić region lub typ."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map((ev) => (
            <Link key={ev.id} href={`/events/${ev.id}`} className="group">
              <Card className="h-full transition-colors hover:border-primary/40">
                <CardContent className="p-5">
                  <div className="mb-1 flex items-start justify-between gap-2">
                    <h3 className="font-semibold leading-snug text-foreground group-hover:text-primary transition-colors line-clamp-1">
                      {ev.title}
                    </h3>
                    <FavoriteButton eventId={ev.id} initialFavorited={favoritedIds.has(ev.id)} />
                  </div>

                  <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
                    <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${EVENT_BADGE_STYLES[ev.type] ?? "bg-muted text-muted-foreground"}`}>
                      {EVENT_TYPE_LABELS[ev.type] ?? ev.type}
                    </span>
                    {isPlayer && ev.type === "RECRUITMENT" && playerProfile?.region && ev.region && playerProfile.region.name === ev.region.name && (
                      <span className="inline-flex items-center gap-0.5 rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                        <Target className="h-2.5 w-2.5" />
                        Dopasowane
                      </span>
                    )}
                    <span className="truncate">
                      {ev.club.name}
                      {ev.club.city && ` · ${ev.club.city}`}
                    </span>
                    {ev.region && (
                      <span className="ml-auto shrink-0 text-xs">{ev.region.name}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 shrink-0" />
                      {formatDate(ev.eventDate)}
                    </span>
                    {ev.location && (
                      <span className="flex items-center gap-1.5 truncate">
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{ev.location}</span>
                      </span>
                    )}
                    {ev.costPerPerson != null && ev.costPerPerson > 0 && (
                      <span className="shrink-0 bg-amber-500/10 text-amber-400 text-[10px] font-semibold px-2 py-0.5 rounded-md">
                        {ev.costPerPerson} PLN
                      </span>
                    )}
                    {ev.maxParticipants && (
                      <span className="ml-auto flex items-center gap-1 shrink-0">
                        <Users className="h-3 w-3" />
                        {ev.maxParticipants} miejsc
                      </span>
                    )}
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
      </>
      ) : (
        <MyEventsTab />
      )}
    </div>
  );
}

function MyEventsTab() {
  const { data: events, isLoading, isError, refetch } = api.event.my.useQuery();

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
        icon={Trophy}
        title="Błąd ładowania"
        description="Nie udało się pobrać Twoich wydarzeń."
        actionLabel="Spróbuj ponownie"
        actionOnClick={() => refetch()}
      />
    );
  }

  if (!events || events.length === 0) {
    return (
      <EmptyState
        icon={Trophy}
        title="Brak wydarzeń"
        description="Nie masz jeszcze żadnych wydarzeń. Utwórz pierwszy!"
        actionLabel="Dodaj wydarzenie"
        actionHref="/events/new"
      />
    );
  }

  const now = new Date();
  const upcoming = events.filter((e) => new Date(e.eventDate) >= now);
  const past = events.filter((e) => new Date(e.eventDate) < now);

  const hasApplications = events.some((e) => (e._count?.applications ?? 0) > 0);
  const hasPast = past.length > 0;
  const processStep = hasPast ? 3 : hasApplications ? 2 : upcoming.length > 0 ? 1 : 0;

  const groups = [
    { label: "Nadchodzące", items: upcoming },
    { label: "Przeszłe", items: past },
  ].filter((g) => g.items.length > 0);

  return (
    <div className="space-y-8">
      <Coachmark
        storageKey="ps_coachmark_events"
        title="Zarządzaj wydarzeniami"
        description="Tu widzisz swoje nabory i treningi. Kliknij w wydarzenie, żeby zobaczyć zgłoszenia zawodników i zarządzać uczestnikami."
      />

      <ProcessSteps
        steps={[
          { label: "Ogłoszenie", description: "Dodaj wydarzenie" },
          { label: "Zgłoszenia", description: "Przyjmuj zawodników" },
          { label: "Zakończone" },
        ]}
        currentStep={processStep}
      />

      {groups.map((group) => (
        <div key={group.label}>
          <h2 className="mb-3 text-lg font-semibold">{group.label} ({group.items.length})</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {group.items.map((ev) => (
              <Link key={ev.id} href={`/events/${ev.id}`} className="group">
                <Card className="h-full transition-colors hover:border-primary/40">
                  <CardContent className="p-5">
                    <div className="mb-1 flex items-center gap-2">
                      <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${EVENT_BADGE_STYLES[ev.type] ?? "bg-muted text-muted-foreground"}`}>
                        {EVENT_TYPE_LABELS[ev.type] ?? ev.type}
                      </span>
                    </div>
                    <h3 className="font-semibold leading-snug text-foreground group-hover:text-primary transition-colors line-clamp-1">
                      {ev.title}
                    </h3>
                    <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(ev.eventDate)}
                      </span>
                      {ev.location && (
                        <span className="flex items-center gap-1.5 truncate">
                          <MapPin className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{ev.location}</span>
                        </span>
                      )}
                      <span className="ml-auto flex items-center gap-1 shrink-0">
                        <Users className="h-3 w-3" />
                        {ev._count?.applications ?? 0} zgł.
                        {ev.maxParticipants && ` / ${ev.maxParticipants}`}
                      </span>
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
