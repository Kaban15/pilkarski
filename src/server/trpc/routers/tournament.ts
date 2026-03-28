import { z } from "zod/v4";
import { router, protectedProcedure, publicProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { awardPoints } from "@/server/award-points";
import { sendPushToUser } from "@/server/send-push";
import { sendEmailToUser } from "@/server/send-email";
import { generateRoundRobin, generateKnockoutBracket, recalculateStandings, getNextPhase } from "@/server/tournament-logic";
import {
  createTournamentSchema, updateTournamentSchema, applyTeamSchema,
  respondApplicationSchema, submitScoreSchema, confirmScoreSchema, tournamentGoalSchema,
} from "@/lib/validators/tournament";
import { getUserDisplayName } from "@/lib/labels";

const baseUrl = process.env.NEXTAUTH_URL || "https://pilkarski.vercel.app";

// Helper: check if n is a power of 2
function isPowerOfTwo(n: number): boolean {
  return n > 0 && (n & (n - 1)) === 0;
}

export const tournamentRouter = router({
  create: protectedProcedure
    .input(createTournamentSchema)
    .mutation(async ({ ctx, input }) => {
      // Format-specific validation
      if (input.format === "KNOCKOUT") {
        if (!isPowerOfTwo(input.maxTeams)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "W formacie pucharowym liczba drużyn musi być potęgą dwójki (4, 8 lub 16)",
          });
        }
      }

      if (input.format === "GROUP_STAGE" || input.format === "GROUP_AND_KNOCKOUT") {
        const groupCount = input.groupCount ?? 1;
        if (input.maxTeams % groupCount !== 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Liczba drużyn musi być podzielna przez liczbę grup",
          });
        }
        const teamsPerGroup = input.maxTeams / groupCount;
        if (teamsPerGroup < 3) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Każda grupa musi mieć co najmniej 3 drużyny",
          });
        }
      }

      if (input.format === "GROUP_AND_KNOCKOUT") {
        const advancing = (input.advancingPerGroup ?? 2) * (input.groupCount ?? 1);
        if (!isPowerOfTwo(advancing)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Liczba awansujących drużyn (advancingPerGroup × groupCount) musi być potęgą dwójki",
          });
        }
      }

      // Create tournament
      const tournament = await ctx.db.tournament.create({
        data: {
          creatorUserId: ctx.session.user.id,
          title: input.title,
          description: input.description,
          startDate: new Date(input.startDate),
          endDate: input.endDate ? new Date(input.endDate) : undefined,
          location: input.location,
          lat: input.lat,
          lng: input.lng,
          regionId: input.regionId,
          format: input.format,
          maxTeams: input.maxTeams,
          groupCount: input.groupCount ?? 1,
          advancingPerGroup: input.advancingPerGroup ?? 2,
        },
      });

      // Auto-register creator as first team (ACCEPTED)
      const creatorUser = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
        select: {
          email: true,
          club: { select: { id: true, name: true } },
          player: { select: { firstName: true, lastName: true } },
          coach: { select: { firstName: true, lastName: true } },
        },
      });

      const teamName = creatorUser?.club?.name ?? getUserDisplayName(creatorUser);

      await ctx.db.tournamentTeam.create({
        data: {
          tournamentId: tournament.id,
          userId: ctx.session.user.id,
          clubId: creatorUser?.club?.id ?? undefined,
          teamName,
          status: "ACCEPTED",
        },
      });

      awardPoints(ctx.db, ctx.session.user.id, "tournament_created", tournament.id).catch(() => {});

      return tournament;
    }),

  update: protectedProcedure
    .input(updateTournamentSchema)
    .mutation(async ({ ctx, input }) => {
      const tournament = await ctx.db.tournament.findUnique({
        where: { id: input.tournamentId },
      });
      if (!tournament) throw new TRPCError({ code: "NOT_FOUND" });
      if (tournament.creatorUserId !== ctx.session.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      if (tournament.status !== "REGISTRATION") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Można edytować tylko turnieje w fazie rejestracji" });
      }

      const { tournamentId, ...fields } = input;

      return ctx.db.tournament.update({
        where: { id: tournamentId },
        data: {
          ...(fields.title !== undefined && { title: fields.title }),
          ...(fields.description !== undefined && { description: fields.description }),
          ...(fields.startDate !== undefined && { startDate: new Date(fields.startDate) }),
          ...(fields.endDate !== undefined && { endDate: new Date(fields.endDate) }),
          ...(fields.location !== undefined && { location: fields.location }),
          ...(fields.lat !== undefined && { lat: fields.lat }),
          ...(fields.lng !== undefined && { lng: fields.lng }),
          ...(fields.regionId !== undefined && { regionId: fields.regionId }),
          ...(fields.format !== undefined && { format: fields.format }),
          ...(fields.maxTeams !== undefined && { maxTeams: fields.maxTeams }),
          ...(fields.groupCount !== undefined && { groupCount: fields.groupCount }),
          ...(fields.advancingPerGroup !== undefined && { advancingPerGroup: fields.advancingPerGroup }),
        },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ tournamentId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const tournament = await ctx.db.tournament.findUnique({
        where: { id: input.tournamentId },
      });
      if (!tournament) throw new TRPCError({ code: "NOT_FOUND" });
      if (tournament.creatorUserId !== ctx.session.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      if (tournament.status !== "REGISTRATION") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Można usunąć tylko turnieje w fazie rejestracji" });
      }

      return ctx.db.tournament.delete({ where: { id: input.tournamentId } });
    }),

  list: publicProcedure
    .input(
      z.object({
        limit: z.number().int().min(1).max(50).default(20),
        cursor: z.string().uuid().optional(),
        regionId: z.number().int().optional(),
        status: z.enum(["REGISTRATION", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).optional(),
        format: z.enum(["GROUP_STAGE", "KNOCKOUT", "GROUP_AND_KNOCKOUT"]).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: any = {};
      if (input.regionId) where.regionId = input.regionId;
      if (input.status) where.status = input.status;
      if (input.format) where.format = input.format;

      const items = await ctx.db.tournament.findMany({
        where,
        take: input.limit + 1,
        ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
        orderBy: { startDate: "desc" },
        include: {
          _count: { select: { teams: true } },
          creator: {
            select: {
              email: true,
              club: { select: { id: true, name: true } },
              player: { select: { firstName: true, lastName: true } },
              coach: { select: { firstName: true, lastName: true } },
            },
          },
          region: true,
        },
      });

      let nextCursor: string | undefined;
      if (items.length > input.limit) {
        nextCursor = items.pop()!.id;
      }

      return { items, nextCursor };
    }),

  getById: publicProcedure
    .input(z.object({ tournamentId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const tournament = await ctx.db.tournament.findUnique({
        where: { id: input.tournamentId },
        include: {
          teams: {
            include: {
              club: { select: { id: true, name: true, logoUrl: true } },
              user: { select: { id: true, email: true } },
            },
            orderBy: { createdAt: "asc" },
          },
          matches: {
            include: {
              homeTeam: { select: { id: true, teamName: true } },
              awayTeam: { select: { id: true, teamName: true } },
              goals: {
                include: {
                  scorerUser: { select: { id: true, email: true } },
                },
                orderBy: { minute: "asc" },
              },
            },
            orderBy: { matchOrder: "asc" },
          },
          standings: {
            orderBy: { points: "desc" },
          },
          creator: {
            select: {
              email: true,
              club: { select: { id: true, name: true } },
              player: { select: { firstName: true, lastName: true } },
              coach: { select: { firstName: true, lastName: true } },
            },
          },
          region: true,
        },
      });

      if (!tournament) throw new TRPCError({ code: "NOT_FOUND" });

      return tournament;
    }),

  applyTeam: protectedProcedure
    .input(applyTeamSchema)
    .mutation(async ({ ctx, input }) => {
      const tournament = await ctx.db.tournament.findUnique({
        where: { id: input.tournamentId },
        include: { creator: { select: { id: true } } },
      });
      if (!tournament) throw new TRPCError({ code: "NOT_FOUND" });
      if (tournament.status !== "REGISTRATION") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Rejestracja na ten turniej jest już zamknięta" });
      }

      // Check if user already registered
      const existing = await ctx.db.tournamentTeam.findUnique({
        where: { tournamentId_userId: { tournamentId: input.tournamentId, userId: ctx.session.user.id } },
      });
      if (existing) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Już zgłosiłeś drużynę do tego turnieju" });
      }

      // Check if tournament is full (accepted teams)
      const acceptedCount = await ctx.db.tournamentTeam.count({
        where: { tournamentId: input.tournamentId, status: "ACCEPTED" },
      });
      if (acceptedCount >= tournament.maxTeams) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Turniej jest już pełny" });
      }

      // If clubId provided, validate membership
      if (input.clubId) {
        const club = await ctx.db.club.findUnique({
          where: { id: input.clubId },
          select: { userId: true },
        });
        if (!club) throw new TRPCError({ code: "NOT_FOUND", message: "Klub nie istnieje" });

        const isOwner = club.userId === ctx.session.user.id;
        if (!isOwner) {
          const membership = await ctx.db.clubMembership.findUnique({
            where: { clubId_memberUserId: { clubId: input.clubId, memberUserId: ctx.session.user.id } },
            select: { status: true },
          });
          if (membership?.status !== "ACCEPTED") {
            throw new TRPCError({ code: "FORBIDDEN", message: "Musisz być zaakceptowanym członkiem klubu" });
          }
        }
      }

      const team = await ctx.db.tournamentTeam.create({
        data: {
          tournamentId: input.tournamentId,
          userId: ctx.session.user.id,
          clubId: input.clubId,
          teamName: input.teamName,
          message: input.message,
          status: "PENDING",
        },
      });

      // Notify creator
      const creatorUserId = tournament.creatorUserId;
      ctx.db.notification.create({
        data: {
          userId: creatorUserId,
          type: "TOURNAMENT_APPLICATION",
          title: "Nowe zgłoszenie do turnieju",
          message: `${input.teamName} chce dołączyć do turnieju "${tournament.title}"`,
          link: `/tournaments/${tournament.id}`,
        },
      }).catch(() => {});
      sendPushToUser(creatorUserId, {
        title: "Nowe zgłoszenie do turnieju",
        body: `${input.teamName} chce dołączyć do "${tournament.title}"`,
        url: `/tournaments/${tournament.id}`,
      }).catch(() => {});
      sendEmailToUser(ctx.db, creatorUserId, "Nowe zgłoszenie do turnieju", {
        title: "Nowe zgłoszenie do turnieju",
        message: `${input.teamName} chce dołączyć do turnieju "${tournament.title}"`,
        ctaLabel: "Zobacz zgłoszenie",
        ctaUrl: `${baseUrl}/tournaments/${tournament.id}`,
      }).catch(() => {});

      return team;
    }),

  respondToApplication: protectedProcedure
    .input(respondApplicationSchema)
    .mutation(async ({ ctx, input }) => {
      const team = await ctx.db.tournamentTeam.findUnique({
        where: { id: input.teamId },
        include: { tournament: true },
      });
      if (!team) throw new TRPCError({ code: "NOT_FOUND" });
      if (team.tournament.creatorUserId !== ctx.session.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Tylko twórca turnieju może rozpatrywać zgłoszenia" });
      }

      const updated = await ctx.db.tournamentTeam.update({
        where: { id: input.teamId },
        data: { status: input.status },
      });

      // Notify team's user
      const statusLabel = input.status === "ACCEPTED" ? "zaakceptowane" : "odrzucone";
      ctx.db.notification.create({
        data: {
          userId: team.userId,
          type: "TOURNAMENT_APPLICATION",
          title: `Zgłoszenie ${statusLabel}`,
          message: `Twoje zgłoszenie do turnieju "${team.tournament.title}" zostało ${statusLabel}`,
          link: `/tournaments/${team.tournamentId}`,
        },
      }).catch(() => {});
      sendPushToUser(team.userId, {
        title: `Zgłoszenie ${statusLabel}`,
        body: `Twoje zgłoszenie do "${team.tournament.title}" zostało ${statusLabel}`,
        url: `/tournaments/${team.tournamentId}`,
      }).catch(() => {});
      sendEmailToUser(ctx.db, team.userId, `Zgłoszenie do turnieju ${statusLabel}`, {
        title: `Zgłoszenie ${statusLabel}`,
        message: `Twoje zgłoszenie drużyny "${team.teamName}" do turnieju "${team.tournament.title}" zostało ${statusLabel}`,
        ctaLabel: "Zobacz turniej",
        ctaUrl: `${baseUrl}/tournaments/${team.tournamentId}`,
      }).catch(() => {});

      return updated;
    }),

  withdraw: protectedProcedure
    .input(z.object({ tournamentId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const team = await ctx.db.tournamentTeam.findUnique({
        where: { tournamentId_userId: { tournamentId: input.tournamentId, userId: ctx.session.user.id } },
        include: { tournament: { select: { status: true } } },
      });
      if (!team) throw new TRPCError({ code: "NOT_FOUND", message: "Nie znaleziono Twojej drużyny w tym turnieju" });

      if (team.status !== "PENDING" && team.status !== "ACCEPTED") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Nie można wycofać zgłoszenia w tym statusie" });
      }
      if (team.tournament.status !== "REGISTRATION") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Turniej jest już w toku — nie można się wycofać" });
      }

      return ctx.db.tournamentTeam.delete({ where: { id: team.id } });
    }),
});
