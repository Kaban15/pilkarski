"use client";

import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/trpc-react";
import { useI18n } from "@/lib/i18n";
import { Users } from "lucide-react";
import { RecruitmentStats } from "@/components/recruitment/recruitment-stats";
import { ClubRecruitment } from "@/components/dashboard/club-recruitment";
import { FeedCard, type FeedItem } from "@/components/feed/feed-card-router";

type SubTab = "pipeline" | "recruitments" | "suggested";

const RECRUITMENT_FEED_TYPES = new Set(["player", "club", "transfer"]);

export function RecruitmentSection() {
  const { t } = useI18n();
  const [subTab, setSubTab] = useState<SubTab>("pipeline");
  const feed = api.feed.get.useQuery({ limit: 30 }, { staleTime: 300_000 });

  const feedItems = (feed.data?.items as FeedItem[] | undefined)?.filter((i) =>
    RECRUITMENT_FEED_TYPES.has(i.type)
  ) ?? [];

  const TABS: { key: SubTab; label: string }[] = [
    { key: "pipeline", label: "Pipeline" },
    { key: "recruitments", label: "Nabory" },
    { key: "suggested", label: "Sugerowani" },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Users className="h-5 w-5 text-primary" />
          {t("Rekrutacja")}
        </h2>
        <Link href="/recruitment" className="text-xs font-medium text-primary hover:underline">
          {t("Zobacz wszystko →")}
        </Link>
      </div>

      {/* Sub-tabs */}
      <div className="mb-4 flex gap-1.5">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setSubTab(key)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              subTab === key
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted/50"
            }`}
          >
            {t(label)}
          </button>
        ))}
      </div>

      {/* Content */}
      {subTab === "pipeline" && <RecruitmentStats />}
      {subTab === "recruitments" && <ClubRecruitment showSection="recruitments" />}
      {subTab === "suggested" && <ClubRecruitment showSection="suggested" />}

      {/* Feed: nowi zawodnicy, kluby, transfery z regionu */}
      {feedItems.length > 0 && (
        <div className="mt-6">
          <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {t("Nowe w regionie")}
          </h3>
          <div className="space-y-3">
            {feedItems.map((item) => (
              <FeedCard key={`${item.type}-${item.data.id}`} item={item} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
