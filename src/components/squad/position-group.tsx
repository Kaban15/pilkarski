"use client";

import { useState } from "react";
import Link from "next/link";
import { POSITION_LABELS } from "@/lib/labels";
import { Trash2 } from "lucide-react";

interface PlayerRow {
  id: string;
  userId: string;
  firstName: string | null;
  lastName: string | null;
  photoUrl?: string | null;
  position?: string | null;
  age?: number | null;
  height?: number | null;
  preferredFoot?: string | null;
}

interface PositionGroupProps {
  label: string;
  color: "red" | "blue" | "emerald" | "amber";
  players: PlayerRow[];
  showActions?: boolean;
  onRemove?: (userId: string) => void;
  removingId?: string | null;
  collapsedMax?: number;
}

const BAR_COLORS: Record<string, string> = {
  red: "bg-red-500",
  blue: "bg-blue-500",
  emerald: "bg-emerald-500",
  amber: "bg-amber-500",
};

export const POSITION_GROUPS = [
  { key: "GK", label: "Bramkarze", color: "red" as const, positions: ["GK"] },
  { key: "DEF", label: "Obrońcy", color: "blue" as const, positions: ["CB", "LB", "RB"] },
  { key: "MID", label: "Pomocnicy", color: "emerald" as const, positions: ["CDM", "CM", "CAM", "LM", "RM"] },
  { key: "FWD", label: "Napastnicy", color: "amber" as const, positions: ["ST", "LW", "RW"] },
];

export function PositionGroup({
  label,
  color,
  players,
  showActions = false,
  onRemove,
  removingId,
  collapsedMax = 3,
}: PositionGroupProps) {
  const [expanded, setExpanded] = useState(false);
  const visiblePlayers = expanded ? players : players.slice(0, collapsedMax);
  const hiddenCount = players.length - collapsedMax;

  if (players.length === 0) return null;

  return (
    <div className="mb-4">
      <div className="flex items-center gap-1.5 mb-2">
        <div className={`w-[3px] h-3.5 rounded-sm ${BAR_COLORS[color]}`} />
        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <span className="text-[11px] text-muted-foreground/60">{players.length}</span>
      </div>
      <div className="bg-card rounded-xl overflow-hidden divide-y divide-border">
        {visiblePlayers.map((p) => {
          const name = [p.firstName, p.lastName].filter(Boolean).join(" ") || "Bez nazwy";
          const initials = `${(p.firstName?.[0] || "").toUpperCase()}${(p.lastName?.[0] || "").toUpperCase()}`;
          const meta = [p.age ? `${p.age} lat` : null, p.height ? `${p.height} cm` : null, p.preferredFoot === "LEFT" ? "Lewa" : p.preferredFoot === "RIGHT" ? "Prawa" : null].filter(Boolean).join(" · ");

          return (
            <div key={p.userId} className="flex items-center px-3 py-2.5">
              <Link href={`/players/${p.id}`} className="flex items-center gap-2.5 flex-1 min-w-0 hover:text-primary transition-colors">
                {p.photoUrl ? (
                  <img src={p.photoUrl} alt={name} className="w-9 h-9 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold shrink-0">
                    {initials}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="text-[13px] font-semibold truncate">{name}</div>
                  {meta && <div className="text-[11px] text-muted-foreground">{meta}</div>}
                </div>
              </Link>
              {p.position && (
                <span className="bg-muted px-2 py-0.5 rounded-md text-[10px] font-semibold text-muted-foreground shrink-0 ml-2">
                  {POSITION_LABELS[p.position] || p.position}
                </span>
              )}
              {showActions && onRemove && (
                <button
                  onClick={() => onRemove(p.userId)}
                  disabled={removingId === p.userId}
                  className="ml-2 p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors shrink-0"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          );
        })}
        {!expanded && hiddenCount > 0 && (
          <button
            onClick={() => setExpanded(true)}
            className="w-full py-2 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
          >
            + {hiddenCount} więcej
          </button>
        )}
      </div>
    </div>
  );
}
