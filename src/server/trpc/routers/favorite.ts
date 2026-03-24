import { z } from "zod/v4";
import { router, protectedProcedure, rateLimitedProcedure } from "../trpc";

export const favoriteRouter = router({
  // Toggle favorite for a sparing or event
  toggle: rateLimitedProcedure({ maxAttempts: 30 })
    .input(
      z.object({
        sparingOfferId: z.string().uuid().optional(),
        eventId: z.string().uuid().optional(),
      }).refine((d) => d.sparingOfferId || d.eventId, "Wymagane sparingOfferId lub eventId")
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
        await ctx.db.favorite.create({
          data: { userId, sparingOfferId: input.sparingOfferId },
        });
        return { favorited: true };
      }

      const existing = await ctx.db.favorite.findUnique({
        where: { userId_eventId: { userId, eventId: input.eventId! } },
      });
      if (existing) {
        await ctx.db.favorite.delete({ where: { id: existing.id } });
        return { favorited: false };
      }
      await ctx.db.favorite.create({
        data: { userId, eventId: input.eventId },
      });
      return { favorited: true };
    }),

  // Check if user has favorited specific items
  check: protectedProcedure
    .input(
      z.object({
        sparingOfferIds: z.array(z.string().uuid()).optional(),
        eventIds: z.array(z.string().uuid()).optional(),
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

      return Array.from(favorited);
    }),

  // List user's favorites
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
        },
        take: input.limit + 1,
        ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
        orderBy: { createdAt: "desc" },
      });

      let nextCursor: string | undefined;
      if (items.length > input.limit) {
        nextCursor = items.pop()!.id;
      }

      return { items, nextCursor };
    }),
});
