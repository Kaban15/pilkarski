import { z } from "zod/v4";

// --- Reports ---

export const adminReportsListSchema = z.object({
  cursor: z.string().uuid().optional(),
  limit: z.number().int().min(1).max(50).default(20),
}).strict();

export const adminDismissReportSchema = z.object({
  postId: z.string().uuid(),
}).strict();

export const adminHidePostSchema = z.object({
  postId: z.string().uuid(),
}).strict();

// --- Users ---

export const adminUsersListSchema = z.object({
  cursor: z.string().uuid().optional(),
  limit: z.number().int().min(1).max(50).default(20),
  search: z.string().max(100).optional(),
}).strict();

export const adminBanSchema = z.object({
  userId: z.string().uuid(),
}).strict();

export const adminSetAdminSchema = z.object({
  userId: z.string().uuid(),
  isAdmin: z.boolean(),
}).strict();

// --- Content ---

export const adminContentListSchema = z.object({
  cursor: z.string().uuid().optional(),
  limit: z.number().int().min(1).max(50).default(20),
  search: z.string().max(100).optional(),
}).strict();

export const adminDeleteContentSchema = z.object({
  type: z.enum(["sparing", "event", "tournament"]),
  id: z.string().uuid(),
}).strict();
