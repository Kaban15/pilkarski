import { z } from "zod/v4";
import { router, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { awardPoints } from "@/server/award-points";

export const recruitmentRouter = router({
  addToRadar: protectedProcedure
    .input(z.object({ transferId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const club = await ctx.db.club.findUnique({
        where: { userId: ctx.session.user.id },
      });
      if (!club) throw new TRPCError({ code: "FORBIDDEN" });

      const entry = await ctx.db.recruitmentPipeline.upsert({
        where: {
          clubId_transferId: {
            clubId: club.id,
            transferId: input.transferId,
          },
        },
        create: {
          clubId: club.id,
          transferId: input.transferId,
          stage: "WATCHING",
        },
        update: {},
      });

      awardPoints(ctx.db, ctx.session.user.id, "player_added_to_radar", entry.id).catch(() => {});

      return entry;
    }),

  updateStage: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        stage: z.enum([
          "WATCHING",
          "INVITED_TO_TRYOUT",
          "AFTER_TRYOUT",
          "OFFER_SENT",
          "SIGNED",
          "REJECTED",
        ]),
        notes: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const club = await ctx.db.club.findUnique({
        where: { userId: ctx.session.user.id },
      });
      if (!club) throw new TRPCError({ code: "FORBIDDEN" });

      const entry = await ctx.db.recruitmentPipeline.findUnique({
        where: { id: input.id },
      });
      if (!entry || entry.clubId !== club.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      return ctx.db.recruitmentPipeline.update({
        where: { id: input.id },
        data: { stage: input.stage, notes: input.notes },
      });
    }),

  remove: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const club = await ctx.db.club.findUnique({
        where: { userId: ctx.session.user.id },
      });
      if (!club) throw new TRPCError({ code: "FORBIDDEN" });

      const entry = await ctx.db.recruitmentPipeline.findUnique({
        where: { id: input.id },
      });
      if (!entry || entry.clubId !== club.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      return ctx.db.recruitmentPipeline.delete({ where: { id: input.id } });
    }),

  myPipeline: protectedProcedure
    .input(
      z.object({
        stage: z
          .enum([
            "WATCHING",
            "INVITED_TO_TRYOUT",
            "AFTER_TRYOUT",
            "OFFER_SENT",
            "SIGNED",
            "REJECTED",
          ])
          .optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const club = await ctx.db.club.findUnique({
        where: { userId: ctx.session.user.id },
      });
      if (!club) return [];

      return ctx.db.recruitmentPipeline.findMany({
        where: {
          clubId: club.id,
          ...(input.stage ? { stage: input.stage } : {}),
        },
        include: {
          transfer: {
            include: {
              user: {
                include: {
                  player: {
                    select: {
                      id: true,
                      firstName: true,
                      lastName: true,
                      photoUrl: true,
                      primaryPosition: true,
                      dateOfBirth: true,
                      city: true,
                    },
                  },
                },
              },
              region: { select: { name: true } },
            },
          },
        },
        orderBy: { updatedAt: "desc" },
      });
    }),

  check: protectedProcedure
    .input(z.object({ transferIds: z.array(z.string().uuid()) }))
    .query(async ({ ctx, input }) => {
      if (input.transferIds.length === 0) return {};

      const club = await ctx.db.club.findUnique({
        where: { userId: ctx.session.user.id },
      });
      if (!club) return {};

      const entries = await ctx.db.recruitmentPipeline.findMany({
        where: {
          clubId: club.id,
          transferId: { in: input.transferIds },
        },
        select: { transferId: true, stage: true, id: true },
      });

      return Object.fromEntries(
        entries.map((e) => [e.transferId, { id: e.id, stage: e.stage }])
      );
    }),
});
