import { z } from "zod/v4";
import { router, publicProcedure } from "../trpc";

export const regionRouter = router({
  // All regions
  list: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.region.findMany({ orderBy: { name: "asc" } });
  }),

  // League levels for a region
  leagueLevels: publicProcedure
    .input(z.object({ regionId: z.number().int() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.leagueLevel.findMany({
        where: { regionId: input.regionId },
        orderBy: { tier: "asc" },
      });
    }),

  // Groups for a league level
  leagueGroups: publicProcedure
    .input(z.object({ leagueLevelId: z.number().int() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.leagueGroup.findMany({
        where: { leagueLevelId: input.leagueLevelId },
        orderBy: { name: "asc" },
      });
    }),

  // Full hierarchy for a region (for profile form)
  hierarchy: publicProcedure
    .input(z.object({ regionId: z.number().int() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.leagueLevel.findMany({
        where: { regionId: input.regionId },
        include: { groups: { orderBy: { name: "asc" } } },
        orderBy: { tier: "asc" },
      });
    }),

  // Regions with club counts (for directory)
  listWithStats: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.region.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { clubs: true } } },
    });
  }),

  // League levels with club counts (for directory)
  levelsWithStats: publicProcedure
    .input(z.object({ regionId: z.number().int() }))
    .query(async ({ ctx, input }) => {
      const levels = await ctx.db.leagueLevel.findMany({
        where: { regionId: input.regionId },
        orderBy: { tier: "asc" },
        include: {
          groups: {
            include: { _count: { select: { clubs: true } } },
          },
        },
      });

      return levels.map((level) => ({
        id: level.id,
        name: level.name,
        tier: level.tier,
        regionId: level.regionId,
        groupCount: level.groups.length,
        clubCount: level.groups.reduce((sum, g) => sum + g._count.clubs, 0),
      }));
    }),

  // Groups with club counts (for directory)
  groupsWithStats: publicProcedure
    .input(z.object({ leagueLevelId: z.number().int() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.leagueGroup.findMany({
        where: { leagueLevelId: input.leagueLevelId },
        orderBy: { name: "asc" },
        include: { _count: { select: { clubs: true } } },
      });
    }),
});
