"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";
import { api } from "@/lib/trpc-react";
import { formatDate } from "@/lib/format";
import {
  SPARING_LEVEL_LABELS,
  SPARING_LEVEL_COLORS,
  AGE_CATEGORY_LABELS,
  PITCH_STATUS_LABELS,
  APPLICATION_STATUS_LABELS,
} from "@/lib/labels";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FavoriteButton } from "@/components/favorite-button";
import { Calendar, MapPin, Send, Check } from "lucide-react";
import { RegionLogo } from "@/components/region-logo";

export type SparingCardItem = {
  id: string;
  title: string;
  matchDate: string | Date;
  location: string | null;
  status: string;
  level?: string | null;
  ageCategory?: string | null;
  preferredTime?: string | null;
  costPerTeam?: number | null;
  pitchStatus?: string | null;
  club: {
    id: string;
    name: string;
    city: string | null;
    logoUrl?: string | null;
  };
  region: { name: string; slug: string } | null;
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

const crestSlotClass = "flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-muted to-secondary border border-primary/15";

export type QuickApplyState = {
  existingStatus: string | null;
  isOwn: boolean;
};

export function SparingCard({
  sparing,
  favorited,
  showFavorite = true,
  quickApply,
}: {
  sparing: SparingCardItem;
  favorited?: boolean;
  showFavorite?: boolean;
  quickApply?: QuickApplyState;
}) {
  const { t } = useI18n();
  const utils = api.useUtils();
  const [localStatus, setLocalStatus] = useState<string | null>(quickApply?.existingStatus ?? null);
  const applyMutation = api.sparing.applyFor.useMutation({
    onSuccess: () => {
      setLocalStatus("PENDING");
      toast.success(t("Zgłoszenie wysłane"));
      utils.digest.get.invalidate();
      utils.sparing.checkApplications.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });
  const countdown = getCountdown(sparing.matchDate);
  const isUrgent = countdown !== null && (countdown === "za chwilę" || countdown.endsWith("h"));
  const canQuickApply =
    !!quickApply &&
    !quickApply.isOwn &&
    localStatus === null &&
    sparing.status === "OPEN";

  return (
    <Link href={`/sparings/${sparing.id}`} className="group block">
      <div className="h-full rounded-2xl bg-card p-5 transition-all hover:border-[rgba(139,92,246,0.2)] hover:shadow-[var(--shadow-card-hover)] border border-[rgba(6,182,212,0.12)] shadow-[var(--shadow-card)] relative overflow-hidden pl-7">
        {/* Gradient left border */}
        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-sport-cyan to-primary rounded-l-2xl" />

        {/* VS layout */}
        <div className="mb-3 flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className={crestSlotClass}>
              {sparing.club.logoUrl ? (
                <img src={sparing.club.logoUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="text-sm font-bold text-muted-foreground">
                  {sparing.club.name.slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>
            <span className="text-base text-muted-foreground font-light">vs</span>
            <div className={crestSlotClass}>
              <span className="text-sm font-bold text-muted-foreground">?</span>
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-[15px] font-semibold leading-snug text-foreground group-hover:text-primary transition-colors line-clamp-2">
              {sparing.title}
            </h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">{sparing.club.name}</p>
          </div>
          {showFavorite && (
            <div className="shrink-0" onClick={(e) => e.preventDefault()}>
              <FavoriteButton sparingOfferId={sparing.id} initialFavorited={favorited ?? false} />
            </div>
          )}
        </div>

        {/* Badges */}
        {(sparing.level || sparing.ageCategory) && (
          <div className="mb-3 flex flex-wrap gap-1.5">
            {sparing.level && (
              <Badge variant="secondary" className={`rounded-lg text-[11px] font-medium ${SPARING_LEVEL_COLORS[sparing.level]}`}>
                {t(SPARING_LEVEL_LABELS[sparing.level])}
              </Badge>
            )}
            {sparing.ageCategory && (
              <Badge variant="secondary" className="rounded-lg text-[11px] font-medium">
                {t(AGE_CATEGORY_LABELS[sparing.ageCategory])}
              </Badge>
            )}
            {sparing.region && (
              <Badge variant="outline" className="rounded-lg text-[11px] font-normal text-muted-foreground gap-1">
                <RegionLogo slug={sparing.region.slug} name={sparing.region.name} size={14} />
                {sparing.region.name}
              </Badge>
            )}
          </div>
        )}

        {/* Meta row */}
        <div className="flex items-center gap-4 text-[13px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 shrink-0 opacity-50" />
            {formatDate(sparing.matchDate)}
          </span>
          {sparing.location && (
            <span className="flex items-center gap-1.5 truncate">
              <MapPin className="h-3.5 w-3.5 shrink-0 opacity-50" />
              <span className="truncate">{sparing.location}</span>
            </span>
          )}
          {sparing.costPerTeam != null && sparing.costPerTeam > 0 && (
            <span className="shrink-0 bg-amber-500/10 text-amber-400 text-[10px] font-semibold px-2 py-0.5 rounded-md">
              {sparing.costPerTeam} PLN
            </span>
          )}
          {sparing.pitchStatus && (
            <span className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-md ${
              sparing.pitchStatus === "WE_HAVE_PITCH"
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : sparing.pitchStatus === "LOOKING_FOR_PITCH"
                  ? "bg-orange-500/10 text-orange-600 dark:text-orange-400"
                  : "bg-blue-500/10 text-blue-600 dark:text-blue-400"
            }`}>
              {t(PITCH_STATUS_LABELS[sparing.pitchStatus] ?? sparing.pitchStatus)}
            </span>
          )}
          {countdown && (
            <span className={`ml-auto shrink-0 rounded-md px-2 py-0.5 text-[12px] font-semibold ${isUrgent ? "bg-sport-yellow/10 text-sport-yellow countdown-urgent" : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"}`}>
              {t(countdown!)}
            </span>
          )}
        </div>

        {quickApply && !quickApply.isOwn && sparing.status === "OPEN" && (
          <div className="mt-3 flex items-center justify-end" onClick={(e) => e.preventDefault()}>
            {canQuickApply ? (
              <Button
                size="sm"
                variant="default"
                disabled={applyMutation.isPending}
                onClick={() => applyMutation.mutate({ sparingOfferId: sparing.id })}
                data-testid="quick-apply-button"
                className="h-8 gap-1.5"
              >
                <Send className="h-3.5 w-3.5" />
                {applyMutation.isPending ? t("Wysyłanie...") : t("Aplikuj")}
              </Button>
            ) : (
              <Badge
                variant="secondary"
                data-testid="quick-apply-status"
                className="gap-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              >
                <Check className="h-3 w-3" />
                {t(APPLICATION_STATUS_LABELS[localStatus ?? "PENDING"] ?? "Wysłano")}
              </Badge>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
