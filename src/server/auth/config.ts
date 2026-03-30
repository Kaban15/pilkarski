import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/server/db/client";
import { isRateLimited } from "@/lib/rate-limit";

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;

        if (!email || !password) return null;

        if (isRateLimited(`login:${email}`, { maxAttempts: 5, windowMs: 60_000 })) {
          throw new Error("Zbyt wiele prób logowania. Spróbuj ponownie za minutę.");
        }

        const user = await db.user.findUnique({
          where: { email },
          include: { club: true, player: true, coach: true },
        });

        if (!user) return null;
        if (user.isBanned) return null;

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          role: user.role,
          isAdmin: user.isAdmin,
          name:
            user.role === "CLUB"
              ? user.club?.name
              : user.role === "COACH"
                ? `${user.coach?.firstName} ${user.coach?.lastName}`
                : `${user.player?.firstName} ${user.player?.lastName}`,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = (user as { role: "CLUB" | "PLAYER" | "COACH" }).role;
        token.isAdmin = (user as { isAdmin?: boolean }).isAdmin ?? false;
        token.bannedCheckedAt = Date.now();
      }

      // Re-check isBanned every 5 minutes
      const FIVE_MINUTES = 5 * 60 * 1000;
      if (!token.bannedCheckedAt || Date.now() - token.bannedCheckedAt > FIVE_MINUTES) {
        const dbUser = await db.user.findUnique({
          where: { id: token.id },
          select: { isBanned: true, isAdmin: true },
        });
        if (dbUser?.isBanned) {
          return { ...token, id: "", role: "" as "CLUB" };
        }
        token.isAdmin = dbUser?.isAdmin ?? false;
        token.bannedCheckedAt = Date.now();
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.isAdmin = token.isAdmin ?? false;
      }
      return session;
    },
  },
});
