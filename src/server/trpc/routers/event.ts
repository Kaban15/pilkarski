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
import { isClubMember } from "@/server/is-club-member";
import { getUserClubId } from "@/server/get-user-club-id";

export const eventRouter = router({
  // Create event (club only)
  create: rateLimitedProcedure({ maxAttempts: 5 })
    .input(createEventSchema)
    .mutation(async ({ ctx, input }) => {
      const role = ctx.session.user.role;
      const isCoach = role === "COACH";
      const trainingTypes = ["INDIVIDUAL_TRAINING", "GROUP_TRAINING"];
      const isTrainingType = trainingTypes.includes(input.type);

      let clubId: string | null = null;
      let coachId: string | null = null;
      let regionId: number | null = input.regionId ?? null;

      if (isCoach) {
        if (!isTrainingType) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Trenerzy mogą tworzyć tylko treningi" });
        }
        const coach = await ctx.db.coach.findUnique({
          where: { userId: ctx.session.user.id },
        });
        if (!coach) throw new TRPCError({ code: "FORBIDDEN" });

        // Coach must be accepted member of a club with canManageEvents
        const membership = await ctx.db.clubMembership.findFirst({
          where: {
            memberUserId: ctx.session.user.id,
            status: "ACCEPTED",
            canManageEvents: true,
          },
          include: { club: { select: { id: true, regionId: true } } },
        });
        if (!membership) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Musisz należeć do klubu i mieć uprawnienia do zarządzania wydarzeniami",
          });
        }

        clubId = membership.club.id;
        coachId = coach.id;
        regionId = regionId ?? membership.club.regionId;
      } else {
        const club = await ctx.db.club.findUnique({
          where: { userId: ctx.session.user.id },
        });
        if (!club) throw new TRPCError({ code: "FORBIDDEN", message: "Tylko kluby i trenerzy mogą tworzyć wydarzenia" });
        clubId = club.id;
        regionId = regionId ?? club.regionId;
      }

      const event = await ctx.db.event.create({
        data: {
          clubId,
          coachId,
          type: input.type,
          title: input.title,
          description: input.description,
          eventDate: new Date(input.eventDate),
          location: input.location,
          lat: input.lat,
          lng: input.lng,
          maxParticipants: input.maxParticipants,
          regionId,
          targetPosition: input.targetPosition,
          targetAgeMin: input.targetAgeMin,
          targetAgeMax: input.targetAgeMax,
          targetLevel: input.targetLevel,
          visibility: input.visibility,
          costPerPerson: input.costPerPerson,
        },
      });

      const recruitTypes = ["RECRUITMENT", "TRYOUT", "CAMP", "CONTINUOUS_RECRUITMENT"];
      const isRecruitment = recruitTypes.includes(input.type);

      awardPoints(ctx.db, ctx.session.user.id, isRecruitment ? "recruitment_created" : "event_created", event.id).catch(() => {});

      // Notify club followers (fire-and-forget) — only for club-created events
      if (!clubId) return event;

      const clubData = await ctx.db.club.findUnique({
        where: { id: clubId },
        select: { name: true, regionId: true },
      });
      if (!clubData) return event;

      // Notify club members about INTERNAL events (fire-and-forget)
      if (input.visibility === "INTERNAL") {
        ctx.db.clubMembership.findMany({
          where: { clubId, status: "ACCEPTED" },
          select: { memberUserId: true },
        }).then(async (members: { memberUserId: string }[]) => {
          if (members.length === 0) return;
          const { formatEventDateTime } = await import("@/lib/format");
          const dateStr = formatEventDateTime(input.eventDate);
          ctx.db.notification.createMany({
            data: members.map((m) => ({
              userId: m.memberUserId,
              type: "REMINDER" as const,
              title: `${clubData.name}: Nowe wydarzenie wewnętrzne`,
              message: `${input.title} — ${dateStr}. Zadeklaruj obecność!`,
              link: `/events/${event.id}`,
            })),
          }).catch(() => {});
          await Promise.allSettled(members.map((m) =>
            sendPushToUser(m.memberUserId, {
              title: `${clubData.name}: Nowe wydarzenie`,
              body: `${input.title} — ${dateStr}`,
              url: `/events/${event.id}`,
            })
          ));
        }).catch(() => {});
      }

      ctx.db.clubFollower.findMany({
        where: { clubId },
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
            message: `${clubData.name} dodał ${typeLabel}: ${input.title}`,
            link: `/events/${event.id}`,
          })),
        }).catch(() => {});
      }).catch(() => {});

      // Notify matching players in region (fire-and-forget, recruitment only)
      if (isRecruitment && regionId) {
        const playerWhere: Record<string, unknown> = { regionId, lookingForClub: true };
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
              title: `${clubData.name} ogłosił nabór w Twoim regionie`,
              message: input.title,
              link: `/events/${event.id}`,
            })),
          }).catch(() => {});
        }).catch(() => {});
      }

      // Notify matching coaches in region (fire-and-forget)
      if (isRecruitment && regionId) {
        ctx.db.coach.findMany({
          where: { regionId, lookingForClub: true },
          select: { userId: true },
          take: 50,
        }).then((coaches: { userId: string }[]) => {
          if (coaches.length === 0) return;
          ctx.db.notification.createMany({
            data: coaches.map((c: { userId: string }) => ({
              userId: c.userId,
              type: "RECRUITMENT_MATCH" as const,
              title: `${clubData.name} ogłosił nabór w Twoim regionie`,
              message: input.title,
              link: `/events/${event.id}`,
            })),
          }).catch(() => {});
        }).catch(() => {});
      }

      return event;
    }),

  update: protectedProcedure
    .input(updateEventSchema)
    .mutation(async ({ ctx, input }) => {
      const event = await ctx.db.event.findUnique({ where: { id: input.id } });
      if (!event) throw new TRPCError({ code: "NOT_FOUND" });

      // Check ownership: club owner or coach creator
      const userId = ctx.session.user.id;
      if (event.clubId) {
        const club = await ctx.db.club.findUnique({ where: { userId } });
        if (!club || event.clubId !== club.id) throw new TRPCError({ code: "FORBIDDEN" });
      } else if (event.coachId) {
        const coach = await ctx.db.coach.findUnique({ where: { userId } });
        if (!coach || event.coachId !== coach.id) throw new TRPCError({ code: "FORBIDDEN" });
      } else {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

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
          costPerPerson: input.costPerPerson,
        },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const event = await ctx.db.event.findUnique({ where: { id: input.id } });
      if (!event) throw new TRPCError({ code: "NOT_FOUND" });

      const userId = ctx.session.user.id;
      if (event.clubId) {
        const club = await ctx.db.club.findUnique({ where: { userId } });
        if (!club || event.clubId !== club.id) throw new TRPCError({ code: "FORBIDDEN" });
      } else if (event.coachId) {
        const coach = await ctx.db.coach.findUnique({ where: { userId } });
        if (!coach || event.coachId !== coach.id) throw new TRPCError({ code: "FORBIDDEN" });
      } else {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      return ctx.db.event.delete({ where: { id: input.id } });
    }),

  recentLocations: protectedProcedure.query(async ({ ctx }) => {
    const clubId = await getUserClubId(ctx.db, ctx.session.user.id, ctx.session.user.role);
    if (!clubId) return [];

    const events = await ctx.db.event.findMany({
      where: { clubId, location: { not: null } },
      select: { location: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    // Deduplicate and return unique locations, most recent first
    const seen = new Set<string>();
    const locations: string[] = [];
    for (const e of events) {
      if (e.location && !seen.has(e.location)) {
        seen.add(e.location);
        locations.push(e.location);
      }
    }
    return locations;
  }),

  updateLocation: protectedProcedure
    .input(z.object({
      oldLocation: z.string().min(1),
      newLocation: z.string().min(1).max(300),
    }))
    .mutation(async ({ ctx, input }) => {
      const clubId = await getUserClubId(ctx.db, ctx.session.user.id, ctx.session.user.role);
      if (!clubId) throw new TRPCError({ code: "FORBIDDEN" });

      await ctx.db.event.updateMany({
        where: { clubId, location: input.oldLocation },
        data: { location: input.newLocation },
      });

      return { updated: true };
    }),

  list: publicProcedure
    .input(
      z.object({
        clubId: z.string().uuid().optional(),
        regionId: z.number().int().optional(),
        type: z.enum(["OPEN_TRAINING", "RECRUITMENT", "TRYOUT", "CAMP", "CONTINUOUS_RECRUITMENT", "INDIVIDUAL_TRAINING", "GROUP_TRAINING"]).optional(),
        types: z.array(z.enum(["OPEN_TRAINING", "RECRUITMENT", "TRYOUT", "CAMP", "CONTINUOUS_RECRUITMENT", "INDIVIDUAL_TRAINING", "GROUP_TRAINING"])).optional(),
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
      if (input.types && input.types.length > 0) {
        where.type = { in: input.types };
      } else if (input.type) {
        where.type = input.type;
      }
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

      // Only show PUBLIC events in public listing; INTERNAL events are visible via club's own endpoints
      (where as Record<string, unknown>).visibility = "PUBLIC";

      const items = await ctx.db.event.findMany({
        where,
        include: {
          club: { select: { id: true, name: true, city: true, logoUrl: true } },
          coach: { select: { id: true, firstName: true, lastName: true, photoUrl: true } },
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

  // Get single event with applications (filtered by auth)
  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const event = await ctx.db.event.findUnique({
        where: { id: input.id },
        include: {
          club: { select: { id: true, name: true, city: true, logoUrl: true, userId: true } },
          coach: { select: { id: true, firstName: true, lastName: true, photoUrl: true, userId: true } },
          region: true,
          applications: {
            include: {
              player: {
                select: { id: true, firstName: true, lastName: true, primaryPosition: true, photoUrl: true, userId: true },
              },
            },
            orderBy: { createdAt: "desc" },
          },
        },
      });
      if (!event) throw new TRPCError({ code: "NOT_FOUND" });

      // Visibility check for INTERNAL events
      if (event.visibility === "INTERNAL") {
        const userId = ctx.session?.user?.id;
        if (!userId) throw new TRPCError({ code: "NOT_FOUND" });

        const isOwner = event.club?.userId === userId || event.coach?.userId === userId;
        if (!isOwner) {
          const clubId = event.clubId;
          if (!clubId) throw new TRPCError({ code: "NOT_FOUND" });
          const member = await isClubMember(userId, clubId);
          if (!member) throw new TRPCError({ code: "NOT_FOUND" });
        }
      }

      // Filter applications: owner sees all, applicant sees only own, others see none
      const userId = ctx.session?.user?.id;
      const isClubOwner = userId && event.club?.userId === userId;
      const isCoachOwner = userId && event.coachId
        ? await ctx.db.coach.findUnique({ where: { userId }, select: { id: true } }).then((c) => c?.id === event.coachId)
        : false;
      const isOwner = isClubOwner || isCoachOwner;
      if (!isOwner) {
        event.applications = event.applications.filter(
          (a) => a.player.userId === userId
        );
      }

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
      const ownerUserId = event.club?.userId;
      if (ownerUserId) {
        ctx.db.notification.create({
          data: {
            userId: ownerUserId,
            type: "EVENT_APPLICATION",
            title: "Nowe zgłoszenie na wydarzenie",
            message: `${player.firstName} ${player.lastName} zgłosił się na "${event.title}"`,
            link: `/events/${event.id}`,
          },
        }).catch(() => {});
      }
      if (ownerUserId) sendPushToUser(ownerUserId, {
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

  recommendedTrainings: protectedProcedure
    .input(z.object({ limit: z.number().int().min(1).max(20).default(6) }))
    .query(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "PLAYER") return { items: [] };

      const player = await ctx.db.player.findUnique({
        where: { userId: ctx.session.user.id },
        select: { regionId: true, primaryPosition: true, dateOfBirth: true },
      });
      if (!player) return { items: [] };

      const now = new Date();
      const where: Record<string, unknown> = {
        type: { in: ["INDIVIDUAL_TRAINING", "GROUP_TRAINING"] },
        eventDate: { gte: now },
      };

      // Filter by player's region if available
      if (player.regionId) {
        where.regionId = player.regionId;
      }

      // Filter by player's position if available
      if (player.primaryPosition) {
        where.OR = [
          { targetPosition: player.primaryPosition },
          { targetPosition: null },
        ];
      }

      const items = await ctx.db.event.findMany({
        where,
        include: {
          club: { select: { id: true, name: true, city: true, logoUrl: true } },
          region: { select: { name: true } },
        },
        orderBy: { eventDate: "asc" },
        take: input.limit,
      });

      return { items };
    }),

  setAttendance: protectedProcedure
    .input(z.object({
      eventId: z.string().uuid(),
      status: z.enum(["YES", "NO", "MAYBE"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const event = await ctx.db.event.findUnique({
        where: { id: input.eventId },
        select: { visibility: true, clubId: true },
      });
      if (!event) throw new TRPCError({ code: "NOT_FOUND" });
      if (event.visibility !== "INTERNAL") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Obecność dostępna tylko dla wydarzeń wewnętrznych" });
      }
      if (!event.clubId) throw new TRPCError({ code: "BAD_REQUEST" });

      const member = await isClubMember(userId, event.clubId);
      if (!member) throw new TRPCError({ code: "FORBIDDEN" });

      return ctx.db.eventAttendance.upsert({
        where: { eventId_userId: { eventId: input.eventId, userId } },
        create: { eventId: input.eventId, userId, status: input.status },
        update: { status: input.status },
      });
    }),

  getAttendance: protectedProcedure
    .input(z.object({ eventId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const event = await ctx.db.event.findUnique({
        where: { id: input.eventId },
        select: { visibility: true, clubId: true },
      });
      if (!event || event.visibility !== "INTERNAL" || !event.clubId) {
        return { items: [], stats: { yes: 0, no: 0, maybe: 0 }, myStatus: null as string | null };
      }

      const member = await isClubMember(userId, event.clubId);
      if (!member) return { items: [], stats: { yes: 0, no: 0, maybe: 0 }, myStatus: null as string | null };

      const items = await ctx.db.eventAttendance.findMany({
        where: { eventId: input.eventId },
        include: {
          user: {
            select: {
              id: true,
              player: { select: { id: true, firstName: true, lastName: true, photoUrl: true } },
              coach: { select: { id: true, firstName: true, lastName: true, photoUrl: true } },
            },
          },
        },
        orderBy: { updatedAt: "desc" },
      });

      const stats = { yes: 0, no: 0, maybe: 0 };
      let myStatus: string | null = null;
      for (const item of items) {
        if (item.status === "YES") stats.yes++;
        else if (item.status === "NO") stats.no++;
        else stats.maybe++;
        if (item.userId === userId) myStatus = item.status;
      }

      return { items, stats, myStatus };
    }),
});
