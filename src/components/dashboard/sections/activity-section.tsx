"use client";

import { api } from "@/lib/trpc-react";
import { useI18n } from "@/lib/i18n";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Swords } from "lucide-react";
import { FeedCard, type FeedItem } from "@/components/feed/feed-card-router";
import { FeedCardSkeleton } from "@/components/card-skeleton";
import { EmptyState } from "@/components/empty-state";

export function ActivitySection() {
  const { t } = useI18n();
  const feed = api.feed.get.useQuery({ limit: 30 }, { staleTime: 300_000 });

  if (feed.isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
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

  if ((feed.data?.items?.length ?? 0) === 0) {
    return (
      <EmptyState
        icon={Swords}
        title={t("Brak aktywności")}
        description={t("Uzupełnij profil i wybierz region, aby zobaczyć dopasowane sparingi, wydarzenia i nowych członków.")}
        actionLabel={t("Uzupełnij profil")}
        actionHref="/profile"
      />
    );
  }

  return (
    <div className="space-y-3">
      {(feed.data!.items as FeedItem[]).map((item) => (
        <FeedCard key={`${item.type}-${item.data.id}`} item={item} />
      ))}
    </div>
  );
}
