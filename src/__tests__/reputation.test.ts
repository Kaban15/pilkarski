import {
  computeReputation,
  formatResponseTime,
  formatRate,
  REPUTATION_THRESHOLDS,
} from "@/lib/reputation";

const now = new Date("2026-04-17T12:00:00Z");
const hoursAgo = (h: number) => new Date(now.getTime() - h * 60 * 60 * 1000);

describe("computeReputation — response", () => {
  it("returns null rate when sample below threshold", () => {
    const r = computeReputation({
      receivedApps: [{ status: "ACCEPTED", createdAt: hoursAgo(2), updatedAt: now }],
      ownedOffers: [],
    });
    expect(r.responseRate).toBeNull();
    expect(r.responseSample).toBe(1);
  });

  it("computes response rate as responded/total", () => {
    const r = computeReputation({
      receivedApps: [
        { status: "ACCEPTED", createdAt: hoursAgo(3), updatedAt: hoursAgo(2) },
        { status: "REJECTED", createdAt: hoursAgo(5), updatedAt: hoursAgo(4) },
        { status: "COUNTER_PROPOSED", createdAt: hoursAgo(7), updatedAt: hoursAgo(6) },
        { status: "PENDING", createdAt: hoursAgo(1), updatedAt: hoursAgo(1) },
      ],
      ownedOffers: [],
    });
    expect(r.responseRate).toBe(0.75);
    expect(r.avgResponseMs).toBe(60 * 60 * 1000);
  });

  it("avgResponseMs null when nothing responded", () => {
    const r = computeReputation({
      receivedApps: Array(REPUTATION_THRESHOLDS.minResponseSample).fill({
        status: "PENDING" as const,
        createdAt: hoursAgo(2),
        updatedAt: hoursAgo(2),
      }),
      ownedOffers: [],
    });
    expect(r.responseRate).toBe(0);
    expect(r.avgResponseMs).toBeNull();
  });
});

describe("computeReputation — fulfilment", () => {
  it("returns null when sample below threshold", () => {
    const r = computeReputation({
      receivedApps: [],
      ownedOffers: [
        { status: "COMPLETED", hadAcceptedApp: true },
        { status: "CANCELLED", hadAcceptedApp: true },
      ],
    });
    expect(r.fulfilmentRate).toBeNull();
    expect(r.fulfilmentSample).toBe(2);
  });

  it("ignores CANCELLED without accepted app", () => {
    const r = computeReputation({
      receivedApps: [],
      ownedOffers: [
        { status: "COMPLETED", hadAcceptedApp: true },
        { status: "COMPLETED", hadAcceptedApp: true },
        { status: "CANCELLED", hadAcceptedApp: false },
      ],
    });
    expect(r.fulfilmentSample).toBe(2);
    expect(r.fulfilmentRate).toBeNull();
  });

  it("computes completed / (completed + cancelled-with-match)", () => {
    const r = computeReputation({
      receivedApps: [],
      ownedOffers: [
        { status: "COMPLETED", hadAcceptedApp: true },
        { status: "COMPLETED", hadAcceptedApp: true },
        { status: "COMPLETED", hadAcceptedApp: true },
        { status: "CANCELLED", hadAcceptedApp: true },
      ],
    });
    expect(r.fulfilmentRate).toBe(0.75);
  });
});

describe("formatters", () => {
  it("formatResponseTime min/h/days", () => {
    expect(formatResponseTime(30 * 60 * 1000)).toBe("30 min");
    expect(formatResponseTime(3 * 60 * 60 * 1000)).toBe("3 h");
    expect(formatResponseTime(3 * 24 * 60 * 60 * 1000)).toBe("3 dni");
    expect(formatResponseTime(null)).toBeNull();
  });

  it("formatRate rounds to integer percent", () => {
    expect(formatRate(0.756)).toBe("76%");
    expect(formatRate(1)).toBe("100%");
    expect(formatRate(null)).toBeNull();
  });
});
