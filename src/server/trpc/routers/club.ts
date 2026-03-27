import { z } from "zod/v4";
import { router, protectedProcedure, publicProcedure } from "../trpc";
import { updateClubSchema } from "@/lib/validators/profile";
import { TRPCError } from "@trpc/server";

export const clubRouter = router({
  // Get own club profile
  me: protectedProcedure.query(async ({ ctx }) => {
    const club = await ctx.db.club.findUnique({
      where: { userId: ctx.session.user.id },
      include: { region: true, leagueGroup: { include: { leagueLevel: true } } },
    });
    if (!club) throw new TRPCError({ code: "NOT_FOUND", message: "Profil klubu nie znaleziony" });
    return club;
  }),

  // Get club by ID (public)
  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const club = await ctx.db.club.findUnique({
        where: { id: input.id },
        include: { region: true, leagueGroup: { include: { leagueLevel: true } } },
      });
      if (!club) throw new TRPCError({ code: "NOT_FOUND" });
      return club;
    }),

  // Update own club profile
  update: protectedProcedure
    .input(updateClubSchema)
    .mutation(async ({ ctx, input }) => {
      const club = await ctx.db.club.findUnique({
        where: { userId: ctx.session.user.id },
      });
      if (!club) throw new TRPCError({ code: "NOT_FOUND" });

      return ctx.db.club.update({
        where: { id: club.id },
        data: input,
      });
    }),

  // List clubs (with optional region filter)
  list: publicProcedure
    .input(
      z.object({
        regionId: z.number().int().optional(),
        leagueGroupId: z.number().int().optional(),
        search: z.string().max(100).optional(),
        cursor: z.string().uuid().optional(),
        limit: z.number().int().min(1).max(50).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: Record<string, unknown> = {};
      if (input.regionId) where.regionId = input.regionId;
      if (input.leagueGroupId) where.leagueGroupId = input.leagueGroupId;
      if (input.search) {
        where.name = { contains: input.search, mode: "insensitive" };
      }

      const clubs = await ctx.db.club.findMany({
        where: Object.keys(where).length > 0 ? where : undefined,
        include: { region: true, leagueGroup: { include: { leagueLevel: true } } },
        take: input.limit + 1,
        ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
        orderBy: { createdAt: "desc" },
      });

      let nextCursor: string | undefined;
      if (clubs.length > input.limit) {
        const next = clubs.pop()!;
        nextCursor = next.id;
      }

      return { clubs, nextCursor };
    }),

  // Follow a club
  follow: protectedProcedure
    .input(z.object({ clubId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Prevent following own club
      const ownClub = await ctx.db.club.findUnique({
        where: { userId: ctx.session.user.id },
        select: { id: true },
      });
      if (ownClub?.id === input.clubId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Nie możesz obserwować własnego klubu" });
      }

      // Check club exists
      const club = await ctx.db.club.findUnique({ where: { id: input.clubId } });
      if (!club) throw new TRPCError({ code: "NOT_FOUND" });

      // Upsert — idempotent
      await ctx.db.clubFollower.upsert({
        where: {
          userId_clubId: {
            userId: ctx.session.user.id,
            clubId: input.clubId,
          },
        },
        create: {
          userId: ctx.session.user.id,
          clubId: input.clubId,
        },
        update: {},
      });

      return { following: true };
    }),

  // Unfollow a club
  unfollow: protectedProcedure
    .input(z.object({ clubId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.clubFollower.deleteMany({
        where: {
          userId: ctx.session.user.id,
          clubId: input.clubId,
        },
      });

      return { following: false };
    }),

  // Check if following a club
  isFollowing: protectedProcedure
    .input(z.object({ clubId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const record = await ctx.db.clubFollower.findUnique({
        where: {
          userId_clubId: {
            userId: ctx.session.user.id,
            clubId: input.clubId,
          },
        },
      });
      return !!record;
    }),

  // Get follower count for a club
  followerCount: publicProcedure
    .input(z.object({ clubId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.clubFollower.count({
        where: { clubId: input.clubId },
      });
    }),

  newInRegion: protectedProcedure
    .input(z.object({ limit: z.number().int().min(1).max(10).default(4) }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Get player's region
      const player = await ctx.db.player.findUnique({
        where: { userId },
        select: { regionId: true },
      });
      if (!player?.regionId) return { items: [] };

      // Get clubs player already follows
      const following = await ctx.db.clubFollower.findMany({
        where: { userId },
        select: { clubId: true },
      });
      const followedIds = following.map((f) => f.clubId);

      // Find recent clubs in region not followed
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const items = await ctx.db.club.findMany({
        where: {
          regionId: player.regionId,
          createdAt: { gte: thirtyDaysAgo },
          ...(followedIds.length > 0 ? { id: { notIn: followedIds } } : {}),
          userId: { not: userId },
        },
        include: {
          region: { select: { name: true } },
          _count: { select: { followers: true } },
        },
        orderBy: { createdAt: "desc" },
        take: input.limit,
      });

      return { items };
    }),
});
