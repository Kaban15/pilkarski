"use client";

import { TOURNAMENT_PHASE_LABELS } from "@/lib/labels";
import { useI18n } from "@/lib/i18n";
import { MatchRow } from "./match-row";

interface BracketMatch {
  id: string;
  phase: string;
  matchOrder: number;
  homeTeam: { teamName: string } | null;
  awayTeam: { teamName: string } | null;
  homeScore?: number | null;
  awayScore?: number | null;
  penaltyHome?: number | null;
  penaltyAway?: number | null;
  scoreConfirmed?: boolean;
}

interface BracketViewProps {
  matches: BracketMatch[];
}

const PHASE_ORDER: string[] = [
  "ROUND_OF_16",
  "QUARTER_FINAL",
  "SEMI_FINAL",
  "THIRD_PLACE",
  "FINAL",
];

export function BracketView({ matches }: BracketViewProps) {
  const { t } = useI18n();
  // Group by phase (exclude GROUP phase — those go in GroupTable)
  const knockoutMatches = matches.filter((m) => m.phase !== "GROUP");

  if (knockoutMatches.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        {t("Brak meczów w drabince.")}
      </p>
    );
  }

  // Collect unique phases in logical order
  const presentPhases = PHASE_ORDER.filter((p) =>
    knockoutMatches.some((m) => m.phase === p)
  );

  // Phases not in PHASE_ORDER (shouldn't happen, but safety)
  const extraPhases = [
    ...new Set(knockoutMatches.map((m) => m.phase).filter((p) => !PHASE_ORDER.includes(p))),
  ];

  const allPhases = [...presentPhases, ...extraPhases];

  return (
    <div className="flex gap-6 overflow-x-auto pb-4">
      {allPhases.map((phase) => {
        const phaseMatches = knockoutMatches
          .filter((m) => m.phase === phase)
          .sort((a, b) => a.matchOrder - b.matchOrder);

        return (
          <div key={phase} className="min-w-[180px] flex-shrink-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
              {t(TOURNAMENT_PHASE_LABELS[phase] ?? phase)}
            </p>
            <div className="space-y-2">
              {phaseMatches.map((match) => (
                <div key={match.id} className="bg-card rounded-lg p-2">
                  <MatchRow
                    homeTeamName={match.homeTeam?.teamName ?? t("Oczekuje")}
                    awayTeamName={match.awayTeam?.teamName ?? t("Oczekuje")}
                    homeScore={match.homeScore}
                    awayScore={match.awayScore}
                    penaltyHome={match.penaltyHome}
                    penaltyAway={match.penaltyAway}
                    scoreConfirmed={match.scoreConfirmed}
                  />
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
