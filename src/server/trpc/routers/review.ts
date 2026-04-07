import { z } from "zod/v4";
import { router, protectedProcedure, publicProcedure, rateLimitedProcedure } from "../trpc";
import { createReviewSchema } from "@/lib/validators/review";
import { TRPCError } from "@trpc/server";
import { awardPoints } from "@/server/award-points";

export const reviewRouter = router({
  // Create review after a matched/completed sparing
  create: rateLimitedProcedure({ maxAttempts: 5 })
    .input(createReviewSchema)
    .mutation(async ({ ctx, input }) => {
      const club = await ctx.db.club.findUnique({
        where: { userId: ctx.session.user.id },
      });
      if (!club) throw new TRPCError({ code: "FORBIDDEN", message: "Tylko kluby mogą wystawiać recenzje" });

      const sparing = await ctx.db.sparingOffer.findUnique({
        where: { id: input.sparingOfferId },
        include: {
          club: { select: { id: true, userId: true, name: true } },
          applications: {
            where: { status: "ACCEPTED" },
            select: { applicantClubId: true, applicantClub: { select: { id: true, userId: true, name: true } } },
          },
        },
      });
      if (!sparing) throw new TRPCError({ code: "NOT_FOUND" });
      if (sparing.status !== "MATCHED" && sparing.status !== "COMPLETED") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Recenzje można wystawiać tylko po dopasowanych sparingach" });
      }

      // Determine reviewer and reviewed club
      const acceptedApp = sparing.applications[0];
      if (!acceptedApp) throw new TRPCError({ code: "BAD_REQUEST", message: "Brak zaakceptowanej aplikacji" });

      const isOwner = sparing.club.id === club.id;
      const isApplicant = acceptedApp.applicantClubId === club.id;
      if (!isOwner && !isApplicant) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Tylko uczestnicy sparingu mogą wystawiać recenzje" });
      }

      const reviewedClubId = isOwner ? acceptedApp.applicantClubId : sparing.club.id;
      const reviewedClub = isOwner ? acceptedApp.applicantClub : sparing.club;

      // Check if already reviewed
      const existing = await ctx.db.review.findUnique({
        where: { sparingOfferId_reviewerClubId: { sparingOfferId: input.sparingOfferId, reviewerClubId: club.id } },
      });
      if (existing) throw new TRPCError({ code: "BAD_REQUEST", message: "Już wystawiłeś recenzję dla tego sparingu" });

      const review = await ctx.db.review.create({
        data: {
          sparingOfferId: input.sparingOfferId,
          reviewerClubId: club.id,
          reviewedClubId,
          rating: input.rating,
          comment: input.comment,
        },
      });

      // Notify reviewed club (fire-and-forget)
      ctx.db.notification.create({
        data: {
          userId: reviewedClub.userId,
          type: "NEW_REVIEW",
          title: "Nowa recenzja",
          message: `${club.name} wystawił(a) ocenę ${input.rating}/5 po sparingu`,
          link: `/sparings/${input.sparingOfferId}`,
        },
      }).catch((err) => console.error("[notification]", err));

      awardPoints(ctx.db, ctx.session.user.id, "review_given", review.id).catch((err) => console.error("[awardPoints]", err));

      return review;
    }),

  // Get reviews for a sparing
  getForSparing: publicProcedure
    .input(z.object({ sparingOfferId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.review.findMany({
        where: { sparingOfferId: input.sparingOfferId },
        include: {
          reviewerClub: { select: { id: true, name: true, logoUrl: true } },
          reviewedClub: { select: { id: true, name: true, logoUrl: true } },
        },
        orderBy: { createdAt: "desc" },
      });
    }),

  // Get reviews received by a club (for public profile)
  listByClub: publicProcedure
    .input(
      z.object({
        clubId: z.string().uuid(),
        cursor: z.string().uuid().optional(),
        limit: z.number().int().min(1).max(50).default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      const items = await ctx.db.review.findMany({
        where: { reviewedClubId: input.clubId },
        include: {
          reviewerClub: { select: { id: true, name: true, logoUrl: true } },
          sparingOffer: { select: { id: true, title: true, matchDate: true } },
        },
        take: input.limit + 1,
        ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
        orderBy: { createdAt: "desc" },
      });

      let nextCursor: string | undefined;
      if (items.length > input.limit) {
        const last = items.pop();
        if (last) nextCursor = last.id;
      }

      return { items, nextCursor };
    }),

  // Get average rating for a club
  averageByClub: publicProcedure
    .input(z.object({ clubId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.db.review.aggregate({
        where: { reviewedClubId: input.clubId },
        _avg: { rating: true },
        _count: { rating: true },
      });
      return {
        average: result._avg.rating ?? 0,
        count: result._count.rating,
      };
    }),

  // Check if current user already reviewed a sparing
  myReview: protectedProcedure
    .input(z.object({ sparingOfferId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const club = await ctx.db.club.findUnique({
        where: { userId: ctx.session.user.id },
      });
      if (!club) return null;

      return ctx.db.review.findUnique({
        where: { sparingOfferId_reviewerClubId: { sparingOfferId: input.sparingOfferId, reviewerClubId: club.id } },
      });
    }),
});
