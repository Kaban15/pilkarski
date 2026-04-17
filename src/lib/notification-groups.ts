export type NotificationTimeBucket = "today" | "week" | "older";

export type NotificationGroup<T> = {
  key: NotificationTimeBucket;
  label: string;
  items: T[];
};

const BUCKET_LABELS: Record<NotificationTimeBucket, string> = {
  today: "Dziś",
  week: "Ostatnie 7 dni",
  older: "Starsze",
};

function bucketFor(date: Date, now: Date): NotificationTimeBucket {
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const t = date.getTime();
  if (t >= startOfToday) return "today";
  if (t >= startOfToday - 6 * 24 * 60 * 60 * 1000) return "week";
  return "older";
}

export function groupNotificationsByTime<T extends { createdAt: Date | string }>(
  items: T[],
  now: Date = new Date(),
): NotificationGroup<T>[] {
  const buckets: Record<NotificationTimeBucket, T[]> = { today: [], week: [], older: [] };

  for (const item of items) {
    const date = item.createdAt instanceof Date ? item.createdAt : new Date(item.createdAt);
    buckets[bucketFor(date, now)].push(item);
  }

  const order: NotificationTimeBucket[] = ["today", "week", "older"];
  return order
    .filter((k) => buckets[k].length > 0)
    .map((k) => ({ key: k, label: BUCKET_LABELS[k], items: buckets[k] }));
}
