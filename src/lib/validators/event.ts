import { z } from "zod/v4";

export const createEventSchema = z.object({
  type: z.enum(["OPEN_TRAINING", "RECRUITMENT"]),
  title: z.string().min(3, "Tytuł musi mieć min. 3 znaki").max(300),
  description: z.string().max(2000).optional(),
  eventDate: z.string().min(1, "Data wydarzenia jest wymagana"),
  location: z.string().max(300).optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  maxParticipants: z.number().int().positive().optional(),
  regionId: z.number().int().positive().optional(),
});

export const applyEventSchema = z.object({
  eventId: z.string().uuid(),
  message: z.string().max(500).optional(),
});

export const respondEventApplicationSchema = z.object({
  applicationId: z.string().uuid(),
  status: z.enum(["ACCEPTED", "REJECTED"]),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;
