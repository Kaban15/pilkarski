import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("@/server/db/client", () => ({
  db: {
    clubMembership: {
      findUnique: vi.fn(),
    },
  },
}));

import { isClubMember } from "@/server/is-club-member";
import { db } from "@/server/db/client";

const mockFindUnique = db.clubMembership.findUnique as ReturnType<typeof vi.fn>;

beforeEach(() => {
  mockFindUnique.mockReset();
});

describe("isClubMember", () => {
  it("returns true for ACCEPTED membership", async () => {
    mockFindUnique.mockResolvedValue({ status: "ACCEPTED" });
    const result = await isClubMember("user-1", "club-1");
    expect(result).toBe(true);
    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { clubId_memberUserId: { clubId: "club-1", memberUserId: "user-1" } },
      select: { status: true },
    });
  });

  it("returns false for PENDING membership", async () => {
    mockFindUnique.mockResolvedValue({ status: "PENDING" });
    expect(await isClubMember("user-1", "club-1")).toBe(false);
  });

  it("returns false when membership not found", async () => {
    mockFindUnique.mockResolvedValue(null);
    expect(await isClubMember("user-1", "club-1")).toBe(false);
  });
});
