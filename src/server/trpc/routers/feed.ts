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
      const [club, player] = await Promise.all([
        ctx.db.club.findUnique({ where: { userId }, select: { regionId: true } }),
        ctx.db.player.findUnique({ where: { userId }, select: { regionId: true } }),
      ]);
      const regionId = club?.regionId ?? player?.regionId ?? null;

      const now = new Date();

      // Fetch recent items in parallel
      const [sparings, events, clubs, players] = await Promise.all([
        ctx.db.sparingOffer.findMany({
          where: {
            status: "OPEN",
            matchDate: { gte: now },
            ...(regionId ? { regionId } : {}),
          },
          include: {
            club: { select: { id: true, name: true, city: true } },
            region: { select: { name: true } },
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
            region: { select: { name: true } },
          },
          orderBy: { createdAt: "desc" },
          take: input.limit,
        }),
        ctx.db.club.findMany({
          where: regionId ? { regionId } : {},
          include: { region: { select: { name: true } } },
          orderBy: { createdAt: "desc" },
          take: 5,
        }),
        ctx.db.player.findMany({
          where: regionId ? { regionId } : {},
          include: { region: { select: { name: true } } },
          orderBy: { createdAt: "desc" },
          take: 5,
        }),
      ]);

      // Merge into unified feed sorted by createdAt
      type FeedItem =
        | { type: "sparing"; data: (typeof sparings)[0]; createdAt: Date }
        | { type: "event"; data: (typeof events)[0]; createdAt: Date }
        | { type: "club"; data: (typeof clubs)[0]; createdAt: Date }
        | { type: "player"; data: (typeof players)[0]; createdAt: Date };

      const items: FeedItem[] = [
        ...sparings.map((s) => ({ type: "sparing" as const, data: s, createdAt: s.createdAt })),
        ...events.map((e) => ({ type: "event" as const, data: e, createdAt: e.createdAt })),
        ...clubs.map((c) => ({ type: "club" as const, data: c, createdAt: c.createdAt })),
        ...players.map((p) => ({ type: "player" as const, data: p, createdAt: p.createdAt })),
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
});
