import { z } from "zod/v4";
import { router, protectedProcedure, publicProcedure, rateLimitedProcedure } from "../trpc";
import { createClubPostSchema, updateClubPostSchema } from "@/lib/validators/club-post";
import { TRPCError } from "@trpc/server";
import { awardPoints } from "@/server/award-points";

export const clubPostRouter = router({
  create: rateLimitedProcedure({ maxAttempts: 10 })
    .input(createClubPostSchema)
    .mutation(async ({ ctx, input }) => {
      const club = await ctx.db.club.findUnique({
        where: { userId: ctx.session.user.id },
      });
      if (!club) throw new TRPCError({ code: "FORBIDDEN", message: "Tylko kluby mogą dodawać posty" });

      const activeCount = await ctx.db.clubPost.count({
        where: {
          clubId: club.id,
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
      });
      if (activeCount >= 5) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Maksymalnie 5 aktywnych postów na klub. Usuń lub poczekaj na wygaśnięcie starszych.",
        });
      }

      const post = await ctx.db.clubPost.create({
        data: {
          clubId: club.id,
          category: input.category,
          title: input.title,
          content: input.content,
          expiresAt: input.expiresAt ? new Date(input.expiresAt) : undefined,
        },
      });

      awardPoints(ctx.db, ctx.session.user.id, "club_post_created", post.id).catch(() => {});

      return post;
    }),

  update: protectedProcedure
    .input(updateClubPostSchema)
    .mutation(async ({ ctx, input }) => {
      const club = await ctx.db.club.findUnique({
        where: { userId: ctx.session.user.id },
      });
      if (!club) throw new TRPCError({ code: "FORBIDDEN" });

      const post = await ctx.db.clubPost.findUnique({ where: { id: input.id } });
      if (!post) throw new TRPCError({ code: "NOT_FOUND" });
      if (post.clubId !== club.id) throw new TRPCError({ code: "FORBIDDEN" });

      return ctx.db.clubPost.update({
        where: { id: input.id },
        data: {
          category: input.category,
          title: input.title,
          content: input.content,
          expiresAt: input.expiresAt ? new Date(input.expiresAt) : undefined,
        },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const club = await ctx.db.club.findUnique({
        where: { userId: ctx.session.user.id },
      });
      if (!club) throw new TRPCError({ code: "FORBIDDEN" });

      const post = await ctx.db.clubPost.findUnique({ where: { id: input.id } });
      if (!post) throw new TRPCError({ code: "NOT_FOUND" });
      if (post.clubId !== club.id) throw new TRPCError({ code: "FORBIDDEN" });

      return ctx.db.clubPost.delete({ where: { id: input.id } });
    }),

  list: publicProcedure
    .input(
      z.object({
        category: z.enum(["LOOKING_FOR_GOALKEEPER", "LOOKING_FOR_SPARRING", "LOOKING_FOR_COACH", "GENERAL_NEWS", "MATCH_RESULT"]).optional(),
        clubId: z.string().uuid().optional(),
        cursor: z.string().uuid().optional(),
        limit: z.number().int().min(1).max(50).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: Record<string, unknown> = {};
      if (input.category) where.category = input.category;
      if (input.clubId) where.clubId = input.clubId;

      // Exclude expired posts
      where.OR = [
        { expiresAt: null },
        { expiresAt: { gte: new Date() } },
      ];

      const items = await ctx.db.clubPost.findMany({
        where,
        include: {
          club: { select: { id: true, name: true, city: true, logoUrl: true } },
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

  report: protectedProcedure
    .input(z.object({
      postId: z.string().uuid(),
      reason: z.string().min(5, "Podaj powód (min. 5 znaków)").max(500),
    }))
    .mutation(async ({ ctx, input }) => {
      const post = await ctx.db.clubPost.findUnique({ where: { id: input.postId } });
      if (!post) throw new TRPCError({ code: "NOT_FOUND" });
      console.warn(`[REPORT] Post ${input.postId} reported by user ${ctx.session.user.id}: ${input.reason}`);
      return { success: true };
    }),

  my: protectedProcedure.query(async ({ ctx }) => {
    const club = await ctx.db.club.findUnique({
      where: { userId: ctx.session.user.id },
    });
    if (!club) return [];

    return ctx.db.clubPost.findMany({
      where: { clubId: club.id },
      orderBy: { createdAt: "desc" },
    });
  }),
});
