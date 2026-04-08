"use client";

import Link from "next/link";
import { Trophy, Calendar, MapPin, Users, Banknote } from "lucide-react";
import { formatDate } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { getLabels, EVENT_TYPE_LABELS } from "@/lib/labels";

interface EventFeedCardProps {
  data: {
    id: string;
    type: string;
    title: string;
    eventDate: string | Date;
    location: string | null;
    maxParticipants: number | null;
    costPerPerson: number | null;
    club: { id: string; name: string; city: string | null };
    region?: { name: string } | null;
  };
  createdAt: string | Date;
}

export function EventFeedCard({ data, createdAt }: EventFeedCardProps) {
  const { t, locale } = useI18n();
  const eventTypeLabels = getLabels(EVENT_TYPE_LABELS, locale);
  const typeLabel = eventTypeLabels[data.type] ?? t("Wydarzenie");

  return (
    <Link href={`/events/${data.id}`} className="group block">
      <div className="rounded-lg border border-transparent bg-card p-4 transition-all hover:border-violet-500/30 hover:bg-violet-500/[0.02]">
        {/* Header */}
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-violet-500/10 px-2 py-0.5 text-[10px] font-semibold text-violet-600 dark:text-violet-400">
              <Trophy className="h-3 w-3" />
              {typeLabel}
            </span>
            {data.costPerPerson && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                <Banknote className="h-3 w-3" />
                {data.costPerPerson} PLN
              </span>
            )}
          </div>
          <span className="text-[11px] text-muted-foreground">{formatDate(createdAt)}</span>
        </div>

        {/* Title */}
        <p className="text-[14px] font-semibold text-foreground group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors line-clamp-1">
          {data.title}
        </p>
        <p className="mt-0.5 text-[13px] text-muted-foreground">
          {data.club.name}{data.club.city ? ` · ${data.club.city}` : ""}
        </p>

        {/* Footer */}
        <div className="mt-3 flex items-center gap-3 text-[12px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formatDate(data.eventDate)}
          </span>
          {data.location && (
            <span className="flex items-center gap-1 truncate">
              <MapPin className="h-3 w-3" />
              {data.location}
            </span>
          )}
          {data.maxParticipants && (
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {data.maxParticipants}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
