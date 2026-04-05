import { z } from "zod/v4";
import { router, protectedProcedure, publicProcedure, rateLimitedProcedure } from "../trpc";
import { createTransferSchema, updateTransferSchema } from "@/lib/validators/transfer";
import { TRPCError } from "@trpc/server";

export const transferRouter = router({
  create: rateLimitedProcedure({ maxAttempts: 5 })
    .input(createTransferSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const user = await ctx.db.user.findUnique({
        where: { id: userId },
        include: { club: true, player: true },
      });

      // Validate type matches role
      if (input.type === "LOOKING_FOR_PLAYER" && !user?.club) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Tylko kluby mogą szukać zawodników" });
      }
      if ((input.type === "LOOKING_FOR_CLUB" || input.type === "FREE_AGENT") && !user?.player) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Tylko zawodnicy mogą szukać klubu" });
      }

      const transfer = await ctx.db.transfer.create({
        data: {
          userId,
          type: input.type,
          title: input.title,
          description: input.description,
          position: input.position,
          regionId: input.regionId,
          minAge: input.minAge,
          maxAge: input.maxAge,
          availableFrom: input.availableFrom ? new Date(input.availableFrom) : undefined,
          preferredLevel: input.preferredLevel,
        },
      });

      // Notify clubs in region when player is looking for a club (fire-and-forget)
      if ((input.type === "LOOKING_FOR_CLUB" || input.type === "FREE_AGENT") && input.regionId) {
        const playerName = user?.player ? `${user.player.firstName} ${user.player.lastName}` : input.title;
        ctx.db.club.findMany({
          where: { regionId: input.regionId },
          select: { userId: true },
          take: 50,
        }).then((clubs: { userId: string }[]) => {
          if (clubs.length === 0) return;
          ctx.db.notification.createMany({
            data: clubs.map((c: { userId: string }) => ({
              userId: c.userId,
              type: "RECRUITMENT_MATCH" as const,
              title: "Nowy zawodnik szuka klubu",
              message: `${playerName} — szuka klubu w Twoim regionie`,
              link: `/transfers/${transfer.id}`,
            })),
          }).catch(() => {});
        }).catch(() => {});
      }

      // Notify players/coaches looking for club when club seeks players (fire-and-forget)
      if (input.type === "LOOKING_FOR_PLAYER" && input.regionId) {
        const clubName = user?.club?.name ?? input.title;
        const playerWhere: Record<string, unknown> = { regionId: input.regionId, lookingForClub: true };
        if (input.position) {
          playerWhere.primaryPosition = input.position;
        }

        ctx.db.player.findMany({
          where: playerWhere,
          select: { userId: true },
          take: 50,
        }).then((players: { userId: string }[]) => {
          if (players.length === 0) return;
          ctx.db.notification.createMany({
            data: players.map((p: { userId: string }) => ({
              userId: p.userId,
              type: "RECRUITMENT_MATCH" as const,
              title: `${clubName} szuka zawodnika w Twoim regionie`,
              message: input.title,
              link: `/transfers/${transfer.id}`,
            })),
          }).catch(() => {});
        }).catch(() => {});

        ctx.db.coach.findMany({
          where: { regionId: input.regionId, lookingForClub: true },
          select: { userId: true },
          take: 50,
        }).then((coaches: { userId: string }[]) => {
          if (coaches.length === 0) return;
          ctx.db.notification.createMany({
            data: coaches.map((c: { userId: string }) => ({
              userId: c.userId,
              type: "RECRUITMENT_MATCH" as const,
              title: `${clubName} szuka zawodnika w Twoim regionie`,
              message: input.title,
              link: `/transfers/${transfer.id}`,
            })),
          }).catch(() => {});
        }).catch(() => {});
      }

      return transfer;
    }),

  update: protectedProcedure
    .input(updateTransferSchema)
    .mutation(async ({ ctx, input }) => {
      const transfer = await ctx.db.transfer.findUnique({ where: { id: input.id } });
      if (!transfer) throw new TRPCError({ code: "NOT_FOUND" });
      if (transfer.userId !== ctx.session.user.id) throw new TRPCError({ code: "FORBIDDEN" });
      if (transfer.status !== "ACTIVE") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Można edytować tylko aktywne ogłoszenia" });
      }

      return ctx.db.transfer.update({
        where: { id: input.id },
        data: {
          type: input.type,
          title: input.title,
          description: input.description,
          position: input.position,
          regionId: input.regionId,
          minAge: input.minAge,
          maxAge: input.maxAge,
          availableFrom: input.availableFrom ? new Date(input.availableFrom) : undefined,
          preferredLevel: input.preferredLevel,
        },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const transfer = await ctx.db.transfer.findUnique({ where: { id: input.id } });
      if (!transfer) throw new TRPCError({ code: "NOT_FOUND" });
      if (transfer.userId !== ctx.session.user.id) throw new TRPCError({ code: "FORBIDDEN" });

      return ctx.db.transfer.delete({ where: { id: input.id } });
    }),

  close: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const transfer = await ctx.db.transfer.findUnique({ where: { id: input.id } });
      if (!transfer) throw new TRPCError({ code: "NOT_FOUND" });
      if (transfer.userId !== ctx.session.user.id) throw new TRPCError({ code: "FORBIDDEN" });

      return ctx.db.transfer.update({
        where: { id: input.id },
        data: { status: "CLOSED" },
      });
    }),

  list: publicProcedure
    .input(
      z.object({
        type: z.enum(["LOOKING_FOR_CLUB", "LOOKING_FOR_PLAYER", "FREE_AGENT"]).optional(),
        position: z.enum(["GK", "CB", "LB", "RB", "CDM", "CM", "CAM", "LM", "RM", "LW", "RW", "ST"]).optional(),
        regionId: z.number().int().optional(),
        status: z.enum(["ACTIVE", "CLOSED"]).default("ACTIVE"),
        availableFrom: z.string().optional(),
        preferredLevel: z.enum(["YOUTH", "AMATEUR", "SEMI_PRO", "PRO"]).optional(),
        sortBy: z.enum(["createdAt", "title"]).default("createdAt"),
        sortOrder: z.enum(["asc", "desc"]).default("desc"),
        cursor: z.string().uuid().optional(),
        limit: z.number().int().min(1).max(50).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: any = { status: input.status };
      if (input.type) where.type = input.type;
      if (input.position) where.position = input.position;
      if (input.regionId) where.regionId = input.regionId;
      if (input.availableFrom) where.availableFrom = { lte: new Date(input.availableFrom) };
      if (input.preferredLevel) where.preferredLevel = input.preferredLevel;

      const items = await ctx.db.transfer.findMany({
        where,
        include: {
          user: {
            include: {
              club: { select: { id: true, name: true, city: true, logoUrl: true } },
              player: { select: { id: true, firstName: true, lastName: true, photoUrl: true, primaryPosition: true, dateOfBirth: true } },
            },
          },
          region: true,
        },
        take: input.limit + 1,
        ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
        orderBy: { [input.sortBy]: input.sortOrder },
      });

      let nextCursor: string | undefined;
      if (items.length > input.limit) {
        nextCursor = items.pop()!.id;
      }

      return { items, nextCursor };
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const transfer = await ctx.db.transfer.findUnique({
        where: { id: input.id },
        include: {
          user: {
            include: {
              club: { select: { id: true, name: true, city: true, logoUrl: true, userId: true } },
              player: { select: { id: true, firstName: true, lastName: true, photoUrl: true, primaryPosition: true, dateOfBirth: true, city: true, userId: true } },
            },
          },
          region: true,
        },
      });
      if (!transfer) throw new TRPCError({ code: "NOT_FOUND" });
      return transfer;
    }),

  my: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.transfer.findMany({
      where: { userId: ctx.session.user.id },
      include: { region: true },
      orderBy: { createdAt: "desc" },
    });
  }),
});
