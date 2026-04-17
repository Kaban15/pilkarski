import { describe, it, expect, vi } from "vitest";

vi.mock("@/server/db/client", () => ({ db: {} }));
vi.mock("@/server/auth/config", () => ({
  auth: vi.fn(() => Promise.resolve(null)),
}));
vi.mock("@/lib/rate-limit", () => ({
  isRateLimited: vi.fn(() => false),
}));
vi.mock("@/env", () => ({
  env: {
    DATABASE_URL: "postgresql://test",
    NEXTAUTH_SECRET: "test-secret",
    NEXT_PUBLIC_SUPABASE_URL: "https://test.supabase.co",
    SUPABASE_SERVICE_ROLE_KEY: "test-key",
  },
}));

import { digestRouter } from "@/server/trpc/routers/digest";

type Role = "CLUB" | "PLAYER" | "COACH";

function makeCtx(role: Role, dbOverrides: Record<string, unknown> = {}) {
  return {
    session: { user: { id: "u1", role } },
    db: {
      club: { findUnique: async () => ({ id: "c1" }) },
      player: {
        findUnique: async () => ({ id: "p1", regionId: null, primaryPosition: null }),
      },
      coach: { findUnique: async () => ({ id: "co1" }) },
      eventApplication: { count: async () => 0 },
      sparingApplication: { count: async () => 0 },
      sparingInvitation: { count: async () => 0 },
      sparingOffer: { count: async () => 0 },
      event: { count: async () => 0 },
      recruitmentPipeline: { count: async () => 0 },
      clubMembership: { count: async () => 0 },
      message: { count: async () => 0 },
      ...dbOverrides,
    },
  } as never;
}

describe("digestRouter.get", () => {
  it("returns CLUB digest with zero counts -> empty rows", async () => {
    const caller = digestRouter.createCaller(makeCtx("CLUB"));
    const res = await caller.get();

    expect(res.role).toBe("CLUB");
    expect(typeof res.totalCount).toBe("number");
    expect(res.totalCount).toBe(0);
    expect(Array.isArray(res.rows)).toBe(true);
    expect(res.rows).toEqual([]);
  });

  it("returns PLAYER digest shape", async () => {
    const caller = digestRouter.createCaller(makeCtx("PLAYER"));
    const res = await caller.get();

    expect(res.role).toBe("PLAYER");
    expect(typeof res.totalCount).toBe("number");
    expect(Array.isArray(res.rows)).toBe(true);
  });

  it("returns COACH digest shape", async () => {
    const caller = digestRouter.createCaller(makeCtx("COACH"));
    const res = await caller.get();

    expect(res.role).toBe("COACH");
    expect(typeof res.totalCount).toBe("number");
    expect(Array.isArray(res.rows)).toBe(true);
  });

  it("CLUB happy-path: sparingApplication.count=3 surfaces a non-zero row", async () => {
    const caller = digestRouter.createCaller(
      makeCtx("CLUB", {
        sparingApplication: { count: async () => 3 },
      }),
    );
    const res = await caller.get();

    expect(res.role).toBe("CLUB");
    expect(res.totalCount).toBe(3);
    expect(res.rows).toHaveLength(1);
    expect(res.rows[0]?.key).toBe("club.pendingSparingApplications");
    expect(res.rows[0]?.count).toBe(3);
  });
});
