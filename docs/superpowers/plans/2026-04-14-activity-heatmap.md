# Activity Heatmap Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a GitHub-style activity heatmap to public profiles (clubs, players, coaches) showing rolling 12-month activity from `UserPoints`.

**Architecture:** Single tRPC `publicProcedure` on `gamificationRouter` aggregates `UserPoints` data server-side. One reusable client component `ActivityHeatmap` renders stat cards + heatmap grid. Integrated on 3 public profile pages.

**Tech Stack:** Next.js 16, tRPC 11, Prisma 7, Tailwind CSS 4, shadcn/ui, lucide-react, Vitest

**Spec:** `docs/superpowers/specs/2026-04-14-activity-heatmap-design.md`

---

## File Structure

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `src/lib/activity-utils.ts` | Pure functions: aggregate daily counts, compute streaks, best month/dow from raw UserPoints data |
| Create | `src/__tests__/activity-utils.test.ts` | Unit tests for all aggregation functions |
| Modify | `prisma/schema.prisma:592-604` | Add composite index `@@index([userId, createdAt])` on `UserPoints` |
| Modify | `src/server/trpc/routers/gamification.ts` | Add `activityHeatmap` public procedure |
| Create | `src/components/activity-heatmap.tsx` | Client component: stat cards + heatmap grid + tooltip + skeleton |
| Modify | `src/app/(public)/clubs/[id]/page.tsx:258-269` | Insert `<ActivityHeatmap>` between StatsBar and Tabs |
| Modify | `src/app/(public)/players/[id]/page.tsx:135-151` | Insert `<ActivityHeatmap>` between stats bar and Bio |
| Modify | `src/app/(public)/coaches/[id]/page.tsx:121-122` | Insert `<ActivityHeatmap>` at start of content section |

---

### Task 1: Aggregation utility functions + tests

**Files:**
- Create: `src/lib/activity-utils.ts`
- Create: `src/__tests__/activity-utils.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/__tests__/activity-utils.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import {
  aggregateDailyCounts,
  computeStreaks,
  computeBestMonth,
  computeBestDow,
  pluralAkcje,
} from "@/lib/activity-utils";

describe("aggregateDailyCounts", () => {
  it("groups points entries by date", () => {
    const entries = [
      { createdAt: new Date("2026-04-14T10:00:00Z") },
      { createdAt: new Date("2026-04-14T15:00:00Z") },
      { createdAt: new Date("2026-04-13T08:00:00Z") },
    ];
    const result = aggregateDailyCounts(entries);
    expect(result["2026-04-14"]).toBe(2);
    expect(result["2026-04-13"]).toBe(1);
  });

  it("returns empty object for empty input", () => {
    expect(aggregateDailyCounts([])).toEqual({});
  });
});

describe("computeStreaks", () => {
  it("computes current and longest streak", () => {
    // Today is mocked as 2026-04-14
    const dailyCounts: Record<string, number> = {
      "2026-04-14": 1,
      "2026-04-13": 2,
      "2026-04-12": 1,
      // gap
      "2026-04-10": 3,
      "2026-04-09": 1,
    };
    const result = computeStreaks(dailyCounts, new Date("2026-04-14"));
    expect(result.currentStreak).toBe(3); // 14, 13, 12
    expect(result.longestStreak).toBe(3);
  });

  it("current streak counts from yesterday if no activity today", () => {
    const dailyCounts: Record<string, number> = {
      "2026-04-13": 1,
      "2026-04-12": 2,
    };
    const result = computeStreaks(dailyCounts, new Date("2026-04-14"));
    expect(result.currentStreak).toBe(2);
  });

  it("returns 0 for empty data", () => {
    const result = computeStreaks({}, new Date("2026-04-14"));
    expect(result.currentStreak).toBe(0);
    expect(result.longestStreak).toBe(0);
  });

  it("longest streak can be different from current", () => {
    const dailyCounts: Record<string, number> = {
      "2026-04-14": 1,
      // gap
      "2026-04-01": 1,
      "2026-03-31": 1,
      "2026-03-30": 1,
      "2026-03-29": 1,
      "2026-03-28": 1,
    };
    const result = computeStreaks(dailyCounts, new Date("2026-04-14"));
    expect(result.currentStreak).toBe(1);
    expect(result.longestStreak).toBe(5);
  });
});

describe("computeBestMonth", () => {
  it("returns month index with most actions", () => {
    const entries = [
      { createdAt: new Date("2026-04-14") },
      { createdAt: new Date("2026-04-13") },
      { createdAt: new Date("2026-03-10") },
    ];
    expect(computeBestMonth(entries)).toBe(3); // April = index 3
  });

  it("returns null for empty input", () => {
    expect(computeBestMonth([])).toBeNull();
  });
});

describe("computeBestDow", () => {
  it("returns day-of-week index with most actions", () => {
    // 2026-04-14 is a Tuesday (getDay() = 2)
    // 2026-04-13 is a Monday (getDay() = 1)
    // 2026-04-07 is a Tuesday (getDay() = 2)
    const entries = [
      { createdAt: new Date("2026-04-14") },
      { createdAt: new Date("2026-04-13") },
      { createdAt: new Date("2026-04-07") },
    ];
    expect(computeBestDow(entries)).toBe(2); // Tuesday
  });

  it("returns null for empty input", () => {
    expect(computeBestDow([])).toBeNull();
  });
});

describe("pluralAkcje", () => {
  it("returns 'akcja' for 1", () => {
    expect(pluralAkcje(1)).toBe("akcja");
  });

  it("returns 'akcje' for 2-4", () => {
    expect(pluralAkcje(2)).toBe("akcje");
    expect(pluralAkcje(3)).toBe("akcje");
    expect(pluralAkcje(4)).toBe("akcje");
  });

  it("returns 'akcji' for 5-21", () => {
    expect(pluralAkcje(5)).toBe("akcji");
    expect(pluralAkcje(11)).toBe("akcji");
    expect(pluralAkcje(12)).toBe("akcji");
    expect(pluralAkcje(21)).toBe("akcji");
  });

  it("returns 'akcje' for 22-24 (Polish plural edge case)", () => {
    expect(pluralAkcje(22)).toBe("akcje");
    expect(pluralAkcje(23)).toBe("akcje");
    expect(pluralAkcje(24)).toBe("akcje");
  });

  it("returns 'akcji' for 25, 100, 112", () => {
    expect(pluralAkcje(25)).toBe("akcji");
    expect(pluralAkcje(100)).toBe("akcji");
    expect(pluralAkcje(112)).toBe("akcji");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/__tests__/activity-utils.test.ts`
Expected: FAIL — module `@/lib/activity-utils` not found

- [ ] **Step 3: Write implementation**

Create `src/lib/activity-utils.ts`:

```typescript
type PointEntry = { createdAt: Date };

/** Format date as YYYY-MM-DD in UTC */
function toDateKey(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Group entries by date, return map of date → action count */
export function aggregateDailyCounts(
  entries: PointEntry[],
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const entry of entries) {
    const key = toDateKey(entry.createdAt);
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

/** Compute current streak (from today/yesterday backwards) and longest streak */
export function computeStreaks(
  dailyCounts: Record<string, number>,
  today: Date,
): { currentStreak: number; longestStreak: number } {
  const dates = Object.keys(dailyCounts).sort();
  if (dates.length === 0) return { currentStreak: 0, longestStreak: 0 };

  // Build a Set for O(1) lookups
  const dateSet = new Set(dates);

  // Current streak: start from today, fall back to yesterday
  let currentStreak = 0;
  const todayKey = toDateKey(today);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = toDateKey(yesterday);

  let cursor = dateSet.has(todayKey) ? new Date(today) : dateSet.has(yesterdayKey) ? new Date(yesterday) : null;
  if (cursor) {
    while (dateSet.has(toDateKey(cursor))) {
      currentStreak++;
      cursor.setDate(cursor.getDate() - 1);
    }
  }

  // Longest streak: scan all sorted dates
  let longestStreak = 1;
  let streak = 1;
  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1] + "T00:00:00");
    const curr = new Date(dates[i] + "T00:00:00");
    const diffDays = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays === 1) {
      streak++;
      longestStreak = Math.max(longestStreak, streak);
    } else {
      streak = 1;
    }
  }

  return { currentStreak, longestStreak: Math.max(longestStreak, currentStreak) };
}

/** Return month index (0-11) with the most actions, or null */
export function computeBestMonth(entries: PointEntry[]): number | null {
  if (entries.length === 0) return null;
  const counts = new Array(12).fill(0) as number[];
  for (const e of entries) counts[e.createdAt.getUTCMonth()]++;
  return counts.indexOf(Math.max(...counts));
}

/** Return day-of-week index (0=Sun, 6=Sat) with the most actions, or null */
export function computeBestDow(entries: PointEntry[]): number | null {
  if (entries.length === 0) return null;
  const counts = new Array(7).fill(0) as number[];
  for (const e of entries) counts[e.createdAt.getUTCDay()]++;
  return counts.indexOf(Math.max(...counts));
}

/** Polish plural form for "akcja" */
export function pluralAkcje(count: number): string {
  if (count === 1) return "akcja";
  const lastTwo = count % 100;
  const lastOne = count % 10;
  if (lastTwo >= 12 && lastTwo <= 14) return "akcji";
  if (lastOne >= 2 && lastOne <= 4) return "akcje";
  return "akcji";
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/__tests__/activity-utils.test.ts`
Expected: All 14 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/activity-utils.ts src/__tests__/activity-utils.test.ts
git commit -m "feat: add activity aggregation utility functions with tests"
```

---

### Task 2: Database index migration

**Files:**
- Modify: `prisma/schema.prisma:602` — change `@@index([userId])` to add composite index

- [ ] **Step 1: Update Prisma schema**

In `prisma/schema.prisma`, inside the `UserPoints` model, replace:

```prisma
  @@index([userId])
```

with:

```prisma
  @@index([userId])
  @@index([userId, createdAt])
```

Keep the existing single-column index (other queries may use it).

- [ ] **Step 2: Generate migration**

Run: `npx prisma migrate dev --name add_user_points_userid_createdat_index`
Expected: Migration created and applied successfully

- [ ] **Step 3: Verify migration SQL**

Check the generated migration file contains:
```sql
CREATE INDEX "user_points_user_id_created_at_idx" ON "user_points"("user_id", "created_at");
```

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add composite index (userId, createdAt) on UserPoints"
```

---

### Task 3: tRPC endpoint `gamification.activityHeatmap`

**Files:**
- Modify: `src/server/trpc/routers/gamification.ts`

- [ ] **Step 1: Add the `activityHeatmap` procedure**

In `src/server/trpc/routers/gamification.ts`, add the following procedure inside the `router({...})` object, after the `leaderboard` procedure (before the closing `});`):

```typescript
  // Activity heatmap for public profiles
  activityHeatmap: publicProcedure
    .input(z.object({ userId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

      const entries = await ctx.db.userPoints.findMany({
        where: {
          userId: input.userId,
          createdAt: { gte: oneYearAgo },
        },
        select: { createdAt: true },
        orderBy: { createdAt: "asc" },
      });

      const dailyCounts = aggregateDailyCounts(entries);
      const { currentStreak, longestStreak } = computeStreaks(dailyCounts, new Date());
      const bestMonth = computeBestMonth(entries);
      const bestDow = computeBestDow(entries);

      return {
        dailyCounts,
        totalActions: entries.length,
        activeDays: Object.keys(dailyCounts).length,
        currentStreak,
        longestStreak,
        bestMonth,
        bestDow,
      };
    }),
```

- [ ] **Step 2: Add imports**

At the top of the file, add:

```typescript
import {
  aggregateDailyCounts,
  computeStreaks,
  computeBestMonth,
  computeBestDow,
} from "@/lib/activity-utils";
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/server/trpc/routers/gamification.ts
git commit -m "feat: add gamification.activityHeatmap tRPC endpoint"
```

---

### Task 4: ActivityHeatmap component

**Files:**
- Create: `src/components/activity-heatmap.tsx`

- [ ] **Step 1: Create the component**

Create `src/components/activity-heatmap.tsx`:

```tsx
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
  // Walk day-by-day from 53 weeks ago (nearest Monday) to today
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
      // row 0=Mon, cursor.getDay(): 0=Sun → gridRow = (getDay()+6)%7
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
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/components/activity-heatmap.tsx
git commit -m "feat: add ActivityHeatmap component with stat cards, grid, tooltip"
```

---

### Task 5: Integrate on club profile

**Files:**
- Modify: `src/app/(public)/clubs/[id]/page.tsx`

- [ ] **Step 1: Add import**

At the top of `src/app/(public)/clubs/[id]/page.tsx`, add:

```typescript
import { ActivityHeatmap } from "@/components/activity-heatmap";
```

- [ ] **Step 2: Insert component**

In the same file, between the StatsBar `</div>` (after line 267) and the `<ClubProfileTabs` (line 270), insert:

```tsx
        <div className="my-4">
          <ActivityHeatmap userId={club.userId} />
        </div>
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/app/(public)/clubs/[id]/page.tsx
git commit -m "feat: add activity heatmap to club public profile"
```

---

### Task 6: Integrate on player profile

**Files:**
- Modify: `src/app/(public)/players/[id]/page.tsx`

- [ ] **Step 1: Add import**

At the top of `src/app/(public)/players/[id]/page.tsx`, add:

```typescript
import { ActivityHeatmap } from "@/components/activity-heatmap";
```

- [ ] **Step 2: Insert component**

In the same file, inside the content section, after the stats bar closing `)}` (line 149) and before `<div className="space-y-6">` (line 151), insert:

```tsx
        <div className="mb-6">
          <ActivityHeatmap userId={player.userId} />
        </div>
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/app/(public)/players/[id]/page.tsx
git commit -m "feat: add activity heatmap to player public profile"
```

---

### Task 7: Integrate on coach profile

**Files:**
- Modify: `src/app/(public)/coaches/[id]/page.tsx`

- [ ] **Step 1: Add import**

At the top of `src/app/(public)/coaches/[id]/page.tsx`, add:

```typescript
import { ActivityHeatmap } from "@/components/activity-heatmap";
```

- [ ] **Step 2: Insert component**

In the same file, at the start of the content section, right after `<div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">` (line 122), insert:

```tsx
        <div className="mb-6">
          <ActivityHeatmap userId={coach.userId} />
        </div>
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/app/(public)/coaches/[id]/page.tsx
git commit -m "feat: add activity heatmap to coach public profile"
```

---

### Task 8: Visual QA & polish

- [ ] **Step 1: Start dev server**

Run: `npm run dev`

- [ ] **Step 2: Test on club profile**

Navigate to a club profile page with activity data. Verify:
- 4 stat cards render with correct values
- Heatmap grid shows colored cells
- Tooltip shows on hover with date and count
- Responsive: check at mobile width (< 640px) — heatmap scrolls horizontally, cards stack 2x2

- [ ] **Step 3: Test on player profile**

Navigate to a player profile page. Same checks.

- [ ] **Step 4: Test on coach profile**

Navigate to a coach profile page. Same checks.

- [ ] **Step 5: Test empty state**

Navigate to a profile with no activity (new user). Verify "Brak aktywności w tym okresie" message shows.

- [ ] **Step 6: Test dark/light mode**

Toggle theme. Verify heatmap colors change appropriately between dark and light mode.

- [ ] **Step 7: Fix any visual issues found**

Apply CSS fixes as needed.

- [ ] **Step 8: Commit fixes if any**

```bash
git add -A
git commit -m "fix: activity heatmap visual polish"
```
