"use client";

import { api } from "@/lib/trpc-react";
import { useI18n } from "@/lib/i18n";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";
import { FeedCard, type FeedItem } from "@/components/feed/feed-card-router";
import { FeedCardSkeleton } from "@/components/card-skeleton";
import { EmptyState } from "@/components/empty-state";

const ACTIVITY_TYPES = new Set(["clubPost"]);

export function ActivitySection() {
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

  if (feed.error) {
    return (
      <Card className="border-destructive/20">
        <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
          <p className="text-sm text-destructive">{t("Nie udało się załadować feedu")}</p>
          <Button variant="outline" size="sm" onClick={() => feed.refetch()}>
            {t("Spróbuj ponownie")}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const items = (feed.data?.items as FeedItem[] | undefined)?.filter((i) =>
    ACTIVITY_TYPES.has(i.type)
  ) ?? [];

  if (items.length === 0) {
    return (
      <EmptyState
        icon={MessageSquare}
        title={t("Brak postów")}
        description={t("Posty klubowe z Twojego regionu pojawią się tutaj.")}
      />
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <FeedCard key={`${item.type}-${item.data.id}`} item={item} />
      ))}
    </div>
  );
}
