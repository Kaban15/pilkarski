import { router, protectedProcedure } from "../trpc";

export const statsRouter = router({
  dashboard: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const role = ctx.session.user.role;

    if (role === "CLUB") {
      const club = await ctx.db.club.findUnique({ where: { userId } });
      if (!club) return { role: "CLUB" as const, sparings: 0, applications: 0, events: 0, messages: 0 };

      const [sparings, applications, events, messages] = await Promise.all([
        ctx.db.sparingOffer.count({ where: { clubId: club.id } }),
        ctx.db.sparingApplication.count({ where: { sparingOffer: { clubId: club.id } } }),
        ctx.db.event.count({ where: { clubId: club.id } }),
        ctx.db.message.count({
          where: { conversation: { participants: { some: { userId } } } },
        }),
      ]);

      return { role: "CLUB" as const, sparings, applications, events, messages };
    }

    // PLAYER
    const player = await ctx.db.player.findUnique({ where: { userId } });
    const [eventApps, messages] = await Promise.all([
      player
        ? ctx.db.eventApplication.count({ where: { playerId: player.id } })
        : Promise.resolve(0),
      ctx.db.message.count({
        where: { conversation: { participants: { some: { userId } } } },
      }),
    ]);

    return { role: "PLAYER" as const, eventApps, messages };
  }),
});
