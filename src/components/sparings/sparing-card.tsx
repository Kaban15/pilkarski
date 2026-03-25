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
      <Card className="h-full transition-colors hover:border-primary/40">
        <CardContent className="p-5">
          {/* Header: title + favorite */}
          <div className="mb-1 flex items-start justify-between gap-2">
            <h3 className="font-semibold leading-snug text-foreground group-hover:text-primary transition-colors line-clamp-1">
              {sparing.title}
            </h3>
            {showFavorite && (
              <div className="shrink-0" onClick={(e) => e.preventDefault()}>
                <FavoriteButton sparingOfferId={sparing.id} initialFavorited={favorited ?? false} />
              </div>
            )}
          </div>

          {/* Club + meta */}
          <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
            <div className="flex h-5 w-5 shrink-0 items-center justify-center overflow-hidden rounded bg-muted">
              {sparing.club.logoUrl ? (
                <img
                  src={sparing.club.logoUrl}
                  alt={sparing.club.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-[9px] font-bold text-muted-foreground">
                  {sparing.club.name.slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>
            <span className="truncate">
              {sparing.club.name}
              {sparing.club.city && ` · ${sparing.club.city}`}
            </span>
            {sparing.region && (
              <span className="ml-auto shrink-0 text-xs">{sparing.region.name}</span>
            )}
          </div>

          {/* Badges */}
          {(sparing.level || sparing.ageCategory) && (
            <div className="mb-3 flex flex-wrap gap-1.5">
              {sparing.level && (
                <Badge variant="secondary" className={`text-[11px] ${SPARING_LEVEL_COLORS[sparing.level]}`}>
                  {SPARING_LEVEL_LABELS[sparing.level]}
                </Badge>
              )}
              {sparing.ageCategory && (
                <Badge variant="secondary" className="text-[11px]">
                  {AGE_CATEGORY_LABELS[sparing.ageCategory]}
                </Badge>
              )}
            </div>
          )}

          {/* Date + location row */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 shrink-0" />
              {formatDate(sparing.matchDate)}
            </span>
            {sparing.location && (
              <span className="flex items-center gap-1.5 truncate">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{sparing.location}</span>
              </span>
            )}
            {countdown && (
              <span className="ml-auto shrink-0 text-emerald-600 dark:text-emerald-400 font-medium">
                {countdown}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
