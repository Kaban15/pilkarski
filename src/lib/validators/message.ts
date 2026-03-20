import { z } from "zod/v4";

export const sendMessageSchema = z.object({
  recipientUserId: z.string().uuid(),
  content: z.string().min(1, "Wiadomość nie może być pusta").max(2000),
});

export const getMessagesSchema = z.object({
  conversationId: z.string().uuid(),
  cursor: z.string().uuid().optional(),
  limit: z.number().int().min(1).max(100).default(50),
});

export const markAsReadSchema = z.object({
  conversationId: z.string().uuid(),
});
