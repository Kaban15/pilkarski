import { z } from "zod/v4";

export const PLAYER_POSITIONS = ["GK","CB","LB","RB","CDM","CM","CAM","LM","RM","LW","RW","ST"] as const;
export const SPARING_LEVELS = ["YOUTH","AMATEUR","SEMI_PRO","PRO"] as const;

export const createEventSchema = z.object({
  type: z.enum(["OPEN_TRAINING", "RECRUITMENT", "TRYOUT", "CAMP", "CONTINUOUS_RECRUITMENT", "INDIVIDUAL_TRAINING", "GROUP_TRAINING"]),
  title: z.string().min(3, "Tytuł musi mieć min. 3 znaki").max(300),
  description: z.string().max(2000).optional(),
  eventDate: z.string().min(1, "Data wydarzenia jest wymagana"),
  location: z.string().max(300).optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  maxParticipants: z.number().int().positive().optional(),
  regionId: z.number().int().positive().optional(),
  targetPosition: z.enum(PLAYER_POSITIONS).optional(),
  targetAgeMin: z.number().int().min(5).max(60).optional(),
  targetAgeMax: z.number().int().min(5).max(60).optional(),
  targetLevel: z.enum(SPARING_LEVELS).optional(),
  priceInfo: z.string().max(200).optional(),
});

export const applyEventSchema = z.object({
  eventId: z.string().uuid(),
  message: z.string().max(500).optional(),
});

export const respondEventApplicationSchema = z.object({
  applicationId: z.string().uuid(),
  status: z.enum(["ACCEPTED", "REJECTED"]),
});

export const updateEventSchema = createEventSchema.extend({
  id: z.string().uuid(),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
export type EventTypeValue = "OPEN_TRAINING" | "RECRUITMENT" | "TRYOUT" | "CAMP" | "CONTINUOUS_RECRUITMENT" | "INDIVIDUAL_TRAINING" | "GROUP_TRAINING";
