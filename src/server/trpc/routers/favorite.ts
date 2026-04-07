import { z } from "zod/v4";
import { router, protectedProcedure, rateLimitedProcedure } from "../trpc";

export const favoriteRouter = router({
  toggle: rateLimitedProcedure({ maxAttempts: 30 })
    .input(
      z.object({
        sparingOfferId: z.string().uuid().optional(),
        eventId: z.string().uuid().optional(),
        clubPostId: z.string().uuid().optional(),
      }).refine((d) => d.sparingOfferId || d.eventId || d.clubPostId, "Wymagane sparingOfferId, eventId lub clubPostId")
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      if (input.sparingOfferId) {
        const existing = await ctx.db.favorite.findUnique({
          where: { userId_sparingOfferId: { userId, sparingOfferId: input.sparingOfferId } },
        });
        if (existing) {
          await ctx.db.favorite.delete({ where: { id: existing.id } });
          return { favorited: false };
        }
        await ctx.db.favorite.create({ data: { userId, sparingOfferId: input.sparingOfferId } });
        return { favorited: true };
      }

      if (input.eventId) {
        const existing = await ctx.db.favorite.findUnique({
          where: { userId_eventId: { userId, eventId: input.eventId } },
        });
        if (existing) {
          await ctx.db.favorite.delete({ where: { id: existing.id } });
          return { favorited: false };
        }
        await ctx.db.favorite.create({ data: { userId, eventId: input.eventId } });
        return { favorited: true };
      }

      // clubPostId
      const existing = await ctx.db.favorite.findUnique({
        where: { userId_clubPostId: { userId, clubPostId: input.clubPostId! } },
      });
      if (existing) {
        await ctx.db.favorite.delete({ where: { id: existing.id } });
        return { favorited: false };
      }
      await ctx.db.favorite.create({ data: { userId, clubPostId: input.clubPostId } });
      return { favorited: true };
    }),

  check: protectedProcedure
    .input(
      z.object({
        sparingOfferIds: z.array(z.string().uuid()).optional(),
        eventIds: z.array(z.string().uuid()).optional(),
        clubPostIds: z.array(z.string().uuid()).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const favorited = new Set<string>();

      if (input.sparingOfferIds?.length) {
        const favs = await ctx.db.favorite.findMany({
          where: { userId, sparingOfferId: { in: input.sparingOfferIds } },
          select: { sparingOfferId: true },
        });
        favs.forEach((f) => f.sparingOfferId && favorited.add(f.sparingOfferId));
      }

      if (input.eventIds?.length) {
        const favs = await ctx.db.favorite.findMany({
          where: { userId, eventId: { in: input.eventIds } },
          select: { eventId: true },
        });
        favs.forEach((f) => f.eventId && favorited.add(f.eventId));
      }

      if (input.clubPostIds?.length) {
        const favs = await ctx.db.favorite.findMany({
          where: { userId, clubPostId: { in: input.clubPostIds } },
          select: { clubPostId: true },
        });
        favs.forEach((f) => f.clubPostId && favorited.add(f.clubPostId));
      }

      return Array.from(favorited);
    }),

  list: protectedProcedure
    .input(
      z.object({
        cursor: z.string().uuid().optional(),
        limit: z.number().int().min(1).max(50).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const items = await ctx.db.favorite.findMany({
        where: { userId: ctx.session.user.id },
        include: {
          sparingOffer: {
            include: {
              club: { select: { id: true, name: true, city: true, logoUrl: true } },
              region: true,
            },
          },
          event: {
            include: {
              club: { select: { id: true, name: true, city: true, logoUrl: true } },
              region: true,
            },
          },
          clubPost: {
            include: {
              club: { select: { id: true, name: true, city: true, logoUrl: true } },
            },
          },
        },
        take: input.limit + 1,
        ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
        orderBy: { createdAt: "desc" },
      });

      // Filter out hidden club posts
      const filtered = items.filter((item) => {
        if (item.clubPost && item.clubPost.hidden) return false;
        return true;
      });

      let nextCursor: string | undefined;
      if (filtered.length > input.limit) {
        const last = filtered.pop();
        if (last) nextCursor = last.id;
      }

      return { items: filtered, nextCursor };
    }),
});
