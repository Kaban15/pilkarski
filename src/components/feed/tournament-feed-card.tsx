"use client";

import Link from "next/link";
import { Trophy, Calendar, Users } from "lucide-react";
import { formatDate } from "@/lib/format";
import { useI18n } from "@/lib/i18n";

interface TournamentFeedCardProps {
  data: {
    id: string;
    title: string;
    format: string;
    maxTeams: number;
    startDate: string | Date;
    costPerTeam: number | null;
    creator?: {
      club?: { name: string } | null;
      player?: { firstName: string; lastName: string } | null;
      coach?: { firstName: string; lastName: string } | null;
    } | null;
    _count?: { teams: number } | null;
  };
  createdAt: string | Date;
}

const FORMAT_LABELS: Record<string, string> = {
  GROUP_STAGE: "Grupy",
  KNOCKOUT: "Puchar",
  GROUP_AND_KNOCKOUT: "Grupy + Puchar",
};

export function TournamentFeedCard({ data, createdAt }: TournamentFeedCardProps) {
  const { t } = useI18n();
  const creator = data.creator;
  const organizerName =
    creator?.club?.name ||
    (creator?.player ? `${creator.player.firstName} ${creator.player.lastName}` : "") ||
    (creator?.coach ? `${creator.coach.firstName} ${creator.coach.lastName}` : "") ||
    t("Organizator");

  const teamCount = data._count?.teams ?? 0;
  const formatLabel = FORMAT_LABELS[data.format] ?? data.format;

  return (
    <Link href={`/tournaments/${data.id}`} className="group block">
      <div className="rounded-lg border border-transparent bg-card p-4 transition-all hover:border-orange-500/30 hover:bg-orange-500/[0.02]">
        {/* Header */}
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/10 px-2 py-0.5 text-[10px] font-semibold text-orange-600 dark:text-orange-400">
              <Trophy className="h-3 w-3" />
              {t("Turniej")}
            </span>
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              {t(formatLabel)}
            </span>
            {data.costPerTeam && (
              <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                {data.costPerTeam} PLN
              </span>
            )}
          </div>
          <span className="text-[11px] text-muted-foreground">{formatDate(createdAt)}</span>
        </div>

        {/* Content */}
        <p className="text-[14px] font-semibold text-foreground group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors line-clamp-1">
          {data.title}
        </p>
        <p className="mt-0.5 text-[13px] text-muted-foreground">{organizerName}</p>

        {/* Footer */}
        <div className="mt-3 flex items-center gap-3 text-[12px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formatDate(data.startDate)}
          </span>
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            <span className="font-semibold tabular-nums text-foreground">{teamCount}</span>/{data.maxTeams}
          </span>
        </div>
      </div>
    </Link>
  );
}
