"use client";

import { MatchRow } from "./match-row";

interface Standing {
  teamId: string;
  teamName: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
}

interface GroupMatch {
  id: string;
  homeTeam: { teamName: string } | null;
  awayTeam: { teamName: string } | null;
  homeScore?: number | null;
  awayScore?: number | null;
  penaltyHome?: number | null;
  penaltyAway?: number | null;
  scoreConfirmed?: boolean;
  matchDate?: string | Date | null;
}

interface GroupTableProps {
  groupLabel: string;
  standings: Standing[];
  advancingCount: number;
  matches: GroupMatch[];
}

export function GroupTable({ groupLabel, standings, advancingCount, matches }: GroupTableProps) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
        Grupa {groupLabel}
      </p>

      {/* Standings table */}
      <div className="bg-card rounded-xl overflow-hidden mb-3">
        {/* Header */}
        <div className="grid grid-cols-[24px_1fr_28px_28px_28px_28px_32px_32px_32px_32px] gap-0.5 px-3 py-1.5 border-b border-border">
          <span className="text-[10px] uppercase text-muted-foreground text-center">#</span>
          <span className="text-[10px] uppercase text-muted-foreground">Drużyna</span>
          <span className="text-[10px] uppercase text-muted-foreground text-center">M</span>
          <span className="text-[10px] uppercase text-muted-foreground text-center">W</span>
          <span className="text-[10px] uppercase text-muted-foreground text-center">R</span>
          <span className="text-[10px] uppercase text-muted-foreground text-center">P</span>
          <span className="text-[10px] uppercase text-muted-foreground text-center">B+</span>
          <span className="text-[10px] uppercase text-muted-foreground text-center">B-</span>
          <span className="text-[10px] uppercase text-muted-foreground text-center">+/-</span>
          <span className="text-[10px] uppercase text-muted-foreground text-center font-bold">Pkt</span>
        </div>

        {/* Data rows */}
        {standings.map((s, idx) => {
          const isAdvancing = idx < advancingCount;
          const gd = s.goalsFor - s.goalsAgainst;
          return (
            <div
              key={s.teamId}
              className={`grid grid-cols-[24px_1fr_28px_28px_28px_28px_32px_32px_32px_32px] gap-0.5 px-3 py-1.5 border-b border-border last:border-0 ${isAdvancing ? "bg-emerald-500/10" : ""}`}
            >
              <span className="text-[12px] text-muted-foreground text-center self-center">{idx + 1}</span>
              <span className="text-[12px] font-bold truncate self-center">{s.teamName}</span>
              <span className="text-[12px] text-center self-center">{s.played}</span>
              <span className="text-[12px] text-center self-center">{s.won}</span>
              <span className="text-[12px] text-center self-center">{s.drawn}</span>
              <span className="text-[12px] text-center self-center">{s.lost}</span>
              <span className="text-[12px] text-center self-center">{s.goalsFor}</span>
              <span className="text-[12px] text-center self-center">{s.goalsAgainst}</span>
              <span className={`text-[12px] text-center self-center ${gd > 0 ? "text-emerald-500" : gd < 0 ? "text-red-500" : ""}`}>
                {gd > 0 ? `+${gd}` : gd}
              </span>
              <span className="text-[12px] font-bold text-center self-center">{s.points}</span>
            </div>
          );
        })}
      </div>

      {/* Group matches */}
      {matches.length > 0 && (
        <div className="bg-card rounded-xl overflow-hidden divide-y divide-border">
          {matches.map((match) => (
            <MatchRow
              key={match.id}
              homeTeamName={match.homeTeam?.teamName ?? "Oczekuje"}
              awayTeamName={match.awayTeam?.teamName ?? "Oczekuje"}
              homeScore={match.homeScore}
              awayScore={match.awayScore}
              penaltyHome={match.penaltyHome}
              penaltyAway={match.penaltyAway}
              scoreConfirmed={match.scoreConfirmed}
              matchDate={match.matchDate}
            />
          ))}
        </div>
      )}
    </div>
  );
}
