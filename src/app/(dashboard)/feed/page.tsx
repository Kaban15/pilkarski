import { Suspense } from "react";
import { auth } from "@/server/auth/config";
import { HydrateClient, trpc, getQueryClient } from "@/lib/trpc-server";
import FeedClient from "./feed-client";

export default async function FeedPage() {
  const session = await auth();
  const role = session?.user?.role;

  // Prefetch key queries server-side — data streams to client
  void trpc.feed.get.prefetch({ limit: 30 });
  void trpc.stats.dashboard.prefetch();

  if (role === "CLUB") {
    void trpc.club.me.prefetch();
    void trpc.stats.clubDashboard.prefetch();
  }

  return (
    <HydrateClient>
      <Suspense>
        <FeedClient />
      </Suspense>
    </HydrateClient>
  );
}
