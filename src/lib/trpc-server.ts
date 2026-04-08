import "server-only";

import { cache } from "react";
import { QueryClient } from "@tanstack/react-query";
import { createHydrationHelpers } from "@trpc/react-query/rsc";
import { createCallerFactory, createTRPCContext } from "@/server/trpc/trpc";
import { appRouter } from "@/server/trpc/router";

export const getQueryClient = cache(
  () =>
    new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 120_000,
        },
      },
    }),
);

const serverCaller = createCallerFactory(appRouter)(createTRPCContext);

export const { trpc, HydrateClient } = createHydrationHelpers<typeof appRouter>(
  serverCaller,
  getQueryClient,
);
