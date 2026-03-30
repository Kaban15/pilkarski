import { router, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import {
  adminReportsListSchema,
  adminDismissReportSchema,
  adminHidePostSchema,
  adminUsersListSchema,
  adminBanSchema,
  adminSetAdminSchema,
  adminContentListSchema,
  adminDeleteContentSchema,
} from "@/lib/validators/admin";

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!ctx.session.user.isAdmin) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Brak uprawnień admina" });
  }
  return next();
});

export const adminRouter = router({
  // ── Reports ──

  reportsList: adminProcedure
    .input(adminReportsListSchema)
    .query(async ({ ctx, input }) => {
      const items = await ctx.db.clubPost.findMany({
        where: { reportCount: { gt: 0 }, hidden: false },
        include: {
          club: { select: { id: true, name: true, logoUrl: true } },
          reports: {
            include: { user: { select: { id: true, email: true } } },
            orderBy: { createdAt: "desc" },
          },
        },
        take: input.limit + 1,
        ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
        orderBy: { reportCount: "desc" },
      });

      let nextCursor: string | undefined;
      if (items.length > input.limit) {
        nextCursor = items.pop()!.id;
      }

      return { items, nextCursor };
    }),

  dismissReport: adminProcedure
    .input(adminDismissReportSchema)
    .mutation(async ({ ctx, input }) => {
      await ctx.db.$transaction([
        ctx.db.clubPostReport.deleteMany({ where: { postId: input.postId } }),
        ctx.db.clubPost.update({
          where: { id: input.postId },
          data: { reportCount: 0 },
        }),
      ]);
      return { success: true };
    }),

  hidePost: adminProcedure
    .input(adminHidePostSchema)
    .mutation(async ({ ctx, input }) => {
      await ctx.db.clubPost.update({
        where: { id: input.postId },
        data: {
          hidden: true,
          hiddenAt: new Date(),
          hiddenBy: ctx.session.user.id,
          reportCount: 0,
        },
      });
      await ctx.db.clubPostReport.deleteMany({ where: { postId: input.postId } });
      return { success: true };
    }),

  // ── Users ──

  usersList: adminProcedure
    .input(adminUsersListSchema)
    .query(async ({ ctx, input }) => {
      const where: Record<string, unknown> = {};

      if (input.search) {
        where.OR = [
          { email: { contains: input.search, mode: "insensitive" } },
          { club: { name: { contains: input.search, mode: "insensitive" } } },
          { player: { firstName: { contains: input.search, mode: "insensitive" } } },
          { player: { lastName: { contains: input.search, mode: "insensitive" } } },
          { coach: { firstName: { contains: input.search, mode: "insensitive" } } },
          { coach: { lastName: { contains: input.search, mode: "insensitive" } } },
        ];
      }

      const items = await ctx.db.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          role: true,
          isAdmin: true,
          isBanned: true,
          createdAt: true,
          club: { select: { name: true } },
          player: { select: { firstName: true, lastName: true } },
          coach: { select: { firstName: true, lastName: true } },
        },
        take: input.limit + 1,
        ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
        orderBy: { createdAt: "desc" },
      });

      let nextCursor: string | undefined;
      if (items.length > input.limit) {
        nextCursor = items.pop()!.id;
      }

      return { items, nextCursor };
    }),

  ban: adminProcedure
    .input(adminBanSchema)
    .mutation(async ({ ctx, input }) => {
      if (input.userId === ctx.session.user.id) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Nie możesz zbanować siebie" });
      }
      await ctx.db.user.update({
        where: { id: input.userId },
        data: { isBanned: true },
      });
      return { success: true };
    }),

  unban: adminProcedure
    .input(adminBanSchema)
    .mutation(async ({ ctx, input }) => {
      await ctx.db.user.update({
        where: { id: input.userId },
        data: { isBanned: false },
      });
      return { success: true };
    }),

  setAdmin: adminProcedure
    .input(adminSetAdminSchema)
    .mutation(async ({ ctx, input }) => {
      if (input.userId === ctx.session.user.id && !input.isAdmin) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Nie możesz odebrać sobie roli admina" });
      }
      if (!input.isAdmin) {
        const adminCount = await ctx.db.user.count({ where: { isAdmin: true } });
        if (adminCount <= 1) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Musi istnieć co najmniej jeden admin" });
        }
      }
      await ctx.db.user.update({
        where: { id: input.userId },
        data: { isAdmin: input.isAdmin },
      });
      return { success: true };
    }),

  // ── Metrics ──

  dashboard: adminProcedure.query(async ({ ctx }) => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [
      totalUsers,
      clubCount,
      playerCount,
      coachCount,
      newUsers7d,
      totalSparings,
      newSparings7d,
      totalEvents,
      newEvents7d,
      totalTournaments,
      pendingReports,
    ] = await Promise.all([
      ctx.db.user.count(),
      ctx.db.user.count({ where: { role: "CLUB" } }),
      ctx.db.user.count({ where: { role: "PLAYER" } }),
      ctx.db.user.count({ where: { role: "COACH" } }),
      ctx.db.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      ctx.db.sparingOffer.count(),
      ctx.db.sparingOffer.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      ctx.db.event.count(),
      ctx.db.event.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      ctx.db.tournament.count(),
      ctx.db.clubPost.count({ where: { reportCount: { gt: 0 }, hidden: false } }),
    ]);

    return {
      totalUsers, clubCount, playerCount, coachCount, newUsers7d,
      totalSparings, newSparings7d, totalEvents, newEvents7d,
      totalTournaments, pendingReports,
    };
  }),

  // ── Content ──

  contentList: adminProcedure
    .input(adminContentListSchema.extend({
      type: adminDeleteContentSchema.shape.type,
    }))
    .query(async ({ ctx, input }) => {
      const searchFilter = input.search
        ? { title: { contains: input.search, mode: "insensitive" as const } }
        : {};

      if (input.type === "sparing") {
        const items = await ctx.db.sparingOffer.findMany({
          where: searchFilter,
          include: { club: { select: { id: true, name: true } } },
          take: input.limit + 1,
          ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
          orderBy: { createdAt: "desc" },
        });
        let nextCursor: string | undefined;
        if (items.length > input.limit) nextCursor = items.pop()!.id;
        return { items, nextCursor };
      }

      if (input.type === "event") {
        const items = await ctx.db.event.findMany({
          where: searchFilter,
          include: { club: { select: { id: true, name: true } } },
          take: input.limit + 1,
          ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
          orderBy: { createdAt: "desc" },
        });
        let nextCursor: string | undefined;
        if (items.length > input.limit) nextCursor = items.pop()!.id;
        return { items, nextCursor };
      }

      // tournament
      const items = await ctx.db.tournament.findMany({
        where: input.search
          ? { title: { contains: input.search, mode: "insensitive" } }
          : {},
        select: {
          id: true, title: true, status: true, startDate: true, createdAt: true,
          creator: { select: { id: true, email: true } },
        },
        take: input.limit + 1,
        ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
        orderBy: { createdAt: "desc" },
      });
      let nextCursor: string | undefined;
      if (items.length > input.limit) nextCursor = items.pop()!.id;
      return { items, nextCursor };
    }),

  deleteContent: adminProcedure
    .input(adminDeleteContentSchema)
    .mutation(async ({ ctx, input }) => {
      if (input.type === "sparing") {
        await ctx.db.sparingOffer.update({
          where: { id: input.id },
          data: { status: "CANCELLED" },
        });
      } else if (input.type === "event") {
        // Event has no status field — hard delete is the only option
        await ctx.db.event.delete({ where: { id: input.id } });
      } else {
        await ctx.db.tournament.update({
          where: { id: input.id },
          data: { status: "CANCELLED" },
        });
      }
      return { success: true };
    }),
});
