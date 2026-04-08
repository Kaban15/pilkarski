"use client";

import Link from "next/link";
import { ArrowRightLeft, MapPin } from "lucide-react";
import { formatDate } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { getLabels, POSITION_LABELS } from "@/lib/labels";

interface TransferFeedCardProps {
  data: {
    id: string;
    title: string;
    type: string;
    user: {
      id: string;
      club?: { name: string; city: string | null } | null;
      player?: { firstName: string; lastName: string; city: string | null; primaryPosition?: string | null } | null;
    };
    region?: { name: string } | null;
  };
  createdAt: string | Date;
}

export function TransferFeedCard({ data, createdAt }: TransferFeedCardProps) {
  const { t, locale } = useI18n();
  const positionLabels = getLabels(POSITION_LABELS, locale);
  const u = data.user;
  const isClub = !!u?.club;
  const name = isClub
    ? u.club!.name
    : u?.player ? `${u.player.firstName} ${u.player.lastName}` : "";
  const city = isClub ? u.club!.city : u?.player?.city;
  const position = u?.player?.primaryPosition
    ? positionLabels[u.player.primaryPosition]
    : null;

  return (
    <Link href={`/transfers/${data.id}`} className="group block">
      <div className="rounded-lg border border-transparent bg-card p-4 transition-all hover:border-cyan-500/30 hover:bg-cyan-500/[0.02]">
        {/* Header */}
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-cyan-500/10 px-2 py-0.5 text-[10px] font-semibold text-cyan-600 dark:text-cyan-400">
              <ArrowRightLeft className="h-3 w-3" />
              {t("Transfer")}
            </span>
            {position && (
              <span className="rounded-full bg-orange-500/10 px-2 py-0.5 text-[10px] font-semibold text-orange-600 dark:text-orange-400">
                {position}
              </span>
            )}
          </div>
          <span className="text-[11px] text-muted-foreground">{formatDate(createdAt)}</span>
        </div>

        {/* Content */}
        <p className="text-[14px] font-semibold text-foreground group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors line-clamp-1">
          {data.title}
        </p>
        <div className="mt-0.5 flex items-center gap-2 text-[13px] text-muted-foreground">
          <span>{name}</span>
          {city && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {city}
            </span>
          )}
          {data.region && <span>· {data.region.name}</span>}
        </div>
      </div>
    </Link>
  );
}
