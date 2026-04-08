import { HydrateClient, trpc } from "@/lib/trpc-server";
import SparingsClient from "./sparings-client";

export default async function SparingsPage() {
  void trpc.region.list.prefetch();

  return (
    <HydrateClient>
      <SparingsClient />
    </HydrateClient>
  );
}
