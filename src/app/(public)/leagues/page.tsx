import Link from "next/link";
import { Metadata } from "next";
import { db } from "@/server/db/client";
import { Shield, ChevronRight, Trophy } from "lucide-react";
import { BackButton } from "@/components/back-button";
import { ScrollReveal } from "@/components/scroll-reveal";
import { PolandMap } from "@/components/leagues/poland-map";
import { pluralPL } from "@/lib/labels";

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
  const totalLevels = regions.reduce((sum, r) => sum + r._count.leagueLevels, 0);

  const mapRegions = regions.map((r) => ({
    slug: r.slug,
    name: r.name,
    clubCount: r._count.clubs,
    levelCount: r._count.leagueLevels,
  }));

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="relative overflow-hidden border-b bg-gradient-to-b from-violet-500/5 to-transparent">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
          <BackButton label="Powrót" variant="dark" />
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-sky-500 shadow-lg shadow-violet-500/20">
              <Trophy className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Ligi regionalne 2024/25
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {regions.length} związków &middot; {totalLevels} szczebli &middot; {totalClubs} {pluralPL(totalClubs, "klub", "kluby", "klubów")}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        {/* Geographic grid map — desktop */}
        <ScrollReveal>
          <div className="mb-10 hidden sm:block">
            <p className="mb-5 text-center text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Wybierz województwo
            </p>
            <PolandMap regions={mapRegions} />
          </div>
        </ScrollReveal>

        {/* Region list */}
        <ScrollReveal delay={1}>
          <p className="mb-4 text-xs font-medium uppercase tracking-widest text-muted-foreground sm:hidden">
            Wybierz województwo
          </p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {regions.map((region) => (
              <Link
                key={region.id}
                href={`/leagues/${region.slug}`}
                className="hover-glow-violet group flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3.5 transition-all"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/15 to-sky-500/10">
                  <Shield className="h-4.5 w-4.5 text-violet-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold leading-tight group-hover:text-primary">
                    {region.name}
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {region._count.leagueLevels} {pluralPL(region._count.leagueLevels, "szczebel", "szczeble", "szczebli")}
                    {region._count.clubs > 0 && ` · ${region._count.clubs} kl.`}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/30 transition-colors group-hover:text-primary" />
              </Link>
            ))}
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
}
