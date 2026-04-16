"use client";

import { api } from "@/lib/trpc-react";
import { useI18n } from "@/lib/i18n";
import { Building2 } from "lucide-react";
import { FeedCard, type FeedItem } from "@/components/feed/feed-card-router";
import { FeedCardSkeleton } from "@/components/card-skeleton";
import { EmptyState } from "@/components/empty-state";

export function ClubsSection() {
  const { t } = useI18n();
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

  const items = (feed.data?.items as FeedItem[] | undefined)?.filter((i) =>
    i.type === "club"
  ) ?? [];

  if (items.length === 0) {
    return (
      <EmptyState
        icon={Building2}
        title={t("Brak nowych klubów")}
        description={t("Nowe kluby w Twoim regionie pojawią się tutaj.")}
      />
    );
  }

  return (
    <div>
      <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
        <Building2 className="h-4 w-4 text-primary" />
        {t("Nowe kluby w regionie")}
      </h2>
      <div className="space-y-3">
        {items.map((item) => (
          <FeedCard key={`${item.type}-${item.data.id}`} item={item} />
        ))}
      </div>
    </div>
  );
}
