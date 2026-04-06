"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { api } from "@/lib/trpc-react";
import { formatDate } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
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
  Eye,
} from "lucide-react";

export default function TransfersPage() {
  const { t } = useI18n();
  const { data: session } = useSession();
  const isClub = session?.user?.role === "CLUB";
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [positionFilter, setPositionFilter] = useState<string>("");
  const [regionId, setRegionId] = useState<number | undefined>();
  const [showFilters, setShowFilters] = useState(false);

  const addToRadar = api.recruitment.addToRadar.useMutation({
    onSuccess: () => toast.success(t("Dodano na radar")),
    onError: (err) => toast.error(err.message),
  });

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
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t("Transfery")}</h1>
          <p className="mt-1 text-muted-foreground">{t("Ogłoszenia transferowe klubów i zawodników")}</p>
        </div>
        <Link href="/transfers/new">
          <Button className="gap-1.5">
            <Plus className="h-4 w-4" />
            {t("Nowe ogłoszenie")}
          </Button>
        </Link>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
        >
          <option value="">{t("Wszystkie typy")}</option>
          <option value="LOOKING_FOR_CLUB">{t("Szukam klubu")}</option>
          <option value="LOOKING_FOR_PLAYER">{t("Szukam zawodnika")}</option>
          <option value="FREE_AGENT">{t("Wolny agent")}</option>
        </select>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-input bg-background px-3 text-sm transition hover:bg-accent"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          {t("Więcej filtrów")}
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
            {t("Wyczyść")}
          </button>
        )}
      </div>

      {showFilters && (
        <Card className="mb-6">
          <CardContent className="grid gap-4 py-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{t("Pozycja")}</label>
              <select
                value={positionFilter}
                onChange={(e) => setPositionFilter(e.target.value)}
                className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
              >
                <option value="">{t("Wszystkie pozycje")}</option>
                {Object.entries(POSITION_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{t(label)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{t("Region")}</label>
              <select
                value={regionId ?? ""}
                onChange={(e) => setRegionId(e.target.value ? Number(e.target.value) : undefined)}
                className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
              >
                <option value="">{t("Wszystkie regiony")}</option>
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
          title={t("Brak ogłoszeń transferowych")}
          description={t("Nie znaleziono ogłoszeń spełniających kryteria.")}
          actionLabel={t("Dodaj ogłoszenie")}
          actionHref="/transfers/new"
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map((item: any) => (
            <Link key={item.id} href={`/transfers/${item.id}`}>
              <Card className="group border-l-[3px] border-l-cyan-500 transition hover:border-primary/50">
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary" className={TRANSFER_TYPE_COLORS[item.type]}>
                          {t(TRANSFER_TYPE_LABELS[item.type] ?? item.type)}
                        </Badge>
                        {item.position && (
                          <Badge variant="outline" className="text-xs">
                            {t(POSITION_LABELS[item.position] ?? item.position)}
                          </Badge>
                        )}
                      </div>
                      <h3 className="mt-2 font-semibold leading-tight transition group-hover:text-primary">
                        {item.title}
                      </h3>
                      <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                        {item.user.club ? (
                          <>
                            <Shield className="h-3 w-3" />
                            {item.user.club.name}
                          </>
                        ) : item.user.player ? (
                          <>
                            <User className="h-3 w-3" />
                            {item.user.player.firstName} {item.user.player.lastName}
                          </>
                        ) : null}
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        {item.region && (
                          <span className="flex items-center gap-1">
                            <Globe className="h-3 w-3" />
                            {item.region.name}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(item.createdAt)}
                        </span>
                      </div>
                    </div>
                    {isClub && (item.type === "LOOKING_FOR_CLUB" || item.type === "FREE_AGENT") && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 shrink-0"
                        title={t("Dodaj na radar")}
                        onClick={(e) => {
                          e.preventDefault();
                          addToRadar.mutate({ transferId: item.id });
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
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
