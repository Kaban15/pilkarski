import { z } from "zod/v4";

export const createReviewSchema = z.object({
  sparingOfferId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});
