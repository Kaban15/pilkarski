import { z } from "zod/v4";

export const createTournamentSchema = z.object({
  title: z.string().min(3).max(300),
  description: z.string().max(2000).optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  location: z.string().max(300).optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  regionId: z.number().int().optional(),
  format: z.enum(["GROUP_STAGE", "KNOCKOUT", "GROUP_AND_KNOCKOUT"]),
  maxTeams: z.number().int().min(4).max(16).refine(n => n % 2 === 0, "Liczba drużyn musi być parzysta"),
  groupCount: z.number().int().min(1).max(8).default(1),
  advancingPerGroup: z.number().int().min(1).max(4).default(2),
  costPerTeam: z.number().int().min(0).max(10000).optional(),
});

export const updateTournamentSchema = createTournamentSchema.partial().extend({
  tournamentId: z.string().uuid(),
});

export const applyTeamSchema = z.object({
  tournamentId: z.string().uuid(),
  clubId: z.string().uuid().optional(),
  teamName: z.string().min(2).max(200),
  message: z.string().max(500).optional(),
});

export const respondApplicationSchema = z.object({
  teamId: z.string().uuid(),
  status: z.enum(["ACCEPTED", "REJECTED"]),
});

export const submitScoreSchema = z.object({
  matchId: z.string().uuid(),
  homeScore: z.number().int().min(0).max(99),
  awayScore: z.number().int().min(0).max(99),
  penaltyHome: z.number().int().min(0).max(99).optional(),
  penaltyAway: z.number().int().min(0).max(99).optional(),
});

export const confirmScoreSchema = z.object({
  matchId: z.string().uuid(),
  confirmed: z.boolean(),
});

export const tournamentGoalSchema = z.object({
  matchId: z.string().uuid(),
  scorerUserId: z.string().uuid(),
  minute: z.number().int().min(0).max(120).optional(),
  ownGoal: z.boolean().default(false),
});

export const markTeamPaidSchema = z.object({
  teamId: z.string().uuid(),
  paid: z.boolean(),
});
