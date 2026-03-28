"use client";

import Link from "next/link";
import { formatShortDate } from "@/lib/format";
import { TOURNAMENT_FORMAT_LABELS, TOURNAMENT_STATUS_LABELS, TOURNAMENT_STATUS_COLORS } from "@/lib/labels";
import { MapPin, Users, Calendar } from "lucide-react";

interface TournamentCardProps {
  id: string;
  title: string;
  startDate: string | Date;
  location?: string | null;
  format: string;
  status: string;
  maxTeams: number;
  teamCount: number;
  creatorName: string;
}

export function TournamentCard({ id, title, startDate, location, format, status, maxTeams, teamCount, creatorName }: TournamentCardProps) {
  return (
    <Link href={`/tournaments/${id}`} className="block">
      <div className="bg-card rounded-xl p-4 border border-border hover:border-orange-500/30 transition-colors">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-sm font-bold truncate">{title}</h3>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md shrink-0 ml-2 ${TOURNAMENT_STATUS_COLORS[status] || ""}`}>
            {TOURNAMENT_STATUS_LABELS[status] || status}
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formatShortDate(startDate)}
          </span>
          {location && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              <span className="truncate max-w-[120px]">{location}</span>
            </span>
          )}
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {teamCount}/{maxTeams}
          </span>
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-[10px] font-semibold bg-orange-500/10 text-orange-400 px-2 py-0.5 rounded-md">
            {TOURNAMENT_FORMAT_LABELS[format] || format}
          </span>
          <span className="text-[10px] text-muted-foreground">{creatorName}</span>
        </div>
      </div>
    </Link>
  );
}
