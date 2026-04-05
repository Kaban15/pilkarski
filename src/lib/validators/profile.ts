import { z } from "zod/v4";

export const updateClubSchema = z.object({
  name: z.string().min(2).max(200),
  logoUrl: z.string().url().max(500).optional(),
  description: z.string().max(2000).optional(),
  city: z.string().max(100).optional(),
  regionId: z.number().int().positive().optional(),
  leagueGroupId: z.number().int().positive().optional(),
  contactEmail: z.email().optional(),
  contactPhone: z.string().max(20).optional(),
  website: z.string().url().max(300).optional(),
  facebookUrl: z.string().url().max(300).optional(),
  instagramUrl: z.string().url().max(300).optional(),
});

export const updatePlayerSchema = z.object({
  firstName: z.string().min(2).max(100),
  lastName: z.string().min(2).max(100),
  photoUrl: z.string().url().max(500).optional(),
  dateOfBirth: z.string().optional(), // ISO date string
  city: z.string().max(100).optional(),
  regionId: z.number().int().positive().optional(),
  heightCm: z.number().int().min(100).max(250).optional(),
  weightKg: z.number().int().min(30).max(200).optional(),
  preferredFoot: z.enum(["LEFT", "RIGHT", "BOTH"]).optional(),
  primaryPosition: z
    .enum(["GK", "CB", "LB", "RB", "CDM", "CM", "CAM", "LM", "RM", "LW", "RW", "ST"])
    .optional(),
  secondaryPosition: z
    .enum(["GK", "CB", "LB", "RB", "CDM", "CM", "CAM", "LM", "RM", "LW", "RW", "ST"])
    .optional(),
  bio: z.string().max(2000).optional(),
  facebookUrl: z.string().url().max(300).optional(),
  instagramUrl: z.string().url().max(300).optional(),
});

export const careerEntrySchema = z.object({
  clubName: z.string().min(2).max(200),
  season: z.string().min(4).max(20),
  notes: z.string().max(500).optional(),
});

export type UpdateClubInput = z.infer<typeof updateClubSchema>;
export type UpdatePlayerInput = z.infer<typeof updatePlayerSchema>;
export type CareerEntryInput = z.infer<typeof careerEntrySchema>;
