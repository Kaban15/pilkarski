import { POINTS_MAP, BADGES, type BadgeCheckStats } from "@/lib/gamification";

const ZERO_STATS: BadgeCheckStats = {
  totalPoints: 0,
  sparingsCreated: 0,
  sparingsMatched: 0,
  eventsCreated: 0,
  reviewsGiven: 0,
  messagesCount: 0,
  applicationsCount: 0,
};

describe("POINTS_MAP", () => {
  it("has 16 actions", () => {
    expect(Object.keys(POINTS_MAP)).toHaveLength(16);
  });

  it("all values are positive integers", () => {
    for (const [action, points] of Object.entries(POINTS_MAP)) {
      expect(points, `${action} should be positive`).toBeGreaterThan(0);
      expect(Number.isInteger(points), `${action} should be integer`).toBe(true);
    }
  });
});

describe("BADGES", () => {
  it("has 9 badges", () => {
    expect(BADGES).toHaveLength(9);
  });

  it("each badge has required fields", () => {
    for (const badge of BADGES) {
      expect(badge.key).toBeTruthy();
      expect(badge.name).toBeTruthy();
      expect(badge.description).toBeTruthy();
      expect(badge.icon).toBeTruthy();
      expect(typeof badge.check).toBe("function");
    }
  });

  it("no badge is earned with zero stats", () => {
    for (const badge of BADGES) {
      expect(badge.check(ZERO_STATS), `${badge.key} should not pass with zero stats`).toBe(false);
    }
  });

  const cases: Array<{ key: string; stats: Partial<BadgeCheckStats> }> = [
    { key: "first_sparing", stats: { sparingsCreated: 1 } },
    { key: "sparing_master", stats: { sparingsCreated: 10 } },
    { key: "matchmaker", stats: { sparingsMatched: 5 } },
    { key: "event_organizer", stats: { eventsCreated: 5 } },
    { key: "reviewer", stats: { reviewsGiven: 3 } },
    { key: "communicator", stats: { messagesCount: 50 } },
    { key: "active_player", stats: { totalPoints: 100 } },
    { key: "veteran", stats: { totalPoints: 500 } },
    { key: "applicant", stats: { applicationsCount: 10 } },
  ];

  for (const { key, stats } of cases) {
    it(`${key} is earned with sufficient stats`, () => {
      const badge = BADGES.find((b) => b.key === key)!;
      expect(badge).toBeDefined();
      expect(badge.check({ ...ZERO_STATS, ...stats })).toBe(true);
    });
  }
});
