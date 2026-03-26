import { router, publicProcedure } from "../trpc";
import { registerSchema } from "@/lib/validators/auth";
import { TRPCError } from "@trpc/server";
import { isRateLimited } from "@/lib/rate-limit";
import bcrypt from "bcryptjs";

export const authRouter = router({
  register: publicProcedure
    .input(registerSchema)
    .mutation(async ({ ctx, input }) => {
      if (isRateLimited(`register:${input.email}`, { maxAttempts: 3, windowMs: 60_000 })) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Zbyt wiele prób rejestracji. Spróbuj ponownie za minutę.",
        });
      }

      const existing = await ctx.db.user.findUnique({
        where: { email: input.email },
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Konto z tym adresem e-mail już istnieje",
        });
      }

      const passwordHash = await bcrypt.hash(input.password, 12);

      const profileData =
        input.role === "CLUB"
          ? { club: { create: { name: input.clubName! } } }
          : input.role === "COACH"
            ? { coach: { create: { firstName: input.firstName!, lastName: input.lastName! } } }
            : { player: { create: { firstName: input.firstName!, lastName: input.lastName! } } };

      const user = await ctx.db.user.create({
        data: {
          email: input.email,
          passwordHash,
          role: input.role,
          ...profileData,
        },
      });

      return { success: true, userId: user.id };
    }),
});
