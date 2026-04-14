import { z } from "zod/v4";
import { router, protectedProcedure, publicProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { awardPoints } from "@/server/award-points";
import { sendPushToUser } from "@/server/send-push";
import { sendEmailToUser } from "@/server/send-email";
import { generateRoundRobin, generateKnockoutBracket, recalculateStandings, getNextPhase } from "@/server/tournament-logic";
import {
  createTournamentSchema, updateTournamentSchema, applyTeamSchema,
  respondApplicationSchema, submitScoreSchema, confirmScoreSchema,
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

      // Auto-register creator as first team (ACCEPTED) — in transaction
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

      const tournament = await ctx.db.$transaction(async (tx) => {
        const created = await tx.tournament.create({
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
            costPerTeam: input.costPerTeam,
          },
        });

        await tx.tournamentTeam.create({
          data: {
            tournamentId: created.id,
            userId: ctx.session.user.id,
            clubId: creatorUser?.club?.id ?? undefined,
            teamName,
            status: "ACCEPTED",
          },
        });

        return created;
      });

      awardPoints(ctx.db, ctx.session.user.id, "tournament_created", tournament.id).catch((err) => console.error("[awardPoints]", err));

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
          ...(fields.costPerTeam !== undefined && { costPerTeam: fields.costPerTeam }),
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
        const last = items.pop();
        if (last) nextCursor = last.id;
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
      }).catch((err) => console.error("[notification]", err));
      sendPushToUser(creatorUserId, {
        title: "Nowe zgłoszenie do turnieju",
        body: `${input.teamName} chce dołączyć do "${tournament.title}"`,
        url: `/tournaments/${tournament.id}`,
      }).catch((err) => console.error("[push]", err));
      sendEmailToUser(ctx.db, creatorUserId, "Nowe zgłoszenie do turnieju", {
        title: "Nowe zgłoszenie do turnieju",
        message: `${input.teamName} chce dołączyć do turnieju "${tournament.title}"`,
        ctaLabel: "Zobacz zgłoszenie",
        ctaUrl: `${baseUrl}/tournaments/${tournament.id}`,
      }).catch((err) => console.error("[email]", err));

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
      }).catch((err) => console.error("[notification]", err));
      sendPushToUser(team.userId, {
        title: `Zgłoszenie ${statusLabel}`,
        body: `Twoje zgłoszenie do "${team.tournament.title}" zostało ${statusLabel}`,
        url: `/tournaments/${team.tournamentId}`,
      }).catch((err) => console.error("[push]", err));
      sendEmailToUser(ctx.db, team.userId, `Zgłoszenie do turnieju ${statusLabel}`, {
        title: `Zgłoszenie ${statusLabel}`,
        message: `Twoje zgłoszenie drużyny "${team.teamName}" do turnieju "${team.tournament.title}" zostało ${statusLabel}`,
        ctaLabel: "Zobacz turniej",
        ctaUrl: `${baseUrl}/tournaments/${team.tournamentId}`,
      }).catch((err) => console.error("[email]", err));

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

  startTournament: protectedProcedure
    .input(z.object({ tournamentId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const tournament = await ctx.db.tournament.findUnique({
        where: { id: input.tournamentId },
      });
      if (!tournament) throw new TRPCError({ code: "NOT_FOUND" });
      if (tournament.creatorUserId !== ctx.session.user.id) throw new TRPCError({ code: "FORBIDDEN" });
      if (tournament.status !== "REGISTRATION") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Turniej nie jest w fazie rejestracji" });
      }

      const acceptedTeams = await ctx.db.tournamentTeam.findMany({
        where: { tournamentId: input.tournamentId, status: "ACCEPTED" },
        orderBy: { createdAt: "asc" },
      });
      const count = acceptedTeams.length;

      if (tournament.format === "KNOCKOUT") {
        if (!isPowerOfTwo(count)) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "W formacie pucharowym liczba drużyn musi być potęgą dwójki (4, 8, 16)" });
        }
      } else {
        const groupCount = tournament.groupCount;
        if (count < groupCount * 3) {
          throw new TRPCError({ code: "BAD_REQUEST", message: `Potrzeba co najmniej ${groupCount * 3} drużyn (min. 3 na grupę)` });
        }
      }

      // Reject remaining PENDING teams
      await ctx.db.tournamentTeam.updateMany({
        where: { tournamentId: input.tournamentId, status: "PENDING" },
        data: { status: "REJECTED" },
      });

      // Shuffle accepted teams
      const shuffled = [...acceptedTeams].sort(() => Math.random() - 0.5);

      if (tournament.format === "KNOCKOUT") {
        // Assign seeds in random order
        const updates = shuffled.map((team, i) =>
          ctx.db.tournamentTeam.update({ where: { id: team.id }, data: { seed: i + 1 } })
        );
        await Promise.all(updates);

        const seededTeams = shuffled.map((team, i) => ({ id: team.id, seed: i + 1 }));
        const bracketMatches = generateKnockoutBracket(seededTeams);

        await ctx.db.tournamentMatch.createMany({
          data: bracketMatches.map((m) => ({
            tournamentId: input.tournamentId,
            homeTeamId: m.homeId,
            awayTeamId: m.awayId,
            phase: m.phase as any,
            matchOrder: m.matchOrder,
          })),
        });
      } else {
        // Assign group labels evenly
        const groupLabels = "ABCDEFGH".split("").slice(0, tournament.groupCount);
        const labelUpdates = shuffled.map((team, i) => {
          const label = groupLabels[i % tournament.groupCount];
          return ctx.db.tournamentTeam.update({ where: { id: team.id }, data: { groupLabel: label } });
        });
        await Promise.all(labelUpdates);

        // Create TournamentStanding rows
        const standingData = shuffled.map((team, i) => ({
          tournamentId: input.tournamentId,
          teamId: team.id,
          groupLabel: groupLabels[i % tournament.groupCount],
        }));
        await ctx.db.tournamentStanding.createMany({ data: standingData });

        // Generate round-robin matches per group
        const groupedTeams = new Map<string, string[]>();
        shuffled.forEach((team, i) => {
          const label = groupLabels[i % tournament.groupCount];
          if (!groupedTeams.has(label)) groupedTeams.set(label, []);
          groupedTeams.get(label)!.push(team.id);
        });

        const matchData: Array<{ tournamentId: string; homeTeamId: string; awayTeamId: string; phase: any; groupLabel: string; matchOrder: number }> = [];
        let orderOffset = 0;
        for (const [label, teamIds] of groupedTeams) {
          const pairs = generateRoundRobin(teamIds);
          pairs.forEach((pair, idx) => {
            matchData.push({
              tournamentId: input.tournamentId,
              homeTeamId: pair[0],
              awayTeamId: pair[1],
              phase: "GROUP" as any,
              groupLabel: label,
              matchOrder: orderOffset + idx,
            });
          });
          orderOffset += pairs.length;
        }
        await ctx.db.tournamentMatch.createMany({ data: matchData });
      }

      await ctx.db.tournament.update({
        where: { id: input.tournamentId },
        data: { status: "IN_PROGRESS" },
      });

      // Notify all accepted teams
      for (const team of acceptedTeams) {
        ctx.db.notification.create({
          data: {
            userId: team.userId,
            type: "TOURNAMENT_APPLICATION",
            title: "Turniej rozpoczęty!",
            message: `Turniej "${tournament.title}" został rozpoczęty`,
            link: `/tournaments/${input.tournamentId}`,
          },
        }).catch((err) => console.error("[notification]", err));
        sendPushToUser(team.userId, {
          title: "Turniej rozpoczęty!",
          body: `Turniej "${tournament.title}" został rozpoczęty`,
          url: `/tournaments/${input.tournamentId}`,
        }).catch((err) => console.error("[push]", err));
      }

      return { ok: true };
    }),

  submitMatchScore: protectedProcedure
    .input(submitScoreSchema)
    .mutation(async ({ ctx, input }) => {
      const match = await ctx.db.tournamentMatch.findUnique({
        where: { id: input.matchId },
        include: {
          tournament: { select: { id: true } },
          homeTeam: { select: { id: true, userId: true, teamName: true } },
          awayTeam: { select: { id: true, userId: true, teamName: true } },
        },
      });
      if (!match) throw new TRPCError({ code: "NOT_FOUND" });

      const isHome = match.homeTeam.userId === ctx.session.user.id;
      const isAway = match.awayTeam.userId === ctx.session.user.id;
      if (!isHome && !isAway) throw new TRPCError({ code: "FORBIDDEN", message: "Nie jesteś uczestnikiem tego meczu" });

      if (match.scoreConfirmed) throw new TRPCError({ code: "BAD_REQUEST", message: "Wynik meczu jest już potwierdzony" });

      // Penalties only allowed in non-GROUP phase when draw
      if (input.penaltyHome !== undefined || input.penaltyAway !== undefined) {
        if (match.phase === "GROUP") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Rzuty karne niedozwolone w fazie grupowej" });
        }
        if (input.homeScore !== input.awayScore) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Rzuty karne można wpisać tylko przy remisie" });
        }
      }

      await ctx.db.tournamentMatch.update({
        where: { id: input.matchId },
        data: {
          homeScore: input.homeScore,
          awayScore: input.awayScore,
          penaltyHome: input.penaltyHome ?? null,
          penaltyAway: input.penaltyAway ?? null,
          scoreSubmittedBy: ctx.session.user.id,
          scoreConfirmed: false,
        },
      });

      // Notify the other team
      const otherUserId = isHome ? match.awayTeam.userId : match.homeTeam.userId;
      const myTeamName = isHome ? match.homeTeam.teamName : match.awayTeam.teamName;
      ctx.db.notification.create({
        data: {
          userId: otherUserId,
          type: "TOURNAMENT_APPLICATION",
          title: "Wynik meczu do potwierdzenia",
          message: `${myTeamName} wpisał wynik meczu. Potwierdź lub odrzuć.`,
          link: `/tournaments/${match.tournament.id}`,
        },
      }).catch((err) => console.error("[notification]", err));
      sendPushToUser(otherUserId, {
        title: "Wynik meczu do potwierdzenia",
        body: `${myTeamName} wpisał wynik. Potwierdź lub odrzuć.`,
        url: `/tournaments/${match.tournament.id}`,
      }).catch((err) => console.error("[push]", err));

      return { ok: true };
    }),

  confirmMatchScore: protectedProcedure
    .input(confirmScoreSchema)
    .mutation(async ({ ctx, input }) => {
      const match = await ctx.db.tournamentMatch.findUnique({
        where: { id: input.matchId },
        include: {
          tournament: { select: { id: true, format: true } },
          homeTeam: { select: { id: true, userId: true, teamName: true, groupLabel: true } },
          awayTeam: { select: { id: true, userId: true, teamName: true, groupLabel: true } },
        },
      });
      if (!match) throw new TRPCError({ code: "NOT_FOUND" });
      if (match.homeScore === null || match.awayScore === null) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Brak wpisanego wyniku" });
      }
      if (match.scoreConfirmed) throw new TRPCError({ code: "BAD_REQUEST", message: "Wynik jest już potwierdzony" });
      if (!match.scoreSubmittedBy) throw new TRPCError({ code: "BAD_REQUEST", message: "Brak wpisanego wyniku" });

      const isHome = match.homeTeam.userId === ctx.session.user.id;
      const isAway = match.awayTeam.userId === ctx.session.user.id;
      if (!isHome && !isAway) throw new TRPCError({ code: "FORBIDDEN", message: "Nie jesteś uczestnikiem tego meczu" });

      // Caller must be the OTHER team (not the one who submitted)
      const submitterIsHome = match.homeTeam.userId === match.scoreSubmittedBy;
      const callerIsHome = isHome;
      if (callerIsHome === submitterIsHome) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Tylko druga drużyna może potwierdzić wynik" });
      }

      if (!input.confirmed) {
        // Reset scores
        await ctx.db.tournamentMatch.update({
          where: { id: input.matchId },
          data: { homeScore: null, awayScore: null, penaltyHome: null, penaltyAway: null, scoreSubmittedBy: null },
        });
        return { ok: true };
      }

      // Confirm score
      await ctx.db.tournamentMatch.update({
        where: { id: input.matchId },
        data: { scoreConfirmed: true },
      });

      if (match.phase === "GROUP") {
        // Recalculate standings for this group
        const groupLabel = match.homeTeam.groupLabel!;
        const [groupMatches, groupTeams] = await Promise.all([
          ctx.db.tournamentMatch.findMany({
            where: { tournamentId: match.tournament.id, phase: "GROUP", groupLabel, scoreConfirmed: true },
          }),
          ctx.db.tournamentTeam.findMany({
            where: { tournamentId: match.tournament.id, groupLabel },
          }),
        ]);

        const teamIds = groupTeams.map((t) => t.id);
        const newStandings = recalculateStandings(
          groupMatches.map((m) => ({
            homeTeamId: m.homeTeamId,
            awayTeamId: m.awayTeamId,
            homeScore: m.homeScore!,
            awayScore: m.awayScore!,
          })),
          teamIds
        );

        await ctx.db.tournamentStanding.deleteMany({
          where: { tournamentId: match.tournament.id, groupLabel },
        });
        await ctx.db.tournamentStanding.createMany({
          data: newStandings.map((s) => ({
            tournamentId: match.tournament.id,
            teamId: s.teamId,
            groupLabel,
            played: s.played,
            won: s.won,
            drawn: s.drawn,
            lost: s.lost,
            goalsFor: s.goalsFor,
            goalsAgainst: s.goalsAgainst,
            points: s.points,
          })),
        });
      } else {
        // KNOCKOUT phase: advance winner to next match
        const homeScore = match.homeScore!;
        const awayScore = match.awayScore!;
        let winnerId: string;
        if (homeScore > awayScore) {
          winnerId = match.homeTeam.id;
        } else if (awayScore > homeScore) {
          winnerId = match.awayTeam.id;
        } else {
          // Penalties decide
          const ph = match.penaltyHome ?? 0;
          const pa = match.penaltyAway ?? 0;
          winnerId = ph >= pa ? match.homeTeam.id : match.awayTeam.id;
        }

        const nextPhase = getNextPhase(match.phase);
        if (nextPhase) {
          // Find next-round match that still has __TBD__ placeholder — represented as same teamId (TBD not stored)
          // TBD matches have homeTeamId or awayTeamId pointing to a placeholder team record
          // Instead find next phase match where homeTeamId or awayTeamId references a TBD entry
          // The bracket is ordered: match i feeds into match i/2 of the next round
          // Use matchOrder: next match index = floor(match.matchOrder / 2), home if even slot, away if odd
          const currentOrder = match.matchOrder;
          const nextOrder = Math.floor(currentOrder / 2);
          const isHomeSlot = currentOrder % 2 === 0;

          const nextMatch = await ctx.db.tournamentMatch.findFirst({
            where: { tournamentId: match.tournament.id, phase: nextPhase as any, matchOrder: nextOrder },
          });

          if (nextMatch) {
            await ctx.db.tournamentMatch.update({
              where: { id: nextMatch.id },
              data: isHomeSlot ? { homeTeamId: winnerId } : { awayTeamId: winnerId },
            });
          }
        }
      }

      return { ok: true };
    }),

  generateKnockoutAfterGroups: protectedProcedure
    .input(z.object({ tournamentId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const tournament = await ctx.db.tournament.findUnique({
        where: { id: input.tournamentId },
      });
      if (!tournament) throw new TRPCError({ code: "NOT_FOUND" });
      if (tournament.creatorUserId !== ctx.session.user.id) throw new TRPCError({ code: "FORBIDDEN" });
      if (tournament.format !== "GROUP_AND_KNOCKOUT") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Turniej nie jest w formacie grupowo-pucharowym" });
      }

      // Validate all GROUP matches are confirmed
      const unconfirmedCount = await ctx.db.tournamentMatch.count({
        where: { tournamentId: input.tournamentId, phase: "GROUP", scoreConfirmed: false },
      });
      if (unconfirmedCount > 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Nie wszystkie mecze grupowe są potwierdzone" });
      }

      const advancingPerGroup = tournament.advancingPerGroup;
      const groupCount = tournament.groupCount;

      // Get standings per group, sorted by points desc
      const standings = await ctx.db.tournamentStanding.findMany({
        where: { tournamentId: input.tournamentId },
        orderBy: [{ groupLabel: "asc" }, { points: "desc" }, { goalsFor: "desc" }],
        include: { team: { select: { id: true } } },
      });

      // Group standings by groupLabel
      const byGroup = new Map<string, typeof standings>();
      for (const s of standings) {
        if (!byGroup.has(s.groupLabel)) byGroup.set(s.groupLabel, []);
        byGroup.get(s.groupLabel)!.push(s);
      }

      // Cross-seeding: 1A=1, 1B=2, 2A=3, 2B=4...
      const seededTeams: Array<{ id: string; seed: number }> = [];
      const groupLabels = Array.from(byGroup.keys()).sort();

      for (let rank = 0; rank < advancingPerGroup; rank++) {
        for (const label of groupLabels) {
          const groupStandings = byGroup.get(label)!;
          if (groupStandings[rank]) {
            seededTeams.push({
              id: groupStandings[rank].team.id,
              seed: seededTeams.length + 1,
            });
          }
        }
      }

      const bracketMatches = generateKnockoutBracket(seededTeams);
      const existingKnockoutCount = await ctx.db.tournamentMatch.count({
        where: { tournamentId: input.tournamentId, phase: { not: "GROUP" } },
      });

      await ctx.db.tournamentMatch.createMany({
        data: bracketMatches.map((m) => ({
          tournamentId: input.tournamentId,
          homeTeamId: m.homeId,
          awayTeamId: m.awayId,
          phase: m.phase as any,
          matchOrder: existingKnockoutCount + m.matchOrder,
        })),
      });

      return { ok: true };
    }),

  completeTournament: protectedProcedure
    .input(z.object({ tournamentId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const tournament = await ctx.db.tournament.findUnique({
        where: { id: input.tournamentId },
        include: {
          teams: { where: { status: "ACCEPTED" }, select: { userId: true, teamName: true } },
        },
      });
      if (!tournament) throw new TRPCError({ code: "NOT_FOUND" });
      if (tournament.creatorUserId !== ctx.session.user.id) throw new TRPCError({ code: "FORBIDDEN" });

      const unconfirmedCount = await ctx.db.tournamentMatch.count({
        where: { tournamentId: input.tournamentId, scoreConfirmed: false },
      });
      if (unconfirmedCount > 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Nie wszystkie mecze są potwierdzone" });
      }

      // Find winner
      let winnerUserId: string | null = null;

      if (tournament.format === "GROUP_STAGE") {
        // Winner is the group leader (single group assumed, or overall top)
        const topStanding = await ctx.db.tournamentStanding.findFirst({
          where: { tournamentId: input.tournamentId },
          orderBy: [{ points: "desc" }, { goalsFor: "desc" }],
          include: { team: { select: { userId: true } } },
        });
        winnerUserId = topStanding?.team.userId ?? null;
      } else {
        // Find FINAL match winner
        const finalMatch = await ctx.db.tournamentMatch.findFirst({
          where: { tournamentId: input.tournamentId, phase: "FINAL", scoreConfirmed: true },
          include: {
            homeTeam: { select: { userId: true } },
            awayTeam: { select: { userId: true } },
          },
        });
        if (finalMatch) {
          const h = finalMatch.homeScore!;
          const a = finalMatch.awayScore!;
          if (h > a) {
            winnerUserId = finalMatch.homeTeam.userId;
          } else if (a > h) {
            winnerUserId = finalMatch.awayTeam.userId;
          } else {
            const ph = finalMatch.penaltyHome ?? 0;
            const pa = finalMatch.penaltyAway ?? 0;
            winnerUserId = ph >= pa ? finalMatch.homeTeam.userId : finalMatch.awayTeam.userId;
          }
        }
      }

      if (winnerUserId) {
        awardPoints(ctx.db, winnerUserId, "tournament_win", input.tournamentId).catch((err) => console.error("[awardPoints]", err));
      }

      await ctx.db.tournament.update({
        where: { id: input.tournamentId },
        data: { status: "COMPLETED" },
      });

      // Notify all teams
      for (const team of tournament.teams) {
        ctx.db.notification.create({
          data: {
            userId: team.userId,
            type: "TOURNAMENT_APPLICATION",
            title: "Turniej zakończony!",
            message: `Turniej "${tournament.title}" został zakończony`,
            link: `/tournaments/${input.tournamentId}`,
          },
        }).catch((err) => console.error("[notification]", err));
        sendPushToUser(team.userId, {
          title: "Turniej zakończony!",
          body: `Turniej "${tournament.title}" został zakończony`,
          url: `/tournaments/${input.tournamentId}`,
        }).catch((err) => console.error("[push]", err));
      }

      return { ok: true };
    }),

});
