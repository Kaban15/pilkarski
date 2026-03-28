"use client";

interface Scorer {
  scorerUserId: string;
  scorerName: string;
  teamName: string;
  goalCount: number;
}

interface TopScorersProps {
  scorers: Scorer[];
}

export function TopScorers({ scorers }: TopScorersProps) {
  if (scorers.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        Brak strzelców.
      </p>
    );
  }

  return (
    <div className="bg-card rounded-xl overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-[28px_1fr_1fr_40px] gap-2 px-3 py-1.5 border-b border-border">
        <span className="text-[10px] uppercase text-muted-foreground text-center">#</span>
        <span className="text-[10px] uppercase text-muted-foreground">Strzelec</span>
        <span className="text-[10px] uppercase text-muted-foreground">Drużyna</span>
        <span className="text-[10px] uppercase text-muted-foreground text-center">⚽</span>
      </div>

      {/* Rows */}
      {scorers.map((scorer, idx) => {
        const isTop3 = idx < 3;
        return (
          <div
            key={scorer.scorerUserId}
            className="grid grid-cols-[28px_1fr_1fr_40px] gap-2 px-3 py-2 border-b border-border last:border-0"
          >
            <span className={`text-[12px] font-bold text-center self-center ${isTop3 ? "text-orange-400" : "text-muted-foreground"}`}>
              {idx + 1}
            </span>
            <span className="text-[12px] font-semibold truncate self-center">{scorer.scorerName}</span>
            <span className="text-[12px] text-muted-foreground truncate self-center">{scorer.teamName}</span>
            <span className={`text-[13px] font-bold text-center self-center ${isTop3 ? "text-orange-400" : ""}`}>
              {scorer.goalCount}
            </span>
          </div>
        );
      })}
    </div>
  );
}
