"use client";

import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/trpc-react";
import { useI18n } from "@/lib/i18n";
import { UserSearch } from "lucide-react";
import { FeedCard, type FeedItem } from "@/components/feed/feed-card-router";
import { FeedCardSkeleton } from "@/components/card-skeleton";
import { EmptyState } from "@/components/empty-state";

const PLAYER_TYPES = new Set(["player", "transfer"]);

type PositionFilter = "all" | "GK" | "DEF" | "MID" | "FWD";

const POSITION_GROUPS: Record<Exclude<PositionFilter, "all">, Set<string>> = {
  GK: new Set(["GK"]),
  DEF: new Set(["CB", "LB", "RB"]),
  MID: new Set(["CDM", "CM", "CAM", "LM", "RM", "LW", "RW"]),
  FWD: new Set(["ST"]),
};

export function PlayersSection() {
  const { t } = useI18n();
  const [posFilter, setPosFilter] = useState<PositionFilter>("all");
  const feed = api.feed.get.useQuery({ limit: 30 }, { staleTime: 300_000 });

  if (feed.isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <FeedCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  const allItems = (feed.data?.items as FeedItem[] | undefined)?.filter((i) =>
    PLAYER_TYPES.has(i.type)
  ) ?? [];

  const items = posFilter === "all"
    ? allItems
    : allItems.filter((i) => {
        const pos = i.data?.primaryPosition;
        return pos && POSITION_GROUPS[posFilter].has(pos);
      });

  const FILTERS: { key: PositionFilter; label: string }[] = [
    { key: "all", label: "Wszyscy" },
    { key: "GK", label: "Bramkarze" },
    { key: "DEF", label: "Obrońcy" },
    { key: "MID", label: "Pomocnicy" },
    { key: "FWD", label: "Napastnicy" },
  ];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
          <UserSearch className="h-4 w-4 text-primary" />
          {t("Zawodnicy szukający klubu")}
        </h2>
        <Link href="/transfers" className="text-xs font-medium text-primary hover:underline">
          {t("Zobacz wszystko →")}
        </Link>
      </div>

      <div className="mb-4 flex gap-1.5">
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setPosFilter(key)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              posFilter === key
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted/50"
            }`}
          >
            {t(label)}
          </button>
        ))}
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={UserSearch}
          title={t("Brak zawodników")}
          description={posFilter === "all"
            ? t("Zawodnicy szukający klubu w Twoim regionie pojawią się tutaj.")
            : t("Brak zawodników na tej pozycji w Twoim regionie.")}
        />
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <FeedCard key={`${item.type}-${item.data.id}`} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
