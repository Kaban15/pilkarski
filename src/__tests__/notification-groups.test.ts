import { groupNotificationsByTime } from "@/lib/notification-groups";

const now = new Date("2026-04-17T14:00:00Z");

function mk(id: string, offsetMs: number) {
  return { id, createdAt: new Date(now.getTime() - offsetMs) };
}

describe("groupNotificationsByTime", () => {
  it("buckets today/week/older correctly", () => {
    const items = [
      mk("today-1", 60 * 1000),
      mk("today-2", 3 * 60 * 60 * 1000),
      mk("week-1", 2 * 24 * 60 * 60 * 1000),
      mk("week-2", 5 * 24 * 60 * 60 * 1000),
      mk("older-1", 10 * 24 * 60 * 60 * 1000),
    ];
    const groups = groupNotificationsByTime(items, now);
    expect(groups.map((g) => g.key)).toEqual(["today", "week", "older"]);
    expect(groups[0].items.map((i) => i.id)).toEqual(["today-1", "today-2"]);
    expect(groups[1].items.map((i) => i.id)).toEqual(["week-1", "week-2"]);
    expect(groups[2].items.map((i) => i.id)).toEqual(["older-1"]);
  });

  it("omits empty buckets", () => {
    const items = [mk("a", 60 * 1000), mk("b", 120 * 1000)];
    const groups = groupNotificationsByTime(items, now);
    expect(groups).toHaveLength(1);
    expect(groups[0].key).toBe("today");
  });

  it("handles ISO string createdAt", () => {
    const items = [{ id: "x", createdAt: new Date(now.getTime() - 1000).toISOString() }];
    const groups = groupNotificationsByTime(items, now);
    expect(groups[0].key).toBe("today");
  });

  it("returns empty array for empty input", () => {
    expect(groupNotificationsByTime([], now)).toEqual([]);
  });
});
