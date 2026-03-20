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
        cursor: z.string().uuid().optional(),
        limit: z.number().int().min(1).max(50).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const clubs = await ctx.db.club.findMany({
        where: input.regionId ? { regionId: input.regionId } : undefined,
        include: { region: true },
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
});
