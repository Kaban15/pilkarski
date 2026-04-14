type PointEntry = { createdAt: Date };

/** UTC so server-aggregated keys match client grid keys regardless of timezone */
export function toDateKey(date: Date): string {
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

  const dateSet = new Set(dates);

  let currentStreak = 0;
  const todayKey = toDateKey(today);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = toDateKey(yesterday);

  let cursor = dateSet.has(todayKey)
    ? new Date(today)
    : dateSet.has(yesterdayKey)
      ? new Date(yesterday)
      : null;
  if (cursor) {
    while (dateSet.has(toDateKey(cursor))) {
      currentStreak++;
      cursor.setDate(cursor.getDate() - 1);
    }
  }

  let longestStreak = 1;
  let streak = 1;
  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1] + "T00:00:00Z");
    const curr = new Date(dates[i] + "T00:00:00Z");
    const diffDays =
      (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays === 1) {
      streak++;
      longestStreak = Math.max(longestStreak, streak);
    } else {
      streak = 1;
    }
  }

  return {
    currentStreak,
    longestStreak: Math.max(longestStreak, currentStreak),
  };
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

