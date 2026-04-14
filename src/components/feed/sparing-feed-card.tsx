"use client";

import Link from "next/link";
import { Swords, Calendar, MapPin, Clock } from "lucide-react";
import { formatDate } from "@/lib/format";
import { useI18n } from "@/lib/i18n";

interface SparingFeedCardProps {
  data: {
    id: string;
    title: string;
    matchDate: string | Date;
    location: string | null;
    costPerTeam: number | null;
    club: { id: string; name: string; city: string | null; logoUrl?: string | null };
    region?: { name: string } | null;
    acceptedClub?: { id: string; name: string; logoUrl?: string | null } | null;
  };
  createdAt: string | Date;
}

function ClubBadge({ name, logoUrl }: { name: string; logoUrl?: string | null }) {
  const initials = name.slice(0, 2).toUpperCase();
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted overflow-hidden">
        {logoUrl ? (
          <img src={logoUrl} alt={name} className="h-full w-full object-cover" />
        ) : (
          <span className="text-xs font-bold text-muted-foreground">{initials}</span>
        )}
      </div>
      <span className="max-w-[72px] truncate text-[11px] font-medium text-foreground/80">{name}</span>
    </div>
  );
}

export function SparingFeedCard({ data, createdAt }: SparingFeedCardProps) {
  const { t } = useI18n();
  const matchDate = new Date(data.matchDate);
  const now = new Date();
  const hoursUntil = (matchDate.getTime() - now.getTime()) / 3_600_000;
  const isUrgent = hoursUntil > 0 && hoursUntil < 24;
  const isMatched = !!data.acceptedClub;

  return (
    <Link href={`/sparings/${data.id}`} className="group block">
      <div className="rounded-xl border border-[var(--card-elevated-border)] bg-card p-4 transition-all hover:border-primary/15 hover:shadow-[var(--shadow-card-hover)]">
        {/* Header */}
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-sport-orange/10 px-2 py-0.5 text-[10px] font-semibold text-sport-orange">
              <Swords className="h-3 w-3" />
              {t("Sparing")}
            </span>
            {isUrgent && (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-semibold text-red-500 animate-pulse">
                <Clock className="h-3 w-3" />
                {Math.round(hoursUntil)}h
              </span>
            )}
            {data.costPerTeam && (
              <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                {data.costPerTeam} PLN
              </span>
            )}
          </div>
          <span className="text-[11px] text-muted-foreground">{formatDate(createdAt)}</span>
        </div>

        {/* Match visualization */}
        {isMatched ? (
          <div className="flex items-center justify-center gap-4 py-2">
            <ClubBadge name={data.club.name} logoUrl={data.club.logoUrl} />
            <div className="flex flex-col items-center">
              <span className="text-xs font-bold uppercase text-muted-foreground">VS</span>
            </div>
            <ClubBadge name={data.acceptedClub!.name} logoUrl={data.acceptedClub!.logoUrl} />
          </div>
        ) : (
          <div>
            <p className="text-[14px] font-semibold text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-1">
              {data.title}
            </p>
            <p className="mt-0.5 text-[13px] text-muted-foreground">
              {data.club.name}{data.club.city ? ` · ${data.club.city}` : ""}
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-3 flex items-center gap-3 text-[12px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formatDate(data.matchDate)}
          </span>
          {data.location && (
            <span className="flex items-center gap-1 truncate">
              <MapPin className="h-3 w-3" />
              {data.location}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
