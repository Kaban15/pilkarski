import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/server/db/client", () => ({
  db: {},
}));

vi.mock("@/server/auth/config", () => ({
  auth: vi.fn(() => Promise.resolve(null)),
}));

vi.mock("@/lib/rate-limit", () => ({
  isRateLimited: vi.fn(() => false),
}));

vi.mock("bcryptjs", () => ({
  default: { hash: vi.fn(() => Promise.resolve("$2a$12$hashed")) },
}));

vi.mock("@/env", () => ({
  env: {
    DATABASE_URL: "postgresql://test",
    NEXTAUTH_SECRET: "test-secret",
    NEXT_PUBLIC_SUPABASE_URL: "https://test.supabase.co",
    SUPABASE_SERVICE_ROLE_KEY: "test-key",
  },
}));

import { isRateLimited } from "@/lib/rate-limit";
import { createMockUser } from "../factories";

function createMockDb() {
  return {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  };
}

async function getRouter() {
  const { authRouter } = await import("@/server/trpc/routers/auth");
  return authRouter;
}

describe("authRouter.register", () => {
  let mockDb: ReturnType<typeof createMockDb>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockDb = createMockDb();
  });

  it("rejects duplicate email with CONFLICT", async () => {
    mockDb.user.findUnique.mockResolvedValue(createMockUser());

    const router = await getRouter();
    const caller = router.createCaller({ db: mockDb as never, session: null });

    await expect(
      caller.register({
        email: "test@example.com",
        password: "password123",
        role: "PLAYER",
        firstName: "Jan",
        lastName: "Kowalski",
      }),
    ).rejects.toThrow("Konto z tym adresem e-mail już istnieje");
  });

  it("creates CLUB user with club profile", async () => {
    mockDb.user.findUnique.mockResolvedValue(null);
    mockDb.user.create.mockResolvedValue(createMockUser({ id: "new-user" }));

    const router = await getRouter();
    const caller = router.createCaller({ db: mockDb as never, session: null });

    const result = await caller.register({
      email: "club@example.com",
      password: "password123",
      role: "CLUB",
      clubName: "Nowy Klub FC",
    });

    expect(result).toEqual({ success: true, userId: "new-user" });
    expect(mockDb.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: "club@example.com",
          role: "CLUB",
          club: { create: { name: "Nowy Klub FC" } },
        }),
      }),
    );
  });

  it("creates PLAYER user with player profile", async () => {
    mockDb.user.findUnique.mockResolvedValue(null);
    mockDb.user.create.mockResolvedValue(createMockUser({ id: "new-player" }));

    const router = await getRouter();
    const caller = router.createCaller({ db: mockDb as never, session: null });

    const result = await caller.register({
      email: "player@example.com",
      password: "password123",
      role: "PLAYER",
      firstName: "Jan",
      lastName: "Kowalski",
    });

    expect(result).toEqual({ success: true, userId: "new-player" });
    expect(mockDb.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          role: "PLAYER",
          player: { create: { firstName: "Jan", lastName: "Kowalski" } },
        }),
      }),
    );
  });

  it("rejects when rate limited", async () => {
    vi.mocked(isRateLimited).mockReturnValue(true);

    const router = await getRouter();
    const caller = router.createCaller({ db: mockDb as never, session: null });

    await expect(
      caller.register({
        email: "test@example.com",
        password: "password123",
        role: "PLAYER",
        firstName: "Jan",
        lastName: "Kowalski",
      }),
    ).rejects.toThrow("Zbyt wiele prób rejestracji");
  });
});
