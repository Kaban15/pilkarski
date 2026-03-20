import { z } from "zod/v4";
import { router, protectedProcedure, publicProcedure } from "../trpc";
import {
  createSparingSchema,
  applySparingSchema,
  respondApplicationSchema,
} from "@/lib/validators/sparing";
import { TRPCError } from "@trpc/server";

export const sparingRouter = router({
  // Create sparing offer (club only)
  create: protectedProcedure
    .input(createSparingSchema)
    .mutation(async ({ ctx, input }) => {
      const club = await ctx.db.club.findUnique({
        where: { userId: ctx.session.user.id },
      });
      if (!club) throw new TRPCError({ code: "FORBIDDEN", message: "Tylko kluby mogą tworzyć sparingi" });

      return ctx.db.sparingOffer.create({
        data: {
          clubId: club.id,
          title: input.title,
          description: input.description,
          matchDate: new Date(input.matchDate),
          location: input.location,
          lat: input.lat,
          lng: input.lng,
          costSplitInfo: input.costSplitInfo,
          regionId: input.regionId ?? club.regionId,
        },
      });
    }),

  // List sparings (with filters)
  list: publicProcedure
    .input(
      z.object({
        regionId: z.number().int().optional(),
        status: z.enum(["OPEN", "MATCHED", "CANCELLED", "COMPLETED"]).optional(),
        cursor: z.string().uuid().optional(),
        limit: z.number().int().min(1).max(50).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: any = {};
      if (input.regionId) where.regionId = input.regionId;
      if (input.status) where.status = input.status;
      else where.status = "OPEN"; // default: only open

      const items = await ctx.db.sparingOffer.findMany({
        where,
        include: {
          club: { select: { id: true, name: true, city: true, logoUrl: true } },
          region: true,
          _count: { select: { applications: true } },
        },
        take: input.limit + 1,
        ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
        orderBy: { matchDate: "asc" },
      });

      let nextCursor: string | undefined;
      if (items.length > input.limit) {
        nextCursor = items.pop()!.id;
      }

      return { items, nextCursor };
    }),

  // Get single sparing with applications
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
              applicantClub: { select: { id: true, name: true, city: true, logoUrl: true } },
            },
            orderBy: { createdAt: "desc" },
          },
        },
      });
      if (!sparing) throw new TRPCError({ code: "NOT_FOUND" });
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
      });
      if (!offer) throw new TRPCError({ code: "NOT_FOUND" });
      if (offer.clubId === club.id) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Nie możesz aplikować na własny sparing" });
      }
      if (offer.status !== "OPEN") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Sparing nie jest już otwarty" });
      }

      return ctx.db.sparingApplication.create({
        data: {
          sparingOfferId: input.sparingOfferId,
          applicantClubId: club.id,
          message: input.message,
        },
      });
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
      }

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
