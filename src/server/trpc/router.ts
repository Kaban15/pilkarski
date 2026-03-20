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
});

export type AppRouter = typeof appRouter;
