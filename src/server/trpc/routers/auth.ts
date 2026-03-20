import { router, publicProcedure } from "../trpc";
import { registerSchema } from "@/lib/validators/auth";
import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";

export const authRouter = router({
  register: publicProcedure
    .input(registerSchema)
    .mutation(async ({ ctx, input }) => {
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

      const user = await ctx.db.user.create({
        data: {
          email: input.email,
          passwordHash,
          role: input.role,
          ...(input.role === "CLUB"
            ? {
                club: {
                  create: { name: input.clubName! },
                },
              }
            : {
                player: {
                  create: {
                    firstName: input.firstName!,
                    lastName: input.lastName!,
                  },
                },
              }),
        },
      });

      return { success: true, userId: user.id };
    }),
});
