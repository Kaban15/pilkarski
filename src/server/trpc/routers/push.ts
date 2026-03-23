import { z } from "zod/v4";
import { router, protectedProcedure } from "../trpc";

export const pushRouter = router({
  // Subscribe to push notifications
  subscribe: protectedProcedure
    .input(
      z.object({
        endpoint: z.string().url(),
        p256dh: z.string(),
        auth: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Upsert — don't create duplicate subscriptions
      await ctx.db.pushSubscription.upsert({
        where: {
          userId_endpoint: { userId, endpoint: input.endpoint },
        },
        update: { p256dh: input.p256dh, auth: input.auth },
        create: {
          userId,
          endpoint: input.endpoint,
          p256dh: input.p256dh,
          auth: input.auth,
        },
      });

      return { success: true };
    }),

  // Unsubscribe from push notifications
  unsubscribe: protectedProcedure
    .input(z.object({ endpoint: z.string().url() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.pushSubscription.deleteMany({
        where: { userId: ctx.session.user.id, endpoint: input.endpoint },
      });
      return { success: true };
    }),

  // Check if current user has an active subscription
  status: protectedProcedure.query(async ({ ctx }) => {
    const count = await ctx.db.pushSubscription.count({
      where: { userId: ctx.session.user.id },
    });
    return { subscribed: count > 0 };
  }),
});
