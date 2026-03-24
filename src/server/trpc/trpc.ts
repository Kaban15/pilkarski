import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { db } from "@/server/db/client";
import { auth } from "@/server/auth/config";
import { isRateLimited } from "@/lib/rate-limit";

export const createTRPCContext = async () => {
  const session = await auth();
  return {
    db,
    session,
  };
};

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

const enforceAuth = t.middleware(async ({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Musisz być zalogowany" });
  }
  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
    },
  });
});

export const protectedProcedure = t.procedure.use(enforceAuth);

/**
 * Rate-limited protected procedure.
 * Uses userId + procedure path as the rate limit key.
 */
export const rateLimitedProcedure = (opts: { maxAttempts?: number; windowMs?: number } = {}) =>
  t.procedure.use(enforceAuth).use(async ({ ctx, path, next }) => {
    const key = `trpc:${path}:${ctx.session.user.id}`;
    if (isRateLimited(key, { maxAttempts: opts.maxAttempts ?? 10, windowMs: opts.windowMs ?? 60_000 })) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: "Zbyt wiele żądań. Spróbuj ponownie za chwilę.",
      });
    }
    return next();
  });
