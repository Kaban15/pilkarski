import Link from "next/link";
import { Metadata } from "next";
import { db } from "@/server/db/client";
import { Shield, Users, ChevronRight, Trophy } from "lucide-react";
import { BackButton } from "@/components/back-button";

export const metadata: Metadata = {
  title: "Ligi regionalne 2024/25",
  description: "Przeglądaj drużyny według struktury ligowej — 16 Związków Piłki Nożnej.",
};

export default async function LeaguesPage() {
  const regions = await db.region.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { clubs: true, leagueLevels: true } },
    },
  });

  const totalClubs = regions.reduce((sum, r) => sum + r._count.clubs, 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="border-b bg-card">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
          <BackButton label="Powrót" variant="dark" />
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Trophy className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Ligi regionalne 2024/25
              </h1>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {regions.length} związków &middot; {totalClubs} klubów
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {regions.map((region) => (
            <Link
              key={region.id}
              href={`/leagues/${region.slug}`}
              className="group flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 transition-all hover:border-primary/30 hover:shadow-sm"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
                <Shield className="h-4 w-4 text-emerald-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold group-hover:text-primary">
                  {region.name}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {region._count.leagueLevels} szczebli &middot; {region._count.clubs} klubów
                </p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50 group-hover:text-primary" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
