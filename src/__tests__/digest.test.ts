import { describe, it, expect } from "vitest";
import {
  DIGEST_THRESHOLDS,
  getClubDigest,
  getPlayerDigest,
  getCoachDigest,
  type DigestRow,
} from "@/lib/digest";

describe("DIGEST_THRESHOLDS", () => {
  it("has expected threshold values", () => {
    expect(DIGEST_THRESHOLDS.attendanceWarnHours).toBe(48);
    expect(DIGEST_THRESHOLDS.upcomingDays).toBe(7);
    expect(DIGEST_THRESHOLDS.stalePipelineDays).toBe(14);
    expect(DIGEST_THRESHOLDS.recommendedEventHours).toBe(72);
  });
});

// Helper: builds a mock delegate for a Prisma model where `.count` returns
// a different value per call (queue-based), or a single value repeatedly.
function countQueue(values: number[]) {
  let i = 0;
  return async () => {
    const v = values[Math.min(i, values.length - 1)];
    i++;
    return v;
  };
}

// ============================================================
// CLUB
// ============================================================

describe("getClubDigest", () => {
  it("returns empty rows if club profile not found", async () => {
    const db = {
      club: { findUnique: async () => null },
      eventApplication: { count: async () => 0 },
      sparingApplication: { count: async () => 0 },
      sparingInvitation: { count: async () => 0 },
      sparingOffer: { count: async () => 0 },
      event: { count: async () => 0 },
      recruitmentPipeline: { count: async () => 0 },
    };
    const result = await getClubDigest({ db, userId: "u1" });
    expect(result.rows).toEqual([]);
    expect(result.totalCount).toBe(0);
  });

  it("returns empty rows when all counts are zero", async () => {
    const db = {
      club: { findUnique: async () => ({ id: "c1" }) },
      eventApplication: { count: async () => 0 },
      sparingApplication: { count: async () => 0 },
      sparingInvitation: { count: async () => 0 },
      sparingOffer: { count: async () => 0 },
      event: { count: async () => 0 },
      recruitmentPipeline: { count: async () => 0 },
    };
    const result = await getClubDigest({ db, userId: "u1" });
    expect(result.rows).toEqual([]);
    expect(result.totalCount).toBe(0);
  });

  it("returns rows in fixed order with count > 0 and correct totalCount", async () => {
    const db = {
      club: { findUnique: async () => ({ id: "c1" }) },
      // 1. attendance48h
      eventApplication: { count: async () => 3 },
      // 2. pendingSparingApplications
      sparingApplication: { count: async () => 2 },
      // 3. pendingSparingInvitations
      sparingInvitation: { count: async () => 1 },
      // 4. upcomingWeek: sum of sparingOffer + event counts
      sparingOffer: { count: async () => 4 },
      event: { count: async () => 5 }, // sum = 9
      // 5. stalePipeline
      recruitmentPipeline: { count: async () => 7 },
    };
    const result = await getClubDigest({ db, userId: "u1" });
    expect(result.rows.map((r) => r.key)).toEqual([
      "club.attendance48h",
      "club.pendingSparingApplications",
      "club.pendingSparingInvitations",
      "club.upcomingWeek",
      "club.stalePipeline",
    ]);
    expect(result.rows.map((r) => r.count)).toEqual([3, 2, 1, 9, 7]);
    expect(result.totalCount).toBe(3 + 2 + 1 + 9 + 7);
    // spot-check icon keys and hrefs
    expect(result.rows[0].iconKey).toBe("attendance");
    expect(result.rows[1].iconKey).toBe("sparing");
    expect(result.rows[2].iconKey).toBe("invitation");
    expect(result.rows[3].iconKey).toBe("calendar");
    expect(result.rows[4].iconKey).toBe("pipeline");
    expect(result.rows[0].href).toBe("/events?filter=pending-attendance");
    expect(result.rows[3].href).toBe("/calendar?range=week");
  });

  it("filters out zero-count rows, preserves order of remaining", async () => {
    const db = {
      club: { findUnique: async () => ({ id: "c1" }) },
      eventApplication: { count: async () => 0 }, // row 1 -> out
      sparingApplication: { count: async () => 5 }, // row 2 -> in
      sparingInvitation: { count: async () => 0 }, // row 3 -> out
      sparingOffer: { count: async () => 0 },
      event: { count: async () => 0 }, // row 4 sum=0 -> out
      recruitmentPipeline: { count: async () => 2 }, // row 5 -> in
    };
    const result = await getClubDigest({ db, userId: "u1" });
    expect(result.rows.map((r) => r.key)).toEqual([
      "club.pendingSparingApplications",
      "club.stalePipeline",
    ]);
    expect(result.totalCount).toBe(7);
  });

  it("every row has required DigestRow fields", async () => {
    const db = {
      club: { findUnique: async () => ({ id: "c1" }) },
      eventApplication: { count: async () => 1 },
      sparingApplication: { count: async () => 1 },
      sparingInvitation: { count: async () => 1 },
      sparingOffer: { count: async () => 1 },
      event: { count: async () => 1 },
      recruitmentPipeline: { count: async () => 1 },
    };
    const result = await getClubDigest({ db, userId: "u1" });
    for (const row of result.rows) {
      expect(row.key).toBeTruthy();
      expect(typeof row.count).toBe("number");
      expect(row.label).toBeTruthy();
      expect(row.href).toMatch(/^\//);
      expect(row.iconKey).toBeTruthy();
    }
  });
});

// ============================================================
// PLAYER
// ============================================================

describe("getPlayerDigest", () => {
  it("returns empty rows if player profile not found", async () => {
    const db = {
      player: { findUnique: async () => null },
      eventApplication: { count: async () => 0 },
      event: { count: async () => 0 },
    };
    const result = await getPlayerDigest({ db, userId: "u1" });
    expect(result.rows).toEqual([]);
    expect(result.totalCount).toBe(0);
  });

  it("returns empty rows when all counts are zero", async () => {
    const db = {
      player: {
        findUnique: async () => ({ id: "p1", regionId: 1, primaryPosition: "ST" }),
      },
      eventApplication: { count: async () => 0 },
      event: { count: async () => 0 },
    };
    const result = await getPlayerDigest({ db, userId: "u1" });
    expect(result.rows).toEqual([]);
    expect(result.totalCount).toBe(0);
  });

  it("returns rows in declared order with correct totalCount", async () => {
    // 3 eventApplication.count calls: (1) myApplicationsInProgress, (2) attendance48h, (3) upcomingWeek
    const eventAppCount = countQueue([4, 2, 1]);
    const db = {
      player: {
        findUnique: async () => ({ id: "p1", regionId: 5, primaryPosition: "ST" }),
      },
      eventApplication: { count: eventAppCount },
      event: { count: async () => 3 }, // recommendedEvents
    };
    const result = await getPlayerDigest({ db, userId: "u1" });
    expect(result.rows.map((r) => r.key)).toEqual([
      "player.myApplicationsInProgress",
      "player.attendance48h",
      "player.upcomingWeek",
      "player.recommendedEvents",
    ]);
    expect(result.rows.map((r) => r.count)).toEqual([4, 2, 1, 3]);
    expect(result.totalCount).toBe(10);
    expect(result.rows.map((r) => r.iconKey)).toEqual([
      "event",
      "attendance",
      "calendar",
      "recommendation",
    ]);
  });

  it("filters out zero-count rows", async () => {
    const eventAppCount = countQueue([0, 2, 0]);
    const db = {
      player: {
        findUnique: async () => ({ id: "p1", regionId: null, primaryPosition: null }),
      },
      eventApplication: { count: eventAppCount },
      event: { count: async () => 0 },
    };
    const result = await getPlayerDigest({ db, userId: "u1" });
    expect(result.rows.map((r) => r.key)).toEqual(["player.attendance48h"]);
    expect(result.totalCount).toBe(2);
  });

  it("recommendedEvents query omits regionId/position filters if player has none", async () => {
    let capturedWhere: any = null;
    const db = {
      player: {
        findUnique: async () => ({ id: "p1", regionId: null, primaryPosition: null }),
      },
      eventApplication: { count: async () => 0 },
      event: {
        count: async (args: any) => {
          capturedWhere = args.where;
          return 1;
        },
      },
    };
    await getPlayerDigest({ db, userId: "u1" });
    expect(capturedWhere).toBeTruthy();
    expect(capturedWhere.regionId).toBeUndefined();
    expect(capturedWhere.OR).toBeUndefined();
  });
});

// ============================================================
// COACH
// ============================================================

describe("getCoachDigest", () => {
  it("returns empty rows if coach profile not found", async () => {
    const db = {
      coach: { findUnique: async () => null },
      eventApplication: { count: async () => 0 },
      clubMembership: { count: async () => 0 },
      event: { count: async () => 0 },
      message: { count: async () => 0 },
    };
    const result = await getCoachDigest({ db, userId: "u1" });
    expect(result.rows).toEqual([]);
    expect(result.totalCount).toBe(0);
  });

  it("returns empty rows when all counts are zero", async () => {
    const db = {
      coach: { findUnique: async () => ({ id: "co1" }) },
      eventApplication: { count: async () => 0 },
      clubMembership: { count: async () => 0 },
      event: { count: async () => 0 },
      message: { count: async () => 0 },
    };
    const result = await getCoachDigest({ db, userId: "u1" });
    expect(result.rows).toEqual([]);
    expect(result.totalCount).toBe(0);
  });

  it("returns rows in declared order with correct totalCount", async () => {
    // 2 eventApplication.count calls: (1) trainingApplications, (2) attendance48h
    const eventAppCount = countQueue([5, 2]);
    const db = {
      coach: { findUnique: async () => ({ id: "co1" }) },
      eventApplication: { count: eventAppCount },
      clubMembership: { count: async () => 3 },
      event: { count: async () => 4 }, // upcomingWeek
      message: { count: async () => 6 },
    };
    const result = await getCoachDigest({ db, userId: "u1" });
    expect(result.rows.map((r) => r.key)).toEqual([
      "coach.trainingApplications",
      "coach.clubInvitations",
      "coach.attendance48h",
      "coach.upcomingWeek",
      "coach.unreadMessages",
    ]);
    expect(result.rows.map((r) => r.count)).toEqual([5, 3, 2, 4, 6]);
    expect(result.totalCount).toBe(20);
    expect(result.rows.map((r) => r.iconKey)).toEqual([
      "event",
      "invitation",
      "attendance",
      "calendar",
      "message",
    ]);
  });

  it("filters out zero-count rows and preserves order", async () => {
    const eventAppCount = countQueue([0, 1]);
    const db = {
      coach: { findUnique: async () => ({ id: "co1" }) },
      eventApplication: { count: eventAppCount },
      clubMembership: { count: async () => 2 },
      event: { count: async () => 0 },
      message: { count: async () => 3 },
    };
    const result = await getCoachDigest({ db, userId: "u1" });
    expect(result.rows.map((r) => r.key)).toEqual([
      "coach.clubInvitations",
      "coach.attendance48h",
      "coach.unreadMessages",
    ]);
    expect(result.totalCount).toBe(6);
  });
});

// ============================================================
// Shape tests — ensure DigestRow type is honored at runtime
// ============================================================

describe("DigestRow shape", () => {
  it("every returned row has all required string/number fields", async () => {
    const db = {
      coach: { findUnique: async () => ({ id: "co1" }) },
      eventApplication: { count: async () => 1 },
      clubMembership: { count: async () => 1 },
      event: { count: async () => 1 },
      message: { count: async () => 1 },
    };
    const result = await getCoachDigest({ db, userId: "u1" });
    for (const row of result.rows as DigestRow[]) {
      expect(typeof row.key).toBe("string");
      expect(typeof row.count).toBe("number");
      expect(typeof row.label).toBe("string");
      expect(typeof row.href).toBe("string");
      expect(typeof row.iconKey).toBe("string");
    }
  });
});
