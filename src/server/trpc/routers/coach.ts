import { z } from "zod/v4";
import { router, protectedProcedure, publicProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { coachCareerEntrySchema } from "@/lib/validators/coach";

export const coachRouter = router({
  me: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.session.user.role !== "COACH") return null;
    const coach = await ctx.db.coach.findUnique({
      where: { userId: ctx.session.user.id },
      include: { region: true },
    });
    if (!coach) return null;
    let careerEntries: { id: string; clubName: string; season: string; role: string; level: string | null; notes: string | null; createdAt: Date }[] = [];
    try { careerEntries = await ctx.db.coachCareerEntry.findMany({ where: { coachId: coach.id }, orderBy: { season: "desc" } }); } catch {}
    return { ...coach, careerEntries };
  }),

  update: protectedProcedure
    .input(
      z.object({
        firstName: z.string().min(2).max(100),
        lastName: z.string().min(2).max(100),
        specialization: z.string().max(100).optional(),
        level: z.string().max(50).optional(),
        city: z.string().max(100).optional(),
        regionId: z.number().int().optional(),
        bio: z.string().max(2000).optional(),
        photoUrl: z.string().url().max(500).optional(),
        facebookUrl: z.string().url().max(300).optional(),
        instagramUrl: z.string().url().max(300).optional(),
        lookingForClub: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        return await ctx.db.coach.update({
          where: { userId: ctx.session.user.id },
          data: input,
        });
      } catch {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const coach = await ctx.db.coach.findUnique({
        where: { id: input.id },
        include: { region: true },
      });
      if (!coach) throw new TRPCError({ code: "NOT_FOUND" });
      let careerEntries: { id: string; clubName: string; season: string; role: string; level: string | null; notes: string | null; createdAt: Date }[] = [];
      try { careerEntries = await ctx.db.coachCareerEntry.findMany({ where: { coachId: input.id }, orderBy: { season: "desc" } }); } catch {}
      const { lookingForClub: _, ...publicCoach } = coach;
      return { ...publicCoach, careerEntries };
    }),

  list: publicProcedure
    .input(
      z.object({
        regionId: z.number().int().optional(),
        specialization: z.string().optional(),
        city: z.string().max(100).optional(),
        cursor: z.string().uuid().optional(),
        limit: z.number().int().min(1).max(50).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: Record<string, unknown> = {};
      if (input.regionId) where.regionId = input.regionId;
      if (input.specialization) where.specialization = input.specialization;
      if (input.city) {
        where.city = { contains: input.city, mode: "insensitive" };
      }

      const rawItems = await ctx.db.coach.findMany({
        where,
        include: { region: true },
        take: input.limit + 1,
        ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
        orderBy: { createdAt: "desc" },
      });

      const items = rawItems.map(({ lookingForClub: _, ...c }) => c);

      let nextCursor: string | undefined;
      if (items.length > input.limit) {
        nextCursor = items.pop()!.id;
      }

      return { items, nextCursor };
    }),

  addCareerEntry: protectedProcedure
    .input(coachCareerEntrySchema)
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "COACH") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const coach = await ctx.db.coach.findUnique({
        where: { userId: ctx.session.user.id },
      });
      if (!coach) throw new TRPCError({ code: "NOT_FOUND" });

      return ctx.db.coachCareerEntry.create({
        data: {
          coachId: coach.id,
          clubName: input.clubName,
          season: input.season,
          role: input.role,
          level: input.level,
          notes: input.notes,
        },
      });
    }),

  removeCareerEntry: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "COACH") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const { count } = await ctx.db.coachCareerEntry.deleteMany({
        where: { id: input.id, coach: { userId: ctx.session.user.id } },
      });
      if (count === 0) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return { id: input.id };
    }),
});
