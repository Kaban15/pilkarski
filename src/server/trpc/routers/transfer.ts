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

      return ctx.db.transfer.create({
        data: {
          userId,
          type: input.type,
          title: input.title,
          description: input.description,
          position: input.position,
          regionId: input.regionId,
          minAge: input.minAge,
          maxAge: input.maxAge,
        },
      });
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
