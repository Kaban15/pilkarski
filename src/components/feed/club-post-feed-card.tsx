"use client";

import Link from "next/link";
import { Megaphone } from "lucide-react";
import { formatDate } from "@/lib/format";
import { useI18n } from "@/lib/i18n";

interface ClubPostFeedCardProps {
  data: {
    id: string;
    title: string;
    content: string;
    category: string;
    club?: { id: string; name: string; logoUrl?: string | null } | null;
  };
  createdAt: string | Date;
}

const CATEGORY_COLORS: Record<string, string> = {
  ANNOUNCEMENT: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  LOOKING_FOR_PLAYERS: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  LOOKING_FOR_SPARING: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
  DISCUSSION: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  EVENT_INFO: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  OTHER: "bg-muted text-muted-foreground",
};

export function ClubPostFeedCard({ data, createdAt }: ClubPostFeedCardProps) {
  const { t } = useI18n();
  const catColor = CATEGORY_COLORS[data.category] ?? CATEGORY_COLORS.OTHER;

  return (
    <Link href="/community" className="group block">
      <div className="rounded-xl border border-[var(--card-elevated-border)] bg-card p-4 transition-all hover:border-primary/15 hover:shadow-[var(--shadow-card-hover)]">
        {/* Header */}
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold text-blue-500">
              <Megaphone className="h-3 w-3" />
              {t("Ogłoszenie")}
            </span>
          </div>
          <span className="text-[11px] text-muted-foreground">{formatDate(createdAt)}</span>
        </div>

        {/* Content */}
        <p className="text-[14px] font-semibold text-foreground group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors line-clamp-1">
          {data.title}
        </p>
        {data.club && (
          <p className="mt-0.5 text-[13px] text-muted-foreground">{data.club.name}</p>
        )}
        {data.content && (
          <p className="mt-1.5 text-[12px] text-muted-foreground/80 line-clamp-2">{data.content}</p>
        )}
      </div>
    </Link>
  );
}
