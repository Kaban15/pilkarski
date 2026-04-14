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
    const dailyCounts: Record<string, number> = {
      "2026-04-14": 1,
      "2026-04-13": 2,
      "2026-04-12": 1,
      "2026-04-10": 3,
      "2026-04-09": 1,
    };
    const result = computeStreaks(dailyCounts, new Date("2026-04-14"));
    expect(result.currentStreak).toBe(3);
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
    expect(computeBestMonth(entries)).toBe(3);
  });

  it("returns null for empty input", () => {
    expect(computeBestMonth([])).toBeNull();
  });
});

describe("computeBestDow", () => {
  it("returns day-of-week index with most actions", () => {
    const entries = [
      { createdAt: new Date("2026-04-14") },
      { createdAt: new Date("2026-04-13") },
      { createdAt: new Date("2026-04-07") },
    ];
    expect(computeBestDow(entries)).toBe(2);
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
