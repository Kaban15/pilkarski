import { z } from "zod/v4";
import { router, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { sendPushToUser } from "@/server/send-push";

export const clubMembershipRouter = router({
  requestJoin: protectedProcedure
    .input(z.object({
      clubId: z.string().uuid(),
      message: z.string().max(500).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const role = ctx.session.user.role;
      if (role !== "PLAYER" && role !== "COACH") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Tylko zawodnicy i trenerzy mogą dołączać do klubów" });
      }

      const userId = ctx.session.user.id;

      // Check no existing PENDING or ACCEPTED membership
      const existing = await ctx.db.clubMembership.findUnique({
        where: { clubId_memberUserId: { clubId: input.clubId, memberUserId: userId } },
      });
      if (existing?.status === "ACCEPTED") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Już jesteś członkiem tego klubu" });
      }
      if (existing?.status === "PENDING") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Prośba o dołączenie już wysłana" });
      }

      const memberType = role === "COACH" ? "COACH" as const : "PLAYER" as const;

      const membership = await ctx.db.clubMembership.upsert({
        where: { clubId_memberUserId: { clubId: input.clubId, memberUserId: userId } },
        create: {
          clubId: input.clubId,
          memberUserId: userId,
          memberType,
          message: input.message,
          status: "PENDING",
        },
        update: {
          status: "PENDING",
          message: input.message,
          memberType,
        },
      });

      // Notify club owner
      const club = await ctx.db.club.findUnique({
        where: { id: input.clubId },
        select: { userId: true, name: true },
      });
      if (club) {
        const memberName = role === "COACH"
          ? await ctx.db.coach.findUnique({ where: { userId }, select: { firstName: true, lastName: true } })
          : await ctx.db.player.findUnique({ where: { userId }, select: { firstName: true, lastName: true } });
        const name = memberName ? `${memberName.firstName} ${memberName.lastName}` : "Ktoś";

        ctx.db.notification.create({
          data: {
            userId: club.userId,
            type: "MEMBERSHIP_REQUEST",
            title: "Prośba o dołączenie do klubu",
            message: `${name} (${role === "COACH" ? "trener" : "zawodnik"}) chce dołączyć do ${club.name}`,
            link: "/squad",
          },
        }).catch(() => {});
      }

      return membership;
    }),

  listRequestsForClub: protectedProcedure.query(async ({ ctx }) => {
    const club = await ctx.db.club.findUnique({
      where: { userId: ctx.session.user.id },
    });
    if (!club) return [];

    return ctx.db.clubMembership.findMany({
      where: { clubId: club.id, status: { in: ["PENDING", "INVITED"] } },
      include: {
        memberUser: {
          include: {
            player: { select: { id: true, firstName: true, lastName: true, primaryPosition: true, photoUrl: true } },
            coach: { select: { id: true, firstName: true, lastName: true, specialization: true, photoUrl: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }),

  listMembers: protectedProcedure
    .input(z.object({ clubId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.clubMembership.findMany({
        where: { clubId: input.clubId, status: "ACCEPTED" },
        include: {
          memberUser: {
            include: {
              player: { select: { id: true, firstName: true, lastName: true, primaryPosition: true, photoUrl: true, city: true } },
              coach: { select: { id: true, firstName: true, lastName: true, specialization: true, photoUrl: true } },
            },
          },
        },
        orderBy: { acceptedAt: "desc" },
      });
    }),

  respond: protectedProcedure
    .input(z.object({
      membershipId: z.string().uuid(),
      decision: z.enum(["ACCEPT", "REJECT"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const club = await ctx.db.club.findUnique({
        where: { userId: ctx.session.user.id },
      });
      if (!club) throw new TRPCError({ code: "FORBIDDEN" });

      const membership = await ctx.db.clubMembership.findUnique({
        where: { id: input.membershipId },
      });
      if (!membership || membership.clubId !== club.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      if (membership.status !== "PENDING") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Prośba już obsłużona" });
      }

      if (input.decision === "ACCEPT") {
        const updated = await ctx.db.clubMembership.update({
          where: { id: input.membershipId },
          data: { status: "ACCEPTED", acceptedAt: new Date() },
        });

        ctx.db.notification.create({
          data: {
            userId: membership.memberUserId,
            type: "MEMBERSHIP_ACCEPTED",
            title: "Dołączyłeś do klubu!",
            message: `${club.name} zaakceptował Twoją prośbę o dołączenie`,
            link: `/clubs/${club.id}/internal`,
          },
        }).catch(() => {});

        return updated;
      }

      return ctx.db.clubMembership.update({
        where: { id: input.membershipId },
        data: { status: "REJECTED" },
      });
    }),

  leaveClub: protectedProcedure
    .input(z.object({ clubId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const membership = await ctx.db.clubMembership.findUnique({
        where: { clubId_memberUserId: { clubId: input.clubId, memberUserId: userId } },
      });
      if (!membership || membership.status !== "ACCEPTED") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Nie jesteś członkiem tego klubu" });
      }

      return ctx.db.clubMembership.update({
        where: { id: membership.id },
        data: { status: "LEFT" },
      });
    }),

  removeMember: protectedProcedure
    .input(z.object({ membershipId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const club = await ctx.db.club.findUnique({
        where: { userId: ctx.session.user.id },
      });
      if (!club) throw new TRPCError({ code: "FORBIDDEN" });

      const membership = await ctx.db.clubMembership.findUnique({
        where: { id: input.membershipId },
      });
      if (!membership || membership.clubId !== club.id || membership.status !== "ACCEPTED") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      return ctx.db.clubMembership.update({
        where: { id: input.membershipId },
        data: { status: "REMOVED" },
      });
    }),

  myMembership: protectedProcedure
    .input(z.object({ clubId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.clubMembership.findUnique({
        where: { clubId_memberUserId: { clubId: input.clubId, memberUserId: ctx.session.user.id } },
      });
    }),

  myClub: protectedProcedure.query(async ({ ctx }) => {
    const membership = await ctx.db.clubMembership.findFirst({
      where: { memberUserId: ctx.session.user.id, status: "ACCEPTED" },
      select: {
        id: true,
        canManageEvents: true,
        club: { select: { id: true, name: true, logoUrl: true, city: true } },
      },
    });
    return membership;
  }),

  setPermissions: protectedProcedure
    .input(z.object({
      membershipId: z.string().uuid(),
      canManageEvents: z.boolean(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const membership = await ctx.db.clubMembership.findUnique({
        where: { id: input.membershipId },
        include: { club: { select: { userId: true } } },
      });
      if (!membership) throw new TRPCError({ code: "NOT_FOUND" });
      if (membership.club.userId !== userId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Tylko właściciel klubu może zmieniać uprawnienia" });
      }
      if (membership.status !== "ACCEPTED") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Można zmieniać uprawnienia tylko aktywnych członków" });
      }

      return ctx.db.clubMembership.update({
        where: { id: input.membershipId },
        data: { canManageEvents: input.canManageEvents },
      });
    }),

  searchUsers: protectedProcedure
    .input(z.object({
      query: z.string().min(2).max(100),
      limit: z.number().int().min(1).max(20).default(10),
    }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const club = await ctx.db.club.findUnique({
        where: { userId },
        select: { id: true },
      });
      if (!club) throw new TRPCError({ code: "FORBIDDEN", message: "Tylko kluby mogą wyszukiwać" });

      const existing = await ctx.db.clubMembership.findMany({
        where: {
          clubId: club.id,
          status: { in: ["ACCEPTED", "INVITED", "PENDING"] },
        },
        select: { memberUserId: true },
      });
      const excludeIds = [userId, ...existing.map((m) => m.memberUserId)];

      const [players, coaches] = await Promise.all([
        ctx.db.player.findMany({
          where: {
            userId: { notIn: excludeIds },
            OR: [
              { firstName: { contains: input.query, mode: "insensitive" } },
              { lastName: { contains: input.query, mode: "insensitive" } },
            ],
          },
          select: {
            userId: true,
            firstName: true,
            lastName: true,
            photoUrl: true,
            city: true,
            primaryPosition: true,
          },
          take: input.limit,
        }),
        ctx.db.coach.findMany({
          where: {
            userId: { notIn: excludeIds },
            OR: [
              { firstName: { contains: input.query, mode: "insensitive" } },
              { lastName: { contains: input.query, mode: "insensitive" } },
            ],
          },
          select: {
            userId: true,
            firstName: true,
            lastName: true,
            photoUrl: true,
            city: true,
            specialization: true,
          },
          take: input.limit,
        }),
      ]);

      return {
        players: players.map((p) => ({ ...p, role: "PLAYER" as const })),
        coaches: coaches.map((c) => ({ ...c, role: "COACH" as const })),
      };
    }),

  invite: protectedProcedure
    .input(z.object({
      userId: z.string().uuid(),
      message: z.string().max(500).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const callerId = ctx.session.user.id;
      const club = await ctx.db.club.findUnique({
        where: { userId: callerId },
        select: { id: true, name: true },
      });
      if (!club) throw new TRPCError({ code: "FORBIDDEN", message: "Tylko kluby mogą zapraszać" });

      const targetUser = await ctx.db.user.findUnique({
        where: { id: input.userId },
        select: { role: true },
      });
      if (!targetUser || (targetUser.role !== "PLAYER" && targetUser.role !== "COACH")) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Można zapraszać tylko zawodników i trenerów" });
      }

      const existing = await ctx.db.clubMembership.findUnique({
        where: { clubId_memberUserId: { clubId: club.id, memberUserId: input.userId } },
      });
      if (existing && ["ACCEPTED", "INVITED", "PENDING"].includes(existing.status)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Ten użytkownik jest już członkiem lub zaproszony" });
      }

      const memberType = targetUser.role === "PLAYER" ? "PLAYER" : "COACH";

      const membership = existing
        ? await ctx.db.clubMembership.update({
            where: { id: existing.id },
            data: { status: "INVITED", memberType, message: input.message },
          })
        : await ctx.db.clubMembership.create({
            data: {
              clubId: club.id,
              memberUserId: input.userId,
              memberType,
              status: "INVITED",
              message: input.message,
            },
          });

      ctx.db.notification.create({
        data: {
          userId: input.userId,
          type: "CLUB_INVITATION",
          title: "Zaproszenie do klubu",
          message: `Klub ${club.name} zaprasza Cię do kadry`,
          link: "/feed",
        },
      }).catch(() => {});

      sendPushToUser(input.userId, {
        title: "Zaproszenie do klubu",
        body: `Klub ${club.name} zaprasza Cię do kadry`,
        url: "/feed",
      }).catch(() => {});

      return membership;
    }),

  respondToInvite: protectedProcedure
    .input(z.object({
      membershipId: z.string().uuid(),
      decision: z.enum(["ACCEPT", "REJECT"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const membership = await ctx.db.clubMembership.findUnique({
        where: { id: input.membershipId },
        include: { club: { select: { userId: true, name: true } } },
      });
      if (!membership) throw new TRPCError({ code: "NOT_FOUND" });
      if (membership.memberUserId !== userId) throw new TRPCError({ code: "FORBIDDEN" });
      if (membership.status !== "INVITED") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "To zaproszenie nie jest już aktywne" });
      }

      if (input.decision === "ACCEPT") {
        const updated = await ctx.db.clubMembership.update({
          where: { id: input.membershipId },
          data: { status: "ACCEPTED", acceptedAt: new Date() },
        });

        ctx.db.notification.create({
          data: {
            userId: membership.club.userId,
            type: "MEMBERSHIP_ACCEPTED",
            title: "Zaproszenie zaakceptowane",
            message: "Użytkownik dołączył do Twojego klubu",
            link: "/squad",
          },
        }).catch(() => {});

        return updated;
      } else {
        return ctx.db.clubMembership.update({
          where: { id: input.membershipId },
          data: { status: "REJECTED" },
        });
      }
    }),

  myInvitations: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.clubMembership.findMany({
      where: {
        memberUserId: ctx.session.user.id,
        status: "INVITED",
      },
      include: {
        club: { select: { id: true, name: true, logoUrl: true, city: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }),
});
