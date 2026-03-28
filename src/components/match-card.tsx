"use client";

import Link from "next/link";
import { formatShortDate } from "@/lib/format";

interface ClubInfo {
  id: string;
  name: string;
  logoUrl?: string | null;
  initials: string;
}

interface MatchCardProps {
  homeClub: ClubInfo;
  awayClub: ClubInfo;
  date: Date;
  homeScore?: number | null;
  awayScore?: number | null;
  scoreConfirmed?: boolean;
  variant?: "compact" | "highlight";
}

function ClubAvatar({ club, size = "sm" }: { club: ClubInfo; size?: "sm" | "md" }) {
  const dim = size === "md" ? "w-9 h-9 text-xs" : "w-7 h-7 text-[9px]";
  if (club.logoUrl) {
    return (
      <img
        src={club.logoUrl}
        alt={club.name}
        className={`${dim} rounded-lg object-cover`}
      />
    );
  }
  return (
    <div className={`${dim} rounded-lg bg-muted flex items-center justify-center font-bold`}>
      {club.initials}
    </div>
  );
}

function ScoreBadge({ home, away, isHome }: { home: number; away: number; isHome: boolean }) {
  const won = isHome ? home > away : away > home;
  const lost = isHome ? home < away : away < home;
  const colorClass = won
    ? "bg-emerald-500/20 text-emerald-400"
    : lost
      ? "bg-red-500/20 text-red-400"
      : "bg-muted/30 text-muted-foreground";

  return (
    <div className={`${colorClass} px-3 py-1 rounded-lg text-sm font-extrabold`}>
      {home} : {away}
    </div>
  );
}

export function MatchCard({ homeClub, awayClub, date, homeScore, awayScore, scoreConfirmed, variant = "compact" }: MatchCardProps) {
  const hasScore = homeScore != null && awayScore != null && scoreConfirmed;
  const dateStr = formatShortDate(date);
  const timeStr = date.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" });

  if (variant === "highlight") {
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    const countdown = diffDays === 0 ? "Dziś" : diffDays === 1 ? "Jutro" : `za ${diffDays} dni`;

    return (
      <div className="bg-card rounded-xl p-4 border-l-[3px] border-violet-500">
        <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
          Następny mecz
        </div>
        <div className="flex items-center justify-center gap-4">
          <div className="text-center">
            <ClubAvatar club={homeClub} size="md" />
            <div className="text-[11px] font-semibold mt-1 truncate max-w-[80px]">{homeClub.name}</div>
          </div>
          <div className="text-center">
            <div className="text-[11px] text-muted-foreground">{dateStr}</div>
            <div className="text-lg font-extrabold my-0.5">{timeStr}</div>
            <div className="text-[10px] font-semibold text-violet-400">{countdown}</div>
          </div>
          <div className="text-center">
            <ClubAvatar club={awayClub} size="md" />
            <div className="text-[11px] font-semibold mt-1 truncate max-w-[80px]">{awayClub.name}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center py-3 px-3">
      <div className="w-11 text-center mr-3 shrink-0">
        <div className="text-[11px] text-muted-foreground">{dateStr}</div>
        {!hasScore && <div className="text-[10px] text-muted-foreground">{timeStr}</div>}
      </div>
      <div className="w-px h-8 bg-border mr-3 shrink-0" />
      <Link href={`/clubs/${homeClub.id}`} className="flex items-center gap-2 flex-1 min-w-0 hover:text-primary transition-colors">
        <ClubAvatar club={homeClub} />
        <span className="text-[13px] font-semibold truncate">{homeClub.name}</span>
      </Link>
      <div className="mx-2 shrink-0">
        {hasScore ? (
          <ScoreBadge home={homeScore} away={awayScore} isHome />
        ) : (
          <span className="text-[13px] font-extrabold text-muted-foreground">vs</span>
        )}
      </div>
      <Link href={`/clubs/${awayClub.id}`} className="flex items-center gap-2 flex-1 min-w-0 justify-end hover:text-primary transition-colors">
        <span className="text-[13px] font-semibold truncate">{awayClub.name}</span>
        <ClubAvatar club={awayClub} />
      </Link>
    </div>
  );
}
