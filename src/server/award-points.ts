import type { PrismaClient } from "@/generated/prisma/client";
import { POINTS_MAP } from "@/lib/gamification";

/**
 * Award points to a user (fire-and-forget).
 * Fire-and-forget — callers should use .catch(err => console.error(...)).
 */
export function awardPoints(
  db: Pick<PrismaClient, "userPoints">,
  userId: string,
  action: string,
  refId?: string,
) {
  const points = POINTS_MAP[action];
  if (!points) return Promise.resolve();

  return db.userPoints.create({
    data: { userId, points, action, refId },
  });
}
