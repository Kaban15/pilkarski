import { z } from "zod/v4";
import { router, protectedProcedure, publicProcedure, rateLimitedProcedure } from "../trpc";
import {
  createEventSchema,
  updateEventSchema,
  applyEventSchema,
  respondEventApplicationSchema,
} from "@/lib/validators/event";
import { TRPCError } from "@trpc/server";
import { awardPoints } from "@/server/award-points";
import { sendPushToUser } from "@/server/send-push";

export const eventRouter = router({
  // Create event (club only)
  create: rateLimitedProcedure({ maxAttempts: 5 })
    .input(createEventSchema)
    .mutation(async ({ ctx, input }) => {
      const club = await ctx.db.club.findUnique({
        where: { userId: ctx.session.user.id },
      });
      if (!club) throw new TRPCError({ code: "FORBIDDEN", message: "Tylko kluby mogą tworzyć wydarzenia" });

      const event = await ctx.db.event.create({
        data: {
          clubId: club.id,
          type: input.type,
          title: input.title,
          description: input.description,
          eventDate: new Date(input.eventDate),
          location: input.location,
          lat: input.lat,
          lng: input.lng,
          maxParticipants: input.maxParticipants,
          regionId: input.regionId ?? club.regionId,
          targetPosition: input.targetPosition,
          targetAgeMin: input.targetAgeMin,
          targetAgeMax: input.targetAgeMax,
          targetLevel: input.targetLevel,
          priceInfo: input.priceInfo,
        },
      });

      const recruitTypes = ["RECRUITMENT", "TRYOUT", "CAMP", "CONTINUOUS_RECRUITMENT"];
      const isRecruitment = recruitTypes.includes(input.type);

      awardPoints(ctx.db, ctx.session.user.id, isRecruitment ? "recruitment_created" : "event_created", event.id).catch(() => {});

      // Notify club followers (fire-and-forget)
      ctx.db.clubFollower.findMany({
        where: { clubId: club.id },
        select: { userId: true },
      }).then((followers: { userId: string }[]) => {
        if (followers.length === 0) return;
        const typeLabel = isRecruitment ? "nabór" : "wydarzenie";
        const notifType = isRecruitment ? "RECRUITMENT_NEW" as const : "EVENT_APPLICATION" as const;
        ctx.db.notification.createMany({
          data: followers.map((f: { userId: string }) => ({
            userId: f.userId,
            type: notifType,
            title: `Nowy ${typeLabel} od obserwowanego klubu`,
            message: `${club.name} dodał ${typeLabel}: ${input.title}`,
            link: `/events/${event.id}`,
          })),
        }).catch(() => {});
      }).catch(() => {});

      // Notify matching players in region (fire-and-forget, recruitment only)
      if (isRecruitment) {
        const targetRegionId = input.regionId ?? club.regionId;
        if (targetRegionId) {
          const playerWhere: Record<string, unknown> = { regionId: targetRegionId };
          if (input.targetPosition) {
            playerWhere.primaryPosition = input.targetPosition;
          }

          ctx.db.player.findMany({
            where: playerWhere,
            select: { userId: true },
            take: 100,
          }).then((players: { userId: string }[]) => {
            if (players.length === 0) return;
            ctx.db.notification.createMany({
              data: players.map((p: { userId: string }) => ({
                userId: p.userId,
                type: "RECRUITMENT_MATCH" as const,
                title: "Nabór w Twoim regionie",
                message: `${club.name} szuka zawodników: ${input.title}`,
                link: `/events/${event.id}`,
              })),
            }).catch(() => {});
          }).catch(() => {});
        }
      }

      return event;
    }),

  update: protectedProcedure
    .input(updateEventSchema)
    .mutation(async ({ ctx, input }) => {
      const club = await ctx.db.club.findUnique({
        where: { userId: ctx.session.user.id },
      });
      if (!club) throw new TRPCError({ code: "FORBIDDEN" });

      const event = await ctx.db.event.findUnique({ where: { id: input.id } });
      if (!event) throw new TRPCError({ code: "NOT_FOUND" });
      if (event.clubId !== club.id) throw new TRPCError({ code: "FORBIDDEN" });

      return ctx.db.event.update({
        where: { id: input.id },
        data: {
          type: input.type,
          title: input.title,
          description: input.description,
          eventDate: new Date(input.eventDate),
          location: input.location,
          lat: input.lat,
          lng: input.lng,
          maxParticipants: input.maxParticipants,
          regionId: input.regionId,
          targetPosition: input.targetPosition,
          targetAgeMin: input.targetAgeMin,
          targetAgeMax: input.targetAgeMax,
          targetLevel: input.targetLevel,
          priceInfo: input.priceInfo,
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

      const event = await ctx.db.event.findUnique({ where: { id: input.id } });
      if (!event) throw new TRPCError({ code: "NOT_FOUND" });
      if (event.clubId !== club.id) throw new TRPCError({ code: "FORBIDDEN" });

      return ctx.db.event.delete({ where: { id: input.id } });
    }),

  list: publicProcedure
    .input(
      z.object({
        clubId: z.string().uuid().optional(),
        regionId: z.number().int().optional(),
        type: z.enum(["OPEN_TRAINING", "RECRUITMENT", "TRYOUT", "CAMP", "CONTINUOUS_RECRUITMENT", "INDIVIDUAL_TRAINING", "GROUP_TRAINING"]).optional(),
        city: z.string().max(100).optional(),
        dateFrom: z.string().optional(),
        dateTo: z.string().optional(),
        sortBy: z.enum(["eventDate", "createdAt", "title"]).default("eventDate"),
        sortOrder: z.enum(["asc", "desc"]).default("asc"),
        cursor: z.string().uuid().optional(),
        limit: z.number().int().min(1).max(50).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: any = {};
      if (input.clubId) where.clubId = input.clubId;
      if (input.regionId) where.regionId = input.regionId;
      if (input.type) where.type = input.type;
      if (input.city) {
        where.club = { city: { contains: input.city, mode: "insensitive" } };
      }
      if (input.dateFrom || input.dateTo) {
        where.eventDate = {};
        if (input.dateFrom) where.eventDate.gte = new Date(input.dateFrom);
        else where.eventDate.gte = new Date(); // default: future events
        if (input.dateTo) where.eventDate.lte = new Date(input.dateTo);
      } else {
        where.eventDate = { gte: new Date() };
      }

      const items = await ctx.db.event.findMany({
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

  // Get single event with applications
  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const event = await ctx.db.event.findUnique({
        where: { id: input.id },
        include: {
          club: { select: { id: true, name: true, city: true, logoUrl: true, userId: true } },
          region: true,
          applications: {
            include: {
              player: {
                select: { id: true, firstName: true, lastName: true, primaryPosition: true, photoUrl: true },
              },
            },
            orderBy: { createdAt: "desc" },
          },
        },
      });
      if (!event) throw new TRPCError({ code: "NOT_FOUND" });
      return event;
    }),

  // Apply for event (player only)
  applyFor: rateLimitedProcedure({ maxAttempts: 10 })
    .input(applyEventSchema)
    .mutation(async ({ ctx, input }) => {
      const player = await ctx.db.player.findUnique({
        where: { userId: ctx.session.user.id },
      });
      if (!player) throw new TRPCError({ code: "FORBIDDEN", message: "Tylko zawodnicy mogą się zgłaszać" });

      const event = await ctx.db.event.findUnique({
        where: { id: input.eventId },
        include: { club: { select: { userId: true } } },
      });
      if (!event) throw new TRPCError({ code: "NOT_FOUND" });

      // Check max participants
      if (event.maxParticipants) {
        const acceptedCount = await ctx.db.eventApplication.count({
          where: { eventId: input.eventId, status: "ACCEPTED" },
        });
        if (acceptedCount >= event.maxParticipants) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Brak wolnych miejsc" });
        }
      }

      const application = await ctx.db.eventApplication.create({
        data: {
          eventId: input.eventId,
          playerId: player.id,
          message: input.message,
        },
      });

      // Notify event owner (fire-and-forget)
      ctx.db.notification.create({
        data: {
          userId: event.club.userId,
          type: "EVENT_APPLICATION",
          title: "Nowe zgłoszenie na wydarzenie",
          message: `${player.firstName} ${player.lastName} zgłosił się na "${event.title}"`,
          link: `/events/${event.id}`,
        },
      }).catch(() => {});
      sendPushToUser(event.club.userId, {
        title: "Nowe zgłoszenie na wydarzenie",
        body: `${player.firstName} ${player.lastName} zgłosił się na "${event.title}"`,
        url: `/events/${event.id}`,
      }).catch(() => {});

      return application;
    }),

  // Accept/reject player application (club owner only)
  respond: protectedProcedure
    .input(respondEventApplicationSchema)
    .mutation(async ({ ctx, input }) => {
      const club = await ctx.db.club.findUnique({
        where: { userId: ctx.session.user.id },
      });
      if (!club) throw new TRPCError({ code: "FORBIDDEN" });

      const application = await ctx.db.eventApplication.findUnique({
        where: { id: input.applicationId },
        include: { event: true },
      });
      if (!application) throw new TRPCError({ code: "NOT_FOUND" });
      if (application.event.clubId !== club.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const updated = await ctx.db.eventApplication.update({
        where: { id: input.applicationId },
        include: { player: true, event: true },
        data: { status: input.status },
      });

      // Notify player (fire-and-forget)
      const evtNotifTitle = input.status === "ACCEPTED" ? "Zgłoszenie zaakceptowane!" : "Zgłoszenie odrzucone";
      const evtNotifMsg = `Twoje zgłoszenie na "${updated.event.title}" zostało ${input.status === "ACCEPTED" ? "zaakceptowane" : "odrzucone"}`;
      ctx.db.notification.create({
        data: {
          userId: updated.player.userId,
          type: input.status === "ACCEPTED" ? "EVENT_ACCEPTED" : "EVENT_REJECTED",
          title: evtNotifTitle,
          message: evtNotifMsg,
          link: `/events/${application.event.id}`,
        },
      }).catch(() => {});
      sendPushToUser(updated.player.userId, {
        title: evtNotifTitle,
        body: evtNotifMsg,
        url: `/events/${application.event.id}`,
      }).catch(() => {});

      return updated;
    }),

  // My events (as club owner)
  my: protectedProcedure.query(async ({ ctx }) => {
    const club = await ctx.db.club.findUnique({
      where: { userId: ctx.session.user.id },
    });
    if (!club) return [];

    return ctx.db.event.findMany({
      where: { clubId: club.id },
      include: {
        region: true,
        _count: { select: { applications: true } },
      },
      orderBy: { eventDate: "desc" },
    });
  }),

  // My applications (as player)
  myApplications: protectedProcedure.query(async ({ ctx }) => {
    const player = await ctx.db.player.findUnique({
      where: { userId: ctx.session.user.id },
    });
    if (!player) return [];

    return ctx.db.eventApplication.findMany({
      where: { playerId: player.id },
      include: {
        event: {
          include: {
            club: { select: { name: true, city: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }),
});
