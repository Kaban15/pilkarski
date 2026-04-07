import { z } from "zod/v4";

export const addGoalSchema = z.object({
  sparingOfferId: z.string().uuid(),
  scorerUserId: z.string().uuid(),
  minute: z.number().int().min(0).max(120).optional(),
  ownGoal: z.boolean().default(false),
}).strict();

export const removeGoalSchema = z.object({
  goalId: z.string().uuid(),
}).strict();

export const getGoalsSchema = z.object({
  sparingOfferId: z.string().uuid(),
}).strict();
