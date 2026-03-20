import { router } from "./trpc";
import { healthRouter } from "./routers/health";
import { authRouter } from "./routers/auth";
import { clubRouter } from "./routers/club";
import { playerRouter } from "./routers/player";
import { regionRouter } from "./routers/region";

export const appRouter = router({
  health: healthRouter,
  auth: authRouter,
  club: clubRouter,
  player: playerRouter,
  region: regionRouter,
});

export type AppRouter = typeof appRouter;
