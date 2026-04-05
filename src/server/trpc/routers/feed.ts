import { z } from "zod/v4";
import { router, protectedProcedure } from "../trpc";

export const feedRouter = router({
  // Get feed items from user's region
  get: protectedProcedure
    .input(
      z.object({
        limit: z.number().int().min(1).max(50).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Determine user's region
      const [club, player, coach] = await Promise.all([
        ctx.db.club.findUnique({ where: { userId }, select: { regionId: true } }),
        ctx.db.player.findUnique({ where: { userId }, select: { regionId: true } }),
        ctx.db.coach.findUnique({ where: { userId }, select: { regionId: true } }),
      ]);
      const regionId = club?.regionId ?? player?.regionId ?? coach?.regionId ?? null;

      const now = new Date();

      // Fetch recent items in parallel
      const [sparings, events, transfers, clubs, players, clubPosts, tournaments] = await Promise.all([
        ctx.db.sparingOffer.findMany({
          where: {
            status: "OPEN",
            matchDate: { gte: now },
            ...(regionId ? { regionId } : {}),
          },
          include: {
            club: { select: { id: true, name: true, city: true } },
            region: { select: { name: true, slug: true } },
          },
          orderBy: { createdAt: "desc" },
          take: input.limit,
        }),
        ctx.db.event.findMany({
          where: {
            eventDate: { gte: now },
            ...(regionId ? { regionId } : {}),
          },
          include: {
            club: { select: { id: true, name: true, city: true } },
            region: { select: { name: true, slug: true } },
          },
          orderBy: { createdAt: "desc" },
          take: input.limit,
        }),
        ctx.db.transfer.findMany({
          where: {
            status: "ACTIVE",
            ...(regionId ? { regionId } : {}),
          },
          include: {
            user: { select: { id: true, club: { select: { name: true, city: true } }, player: { select: { firstName: true, lastName: true, city: true } } } },
            region: { select: { name: true, slug: true } },
          },
          orderBy: { createdAt: "desc" },
          take: input.limit,
        }),
        ctx.db.club.findMany({
          where: regionId ? { regionId } : {},
          include: { region: { select: { name: true, slug: true } } },
          orderBy: { createdAt: "desc" },
          take: 5,
        }),
        ctx.db.player.findMany({
          where: regionId ? { regionId } : {},
          include: { region: { select: { name: true, slug: true } } },
          orderBy: { createdAt: "desc" },
          take: 5,
        }),
        ctx.db.clubPost.findMany({
          where: {
            hidden: false,
            OR: [{ expiresAt: null }, { expiresAt: { gte: now } }],
            ...(regionId ? { club: { regionId } } : {}),
          },
          include: {
            club: { select: { id: true, name: true, city: true, logoUrl: true } },
          },
          orderBy: { createdAt: "desc" },
          take: input.limit,
        }),
        ctx.db.tournament.findMany({
          where: {
            status: { in: ["REGISTRATION", "IN_PROGRESS"] },
            ...(regionId ? { regionId } : {}),
          },
          orderBy: { createdAt: "desc" },
          take: 5,
          include: {
            creator: {
              select: {
                id: true,
                club: { select: { name: true } },
                player: { select: { firstName: true, lastName: true } },
                coach: { select: { firstName: true, lastName: true } },
              },
            },
            _count: { select: { teams: true } },
          },
        }),
      ]);

      // Merge into unified feed sorted by createdAt
      type FeedItem =
        | { type: "sparing"; data: (typeof sparings)[0]; createdAt: Date }
        | { type: "event"; data: (typeof events)[0]; createdAt: Date }
        | { type: "transfer"; data: (typeof transfers)[0]; createdAt: Date }
        | { type: "club"; data: (typeof clubs)[0]; createdAt: Date }
        | { type: "player"; data: (typeof players)[0]; createdAt: Date }
        | { type: "clubPost"; data: (typeof clubPosts)[0]; createdAt: Date }
        | { type: "tournament"; data: (typeof tournaments)[0]; createdAt: Date };

      const items: FeedItem[] = [
        ...sparings.map((s) => ({ type: "sparing" as const, data: s, createdAt: s.createdAt })),
        ...events.map((e) => ({ type: "event" as const, data: e, createdAt: e.createdAt })),
        ...transfers.map((t) => ({ type: "transfer" as const, data: t, createdAt: t.createdAt })),
        ...clubs.map((c) => ({ type: "club" as const, data: c, createdAt: c.createdAt })),
        ...players.map((p) => ({ type: "player" as const, data: p, createdAt: p.createdAt })),
        ...clubPosts.map((cp) => ({ type: "clubPost" as const, data: cp, createdAt: cp.createdAt })),
        ...tournaments.map((t) => ({ type: "tournament" as const, data: t, createdAt: t.createdAt })),
      ];

      items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      // Get region name directly if we have a regionId
      let regionName: string | null = null;
      if (regionId) {
        const region = await ctx.db.region.findUnique({ where: { id: regionId }, select: { name: true } });
        regionName = region?.name ?? null;
      }

      return {
        items: items.slice(0, input.limit),
        regionName,
      };
    }),

  // Recruitment events matched to player's profile
  recruitments: protectedProcedure
    .input(
      z.object({
        limit: z.number().int().min(1).max(20).default(5),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      if (ctx.session.user.role === "CLUB") return { items: [], matched: false };

      // PLAYER uses player profile region, COACH uses coach profile region
      let regionId: number | null = null;
      let playerPosition: string | null = null;

      if (ctx.session.user.role === "PLAYER") {
        const player = await ctx.db.player.findUnique({
          where: { userId },
          select: { regionId: true, primaryPosition: true },
        });
        if (!player) return { items: [], matched: false };
        regionId = player.regionId;
        playerPosition = player.primaryPosition;
      } else if (ctx.session.user.role === "COACH") {
        const coach = await ctx.db.coach.findUnique({
          where: { userId },
          select: { regionId: true },
        });
        if (!coach) return { items: [], matched: false };
        regionId = coach.regionId;
      }

      const now = new Date();

      const where: Record<string, unknown> = {
        type: { in: ["RECRUITMENT", "TRYOUT", "CAMP", "CONTINUOUS_RECRUITMENT"] as const },
        eventDate: { gte: now },
      };

      // Filter by region if available
      if (regionId) {
        where.regionId = regionId;
      }

      const items = await ctx.db.event.findMany({
        where,
        include: {
          club: { select: { id: true, name: true, city: true, logoUrl: true } },
          region: { select: { name: true, slug: true } },
        },
        orderBy: { eventDate: "asc" },
        take: input.limit,
      });

      return {
        items,
        matched: !!regionId,
        playerPosition,
      };
    }),

  // Suggested players for club (transfers LOOKING_FOR_CLUB/FREE_AGENT in club's region)
  suggestedPlayers: protectedProcedure
    .input(z.object({ limit: z.number().int().min(1).max(20).default(6) }))
    .query(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "CLUB") return { items: [] };

      const club = await ctx.db.club.findUnique({
        where: { userId: ctx.session.user.id },
        select: { regionId: true },
      });
      if (!club?.regionId) return { items: [] };

      const items = await ctx.db.transfer.findMany({
        where: {
          type: { in: ["LOOKING_FOR_CLUB", "FREE_AGENT"] },
          status: "ACTIVE",
          regionId: club.regionId,
        },
        include: {
          user: {
            include: {
              player: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  photoUrl: true,
                  primaryPosition: true,
                  dateOfBirth: true,
                  city: true,
                },
              },
            },
          },
          region: { select: { name: true, slug: true } },
        },
        orderBy: { createdAt: "desc" },
        take: input.limit,
      });

      return { items };
    }),
});
