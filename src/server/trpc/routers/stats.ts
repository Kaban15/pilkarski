import { router, protectedProcedure, publicProcedure } from "../trpc";

export const statsRouter = router({
  // Detailed stats for /stats page
  detailed: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const role = ctx.session.user.role;

    // Activity per month (last 6 months) — sparings and events created
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const [sparingsPerMonth, eventsPerMonth, topRegions, platformTotals] = await Promise.all([
      ctx.db.sparingOffer.groupBy({
        by: ["createdAt"],
        where: { createdAt: { gte: sixMonthsAgo } },
        _count: true,
      }),
      ctx.db.event.groupBy({
        by: ["createdAt"],
        where: { createdAt: { gte: sixMonthsAgo } },
        _count: true,
      }),
      // Top 5 regions by activity
      ctx.db.sparingOffer.groupBy({
        by: ["regionId"],
        where: { regionId: { not: null } },
        _count: true,
        orderBy: { _count: { regionId: "desc" } },
        take: 5,
      }),
      // Platform totals
      Promise.all([
        ctx.db.club.count(),
        ctx.db.player.count(),
        ctx.db.sparingOffer.count(),
        ctx.db.event.count(),
        ctx.db.transfer.count({ where: { status: "ACTIVE" } }),
        ctx.db.review.count(),
      ]),
    ]);

    // Aggregate sparings by month
    const monthlyData = aggregateByMonth(sparingsPerMonth, eventsPerMonth);

    // Resolve region names
    const regionIds = topRegions.map((r) => r.regionId).filter((id): id is number => id !== null);
    const regionNames = regionIds.length > 0
      ? await ctx.db.region.findMany({ where: { id: { in: regionIds } }, select: { id: true, name: true } })
      : [];
    const regionMap = Object.fromEntries(regionNames.map((r) => [r.id, r.name]));

    const topRegionsData = topRegions.map((r) => ({
      name: r.regionId ? (regionMap[r.regionId] ?? "Nieznany") : "Brak",
      count: r._count,
    }));

    // User-specific stats
    let userStats: any = {};
    if (role === "CLUB") {
      const club = await ctx.db.club.findUnique({ where: { userId } });
      if (club) {
        const [totalSparings, matchedSparings, totalApps, acceptedApps, avgRating] = await Promise.all([
          ctx.db.sparingOffer.count({ where: { clubId: club.id } }),
          ctx.db.sparingOffer.count({ where: { clubId: club.id, status: { in: ["MATCHED", "COMPLETED"] } } }),
          ctx.db.sparingApplication.count({ where: { sparingOffer: { clubId: club.id } } }),
          ctx.db.sparingApplication.count({ where: { sparingOffer: { clubId: club.id }, status: "ACCEPTED" } }),
          ctx.db.review.aggregate({ where: { reviewedClubId: club.id }, _avg: { rating: true }, _count: { rating: true } }),
        ]);
        userStats = {
          totalSparings,
          matchedSparings,
          matchRate: totalSparings > 0 ? Math.round((matchedSparings / totalSparings) * 100) : 0,
          totalApps,
          acceptedApps,
          acceptRate: totalApps > 0 ? Math.round((acceptedApps / totalApps) * 100) : 0,
          avgRating: avgRating._avg.rating ?? 0,
          reviewCount: avgRating._count.rating,
        };
      }
    } else if (role === "PLAYER") {
      const player = await ctx.db.player.findUnique({ where: { userId } });
      if (player) {
        const [totalApps, acceptedApps] = await Promise.all([
          ctx.db.eventApplication.count({ where: { playerId: player.id } }),
          ctx.db.eventApplication.count({ where: { playerId: player.id, status: "ACCEPTED" } }),
        ]);
        userStats = {
          totalApps,
          acceptedApps,
          acceptRate: totalApps > 0 ? Math.round((acceptedApps / totalApps) * 100) : 0,
        };
      }
    }

    return {
      role,
      monthlyData,
      topRegions: topRegionsData,
      platform: {
        clubs: platformTotals[0],
        players: platformTotals[1],
        sparings: platformTotals[2],
        events: platformTotals[3],
        transfers: platformTotals[4],
        reviews: platformTotals[5],
      },
      userStats,
    };
  }),

  platform: publicProcedure.query(async ({ ctx }) => {
    const [clubs, sparings, events, players] = await Promise.all([
      ctx.db.club.count(),
      ctx.db.sparingOffer.count(),
      ctx.db.event.count(),
      ctx.db.player.count(),
    ]);
    return { clubs, sparings, events, players };
  }),

  dashboard: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const role = ctx.session.user.role;

    if (role === "CLUB") {
      const club = await ctx.db.club.findUnique({ where: { userId } });
      if (!club) return { role: "CLUB" as const, activeSparings: 0, pendingApplications: 0, upcomingEvents: 0, unreadMessages: 0 };

      const now = new Date();
      const [activeSparings, pendingApplications, upcomingEvents, unreadMessages] = await Promise.all([
        ctx.db.sparingOffer.count({ where: { clubId: club.id, status: "OPEN" } }),
        ctx.db.sparingApplication.count({
          where: {
            sparingOffer: { clubId: club.id, status: "OPEN" },
            status: "PENDING",
          },
        }),
        ctx.db.event.count({ where: { clubId: club.id, eventDate: { gte: now } } }),
        ctx.db.message.count({
          where: {
            conversation: { participants: { some: { userId } } },
            readAt: null,
            senderId: { not: userId },
          },
        }),
      ]);

      return { role: "CLUB" as const, activeSparings, pendingApplications, upcomingEvents, unreadMessages };
    }

    if (role === "COACH") {
      const unreadMessages = await ctx.db.message.count({
        where: {
          conversation: { participants: { some: { userId } } },
          readAt: null,
          senderId: { not: userId },
        },
      });
      return { role: "COACH" as const, unreadMessages };
    }

    // PLAYER
    const player = await ctx.db.player.findUnique({ where: { userId } });
    const [eventApps, unreadMessages] = await Promise.all([
      player
        ? ctx.db.eventApplication.count({ where: { playerId: player.id } })
        : Promise.resolve(0),
      ctx.db.message.count({
        where: {
          conversation: { participants: { some: { userId } } },
          readAt: null,
          senderId: { not: userId },
        },
      }),
    ]);

    return { role: "PLAYER" as const, eventApps, unreadMessages };
  }),

  // Club dashboard sections: active sparings, upcoming events, pending applications + next match, squad count, win record
  clubDashboard: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    if (ctx.session.user.role !== "CLUB") return null;

    const club = await ctx.db.club.findUnique({ where: { userId } });
    if (!club) return null;

    const now = new Date();

    const [activeSparings, upcomingEvents, pendingApplications, squadCount, nextMatchOffer] = await Promise.all([
      ctx.db.sparingOffer.findMany({
        where: { clubId: club.id, status: "OPEN" },
        include: {
          region: { select: { name: true } },
          _count: { select: { applications: true } },
        },
        orderBy: { matchDate: "asc" },
        take: 3,
      }),
      ctx.db.event.findMany({
        where: { clubId: club.id, eventDate: { gte: now } },
        include: {
          region: { select: { name: true } },
          _count: { select: { applications: true } },
        },
        orderBy: { eventDate: "asc" },
        take: 3,
      }),
      ctx.db.sparingApplication.findMany({
        where: {
          sparingOffer: { clubId: club.id, status: "OPEN" },
          status: { in: ["PENDING", "COUNTER_PROPOSED"] },
        },
        include: {
          applicantClub: { select: { id: true, name: true, city: true, logoUrl: true } },
          sparingOffer: { select: { id: true, title: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      // Squad count: accepted club memberships
      ctx.db.clubMembership.count({
        where: { clubId: club.id, status: "ACCEPTED" },
      }),
      // Next upcoming MATCHED sparing
      ctx.db.sparingOffer.findFirst({
        where: {
          clubId: club.id,
          status: "MATCHED",
          matchDate: { gte: now },
        },
        include: {
          applications: {
            where: { status: "ACCEPTED" },
            include: {
              applicantClub: { select: { id: true, name: true, logoUrl: true } },
            },
            take: 1,
          },
        },
        orderBy: { matchDate: "asc" },
      }),
    ]);

    // Build nextMatch data
    let nextMatch: {
      id: string;
      title: string;
      matchDate: Date;
      opponentClub: { id: string; name: string; logoUrl: string | null } | null;
    } | null = null;

    if (nextMatchOffer) {
      const acceptedApp = nextMatchOffer.applications[0];
      nextMatch = {
        id: nextMatchOffer.id,
        title: nextMatchOffer.title,
        matchDate: nextMatchOffer.matchDate,
        opponentClub: acceptedApp?.applicantClub ?? null,
      };
    }

    return {
      activeSparings,
      upcomingEvents,
      pendingApplications,
      squadCount,
      nextMatch,
    };
  }),

  coachDashboard: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.session.user.role !== "COACH") return null;

    const coach = await ctx.db.coach.findUnique({
      where: { userId: ctx.session.user.id },
      select: { regionId: true },
    });
    if (!coach) return null;

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const trainingTypes = ["INDIVIDUAL_TRAINING", "GROUP_TRAINING"] as const;

    // Count active trainings in coach's region
    const activeTrainings = await ctx.db.event.count({
      where: {
        type: { in: [...trainingTypes] },
        eventDate: { gte: now },
        ...(coach.regionId ? { regionId: coach.regionId } : {}),
      },
    });

    // Count applications to trainings this week in coach's region
    const weeklySignups = await ctx.db.eventApplication.count({
      where: {
        createdAt: { gte: weekAgo },
        event: {
          type: { in: [...trainingTypes] },
          ...(coach.regionId ? { regionId: coach.regionId } : {}),
        },
      },
    });

    // Average review rating for training events in region (using existing Review model on sparings — approximate)
    // For MVP: count total trainings and signups as proxy for engagement
    return {
      activeTrainings,
      weeklySignups,
      regionName: coach.regionId
        ? (await ctx.db.region.findUnique({ where: { id: coach.regionId }, select: { name: true } }))?.name
        : null,
    };
  }),
});

// Helper: aggregate grouped records by YYYY-MM
function aggregateByMonth(
  sparings: { createdAt: Date; _count: number }[],
  events: { createdAt: Date; _count: number }[]
) {
  const MONTHS_PL = ["Sty", "Lut", "Mar", "Kwi", "Maj", "Cze", "Lip", "Sie", "Wrz", "Paź", "Lis", "Gru"];
  const map = new Map<string, { sparingi: number; wydarzenia: number }>();

  // Init last 6 months
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    map.set(key, { sparingi: 0, wydarzenia: 0 });
  }

  for (const s of sparings) {
    const key = `${s.createdAt.getFullYear()}-${String(s.createdAt.getMonth() + 1).padStart(2, "0")}`;
    const entry = map.get(key);
    if (entry) entry.sparingi += s._count;
  }
  for (const e of events) {
    const key = `${e.createdAt.getFullYear()}-${String(e.createdAt.getMonth() + 1).padStart(2, "0")}`;
    const entry = map.get(key);
    if (entry) entry.wydarzenia += e._count;
  }

  return Array.from(map.entries()).map(([key, val]) => {
    const [, m] = key.split("-");
    return { name: MONTHS_PL[parseInt(m) - 1], ...val };
  });
}
