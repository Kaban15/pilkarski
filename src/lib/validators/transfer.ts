import { z } from "zod/v4";

export const createTransferSchema = z.object({
  type: z.enum(["LOOKING_FOR_CLUB", "LOOKING_FOR_PLAYER", "FREE_AGENT"]),
  title: z.string().min(3).max(300),
  description: z.string().max(2000).optional(),
  position: z.enum(["GK", "CB", "LB", "RB", "CDM", "CM", "CAM", "LM", "RM", "LW", "RW", "ST"]).optional(),
  regionId: z.number().int().optional(),
  minAge: z.number().int().min(10).max(60).optional(),
  maxAge: z.number().int().min(10).max(60).optional(),
});

export const updateTransferSchema = createTransferSchema.extend({
  id: z.string().uuid(),
});

export type TransferType = "LOOKING_FOR_CLUB" | "LOOKING_FOR_PLAYER" | "FREE_AGENT";
export type TransferPosition = "GK" | "CB" | "LB" | "RB" | "CDM" | "CM" | "CAM" | "LM" | "RM" | "LW" | "RW" | "ST";
