import { z } from "zod/v4";
import { router, publicProcedure } from "../trpc";

export const searchRouter = router({
  global: publicProcedure
    .input(
      z.object({
        query: z.string().min(1).max(100),
        limit: z.number().int().min(1).max(20).default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      const [clubs, players, sparings, events] = await Promise.all([
        ctx.db.club.findMany({
          where: {
            OR: [
              { name: { contains: input.query, mode: "insensitive" } },
              { city: { contains: input.query, mode: "insensitive" } },
            ],
          },
          include: {
            region: { select: { name: true, slug: true } },
            leagueGroup: {
              include: { leagueLevel: { select: { id: true, name: true } } },
            },
          },
          take: input.limit,
          orderBy: { name: "asc" },
        }),
        ctx.db.player.findMany({
          where: {
            OR: [
              { firstName: { contains: input.query, mode: "insensitive" } },
              { lastName: { contains: input.query, mode: "insensitive" } },
              { city: { contains: input.query, mode: "insensitive" } },
            ],
          },
          include: { region: { select: { name: true } } },
          take: input.limit,
          orderBy: { lastName: "asc" },
        }),
        ctx.db.sparingOffer.findMany({
          where: {
            status: "OPEN",
            OR: [
              { title: { contains: input.query, mode: "insensitive" } },
              { location: { contains: input.query, mode: "insensitive" } },
            ],
          },
          include: {
            club: { select: { name: true } },
            region: { select: { name: true } },
          },
          take: input.limit,
          orderBy: { matchDate: "asc" },
        }),
        ctx.db.event.findMany({
          where: {
            eventDate: { gte: new Date() },
            OR: [
              { title: { contains: input.query, mode: "insensitive" } },
              { location: { contains: input.query, mode: "insensitive" } },
            ],
          },
          include: {
            club: { select: { name: true } },
            region: { select: { name: true } },
          },
          take: input.limit,
          orderBy: { eventDate: "asc" },
        }),
      ]);

      return { clubs, players, sparings, events };
    }),
});
