import { z } from "zod/v4";
import { router, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { isClubMember } from "@/server/is-club-member";

export const teamLineupRouter = router({
  create: protectedProcedure
    .input(z.object({
      title: z.string().min(3).max(300),
      matchInfo: z.string().max(500).optional(),
      date: z.string(),
      notes: z.string().max(2000).optional(),
      players: z.array(z.object({
        memberUserId: z.string().uuid(),
        role: z.enum(["STARTER", "BENCH"]).default("STARTER"),
        position: z.string().max(10).optional(),
        notes: z.string().max(200).optional(),
      })),
    }))
    .mutation(async ({ ctx, input }) => {
      const club = await ctx.db.club.findUnique({
        where: { userId: ctx.session.user.id },
      });
      if (!club) throw new TRPCError({ code: "FORBIDDEN" });

      // Validate all players are accepted members of this club
      if (input.players.length > 0) {
        const memberIds = input.players.map((p) => p.memberUserId);
        const validMembers = await ctx.db.clubMembership.findMany({
          where: { clubId: club.id, memberUserId: { in: memberIds }, status: "ACCEPTED" },
          select: { memberUserId: true },
        });
        if (validMembers.length !== new Set(memberIds).size) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Jeden lub więcej zawodników nie należy do klubu" });
        }
      }

      return ctx.db.teamLineup.create({
        data: {
          clubId: club.id,
          title: input.title,
          matchInfo: input.matchInfo,
          date: new Date(input.date),
          notes: input.notes,
          players: {
            create: input.players.map((p) => ({
              memberUserId: p.memberUserId,
              role: p.role,
              position: p.position,
              notes: p.notes,
            })),
          },
        },
        include: { players: true },
      });
    }),

  listByClub: protectedProcedure
    .input(z.object({ clubId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Check access: club owner or accepted member
      const club = await ctx.db.club.findUnique({
        where: { id: input.clubId },
        select: { userId: true },
      });
      if (!club) throw new TRPCError({ code: "NOT_FOUND" });

      const isOwner = club.userId === userId;
      if (!isOwner) {
        const isMember = await isClubMember(userId, input.clubId);
        if (!isMember) throw new TRPCError({ code: "FORBIDDEN", message: "Tylko członkowie klubu mają dostęp" });
      }

      return ctx.db.teamLineup.findMany({
        where: { clubId: input.clubId },
        include: {
          players: {
            include: {
              lineup: false,
            },
          },
        },
        orderBy: { date: "desc" },
        take: 20,
      });
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const lineup = await ctx.db.teamLineup.findUnique({
        where: { id: input.id },
        include: {
          club: { select: { id: true, name: true, userId: true } },
          players: true,
        },
      });
      if (!lineup) throw new TRPCError({ code: "NOT_FOUND" });

      const userId = ctx.session.user.id;
      const isOwner = lineup.club.userId === userId;
      if (!isOwner) {
        const isMember = await isClubMember(userId, lineup.clubId);
        if (!isMember) throw new TRPCError({ code: "FORBIDDEN" });
      }

      return lineup;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const club = await ctx.db.club.findUnique({
        where: { userId: ctx.session.user.id },
      });
      if (!club) throw new TRPCError({ code: "FORBIDDEN" });

      const lineup = await ctx.db.teamLineup.findUnique({ where: { id: input.id } });
      if (!lineup || lineup.clubId !== club.id) throw new TRPCError({ code: "FORBIDDEN" });

      return ctx.db.teamLineup.delete({ where: { id: input.id } });
    }),
});
