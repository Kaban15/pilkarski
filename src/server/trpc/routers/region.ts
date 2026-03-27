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
});
