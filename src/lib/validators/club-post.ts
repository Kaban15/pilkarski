import { z } from "zod/v4";

export const CLUB_POST_CATEGORIES = [
  "LOOKING_FOR_GOALKEEPER",
  "LOOKING_FOR_SPARRING",
  "LOOKING_FOR_COACH",
  "GENERAL_NEWS",
  "MATCH_RESULT",
  "INTERNAL",
] as const;

export const createClubPostSchema = z.object({
  category: z.enum(CLUB_POST_CATEGORIES),
  title: z.string().min(5, "Tytuł musi mieć min. 5 znaków").max(300),
  content: z.string().min(10, "Treść musi mieć min. 10 znaków").max(2000),
  expiresAt: z.string().optional(),
}).strict();

export const updateClubPostSchema = createClubPostSchema.extend({
  id: z.string().uuid(),
});

export type CreateClubPostInput = z.infer<typeof createClubPostSchema>;
export type ClubPostCategoryValue = (typeof CLUB_POST_CATEGORIES)[number];
