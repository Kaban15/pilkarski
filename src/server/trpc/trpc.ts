import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { db } from "@/server/db/client";
import { auth } from "@/server/auth/config";

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

export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
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
