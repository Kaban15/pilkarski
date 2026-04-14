"use client";

import Link from "next/link";
import { Users, User, MapPin } from "lucide-react";
import { formatDate } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { getLabels, POSITION_LABELS } from "@/lib/labels";

interface NewMemberFeedCardProps {
  type: "club" | "player";
  data: {
    id: string;
    name?: string;
    firstName?: string;
    lastName?: string;
    city?: string | null;
    primaryPosition?: string | null;
    logoUrl?: string | null;
    region?: { name: string } | null;
  };
  createdAt: string | Date;
}

export function NewMemberFeedCard({ type, data, createdAt }: NewMemberFeedCardProps) {
  const { t, locale } = useI18n();
  const positionLabels = getLabels(POSITION_LABELS, locale);
  const isClub = type === "club";
  const name = isClub ? data.name : `${data.firstName} ${data.lastName}`;
  const href = isClub ? `/clubs/${data.id}` : `/players/${data.id}`;
  const icon = isClub ? Users : User;
  const Icon = icon;
  const accentColor = isClub ? "blue" : "orange";
  const position = data.primaryPosition ? positionLabels[data.primaryPosition] : null;

  return (
    <Link href={href} className="group block">
      <div className="rounded-xl border border-[var(--card-elevated-border)] bg-card p-4 transition-all hover:border-primary/15 hover:shadow-[var(--shadow-card-hover)]">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted overflow-hidden">
            {data.logoUrl ? (
              <img src={data.logoUrl} alt={name ?? ""} className="h-full w-full object-cover" />
            ) : (
              <Icon className="h-5 w-5 text-muted-foreground" />
            )}
          </div>

          {/* Info */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1 rounded-full bg-${accentColor}-500/10 px-2 py-0.5 text-[10px] font-semibold text-${accentColor}-600 dark:text-${accentColor}-400`}>
                {isClub ? t("Nowy klub") : t("Nowy zawodnik")}
              </span>
              <span className="text-[11px] text-muted-foreground">{formatDate(createdAt)}</span>
            </div>
            <p className={`mt-1 text-[14px] font-semibold text-foreground group-hover:text-${accentColor}-600 dark:group-hover:text-${accentColor}-400 transition-colors`}>
              {name}
            </p>
            <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
              {position && <span>{position}</span>}
              {data.city && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {data.city}
                </span>
              )}
              {data.region && <span>· {data.region.name}</span>}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
