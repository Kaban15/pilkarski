import { vi, describe, it, expect } from "vitest";
import { awardPoints } from "@/server/award-points";

describe("awardPoints", () => {
  it("creates userPoints with correct data for known action", async () => {
    const mockCreate = vi.fn().mockResolvedValue({});
    const mockDb = { userPoints: { create: mockCreate } };

    await awardPoints(mockDb, "user-123", "sparing_created", "ref-456");

    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        userId: "user-123",
        points: 10,
        action: "sparing_created",
        refId: "ref-456",
      },
    });
  });

  it("resolves without DB call for unknown action", async () => {
    const mockCreate = vi.fn();
    const mockDb = { userPoints: { create: mockCreate } };

    await awardPoints(mockDb, "user-123", "nonexistent_action");

    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("passes undefined refId when not provided", async () => {
    const mockCreate = vi.fn().mockResolvedValue({});
    const mockDb = { userPoints: { create: mockCreate } };

    await awardPoints(mockDb, "user-123", "message_sent");

    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        userId: "user-123",
        points: 2,
        action: "message_sent",
        refId: undefined,
      },
    });
  });
});
