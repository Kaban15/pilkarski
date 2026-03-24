import { z } from "zod/v4";
import { router, protectedProcedure, publicProcedure } from "../trpc";
import {
  createSparingSchema,
  updateSparingSchema,
  applySparingSchema,
  respondApplicationSchema,
} from "@/lib/validators/sparing";
import { TRPCError } from "@trpc/server";
import { awardPoints } from "@/server/award-points";

export const sparingRouter = router({
  create: protectedProcedure
    .input(createSparingSchema)
    .mutation(async ({ ctx, input }) => {
      const club = await ctx.db.club.findUnique({
        where: { userId: ctx.session.user.id },
      });
      if (!club) throw new TRPCError({ code: "FORBIDDEN", message: "Tylko kluby mogą tworzyć sparingi" });

      const sparing = await ctx.db.sparingOffer.create({
        data: {
          clubId: club.id,
          title: input.title,
          description: input.description,
          matchDate: new Date(input.matchDate),
          location: input.location,
          lat: input.lat,
          lng: input.lng,
          costSplitInfo: input.costSplitInfo,
          level: input.level,
          ageCategory: input.ageCategory,
          preferredTime: input.preferredTime,
          regionId: input.regionId ?? club.regionId,
        },
      });

      awardPoints(ctx.db, ctx.session.user.id, "sparing_created", sparing.id).catch(() => {});

      return sparing;
    }),

  update: protectedProcedure
    .input(updateSparingSchema)
    .mutation(async ({ ctx, input }) => {
      const club = await ctx.db.club.findUnique({
        where: { userId: ctx.session.user.id },
      });
      if (!club) throw new TRPCError({ code: "FORBIDDEN" });

      const offer = await ctx.db.sparingOffer.findUnique({ where: { id: input.id } });
      if (!offer) throw new TRPCError({ code: "NOT_FOUND" });
      if (offer.clubId !== club.id) throw new TRPCError({ code: "FORBIDDEN" });
      if (offer.status !== "OPEN") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Można edytować tylko otwarte sparingi" });
      }

      return ctx.db.sparingOffer.update({
        where: { id: input.id },
        data: {
          title: input.title,
          description: input.description,
          matchDate: new Date(input.matchDate),
          location: input.location,
          lat: input.lat,
          lng: input.lng,
          costSplitInfo: input.costSplitInfo,
          level: input.level,
          ageCategory: input.ageCategory,
          preferredTime: input.preferredTime,
          regionId: input.regionId,
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

      const offer = await ctx.db.sparingOffer.findUnique({ where: { id: input.id } });
      if (!offer) throw new TRPCError({ code: "NOT_FOUND" });
      if (offer.clubId !== club.id) throw new TRPCError({ code: "FORBIDDEN" });
      if (offer.status !== "OPEN") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Można usunąć tylko otwarte sparingi" });
      }

      await ctx.db.sparingApplication.deleteMany({ where: { sparingOfferId: input.id } });
      return ctx.db.sparingOffer.delete({ where: { id: input.id } });
    }),

  list: publicProcedure
    .input(
      z.object({
        clubId: z.string().uuid().optional(),
        regionId: z.number().int().optional(),
        status: z.enum(["OPEN", "MATCHED", "CANCELLED", "COMPLETED"]).optional(),
        level: z.enum(["YOUTH", "AMATEUR", "SEMI_PRO", "PRO"]).optional(),
        ageCategory: z.enum(["JUNIOR_E", "JUNIOR_D", "JUNIOR_C", "JUNIOR_B", "JUNIOR_A", "SENIOR_JR", "SENIOR", "VETERAN"]).optional(),
        city: z.string().max(100).optional(),
        dateFrom: z.string().optional(),
        dateTo: z.string().optional(),
        sortBy: z.enum(["matchDate", "createdAt", "title"]).default("matchDate"),
        sortOrder: z.enum(["asc", "desc"]).default("asc"),
        cursor: z.string().uuid().optional(),
        limit: z.number().int().min(1).max(50).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: any = {};
      if (input.clubId) where.clubId = input.clubId;
      if (input.regionId) where.regionId = input.regionId;
      if (input.status) where.status = input.status;
      else where.status = "OPEN";
      if (input.level) where.level = input.level;
      if (input.ageCategory) where.ageCategory = input.ageCategory;
      if (input.city) {
        where.club = { city: { contains: input.city, mode: "insensitive" } };
      }
      if (input.dateFrom || input.dateTo) {
        where.matchDate = {};
        if (input.dateFrom) where.matchDate.gte = new Date(input.dateFrom);
        if (input.dateTo) where.matchDate.lte = new Date(input.dateTo);
      }

      const items = await ctx.db.sparingOffer.findMany({
        where,
        include: {
          club: { select: { id: true, name: true, city: true, logoUrl: true } },
          region: true,
          _count: { select: { applications: true } },
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

  // Get single sparing with applications (applications filtered by auth)
  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const sparing = await ctx.db.sparingOffer.findUnique({
        where: { id: input.id },
        include: {
          club: { select: { id: true, name: true, city: true, logoUrl: true, userId: true } },
          region: true,
          applications: {
            include: {
              applicantClub: { select: { id: true, name: true, city: true, logoUrl: true, userId: true } },
            },
            orderBy: { createdAt: "desc" },
          },
        },
      });
      if (!sparing) throw new TRPCError({ code: "NOT_FOUND" });

      // Filter applications: owner sees all, applicant sees only own, others see none
      const userId = ctx.session?.user?.id;
      const isOwner = userId === sparing.club.userId;
      if (!isOwner) {
        sparing.applications = sparing.applications.filter(
          (a) => a.applicantClub.userId === userId
        );
      }

      return sparing;
    }),

  // Apply for a sparing (club only)
  applyFor: protectedProcedure
    .input(applySparingSchema)
    .mutation(async ({ ctx, input }) => {
      const club = await ctx.db.club.findUnique({
        where: { userId: ctx.session.user.id },
      });
      if (!club) throw new TRPCError({ code: "FORBIDDEN", message: "Tylko kluby mogą aplikować" });

      const offer = await ctx.db.sparingOffer.findUnique({
        where: { id: input.sparingOfferId },
        include: { club: { select: { userId: true } } },
      });
      if (!offer) throw new TRPCError({ code: "NOT_FOUND" });
      if (offer.clubId === club.id) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Nie możesz aplikować na własny sparing" });
      }
      if (offer.status !== "OPEN") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Sparing nie jest już otwarty" });
      }

      const existing = await ctx.db.sparingApplication.findUnique({
        where: { sparingOfferId_applicantClubId: { sparingOfferId: input.sparingOfferId, applicantClubId: club.id } },
      });
      if (existing) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Już aplikowałeś na ten sparing" });
      }

      const application = await ctx.db.sparingApplication.create({
        data: {
          sparingOfferId: input.sparingOfferId,
          applicantClubId: club.id,
          message: input.message,
        },
      });

      // Notify sparing owner (fire-and-forget)
      ctx.db.notification.create({
        data: {
          userId: offer.club.userId,
          type: "SPARING_APPLICATION",
          title: "Nowe zgłoszenie na sparing",
          message: `${club.name} chce zagrać sparing`,
          link: `/sparings/${offer.id}`,
        },
      }).catch(() => {});

      awardPoints(ctx.db, ctx.session.user.id, "application_sent", application.id).catch(() => {});

      return application;
    }),

  // Accept/reject application (owner only)
  respond: protectedProcedure
    .input(respondApplicationSchema)
    .mutation(async ({ ctx, input }) => {
      const club = await ctx.db.club.findUnique({
        where: { userId: ctx.session.user.id },
      });
      if (!club) throw new TRPCError({ code: "FORBIDDEN" });

      const application = await ctx.db.sparingApplication.findUnique({
        where: { id: input.applicationId },
        include: { sparingOffer: true },
      });
      if (!application) throw new TRPCError({ code: "NOT_FOUND" });
      if (application.sparingOffer.clubId !== club.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Tylko właściciel sparingu może odpowiadać" });
      }

      const updated = await ctx.db.sparingApplication.update({
        where: { id: input.applicationId },
        include: { applicantClub: true, sparingOffer: true },
        data: { status: input.status },
      });

      // If accepted, mark offer as MATCHED and reject other applications
      if (input.status === "ACCEPTED") {
        await ctx.db.sparingOffer.update({
          where: { id: application.sparingOfferId },
          data: { status: "MATCHED" },
        });
        await ctx.db.sparingApplication.updateMany({
          where: {
            sparingOfferId: application.sparingOfferId,
            id: { not: input.applicationId },
            status: "PENDING",
          },
          data: { status: "REJECTED" },
        });

        // Points for match (fire-and-forget)
        awardPoints(ctx.db, ctx.session.user.id, "sparing_matched", application.sparingOfferId).catch(() => {});
        awardPoints(ctx.db, updated.applicantClub.userId, "application_accepted", application.sparingOfferId).catch(() => {});
      }

      // Notify applicant (fire-and-forget)
      ctx.db.notification.create({
        data: {
          userId: updated.applicantClub.userId,
          type: input.status === "ACCEPTED" ? "SPARING_ACCEPTED" : "SPARING_REJECTED",
          title: input.status === "ACCEPTED" ? "Zgłoszenie zaakceptowane!" : "Zgłoszenie odrzucone",
          message: `Twoje zgłoszenie na sparing "${updated.sparingOffer.title}" zostało ${input.status === "ACCEPTED" ? "zaakceptowane" : "odrzucone"}`,
          link: `/sparings/${application.sparingOfferId}`,
        },
      }).catch(() => {});

      return updated;
    }),

  // Cancel own sparing
  cancel: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const club = await ctx.db.club.findUnique({
        where: { userId: ctx.session.user.id },
      });
      if (!club) throw new TRPCError({ code: "FORBIDDEN" });

      const offer = await ctx.db.sparingOffer.findUnique({ where: { id: input.id } });
      if (!offer) throw new TRPCError({ code: "NOT_FOUND" });
      if (offer.clubId !== club.id) throw new TRPCError({ code: "FORBIDDEN" });

      return ctx.db.sparingOffer.update({
        where: { id: input.id },
        data: { status: "CANCELLED" },
      });
    }),

  // Mark matched sparing as completed (owner only)
  complete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const club = await ctx.db.club.findUnique({
        where: { userId: ctx.session.user.id },
      });
      if (!club) throw new TRPCError({ code: "FORBIDDEN" });

      const offer = await ctx.db.sparingOffer.findUnique({ where: { id: input.id } });
      if (!offer) throw new TRPCError({ code: "NOT_FOUND" });
      if (offer.clubId !== club.id) throw new TRPCError({ code: "FORBIDDEN" });
      if (offer.status !== "MATCHED") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Tylko dopasowane sparingi można oznaczyć jako zakończone" });
      }

      return ctx.db.sparingOffer.update({
        where: { id: input.id },
        data: { status: "COMPLETED" },
      });
    }),

  // My sparings (as owner)
  my: protectedProcedure.query(async ({ ctx }) => {
    const club = await ctx.db.club.findUnique({
      where: { userId: ctx.session.user.id },
    });
    if (!club) return [];

    return ctx.db.sparingOffer.findMany({
      where: { clubId: club.id },
      include: {
        region: true,
        _count: { select: { applications: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }),
});
