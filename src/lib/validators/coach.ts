import { z } from "zod/v4";

export const coachCareerEntrySchema = z.object({
  clubName: z.string().min(2, "Nazwa klubu musi mieć min. 2 znaki").max(200),
  season: z.string().min(4, "Podaj sezon").max(20),
  role: z.string().min(2, "Podaj rolę").max(100),
  level: z.string().max(100).optional(),
  notes: z.string().max(500).optional(),
}).strict();
