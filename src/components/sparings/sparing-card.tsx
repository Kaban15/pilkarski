"use client";

import Link from "next/link";
import { formatDate } from "@/lib/format";
import {
  SPARING_LEVEL_LABELS,
  SPARING_LEVEL_COLORS,
  AGE_CATEGORY_LABELS,
} from "@/lib/labels";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FavoriteButton } from "@/components/favorite-button";
import {
  Calendar,
  MapPin,
  Globe,
  Users,
  ArrowRight,
} from "lucide-react";

export type SparingCardItem = {
  id: string;
  title: string;
  matchDate: string | Date;
  location: string | null;
  status: string;
  level?: string | null;
  ageCategory?: string | null;
  preferredTime?: string | null;
  club: {
    id: string;
    name: string;
    city: string | null;
    logoUrl?: string | null;
  };
  region: { name: string } | null;
  _count: { applications: number };
};

function getCountdown(dateStr: string | Date): string | null {
  const diff = new Date(dateStr).getTime() - Date.now();
  if (diff <= 0) return null;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days > 30) return null;
  if (days === 0) {
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours === 0) return "za chwilę";
    return `za ${hours}h`;
  }
  if (days === 1) return "jutro";
  return `za ${days} dni`;
}

export function SparingCard({
  sparing,
  favorited,
  showFavorite = true,
}: {
  sparing: SparingCardItem;
  favorited?: boolean;
  showFavorite?: boolean;
}) {
  const countdown = getCountdown(sparing.matchDate);

  return (
    <Link href={`/sparings/${sparing.id}`} className="group block">
      <Card className="h-full border-l-[3px] border-l-emerald-500 transition-all hover:shadow-md hover:-translate-y-0.5">
        <CardContent className="py-4">
          {/* Header: club avatar + title + favorite */}
          <div className="mb-3 flex items-start gap-3">
            {/* Club avatar */}
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-emerald-500/10">
              {sparing.club.logoUrl ? (
                <img
                  src={sparing.club.logoUrl}
                  alt={sparing.club.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  {sparing.club.name.slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                {sparing.title}
              </h3>
              <p className="text-xs text-muted-foreground line-clamp-1">
                {sparing.club.name}
                {sparing.club.city && ` · ${sparing.club.city}`}
              </p>
            </div>
            {showFavorite && (
              <div onClick={(e) => e.preventDefault()}>
                <FavoriteButton sparingOfferId={sparing.id} initialFavorited={favorited ?? false} />
              </div>
            )}
          </div>

          {/* Pill badges */}
          <div className="mb-3 flex flex-wrap gap-1.5">
            {sparing.level && (
              <Badge variant="secondary" className={`text-[10px] ${SPARING_LEVEL_COLORS[sparing.level]}`}>
                {SPARING_LEVEL_LABELS[sparing.level]}
              </Badge>
            )}
            {sparing.ageCategory && (
              <Badge variant="secondary" className="text-[10px] bg-cyan-50 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300">
                {AGE_CATEGORY_LABELS[sparing.ageCategory]}
              </Badge>
            )}
            {sparing.region && (
              <Badge variant="secondary" className="text-[10px]">
                <Globe className="mr-1 h-2.5 w-2.5" />
                {sparing.region.name}
              </Badge>
            )}
          </div>

          {/* Date + location */}
          <div className="space-y-1.5 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 shrink-0" />
              <span>{formatDate(sparing.matchDate)}</span>
              {countdown && (
                <Badge variant="outline" className="ml-auto h-5 border-emerald-300 dark:border-emerald-700 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                  {countdown}
                </Badge>
              )}
            </div>
            {sparing.location && (
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span className="line-clamp-1">{sparing.location}</span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Users className="h-3 w-3" />
              {sparing._count.applications} zgłoszeń
            </div>
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
