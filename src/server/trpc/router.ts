import { router } from "./trpc";
import { healthRouter } from "./routers/health";
import { authRouter } from "./routers/auth";
import { clubRouter } from "./routers/club";
import { playerRouter } from "./routers/player";
import { regionRouter } from "./routers/region";
import { sparingRouter } from "./routers/sparing";
import { eventRouter } from "./routers/event";
import { messageRouter } from "./routers/message";
import { feedRouter } from "./routers/feed";
import { searchRouter } from "./routers/search";
import { notificationRouter } from "./routers/notification";
import { favoriteRouter } from "./routers/favorite";
import { statsRouter } from "./routers/stats";
import { reviewRouter } from "./routers/review";
import { transferRouter } from "./routers/transfer";
import { gamificationRouter } from "./routers/gamification";
import { pushRouter } from "./routers/push";
import { recruitmentRouter } from "./routers/recruitment";
import { clubPostRouter } from "./routers/club-post";
import { coachRouter } from "./routers/coach";
import { clubMembershipRouter } from "./routers/club-membership";
import { teamLineupRouter } from "./routers/team-lineup";
import { tournamentRouter } from "./routers/tournament";
import { adminRouter } from "./routers/admin";

export const appRouter = router({
  health: healthRouter,
  auth: authRouter,
  club: clubRouter,
  player: playerRouter,
  region: regionRouter,
  sparing: sparingRouter,
  event: eventRouter,
  message: messageRouter,
  feed: feedRouter,
  search: searchRouter,
  notification: notificationRouter,
  favorite: favoriteRouter,
  stats: statsRouter,
  review: reviewRouter,
  transfer: transferRouter,
  gamification: gamificationRouter,
  push: pushRouter,
  recruitment: recruitmentRouter,
  clubPost: clubPostRouter,
  coach: coachRouter,
  clubMembership: clubMembershipRouter,
  teamLineup: teamLineupRouter,
  tournament: tournamentRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;
