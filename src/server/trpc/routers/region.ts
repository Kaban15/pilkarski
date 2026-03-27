import { z } from "zod/v4";
import { router, publicProcedure } from "../trpc";

/** Sort group names numerically: "Grupa 1", "Grupa 2", ..., "Grupa 13" */
function sortGroupsByNumber<T extends { name: string }>(groups: T[]): T[] {
  return groups.sort((a, b) => {
    const numA = parseInt(a.name.replace(/\D/g, ""), 10) || 0;
    const numB = parseInt(b.name.replace(/\D/g, ""), 10) || 0;
    return numA - numB;
  });
}

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
      const groups = await ctx.db.leagueGroup.findMany({
        where: { leagueLevelId: input.leagueLevelId },
      });
      return sortGroupsByNumber(groups);
    }),

  // Full hierarchy for a region (for profile form)
  hierarchy: publicProcedure
    .input(z.object({ regionId: z.number().int() }))
    .query(async ({ ctx, input }) => {
      const levels = await ctx.db.leagueLevel.findMany({
        where: { regionId: input.regionId },
        include: { groups: true },
        orderBy: { tier: "asc" },
      });
      return levels.map((level) => ({
        ...level,
        groups: sortGroupsByNumber(level.groups),
      }));
    }),
});
