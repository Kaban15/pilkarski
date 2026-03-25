import { z } from "zod/v4";

export const CLUB_POST_CATEGORIES = [
  "LOOKING_FOR_GOALKEEPER",
  "LOOKING_FOR_SPARRING",
  "LOOKING_FOR_COACH",
  "GENERAL_NEWS",
  "MATCH_RESULT",
] as const;

export const createClubPostSchema = z.object({
  category: z.enum(CLUB_POST_CATEGORIES),
  title: z.string().min(3, "Tytuł musi mieć min. 3 znaki").max(300),
  content: z.string().max(2000).optional(),
  expiresAt: z.string().optional(),
});

export const updateClubPostSchema = createClubPostSchema.extend({
  id: z.string().uuid(),
});

export type CreateClubPostInput = z.infer<typeof createClubPostSchema>;
export type ClubPostCategoryValue = (typeof CLUB_POST_CATEGORIES)[number];
