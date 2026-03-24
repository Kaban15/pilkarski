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
          include: { club: true, player: true },
        });

        if (!user) return null;

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          role: user.role,
          name:
            user.role === "CLUB"
              ? user.club?.name
              : `${user.player?.firstName} ${user.player?.lastName}`,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role: string }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as { role?: unknown }).role = token.role;
      }
      return session;
    },
  },
});
