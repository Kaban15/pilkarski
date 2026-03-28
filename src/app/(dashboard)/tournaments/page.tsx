"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { api } from "@/lib/trpc-react";
import { TOURNAMENT_STATUS_LABELS } from "@/lib/labels";
import { Button } from "@/components/ui/button";
import { CardSkeleton } from "@/components/card-skeleton";
import { usePaginatedList } from "@/hooks/use-paginated-list";
import { EmptyState } from "@/components/empty-state";
import { TournamentCard } from "@/components/tournament/tournament-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trophy } from "lucide-react";

export default function TournamentsPage() {
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user;

  const [regionId, setRegionId] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  const { data: regions } = api.region.list.useQuery(undefined, { staleTime: Infinity });

  const queryInput = {
    regionId: regionId ? Number(regionId) : undefined,
    status: (statusFilter || undefined) as "REGISTRATION" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | undefined,
  };

  const tournamentsQuery = api.tournament.list.useInfiniteQuery(queryInput, {
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });

  const { items, isLoading, isError, refetch, sentinelRef, isFetchingNextPage } = usePaginatedList(tournamentsQuery);

  return (
    <div className="animate-fade-in">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Turnieje</h1>
          <p className="mt-1 text-sm text-muted-foreground">Przeglądaj i dołączaj do turniejów</p>
        </div>
        {isLoggedIn && (
          <Link href="/tournaments/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Nowy turniej</span>
              <span className="sm:hidden">Nowy</span>
            </Button>
          </Link>
        )}
      </div>

      <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-1">
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

        <Select value={statusFilter || "__all__"} onValueChange={(v) => setStatusFilter(v === "__all__" ? "" : v)}>
          <SelectTrigger className="h-9 w-auto shrink-0 min-w-[180px]">
            <SelectValue placeholder="Wszystkie statusy" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Wszystkie statusy</SelectItem>
            {(["REGISTRATION", "IN_PROGRESS", "COMPLETED"] as const).map((s) => (
              <SelectItem key={s} value={s}>
                {TOURNAMENT_STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isError ? (
        <EmptyState
          icon={Trophy}
          title="Błąd ładowania"
          description="Nie udało się pobrać turniejów."
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
          title="Brak turniejów"
          description="Nie znaleziono turniejów z aktualnymi filtrami."
        />
      ) : (
        <div className="stagger-children grid gap-4 sm:grid-cols-2">
          {items.map((t) => {
            const creator = t.creator;
            const creatorName =
              creator?.club?.name ??
              (creator?.player ? `${creator.player.firstName} ${creator.player.lastName}` : null) ??
              (creator?.coach ? `${creator.coach.firstName} ${creator.coach.lastName}` : null) ??
              creator?.email ??
              "";
            return (
              <TournamentCard
                key={t.id}
                id={t.id}
                title={t.title}
                startDate={t.startDate}
                location={t.location}
                format={t.format}
                status={t.status}
                maxTeams={t.maxTeams}
                teamCount={t._count.teams}
                creatorName={creatorName}
              />
            );
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
