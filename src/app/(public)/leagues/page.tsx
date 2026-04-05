import Link from "next/link";
import { Metadata } from "next";
import { db } from "@/server/db/client";
import { ChevronRight, Trophy, MapPin, Users, Home } from "lucide-react";
import { ScrollReveal } from "@/components/scroll-reveal";
import { pluralPL } from "@/lib/labels";
import { RegionLogo } from "@/components/region-logo";

export const metadata: Metadata = {
  title: "Ligi regionalne 2025/26",
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
  const totalLevels = regions.reduce((sum, r) => sum + r._count.leagueLevels, 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="relative overflow-hidden border-b">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-violet-500/8 via-sky-500/4 to-transparent" />
        <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 h-40 w-96 rounded-full bg-violet-500/10 blur-[80px]" />
        <div className="relative mx-auto max-w-5xl px-4 py-12 sm:px-6">
          <Link
            href="/feed"
            className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
          >
            <Home className="h-4 w-4" />
            Menu główne
          </Link>
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-sky-500 shadow-lg shadow-violet-500/25">
              <Trophy className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Ligi regionalne 2025/26
              </h1>
              <div className="mt-1.5 flex items-center gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {regions.length} związków
                </span>
                <span className="text-border">•</span>
                <span>{totalLevels} szczebli</span>
                <span className="text-border">•</span>
                <span className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  {totalClubs} {pluralPL(totalClubs, "klub", "kluby", "klubów")}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Regions */}
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <ScrollReveal>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {regions.map((region, i) => (
              <Link
                key={region.id}
                href={`/leagues/${region.slug}`}
                className="hover-glow-violet group relative overflow-hidden rounded-xl border border-border bg-card p-5 transition-all"
              >
                {/* Subtle gradient accent top */}
                <div className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-violet-500/40 via-sky-500/40 to-violet-500/0 opacity-0 transition-opacity group-hover:opacity-100" />

                <div className="mb-3 flex items-center justify-between">
                  <RegionLogo slug={region.slug} name={region.name} size={40} />
                  <ChevronRight className="h-4 w-4 text-muted-foreground/30 transition-all group-hover:translate-x-0.5 group-hover:text-violet-400" />
                </div>

                <h3 className="text-[14px] font-semibold leading-tight group-hover:text-primary">
                  {region.name}
                </h3>

                <div className="mt-2 flex items-center gap-2 text-[11px] text-muted-foreground">
                  <span className="rounded-md bg-muted px-1.5 py-0.5 font-medium">
                    {region._count.leagueLevels} {pluralPL(region._count.leagueLevels, "szczebel", "szczeble", "szczebli")}
                  </span>
                  {region._count.clubs > 0 && (
                    <span className="rounded-md bg-violet-500/10 px-1.5 py-0.5 font-medium text-violet-400">
                      {region._count.clubs} {pluralPL(region._count.clubs, "klub", "kluby", "klubów")}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
}
