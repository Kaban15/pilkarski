import { z } from "zod/v4";

export const createSparingSchema = z.object({
  title: z.string().min(3, "Tytuł musi mieć min. 3 znaki").max(300),
  description: z.string().max(2000).optional(),
  matchDate: z.string().min(1, "Data meczu jest wymagana"),
  location: z.string().max(300).optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  costSplitInfo: z.string().max(500).optional(),
  regionId: z.number().int().positive().optional(),
});

export const applySparingSchema = z.object({
  sparingOfferId: z.string().uuid(),
  message: z.string().max(500).optional(),
});

export const respondApplicationSchema = z.object({
  applicationId: z.string().uuid(),
  status: z.enum(["ACCEPTED", "REJECTED"]),
});

export const updateSparingSchema = createSparingSchema.extend({
  id: z.string().uuid(),
});

export type CreateSparingInput = z.infer<typeof createSparingSchema>;
export type UpdateSparingInput = z.infer<typeof updateSparingSchema>;
