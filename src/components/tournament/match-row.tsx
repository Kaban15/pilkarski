"use client";

import { useState } from "react";
import { formatShortDate } from "@/lib/format";

interface MatchRowProps {
  homeTeamName: string;
  awayTeamName: string;
  homeScore?: number | null;
  awayScore?: number | null;
  penaltyHome?: number | null;
  penaltyAway?: number | null;
  scoreConfirmed?: boolean;
  matchDate?: string | Date | null;
  onSubmitScore?: (homeScore: number, awayScore: number) => void;
  onConfirmScore?: (confirmed: boolean) => void;
  showActions?: boolean;
  isSubmitter?: boolean;
}

export function MatchRow({
  homeTeamName,
  awayTeamName,
  homeScore,
  awayScore,
  penaltyHome,
  penaltyAway,
  scoreConfirmed,
  matchDate,
  onSubmitScore,
  onConfirmScore,
  showActions,
  isSubmitter,
}: MatchRowProps) {
  const [inputHome, setInputHome] = useState("");
  const [inputAway, setInputAway] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const hasScore = homeScore !== null && homeScore !== undefined && awayScore !== null && awayScore !== undefined;

  function handleSubmit() {
    const h = parseInt(inputHome);
    const a = parseInt(inputAway);
    if (isNaN(h) || isNaN(a) || h < 0 || a < 0) return;
    setSubmitting(true);
    onSubmitScore?.(h, a);
    setInputHome("");
    setInputAway("");
    setSubmitting(false);
  }

  return (
    <div className="py-2.5 px-3">
      <div className="flex items-center gap-2">
        {/* Home team */}
        <span className="flex-1 text-right text-[13px] font-semibold truncate">{homeTeamName}</span>

        {/* Score */}
        <span className={`text-[13px] font-bold min-w-[40px] text-center ${scoreConfirmed ? "text-foreground" : "text-muted-foreground"}`}>
          {hasScore ? (
            <>
              {homeScore}:{awayScore}
              {penaltyHome !== null && penaltyHome !== undefined && penaltyAway !== null && penaltyAway !== undefined && (
                <span className="text-[10px] font-normal ml-1 text-muted-foreground">(pk. {penaltyHome}:{penaltyAway})</span>
              )}
            </>
          ) : (
            <span className="text-muted-foreground">–:–</span>
          )}
        </span>

        {/* Away team */}
        <span className="flex-1 text-left text-[13px] font-semibold truncate">{awayTeamName}</span>
      </div>

      {/* Date */}
      {matchDate && (
        <p className="text-[10px] text-muted-foreground text-center mt-0.5">
          {formatShortDate(matchDate)}
        </p>
      )}

      {/* Actions */}
      {showActions && !scoreConfirmed && (
        <div className="mt-2">
          {!hasScore ? (
            /* Submit score form */
            <div className="flex items-center gap-2 justify-center">
              <input
                type="number"
                min={0}
                value={inputHome}
                onChange={(e) => setInputHome(e.target.value)}
                placeholder="0"
                className="w-12 text-center text-sm border border-border rounded-md bg-background px-1 py-0.5"
              />
              <span className="text-muted-foreground text-sm">:</span>
              <input
                type="number"
                min={0}
                value={inputAway}
                onChange={(e) => setInputAway(e.target.value)}
                placeholder="0"
                className="w-12 text-center text-sm border border-border rounded-md bg-background px-1 py-0.5"
              />
              <button
                onClick={handleSubmit}
                disabled={submitting || inputHome === "" || inputAway === ""}
                className="text-[11px] font-semibold bg-orange-500 text-white rounded-md px-2 py-0.5 hover:bg-orange-600 disabled:opacity-50"
              >
                Wpisz
              </button>
            </div>
          ) : isSubmitter ? (
            /* Waiting for other team */
            <p className="text-[11px] text-muted-foreground text-center">Oczekiwanie na potwierdzenie...</p>
          ) : (
            /* Confirm / reject buttons for the other team */
            <div className="flex items-center gap-2 justify-center">
              <span className="text-[11px] text-muted-foreground">Potwierdzasz wynik?</span>
              <button
                onClick={() => onConfirmScore?.(true)}
                className="text-[11px] font-semibold bg-emerald-500/10 text-emerald-500 rounded-md px-2 py-0.5 hover:bg-emerald-500/20"
              >
                Tak
              </button>
              <button
                onClick={() => onConfirmScore?.(false)}
                className="text-[11px] font-semibold bg-red-500/10 text-red-500 rounded-md px-2 py-0.5 hover:bg-red-500/20"
              >
                Nie
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
