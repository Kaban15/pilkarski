import { z } from "zod/v4";
import { router, protectedProcedure, publicProcedure, rateLimitedProcedure } from "../trpc";
import {
  createSparingSchema,
  updateSparingSchema,
  applySparingSchema,
  respondApplicationSchema,
} from "@/lib/validators/sparing";
import { TRPCError } from "@trpc/server";
import { awardPoints } from "@/server/award-points";
import { sendPushToUser } from "@/server/send-push";
import { sendEmailToUser } from "@/server/send-email";

const baseUrl = process.env.NEXTAUTH_URL || "https://pilkarski.vercel.app";

export const sparingRouter = router({
  create: rateLimitedProcedure({ maxAttempts: 5 })
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
          level: input.level,
          ageCategory: input.ageCategory,
          preferredTime: input.preferredTime,
          regionId: input.regionId ?? club.regionId,
          costPerTeam: input.costPerTeam,
          pitchStatus: input.pitchStatus,
        },
      });

      awardPoints(ctx.db, ctx.session.user.id, "sparing_created", sparing.id).catch((err) => console.error("[awardPoints]", err));

      // Notify club followers (fire-and-forget)
      ctx.db.clubFollower.findMany({
        where: { clubId: club.id },
        select: { userId: true },
      }).then((followers: { userId: string }[]) => {
        if (followers.length === 0) return;
        ctx.db.notification.createMany({
          data: followers.map((f: { userId: string }) => ({
            userId: f.userId,
            type: "SPARING_APPLICATION" as const,
            title: "Nowy sparing od obserwowanego klubu",
            message: `${club.name} szuka sparingpartnera: ${input.title}`,
            link: `/sparings/${sparing.id}`,
          })),
        }).catch((err) => console.error("[notification]", err));
      }).catch((err) => console.error("[fire-and-forget]", err));

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
          level: input.level,
          ageCategory: input.ageCategory,
          preferredTime: input.preferredTime,
          regionId: input.regionId,
          costPerTeam: input.costPerTeam,
          pitchStatus: input.pitchStatus,
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
        },
        take: input.limit + 1,
        ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
        orderBy: { [input.sortBy]: input.sortOrder },
      });

      let nextCursor: string | undefined;
      if (items.length > input.limit) {
        const last = items.pop();
        if (last) nextCursor = last.id;
      }

      return { items, nextCursor };
    }),

  // Bulk check viewer's application state for a list of sparing offers (CLUB viewer)
  checkApplications: protectedProcedure
    .input(z.object({ sparingOfferIds: z.array(z.string().uuid()).max(50) }))
    .query(async ({ ctx, input }) => {
      if (input.sparingOfferIds.length === 0) {
        return { applied: {} as Record<string, string>, ownedIds: [] as string[], ownClubId: null as string | null };
      }
      const club = await ctx.db.club.findUnique({
        where: { userId: ctx.session.user.id },
        select: { id: true },
      });
      if (!club) {
        return { applied: {} as Record<string, string>, ownedIds: [] as string[], ownClubId: null };
      }
      const [apps, owned] = await Promise.all([
        ctx.db.sparingApplication.findMany({
          where: {
            applicantClubId: club.id,
            sparingOfferId: { in: input.sparingOfferIds },
          },
          select: { sparingOfferId: true, status: true },
        }),
        ctx.db.sparingOffer.findMany({
          where: { id: { in: input.sparingOfferIds }, clubId: club.id },
          select: { id: true },
        }),
      ]);
      const applied: Record<string, string> = {};
      for (const a of apps) applied[a.sparingOfferId] = a.status;
      return { applied, ownedIds: owned.map((o) => o.id), ownClubId: club.id };
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
  applyFor: rateLimitedProcedure({ maxAttempts: 10 })
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
          counterProposedDate: input.counterProposedDate ? new Date(input.counterProposedDate) : undefined,
          status: input.counterProposedDate ? "COUNTER_PROPOSED" : "PENDING",
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
      }).catch((err) => console.error("[notification]", err));
      sendPushToUser(offer.club.userId, {
        title: "Nowe zgłoszenie na sparing",
        body: `${club.name} chce zagrać sparing`,
        url: `/sparings/${offer.id}`,
      }).catch((err) => console.error("[push]", err));
      sendEmailToUser(ctx.db, offer.club.userId, "Nowe zgłoszenie na sparing", {
        title: "Nowe zgłoszenie na sparing",
        message: `${club.name} chce zagrać sparing: ${offer.title}`,
        ctaLabel: "Zobacz zgłoszenie",
        ctaUrl: `${baseUrl}/sparings/${offer.id}`,
      }).catch((err) => console.error("[email]", err));

      awardPoints(ctx.db, ctx.session.user.id, "application_sent", application.id).catch((err) => console.error("[awardPoints]", err));

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

      // Guard: prevent accepting if sparing is already matched (race condition)
      if (input.status === "ACCEPTED" && application.sparingOffer.status !== "OPEN") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Sparing został już dopasowany" });
      }

      const updated = await ctx.db.sparingApplication.update({
        where: { id: input.applicationId },
        include: { applicantClub: true, sparingOffer: true },
        data: { status: input.status },
      });

      // If accepted, mark offer as MATCHED (and update matchDate if counter-proposed)
      if (input.status === "ACCEPTED") {
        const updateData: { status: "MATCHED"; matchDate?: Date } = { status: "MATCHED" };
        if (updated.counterProposedDate) {
          updateData.matchDate = updated.counterProposedDate;
        }
        await ctx.db.sparingOffer.update({
          where: { id: application.sparingOfferId },
          data: updateData,
        });
        await ctx.db.sparingApplication.updateMany({
          where: {
            sparingOfferId: application.sparingOfferId,
            id: { not: input.applicationId },
            status: { in: ["PENDING", "COUNTER_PROPOSED"] },
          },
          data: { status: "REJECTED" },
        });

        // Points for match (fire-and-forget)
        awardPoints(ctx.db, ctx.session.user.id, "sparing_matched", application.sparingOfferId).catch((err) => console.error("[awardPoints]", err));
        awardPoints(ctx.db, updated.applicantClub.userId, "application_accepted", application.sparingOfferId).catch((err) => console.error("[awardPoints]", err));
      }

      // Notify applicant (fire-and-forget)
      const notifTitle = input.status === "ACCEPTED" ? "Zgłoszenie zaakceptowane!" : "Zgłoszenie odrzucone";
      const notifMessage = `Twoje zgłoszenie na sparing "${updated.sparingOffer.title}" zostało ${input.status === "ACCEPTED" ? "zaakceptowane" : "odrzucone"}`;
      ctx.db.notification.create({
        data: {
          userId: updated.applicantClub.userId,
          type: input.status === "ACCEPTED" ? "SPARING_ACCEPTED" : "SPARING_REJECTED",
          title: notifTitle,
          message: notifMessage,
          link: `/sparings/${application.sparingOfferId}`,
        },
      }).catch((err) => console.error("[notification]", err));
      sendPushToUser(updated.applicantClub.userId, {
        title: notifTitle,
        body: notifMessage,
        url: `/sparings/${application.sparingOfferId}`,
      }).catch((err) => console.error("[push]", err));
      sendEmailToUser(ctx.db, updated.applicantClub.userId, notifTitle, {
        title: notifTitle,
        message: notifMessage,
        ctaLabel: "Zobacz szczegóły",
        ctaUrl: `${baseUrl}/sparings/${application.sparingOfferId}`,
      }).catch((err) => console.error("[email]", err));

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
        club: { select: { id: true, name: true, city: true, logoUrl: true } },
        region: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }),

  // ===== INVITATIONS =====

  invite: rateLimitedProcedure({ maxAttempts: 10 })
    .input(
      z.object({
        sparingOfferId: z.string().uuid(),
        toClubIds: z.array(z.string().uuid()).min(1).max(5),
        message: z.string().max(500).optional(),
        expiresInHours: z.number().int().min(1).max(168).default(48),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const club = await ctx.db.club.findUnique({
        where: { userId: ctx.session.user.id },
      });
      if (!club) throw new TRPCError({ code: "FORBIDDEN" });

      const sparing = await ctx.db.sparingOffer.findUnique({
        where: { id: input.sparingOfferId },
      });
      if (!sparing || sparing.clubId !== club.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Możesz zapraszać tylko do swoich sparingów" });
      }
      if (sparing.status !== "OPEN") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Sparing nie jest otwarty" });
      }

      const filteredIds = input.toClubIds.filter((id) => id !== club.id);
      if (filteredIds.length === 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Nie możesz zaprosić własnego klubu" });
      }

      const toClubs = await ctx.db.club.findMany({
        where: { id: { in: filteredIds } },
        select: { id: true, userId: true, name: true },
      });
      if (toClubs.length === 0) throw new TRPCError({ code: "NOT_FOUND", message: "Żaden klub nie znaleziony" });

      const expiresAt = new Date(Date.now() + input.expiresInHours * 60 * 60 * 1000);

      const invitations = await Promise.all(
        toClubs.map((toClub) =>
          ctx.db.sparingInvitation.upsert({
            where: {
              sparingOfferId_toClubId: {
                sparingOfferId: input.sparingOfferId,
                toClubId: toClub.id,
              },
            },
            create: {
              sparingOfferId: input.sparingOfferId,
              fromClubId: club.id,
              toClubId: toClub.id,
              message: input.message,
              expiresAt,
            },
            update: {
              message: input.message,
              status: "PENDING",
              expiresAt,
            },
          })
        )
      );

      // Notify all invited clubs (fire-and-forget)
      for (const toClub of toClubs) {
        ctx.db.notification.create({
          data: {
            userId: toClub.userId,
            type: "SPARING_INVITATION",
            title: "Zaproszenie na sparing",
            message: `${club.name} zaprasza Cię na sparing: "${sparing.title}"`,
            link: `/sparings/${sparing.id}`,
          },
        }).catch((err) => console.error("[notification]", err));

        sendPushToUser(toClub.userId, {
          title: "Zaproszenie na sparing",
          body: `${club.name} zaprasza na: ${sparing.title}`,
          url: `/sparings/${sparing.id}`,
        }).catch((err) => console.error("[push]", err));
        sendEmailToUser(ctx.db, toClub.userId, "Zaproszenie na sparing", {
          title: "Zaproszenie na sparing",
          message: `${club.name} zaprasza na: ${sparing.title}`,
          ctaLabel: "Zobacz zaproszenie",
          ctaUrl: `${baseUrl}/sparings/${sparing.id}`,
        }).catch((err) => console.error("[email]", err));
      }

      return invitations;
    }),

  respondToInvitation: protectedProcedure
    .input(
      z.object({
        invitationId: z.string().uuid(),
        accept: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const club = await ctx.db.club.findUnique({
        where: { userId: ctx.session.user.id },
      });
      if (!club) throw new TRPCError({ code: "FORBIDDEN" });

      const invitation = await ctx.db.sparingInvitation.findUnique({
        where: { id: input.invitationId },
        include: {
          sparingOffer: true,
          fromClub: { select: { userId: true, name: true } },
        },
      });
      if (!invitation || invitation.toClubId !== club.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      if (invitation.status !== "PENDING") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Zaproszenie już obsłużone" });
      }
      if (invitation.expiresAt && new Date(invitation.expiresAt) < new Date()) {
        await ctx.db.sparingInvitation.update({
          where: { id: input.invitationId },
          data: { status: "EXPIRED" },
        });
        throw new TRPCError({ code: "BAD_REQUEST", message: "Zaproszenie wygasło" });
      }

      if (input.accept) {
        // Accept invitation → match sparing (interactive transaction to prevent race)
        await ctx.db.$transaction(async (tx) => {
          // Re-check sparing status inside transaction
          const offer = await tx.sparingOffer.findUnique({
            where: { id: invitation.sparingOfferId },
            select: { status: true },
          });
          if (!offer || offer.status !== "OPEN") {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Sparing nie jest już otwarty" });
          }

          await tx.sparingInvitation.update({
            where: { id: input.invitationId },
            data: { status: "ACCEPTED" },
          });
          await tx.sparingOffer.update({
            where: { id: invitation.sparingOfferId },
            data: { status: "MATCHED" },
          });
          await tx.sparingApplication.upsert({
            where: {
              sparingOfferId_applicantClubId: {
                sparingOfferId: invitation.sparingOfferId,
                applicantClubId: club.id,
              },
            },
            create: {
              sparingOfferId: invitation.sparingOfferId,
              applicantClubId: club.id,
              message: invitation.message ?? "Zaakceptowane zaproszenie",
              status: "ACCEPTED",
            },
            update: { status: "ACCEPTED" },
          });
          await tx.sparingApplication.updateMany({
            where: {
              sparingOfferId: invitation.sparingOfferId,
              applicantClubId: { not: club.id },
              status: { in: ["PENDING", "COUNTER_PROPOSED"] },
            },
            data: { status: "REJECTED" },
          });
          await tx.sparingInvitation.updateMany({
            where: {
              sparingOfferId: invitation.sparingOfferId,
              id: { not: input.invitationId },
              status: "PENDING",
            },
            data: { status: "REJECTED" },
          });
        });

        // Notify sparing owner
        ctx.db.notification.create({
          data: {
            userId: invitation.fromClub.userId,
            type: "SPARING_ACCEPTED",
            title: "Zaproszenie zaakceptowane!",
            message: `${club.name} zaakceptował zaproszenie na sparing "${invitation.sparingOffer.title}"`,
            link: `/sparings/${invitation.sparingOfferId}`,
          },
        }).catch((err) => console.error("[notification]", err));

        awardPoints(ctx.db, invitation.fromClub.userId, "sparing_matched", invitation.sparingOfferId).catch((err) => console.error("[awardPoints]", err));

        return { accepted: true };
      }

      // Reject
      await ctx.db.sparingInvitation.update({
        where: { id: input.invitationId },
        data: { status: "REJECTED" },
      });

      ctx.db.notification.create({
        data: {
          userId: invitation.fromClub.userId,
          type: "SPARING_REJECTED",
          title: "Zaproszenie odrzucone",
          message: `${club.name} odrzucił zaproszenie na sparing "${invitation.sparingOffer.title}"`,
          link: `/sparings/${invitation.sparingOfferId}`,
        },
      }).catch((err) => console.error("[notification]", err));

      return { accepted: false };
    }),

  myInvitations: protectedProcedure.query(async ({ ctx }) => {
    const club = await ctx.db.club.findUnique({
      where: { userId: ctx.session.user.id },
    });
    if (!club) return { sent: [], received: [] };

    const [sent, received] = await Promise.all([
      ctx.db.sparingInvitation.findMany({
        where: { fromClubId: club.id },
        include: {
          sparingOffer: { select: { id: true, title: true, matchDate: true } },
          toClub: { select: { id: true, name: true, logoUrl: true, city: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      ctx.db.sparingInvitation.findMany({
        where: { toClubId: club.id, status: "PENDING" },
        include: {
          sparingOffer: { select: { id: true, title: true, matchDate: true, location: true } },
          fromClub: { select: { id: true, name: true, logoUrl: true, city: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
    ]);

    return { sent, received };
  }),

});
