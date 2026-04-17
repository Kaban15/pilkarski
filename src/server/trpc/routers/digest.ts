import { router, protectedProcedure } from "../trpc";
import {
  getClubDigest,
  getPlayerDigest,
  getCoachDigest,
  type DigestResponse,
  type DigestRole,
} from "@/lib/digest";

export const digestRouter = router({
  get: protectedProcedure.query(async ({ ctx }): Promise<DigestResponse> => {
    const userId = ctx.session.user.id;
    const role = ctx.session.user.role as DigestRole;

    const result =
      role === "CLUB"
        ? await getClubDigest({ db: ctx.db, userId })
        : role === "PLAYER"
          ? await getPlayerDigest({ db: ctx.db, userId })
          : await getCoachDigest({ db: ctx.db, userId });

    return {
      role,
      rows: result.rows,
      totalCount: result.totalCount,
      generatedAt: new Date().toISOString(),
    };
  }),
});
