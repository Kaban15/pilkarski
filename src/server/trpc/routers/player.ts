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
      const { lookingForClub: _, ...publicPlayer } = player;
      return publicPlayer;
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

      const rawPlayers = await ctx.db.player.findMany({
        where,
        include: { region: true },
        take: input.limit + 1,
        ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
        orderBy: { createdAt: "desc" },
      });

      const players = rawPlayers.map(({ lookingForClub: _, ...p }) => p);

      let nextCursor: string | undefined;
      if (players.length > input.limit) {
        const next = players.pop()!;
        nextCursor = next.id;
      }

      return { players, nextCursor };
    }),

  // Search players for invitation (with club/league filtering and lookingForClub boost)
  search: protectedProcedure
    .input(
      z.object({
        search: z.string().max(100).optional(),
        regionId: z.number().int().optional(),
        leagueLevelId: z.number().int().optional(),
        leagueGroupId: z.number().int().optional(),
        position: z
          .enum(["GK", "CB", "LB", "RB", "CDM", "CM", "CAM", "LM", "RM", "LW", "RW", "ST"])
          .optional(),
        prioritizeForRegionId: z.number().int().optional(),
        limit: z.number().int().min(1).max(30).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: any = {};

      if (input.search && input.search.length >= 2) {
        where.OR = [
          { firstName: { contains: input.search, mode: "insensitive" } },
          { lastName: { contains: input.search, mode: "insensitive" } },
        ];
      }
      if (input.regionId) where.regionId = input.regionId;
      if (input.position) where.primaryPosition = input.position;

      // Filter by club league level/group via membership
      if (input.leagueGroupId) {
        where.user = {
          clubMemberships: {
            some: { status: "ACCEPTED", club: { leagueGroupId: input.leagueGroupId } },
          },
        };
      } else if (input.leagueLevelId) {
        where.user = {
          clubMemberships: {
            some: {
              status: "ACCEPTED",
              club: { leagueGroup: { leagueLevelId: input.leagueLevelId } },
            },
          },
        };
      }

      const rawPlayers = await ctx.db.player.findMany({
        where,
        include: {
          region: true,
          user: {
            include: {
              clubMemberships: {
                where: { status: "ACCEPTED" },
                take: 1,
                include: { club: { select: { name: true, city: true } } },
              },
            },
          },
        },
        take: input.limit,
        orderBy: { createdAt: "desc" },
      });

      // Sort: lookingForClub + same region first
      const players = rawPlayers
        .sort((a, b) => {
          if (input.prioritizeForRegionId) {
            const aBoost = a.lookingForClub && a.regionId === input.prioritizeForRegionId ? 0 : 1;
            const bBoost = b.lookingForClub && b.regionId === input.prioritizeForRegionId ? 0 : 1;
            if (aBoost !== bBoost) return aBoost - bBoost;
          }
          return 0;
        })
        .map(({ lookingForClub: _, user, ...p }) => ({
          ...p,
          userId: user.id,
          clubName: user.clubMemberships[0]?.club?.name ?? null,
          clubCity: user.clubMemberships[0]?.club?.city ?? null,
        }));

      return players;
    }),
});
