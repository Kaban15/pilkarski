import { z } from "zod/v4";
import { router, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { awardPoints } from "@/server/award-points";

const PIPELINE_STAGES = [
  "WATCHING",
  "INVITED_TO_TRYOUT",
  "AFTER_TRYOUT",
  "OFFER_SENT",
  "SIGNED",
  "REJECTED",
] as const;

const stageEnum = z.enum(PIPELINE_STAGES);

function csvEscape(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

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

      // Log initial timeline event
      ctx.db.recruitmentEvent.create({
        data: { pipelineId: entry.id, toStage: "WATCHING", note: "Dodano na radar" },
      }).catch(() => {});

      return entry;
    }),

  updateStage: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        stage: stageEnum,
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

      const oldStage = entry.stage;

      const updated = await ctx.db.recruitmentPipeline.update({
        where: { id: input.id },
        data: { stage: input.stage, notes: input.notes },
      });

      // Log stage change event
      if (oldStage !== input.stage) {
        ctx.db.recruitmentEvent.create({
          data: {
            pipelineId: input.id,
            fromStage: oldStage,
            toStage: input.stage,
            note: input.notes,
          },
        }).catch(() => {});
      }

      return updated;
    }),

  updateStageAndOrder: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        stage: stageEnum,
        position: z.number().int().min(0),
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

      const oldStage = entry.stage;

      const updated = await ctx.db.recruitmentPipeline.update({
        where: { id: input.id },
        data: { stage: input.stage, position: input.position },
      });

      if (oldStage !== input.stage) {
        ctx.db.recruitmentEvent.create({
          data: {
            pipelineId: input.id,
            fromStage: oldStage,
            toStage: input.stage,
          },
        }).catch(() => {});
      }

      return updated;
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
          .enum(PIPELINE_STAGES)
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
          events: {
            orderBy: { createdAt: "desc" },
            take: 3,
          },
        },
        orderBy: [{ position: "asc" }, { updatedAt: "desc" }],
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

  stats: protectedProcedure.query(async ({ ctx }) => {
    const club = await ctx.db.club.findUnique({
      where: { userId: ctx.session.user.id },
    });
    if (!club) return null;

    const counts = await ctx.db.recruitmentPipeline.groupBy({
      by: ["stage"],
      where: { clubId: club.id },
      _count: true,
    });

    const byStage: Record<string, number> = {};
    for (const c of counts) {
      byStage[c.stage] = c._count;
    }

    return {
      watching: byStage.WATCHING ?? 0,
      invited: byStage.INVITED_TO_TRYOUT ?? 0,
      afterTryout: byStage.AFTER_TRYOUT ?? 0,
      offerSent: byStage.OFFER_SENT ?? 0,
      signed: byStage.SIGNED ?? 0,
      rejected: byStage.REJECTED ?? 0,
      total: counts.reduce((sum, c) => sum + c._count, 0),
    };
  }),

  exportCsv: protectedProcedure.query(async ({ ctx }) => {
    const club = await ctx.db.club.findUnique({
      where: { userId: ctx.session.user.id },
    });
    if (!club) return { csv: "" };

    const entries = await ctx.db.recruitmentPipeline.findMany({
      where: { clubId: club.id },
      include: {
        transfer: {
          include: {
            user: {
              include: {
                player: {
                  select: { firstName: true, lastName: true, primaryPosition: true, city: true },
                },
              },
            },
            region: { select: { name: true } },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    const header = "Imię,Nazwisko,Pozycja,Miasto,Region,Etap,Notatki,Data aktualizacji";
    const rows = entries.map((e) => {
      const p = e.transfer.user.player;
      return [
        csvEscape(p?.firstName ?? ""),
        csvEscape(p?.lastName ?? ""),
        csvEscape(p?.primaryPosition ?? ""),
        csvEscape(p?.city ?? ""),
        csvEscape(e.transfer.region?.name ?? ""),
        e.stage,
        csvEscape(e.notes ?? ""),
        e.updatedAt.toISOString().split("T")[0],
      ].join(",");
    });

    return { csv: [header, ...rows].join("\n") };
  }),

  avgTimeToSign: protectedProcedure.query(async ({ ctx }) => {
    const club = await ctx.db.club.findUnique({
      where: { userId: ctx.session.user.id },
    });
    if (!club) return null;

    // Find all signed pipeline entries with their events
    const signedEntries = await ctx.db.recruitmentPipeline.findMany({
      where: { clubId: club.id, stage: "SIGNED" },
      select: { createdAt: true, events: { where: { toStage: "SIGNED" }, select: { createdAt: true }, take: 1 } },
    });

    if (signedEntries.length === 0) return null;

    let totalDays = 0;
    let count = 0;

    for (const entry of signedEntries) {
      const signedEvent = entry.events[0];
      const signedAt = signedEvent?.createdAt ?? entry.createdAt;
      const watchingSince = entry.createdAt;
      const days = Math.round((signedAt.getTime() - watchingSince.getTime()) / (1000 * 60 * 60 * 24));
      if (days >= 0) {
        totalDays += days;
        count++;
      }
    }

    return count > 0 ? { avgDays: Math.round(totalDays / count), count } : null;
  }),
});
