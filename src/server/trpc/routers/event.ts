import { z } from "zod/v4";
import { router, protectedProcedure, publicProcedure } from "../trpc";
import {
  createEventSchema,
  applyEventSchema,
  respondEventApplicationSchema,
} from "@/lib/validators/event";
import { TRPCError } from "@trpc/server";

export const eventRouter = router({
  // Create event (club only)
  create: protectedProcedure
    .input(createEventSchema)
    .mutation(async ({ ctx, input }) => {
      const club = await ctx.db.club.findUnique({
        where: { userId: ctx.session.user.id },
      });
      if (!club) throw new TRPCError({ code: "FORBIDDEN", message: "Tylko kluby mogą tworzyć wydarzenia" });

      return ctx.db.event.create({
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
        },
      });
    }),

  // List events (with filters)
  list: publicProcedure
    .input(
      z.object({
        regionId: z.number().int().optional(),
        type: z.enum(["OPEN_TRAINING", "RECRUITMENT"]).optional(),
        cursor: z.string().uuid().optional(),
        limit: z.number().int().min(1).max(50).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: any = { eventDate: { gte: new Date() } };
      if (input.regionId) where.regionId = input.regionId;
      if (input.type) where.type = input.type;

      const items = await ctx.db.event.findMany({
        where,
        include: {
          club: { select: { id: true, name: true, city: true, logoUrl: true } },
          region: true,
          _count: { select: { applications: true } },
        },
        take: input.limit + 1,
        ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
        orderBy: { eventDate: "asc" },
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
  applyFor: protectedProcedure
    .input(applyEventSchema)
    .mutation(async ({ ctx, input }) => {
      const player = await ctx.db.player.findUnique({
        where: { userId: ctx.session.user.id },
      });
      if (!player) throw new TRPCError({ code: "FORBIDDEN", message: "Tylko zawodnicy mogą się zgłaszać" });

      const event = await ctx.db.event.findUnique({ where: { id: input.eventId } });
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

      return ctx.db.eventApplication.create({
        data: {
          eventId: input.eventId,
          playerId: player.id,
          message: input.message,
        },
      });
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

      return ctx.db.eventApplication.update({
        where: { id: input.applicationId },
        data: { status: input.status },
      });
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
