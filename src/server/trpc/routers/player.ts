import { z } from "zod/v4";
import { router, protectedProcedure, publicProcedure } from "../trpc";
import { updatePlayerSchema, careerEntrySchema } from "@/lib/validators/profile";
import { TRPCError } from "@trpc/server";

export const playerRouter = router({
  // Get own player profile
  me: protectedProcedure.query(async ({ ctx }) => {
    const player = await ctx.db.player.findUnique({
      where: { userId: ctx.session.user.id },
      include: { region: true, careerEntries: { orderBy: { season: "desc" } } },
    });
    if (!player)
      throw new TRPCError({ code: "NOT_FOUND", message: "Profil zawodnika nie znaleziony" });
    return player;
  }),

  // Get player by ID (public)
  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const player = await ctx.db.player.findUnique({
        where: { id: input.id },
        include: { region: true, careerEntries: { orderBy: { season: "desc" } } },
      });
      if (!player) throw new TRPCError({ code: "NOT_FOUND" });
      return player;
    }),

  // Update own player profile
  update: protectedProcedure
    .input(updatePlayerSchema)
    .mutation(async ({ ctx, input }) => {
      const player = await ctx.db.player.findUnique({
        where: { userId: ctx.session.user.id },
      });
      if (!player) throw new TRPCError({ code: "NOT_FOUND" });

      return ctx.db.player.update({
        where: { id: player.id },
        data: {
          ...input,
          dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : undefined,
        },
      });
    }),

  // Add career entry
  addCareer: protectedProcedure
    .input(careerEntrySchema)
    .mutation(async ({ ctx, input }) => {
      const player = await ctx.db.player.findUnique({
        where: { userId: ctx.session.user.id },
      });
      if (!player) throw new TRPCError({ code: "NOT_FOUND" });

      return ctx.db.careerEntry.create({
        data: { ...input, playerId: player.id },
      });
    }),

  // Delete career entry
  deleteCareer: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const player = await ctx.db.player.findUnique({
        where: { userId: ctx.session.user.id },
      });
      if (!player) throw new TRPCError({ code: "NOT_FOUND" });

      const entry = await ctx.db.careerEntry.findUnique({
        where: { id: input.id },
      });
      if (!entry || entry.playerId !== player.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      return ctx.db.careerEntry.delete({ where: { id: input.id } });
    }),

  // List players (with optional region filter)
  list: publicProcedure
    .input(
      z.object({
        regionId: z.number().int().optional(),
        position: z
          .enum(["GK", "CB", "LB", "RB", "CDM", "CM", "CAM", "LM", "RM", "LW", "RW", "ST"])
          .optional(),
        cursor: z.string().uuid().optional(),
        limit: z.number().int().min(1).max(50).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: any = {};
      if (input.regionId) where.regionId = input.regionId;
      if (input.position) where.primaryPosition = input.position;

      const players = await ctx.db.player.findMany({
        where,
        include: { region: true },
        take: input.limit + 1,
        ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
        orderBy: { createdAt: "desc" },
      });

      let nextCursor: string | undefined;
      if (players.length > input.limit) {
        const next = players.pop()!;
        nextCursor = next.id;
      }

      return { players, nextCursor };
    }),
});
