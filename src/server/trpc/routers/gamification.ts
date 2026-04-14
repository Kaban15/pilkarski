import { z } from "zod/v4";
import { router, protectedProcedure, publicProcedure } from "../trpc";
import { BADGES, type BadgeCheckStats } from "@/lib/gamification";
import {
  aggregateDailyCounts,
  computeStreaks,
  computeBestMonth,
  computeBestDow,
} from "@/lib/activity-utils";

export const gamificationRouter = router({
  // Get current user's total points and recent point history
  myPoints: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const [totalResult, recent] = await Promise.all([
      ctx.db.userPoints.aggregate({
        where: { userId },
        _sum: { points: true },
      }),
      ctx.db.userPoints.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
    ]);

    return {
      total: totalResult._sum.points ?? 0,
      recent,
    };
  }),

  // Get current user's badges
  myBadges: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.userBadge.findMany({
      where: { userId: ctx.session.user.id },
      orderBy: { awardedAt: "desc" },
    });
  }),

  // Check and award new badges for current user
  checkBadges: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const [totalResult, existingBadges, stats] = await Promise.all([
      ctx.db.userPoints.aggregate({ where: { userId }, _sum: { points: true } }),
      ctx.db.userBadge.findMany({ where: { userId }, select: { badge: true } }),
      getStats(ctx.db, userId),
    ]);

    const existing = new Set(existingBadges.map((b) => b.badge));
    const checkStats: BadgeCheckStats = {
      totalPoints: totalResult._sum.points ?? 0,
      ...stats,
    };

    const newBadges: string[] = [];
    for (const badge of BADGES) {
      if (!existing.has(badge.key) && badge.check(checkStats)) {
        await ctx.db.userBadge.create({
          data: { userId, badge: badge.key },
        });
        newBadges.push(badge.key);
      }
    }

    return newBadges;
  }),

  // Leaderboard — top users by total points
  leaderboard: publicProcedure
    .input(z.object({ limit: z.number().int().min(1).max(50).default(20) }))
    .query(async ({ ctx, input }) => {
      // Aggregate points per user
      const grouped = await ctx.db.userPoints.groupBy({
        by: ["userId"],
        _sum: { points: true },
        orderBy: { _sum: { points: "desc" } },
        take: input.limit,
      });

      if (grouped.length === 0) return [];

      const userIds = grouped.map((g) => g.userId);
      const users = await ctx.db.user.findMany({
        where: { id: { in: userIds } },
        include: {
          club: { select: { id: true, name: true, logoUrl: true } },
          player: { select: { id: true, firstName: true, lastName: true, photoUrl: true } },
        },
      });

      const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

      // Count badges per user
      const badgeCounts = await ctx.db.userBadge.groupBy({
        by: ["userId"],
        where: { userId: { in: userIds } },
        _count: true,
      });
      const badgeMap = Object.fromEntries(badgeCounts.map((b) => [b.userId, b._count]));

      return grouped.map((g) => {
        const user = userMap[g.userId];
        return {
          userId: g.userId,
          points: g._sum.points ?? 0,
          badges: badgeMap[g.userId] ?? 0,
          name: user?.club?.name
            ?? (user?.player ? `${user.player.firstName} ${user.player.lastName}` : "Nieznany"),
          avatar: user?.club?.logoUrl ?? user?.player?.photoUrl ?? null,
          role: user?.role ?? "CLUB",
          profileId: user?.club?.id ?? user?.player?.id ?? null,
        };
      });
    }),

  // Activity heatmap for public profiles
  activityHeatmap: publicProcedure
    .input(z.object({ userId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

      const entries = await ctx.db.userPoints.findMany({
        where: {
          userId: input.userId,
          createdAt: { gte: oneYearAgo },
        },
        select: { createdAt: true },
        orderBy: { createdAt: "asc" },
      });

      const dailyCounts = aggregateDailyCounts(entries);
      const { currentStreak, longestStreak } = computeStreaks(dailyCounts, new Date());
      const bestMonth = computeBestMonth(entries);
      const bestDow = computeBestDow(entries);

      return {
        dailyCounts,
        totalActions: entries.length,
        activeDays: Object.keys(dailyCounts).length,
        currentStreak,
        longestStreak,
        bestMonth,
        bestDow,
      };
    }),
});

async function getStats(db: any, userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: { club: true, player: true },
  });

  if (user?.club) {
    const [sparingsCreated, sparingsMatched, eventsCreated, reviewsGiven, messagesCount, applicationsCount] = await Promise.all([
      db.sparingOffer.count({ where: { clubId: user.club.id } }),
      db.sparingOffer.count({ where: { clubId: user.club.id, status: { in: ["MATCHED", "COMPLETED"] } } }),
      db.event.count({ where: { clubId: user.club.id } }),
      db.review.count({ where: { reviewerClubId: user.club.id } }),
      db.message.count({ where: { senderId: userId } }),
      db.sparingApplication.count({ where: { sparingOffer: { clubId: user.club.id } } }),
    ]);
    return { sparingsCreated, sparingsMatched, eventsCreated, reviewsGiven, messagesCount, applicationsCount };
  }

  if (user?.player) {
    const [messagesCount, applicationsCount] = await Promise.all([
      db.message.count({ where: { senderId: userId } }),
      db.eventApplication.count({ where: { playerId: user.player.id } }),
    ]);
    return { sparingsCreated: 0, sparingsMatched: 0, eventsCreated: 0, reviewsGiven: 0, messagesCount, applicationsCount };
  }

  return { sparingsCreated: 0, sparingsMatched: 0, eventsCreated: 0, reviewsGiven: 0, messagesCount: 0, applicationsCount: 0 };
}
