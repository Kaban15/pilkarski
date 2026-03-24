"use client";

import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/trpc-react";
import { formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CardSkeleton } from "@/components/card-skeleton";
import { EmptyState } from "@/components/empty-state";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import {
  TRANSFER_TYPE_LABELS,
  TRANSFER_TYPE_COLORS,
  POSITION_LABELS,
} from "@/lib/labels";
import type { TransferType, TransferPosition } from "@/lib/validators/transfer";
import {
  ArrowRightLeft,
  Plus,
  Globe,
  Calendar,
  User,
  Shield,
  SlidersHorizontal,
  X,
} from "lucide-react";

export default function TransfersPage() {
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [positionFilter, setPositionFilter] = useState<string>("");
  const [regionId, setRegionId] = useState<number | undefined>();
  const [showFilters, setShowFilters] = useState(false);

  const { data: regions } = api.region.list.useQuery(undefined, { staleTime: Infinity });

  const hasActiveFilters = !!typeFilter || !!positionFilter || !!regionId;

  const queryInput = {
    type: (typeFilter || undefined) as TransferType | undefined,
    position: (positionFilter || undefined) as TransferPosition | undefined,
    regionId,
    limit: 20,
  };

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = api.transfer.list.useInfiniteQuery(queryInput, {
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });

  const items = data?.pages.flatMap((p) => p.items) ?? [];

  const sentinelRef = useInfiniteScroll(
    () => { fetchNextPage(); },
    !!hasNextPage,
    isFetchingNextPage,
  );

  function clearFilters() {
    setTypeFilter("");
    setPositionFilter("");
    setRegionId(undefined);
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Transfery</h1>
          <p className="mt-1 text-muted-foreground">Ogłoszenia transferowe klubów i zawodników</p>
        </div>
        <Link href="/transfers/new">
          <Button className="gap-1.5">
            <Plus className="h-4 w-4" />
            Nowe ogłoszenie
          </Button>
        </Link>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
        >
          <option value="">Wszystkie typy</option>
          <option value="LOOKING_FOR_CLUB">Szukam klubu</option>
          <option value="LOOKING_FOR_PLAYER">Szukam zawodnika</option>
          <option value="FREE_AGENT">Wolny agent</option>
        </select>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-input bg-background px-3 text-sm transition hover:bg-accent"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Więcej filtrów
          {hasActiveFilters && (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">!</span>
          )}
        </button>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="inline-flex h-9 items-center gap-1 rounded-lg border border-input bg-background px-3 text-sm text-muted-foreground transition hover:bg-accent hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
            Wyczyść
          </button>
        )}
      </div>

      {showFilters && (
        <Card className="mb-6">
          <CardContent className="grid gap-4 py-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Pozycja</label>
              <select
                value={positionFilter}
                onChange={(e) => setPositionFilter(e.target.value)}
                className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
              >
                <option value="">Wszystkie pozycje</option>
                {Object.entries(POSITION_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Region</label>
              <select
                value={regionId ?? ""}
                onChange={(e) => setRegionId(e.target.value ? Number(e.target.value) : undefined)}
                className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
              >
                <option value="">Wszystkie regiony</option>
                {(regions ?? []).map((r: any) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[...Array(4)].map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={ArrowRightLeft}
          title="Brak ogłoszeń transferowych"
          description="Nie znaleziono ogłoszeń spełniających kryteria."
          actionLabel="Dodaj ogłoszenie"
          actionHref="/transfers/new"
        />
      ) : (
        <div className="stagger-children grid gap-4 sm:grid-cols-2">
          {items.map((t: any) => (
            <Link key={t.id} href={`/transfers/${t.id}`}>
              <Card className="group border-l-[3px] border-l-cyan-500 transition hover:border-primary/50 hover:shadow-md">
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary" className={TRANSFER_TYPE_COLORS[t.type]}>
                          {TRANSFER_TYPE_LABELS[t.type]}
                        </Badge>
                        {t.position && (
                          <Badge variant="outline" className="text-xs">
                            {POSITION_LABELS[t.position]}
                          </Badge>
                        )}
                      </div>
                      <h3 className="mt-2 font-semibold leading-tight transition group-hover:text-primary">
                        {t.title}
                      </h3>
                      <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                        {t.user.club ? (
                          <>
                            <Shield className="h-3 w-3" />
                            {t.user.club.name}
                          </>
                        ) : t.user.player ? (
                          <>
                            <User className="h-3 w-3" />
                            {t.user.player.firstName} {t.user.player.lastName}
                          </>
                        ) : null}
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        {t.region && (
                          <span className="flex items-center gap-1">
                            <Globe className="h-3 w-3" />
                            {t.region.name}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(t.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
          <div ref={sentinelRef} />
          {isFetchingNextPage && <CardSkeleton />}
        </div>
      )}
    </div>
  );
}
