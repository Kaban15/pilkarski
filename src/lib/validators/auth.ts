import { z } from "zod/v4";

export const registerSchema = z.object({
  email: z.email("Podaj prawidłowy adres e-mail"),
  password: z
    .string()
    .min(8, "Hasło musi mieć minimum 8 znaków")
    .max(100, "Hasło może mieć maksymalnie 100 znaków"),
  role: z.enum(["CLUB", "PLAYER", "COACH"]),
  // Club fields (required when role=CLUB)
  clubName: z.string().min(2, "Nazwa klubu jest wymagana").max(200).optional(),
  // Player fields (required when role=PLAYER)
  firstName: z.string().min(2, "Imię jest wymagane").max(100).optional(),
  lastName: z.string().min(2, "Nazwisko jest wymagane").max(100).optional(),
}).refine(
  (data) => {
    if (data.role === "CLUB") return !!data.clubName;
    return true;
  },
  { message: "Nazwa klubu jest wymagana", path: ["clubName"] }
).refine(
  (data) => {
    if (data.role === "PLAYER" || data.role === "COACH") return !!data.firstName && !!data.lastName;
    return true;
  },
  { message: "Imię i nazwisko są wymagane", path: ["firstName"] }
);

export const loginSchema = z.object({
  email: z.email("Podaj prawidłowy adres e-mail"),
  password: z.string().min(1, "Hasło jest wymagane"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
