import { z } from "zod/v4";

export const SPARING_LEVELS = ["YOUTH", "AMATEUR", "SEMI_PRO", "PRO"] as const;
export const AGE_CATEGORIES = [
  "JUNIOR_E", "JUNIOR_D", "JUNIOR_C", "JUNIOR_B",
  "JUNIOR_A", "SENIOR_JR", "SENIOR", "VETERAN",
] as const;

export const createSparingSchema = z.object({
  title: z.string().min(3, "Tytuł musi mieć min. 3 znaki").max(300),
  description: z.string().max(2000).optional(),
  matchDate: z.string().min(1, "Data meczu jest wymagana").refine(
    (s) => {
      const d = Date.parse(s);
      return !isNaN(d) && d > Date.now();
    },
    { message: "Data meczu musi być w przyszłości" }
  ),
  location: z.string().max(300).optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  level: z.enum(SPARING_LEVELS).optional(),
  ageCategory: z.enum(AGE_CATEGORIES).optional(),
  preferredTime: z.string().max(100).optional(),
  regionId: z.number().int().positive().optional(),
  costPerTeam: z.number().int().min(0).max(10000).optional(),
});

export const applySparingSchema = z.object({
  sparingOfferId: z.string().uuid(),
  message: z.string().max(500).optional(),
  counterProposedDate: z.string().refine(
    (s) => {
      const d = Date.parse(s);
      return !isNaN(d) && d > Date.now();
    },
    { message: "Proponowana data musi być w przyszłości" }
  ).optional(),
});

export const respondApplicationSchema = z.object({
  applicationId: z.string().uuid(),
  status: z.enum(["ACCEPTED", "REJECTED"]),
});

export const updateSparingSchema = createSparingSchema.extend({
  id: z.string().uuid(),
  matchDate: z.string().min(1, "Data meczu jest wymagana").refine(
    (s) => !isNaN(Date.parse(s)),
    { message: "Nieprawidłowa data" }
  ),
});

export type CreateSparingInput = z.infer<typeof createSparingSchema>;
export type UpdateSparingInput = z.infer<typeof updateSparingSchema>;

export const markCostPaidSchema = z.object({
  sparingId: z.string().uuid(),
  side: z.enum(["home", "away"]),
  paid: z.boolean(),
});

export type SparingLevel = (typeof SPARING_LEVELS)[number];
export type AgeCategory = (typeof AGE_CATEGORIES)[number];
export type SparingSortBy = "matchDate" | "createdAt" | "title";
export type SparingSortOrder = "asc" | "desc";
