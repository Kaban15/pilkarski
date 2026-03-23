import { POINTS_MAP } from "@/lib/gamification";

/**
 * Award points to a user (fire-and-forget).
 * Call with .catch(() => {}) to not block the response.
 */
export function awardPoints(
  db: any,
  userId: string,
  action: string,
  refId?: string
) {
  const points = POINTS_MAP[action];
  if (!points) return Promise.resolve();

  return db.userPoints.create({
    data: { userId, points, action, refId },
  });
}
