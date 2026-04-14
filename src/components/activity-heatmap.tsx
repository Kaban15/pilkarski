"use client";

import { api } from "@/lib/trpc-react";
import { Calendar, Flame, TrendingUp, Star } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { pluralAkcje } from "@/lib/activity-utils";
import { useMemo, useState } from "react";

const MONTHS_SHORT = ["sty", "lut", "mar", "kwi", "maj", "cze", "lip", "sie", "wrz", "paź", "lis", "gru"];
const MONTHS_FULL = ["Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec", "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień"];
const DAYS_FULL = ["Niedziela", "Poniedziałek", "Wtorek", "Środa", "Czwartek", "Piątek", "Sobota"];
const DAY_LABELS = [
  { index: 0, label: "Pon" },
  { index: 2, label: "Śr" },
  { index: 4, label: "Pt" },
  { index: 6, label: "Nd" },
];

function getLevel(count: number): number {
  if (count === 0) return 0;
  if (count <= 2) return 1;
  if (count <= 5) return 2;
  if (count <= 9) return 3;
  return 4;
}

// Pre-built complete class strings so Tailwind can detect them at build time
const LEVEL_CLASSES = [
  "bg-muted/30 dark:bg-muted/20",
  "bg-violet-200 dark:bg-violet-900/40",
  "bg-violet-300 dark:bg-violet-700/60",
  "bg-violet-400 dark:bg-violet-500/80",
  "bg-violet-600 dark:bg-violet-500",
];

function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatTooltipDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const day = d.getDate();
  const month = MONTHS_SHORT[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

interface WeekColumn {
  dates: (string | null)[]; // 7 slots (Mon=0 to Sun=6), null = empty
}

function buildGrid(today: Date): { weeks: WeekColumn[]; monthLabels: { col: number; label: string }[] } {
  const start = new Date(today);
  const todayDow = (today.getDay() + 6) % 7; // 0=Mon
  start.setDate(start.getDate() - (52 * 7) - todayDow);

  const weeks: WeekColumn[] = [];
  const monthLabels: { col: number; label: string }[] = [];
  let lastMonth = -1;

  const cursor = new Date(start);

  while (cursor <= today) {
    const week: (string | null)[] = [null, null, null, null, null, null, null];

    for (let row = 0; row < 7; row++) {
      if (cursor > today) break;
      const gridRow = (cursor.getDay() + 6) % 7;
      if (gridRow === row) {
        const month = cursor.getMonth();
        if (month !== lastMonth) {
          monthLabels.push({ col: weeks.length, label: MONTHS_SHORT[month] });
          lastMonth = month;
        }
        week[row] = toDateKey(cursor);
        cursor.setDate(cursor.getDate() + 1);
      }
    }

    weeks.push({ dates: week });
  }

  return { weeks, monthLabels };
}

function StatCard({ icon: Icon, value, label, color }: {
  icon: typeof Calendar;
  value: string | number;
  label: string;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-3 text-center">
      <Icon className={`mx-auto mb-1 h-4 w-4 ${color}`} />
      <p className="font-[Rubik] text-lg font-bold">{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}

function HeatmapSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[76px] rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-[120px] rounded-lg" />
    </div>
  );
}

export function ActivityHeatmap({ userId }: { userId: string }) {
  const { data, isLoading } = api.gamification.activityHeatmap.useQuery({ userId });
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null);

  const grid = useMemo(() => buildGrid(new Date()), []);

  if (isLoading) return <HeatmapSkeleton />;
  if (!data || data.totalActions === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
        Brak aktywności w tym okresie
      </div>
    );
  }

  const { dailyCounts, activeDays, currentStreak, bestMonth, bestDow } = data;

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-4">
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={Calendar} value={activeDays} label="Aktywne dni" color="text-violet-500" />
        <StatCard icon={Flame} value={`${currentStreak} dni`} label="Aktualna seria" color="text-orange-500" />
        <StatCard icon={TrendingUp} value={bestMonth !== null ? MONTHS_FULL[bestMonth] : "—"} label="Najaktywniejszy miesiąc" color="text-emerald-500" />
        <StatCard icon={Star} value={bestDow !== null ? DAYS_FULL[bestDow] : "—"} label="Najlepszy dzień" color="text-amber-500" />
      </div>

      {/* Heatmap */}
      <div className="relative overflow-x-auto">
        <div className="min-w-[700px]">
          {/* Month labels */}
          <div className="relative h-4 ml-7">
            {grid.monthLabels.map((m, i) => (
              <span
                key={i}
                className="text-[10px] text-muted-foreground absolute"
                style={{ left: `${m.col * 15}px` }}
              >
                {m.label}
              </span>
            ))}
          </div>

          <div className="flex relative">
            {/* Day labels */}
            <div className="relative w-7 shrink-0" style={{ height: `${7 * 15 - 3}px` }}>
              {DAY_LABELS.map((d) => (
                <span
                  key={d.label}
                  className="text-[10px] text-muted-foreground leading-none absolute"
                  style={{ top: `${d.index * 15 + 1}px` }}
                >
                  {d.label}
                </span>
              ))}
            </div>

            {/* Grid */}
            <div className="flex gap-[3px] sm:gap-[3px] max-sm:gap-[2px]">
              {grid.weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-[3px] sm:gap-[3px] max-sm:gap-[2px]">
                  {week.dates.map((dateStr, di) => {
                    if (!dateStr) {
                      return <div key={di} className="h-[10px] w-[10px] sm:h-3 sm:w-3 rounded-[2px]" />;
                    }
                    const count = dailyCounts[dateStr] ?? 0;
                    const level = getLevel(count);
                    return (
                      <div
                        key={di}
                        className={`h-[10px] w-[10px] sm:h-3 sm:w-3 rounded-[2px] cursor-default ${LEVEL_CLASSES[level]}`}
                        onMouseEnter={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setTooltip({
                            x: rect.left + rect.width / 2,
                            y: rect.top - 8,
                            text: `${formatTooltipDate(dateStr)} — ${count} ${pluralAkcje(count)}`,
                          });
                        }}
                        onMouseLeave={() => setTooltip(null)}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-end gap-1.5 mt-2 text-[10px] text-muted-foreground">
            <span>Mniej</span>
            {LEVEL_CLASSES.map((cls, i) => (
              <div key={i} className={`h-3 w-3 rounded-[2px] ${cls}`} />
            ))}
            <span>Więcej</span>
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 rounded-md bg-popover px-2 py-1 text-xs text-popover-foreground shadow-md border border-border pointer-events-none"
          style={{
            left: `${tooltip.x}px`,
            top: `${tooltip.y}px`,
            transform: "translate(-50%, -100%)",
          }}
        >
          {tooltip.text}
        </div>
      )}
    </div>
  );
}
