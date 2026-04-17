import { z } from "zod/v4";
import { router, protectedProcedure, publicProcedure } from "../trpc";
import { updateClubSchema } from "@/lib/validators/profile";
import { TRPCError } from "@trpc/server";
import { computeReputation, REPUTATION_THRESHOLDS } from "@/lib/reputation";

function getMatchTier(
  club: { regionId: number | null; leagueGroup: { leagueLevelId: number } | null },
  targetLevelId: number | undefined | null,
  targetRegionId: number | undefined | null,
): number {
  const sameLevel = targetLevelId != null && club.leagueGroup?.leagueLevelId === targetLevelId;
  const sameRegion = targetRegionId != null && club.regionId === targetRegionId;
  if (sameLevel && sameRegion) return 1;
  if (sameLevel) return 2;
  if (sameRegion) return 3;
  return 4;
}

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
        leagueLevelId: z.number().int().optional(),
        leagueGroupId: z.number().int().optional(),
        search: z.string().max(100).optional(),
        cursor: z.string().uuid().optional(),
        limit: z.number().int().min(1).max(50).default(20),
        prioritizeForClubId: z.string().uuid().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: Record<string, unknown> = {};
      if (input.regionId) where.regionId = input.regionId;
      if (input.leagueGroupId) {
        where.leagueGroupId = input.leagueGroupId;
      } else if (input.leagueLevelId) {
        where.leagueGroup = { leagueLevelId: input.leagueLevelId };
      }
      if (input.search) {
        where.name = { contains: input.search, mode: "insensitive" };
      }
      if (input.prioritizeForClubId) {
        where.id = { not: input.prioritizeForClubId };
      }

      let clubs = await ctx.db.club.findMany({
        where: Object.keys(where).length > 0 ? where : undefined,
        include: { region: true, leagueGroup: { include: { leagueLevel: true } } },
        take: input.limit + 1,
        ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
        orderBy: { createdAt: "desc" },
      });

      // Priority sorting: same league level + region first
      if (input.prioritizeForClubId && !input.cursor) {
        const myClub = await ctx.db.club.findUnique({
          where: { id: input.prioritizeForClubId },
          include: { leagueGroup: { include: { leagueLevel: true } } },
        });
        if (myClub) {
          const myLevelId = myClub.leagueGroup?.leagueLevelId;
          const myRegionId = myClub.regionId;

          clubs.sort((a, b) => {
            const aTier = getMatchTier(a, myLevelId, myRegionId);
            const bTier = getMatchTier(b, myLevelId, myRegionId);
            if (aTier !== bTier) return aTier - bTier;
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          });
        }
      }

      let nextCursor: string | undefined;
      if (clubs.length > input.limit) {
        const last = clubs.pop();
        if (last) nextCursor = last.id;
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

  reputation: publicProcedure
    .input(z.object({ clubId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const since = new Date(Date.now() - REPUTATION_THRESHOLDS.windowDays * 24 * 60 * 60 * 1000);

      const [receivedApps, ownedOffers] = await Promise.all([
        ctx.db.sparingApplication.findMany({
          where: {
            sparingOffer: { clubId: input.clubId },
            createdAt: { gte: since },
          },
          select: { status: true, createdAt: true, updatedAt: true },
        }),
        ctx.db.sparingOffer.findMany({
          where: {
            clubId: input.clubId,
            matchDate: { gte: since },
            status: { in: ["COMPLETED", "CANCELLED"] },
          },
          select: {
            status: true,
            applications: {
              where: { status: "ACCEPTED" },
              select: { id: true },
              take: 1,
            },
          },
        }),
      ]);

      return computeReputation({
        receivedApps,
        ownedOffers: ownedOffers.map((o) => ({
          status: o.status,
          hadAcceptedApp: o.applications.length > 0,
        })),
      });
    }),

  newInRegion: protectedProcedure
    .input(z.object({ limit: z.number().int().min(1).max(10).default(4) }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const player = await ctx.db.player.findUnique({
        where: { userId },
        select: { regionId: true, primaryPosition: true },
      });
      if (!player?.regionId) return { items: [], regionName: null };

      const following = await ctx.db.clubFollower.findMany({
        where: { userId },
        select: { clubId: true },
      });
      const followedIds = following.map((f) => f.clubId);

      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const now = new Date();

      const candidates = await ctx.db.club.findMany({
        where: {
          regionId: player.regionId,
          ...(followedIds.length > 0 ? { id: { notIn: followedIds } } : {}),
          userId: { not: userId },
        },
        include: {
          region: { select: { name: true, slug: true } },
          leagueGroup: { include: { leagueLevel: { select: { name: true } } } },
          _count: { select: { followers: true } },
          sparingOffers: {
            where: { createdAt: { gte: thirtyDaysAgo } },
            select: { id: true },
            take: 1,
          },
          events: {
            where: {
              eventDate: { gte: now },
              type: { in: ["RECRUITMENT", "TRYOUT", "CONTINUOUS_RECRUITMENT"] },
              ...(player.primaryPosition
                ? { OR: [{ targetPosition: player.primaryPosition }, { targetPosition: null }] }
                : {}),
            },
            select: { id: true, targetPosition: true },
            take: 1,
          },
        },
        take: 30,
      });

      const scored = candidates
        .map((c) => {
          const isNew = c.createdAt >= thirtyDaysAgo;
          const isActive = c.sparingOffers.length > 0;
          const isRecruiting = c.events.length > 0;
          const matchesPosition =
            player.primaryPosition != null &&
            c.events.some((e) => e.targetPosition === player.primaryPosition);

          const reasons: { key: string; label: string }[] = [];
          if (matchesPosition) reasons.push({ key: "position", label: "Szuka Twojej pozycji" });
          else if (isRecruiting) reasons.push({ key: "recruiting", label: "Rekrutuje" });
          if (isActive) reasons.push({ key: "active", label: "Aktywny klub" });
          if (isNew) reasons.push({ key: "new", label: "Nowy w regionie" });

          const score =
            (matchesPosition ? 8 : 0) +
            (isRecruiting ? 4 : 0) +
            (isActive ? 2 : 0) +
            (isNew ? 1 : 0) +
            c._count.followers * 0.1;

          return { club: c, reasons, score };
        })
        .filter((x) => x.reasons.length > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, input.limit);

      return {
        regionName: candidates[0]?.region?.name ?? null,
        items: scored.map((s) => ({
          ...s.club,
          sparingOffers: undefined as never,
          events: undefined as never,
          reasons: s.reasons,
        })),
      };
    }),
});
