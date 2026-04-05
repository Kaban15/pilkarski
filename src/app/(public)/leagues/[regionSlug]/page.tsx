import { cache } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { db } from "@/server/db/client";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { ChevronRight, Users } from "lucide-react";
import { pluralPL } from "@/lib/labels";
import { RegionLogo } from "@/components/region-logo";

type Props = { params: Promise<{ regionSlug: string }> };

const getRegionBySlug = cache((slug: string) =>
  db.region.findUnique({ where: { slug } })
);

async function getLevelsWithStats(regionId: number) {
  const levels = await db.leagueLevel.findMany({
    where: { regionId },
    orderBy: { tier: "asc" },
    include: {
      groups: {
        include: { _count: { select: { clubs: true } } },
      },
    },
  });

  return levels.map((level) => ({
    ...level,
    clubCount: level.groups.reduce((sum, g) => sum + g._count.clubs, 0),
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { regionSlug } = await params;
  const region = await getRegionBySlug(regionSlug);
  if (!region) return { title: "Region nie znaleziony" };
  return {
    title: `${region.name} — Struktura ligowa`,
    description: `Szczeble ligowe w regionie ${region.name}.`,
  };
}

export default async function RegionLevelsPage({ params }: Props) {
  const { regionSlug } = await params;
  const region = await getRegionBySlug(regionSlug);
  if (!region) notFound();

  const levels = await getLevelsWithStats(region.id);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <Breadcrumbs
          items={[
            { label: "Menu", href: "/feed" },
            { label: "Ligi", href: "/leagues" },
            { label: region.name },
          ]}
        />

        <div className="mb-8 flex items-center gap-4">
          <RegionLogo slug={regionSlug} name={region.name} size={48} />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{region.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {levels.length} {pluralPL(levels.length, "szczebel", "szczeble", "szczebli")} ligowych
            </p>
          </div>
        </div>

        {levels.length === 0 ? (
          <p className="text-muted-foreground">Brak szczebli ligowych w tym regionie.</p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-border">
            {levels.map((level, i) => {
              const href =
                level.groups.length === 1
                  ? `/leagues/${regionSlug}/${level.id}/${level.groups[0].id}`
                  : `/leagues/${regionSlug}/${level.id}`;

              return (
                <Link
                  key={level.id}
                  href={href}
                  className={`group flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-muted/50 ${
                    i > 0 ? "border-t border-border" : ""
                  }`}
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-bold text-muted-foreground">
                    {level.tier}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold group-hover:text-primary">
                      {level.name}
                    </p>
                    {level.groups.length > 1 && (
                      <p className="text-[11px] text-muted-foreground">
                        {level.groups.length} {pluralPL(level.groups.length, "grupa", "grupy", "grup")}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Users className="h-3 w-3" />
                      {level.clubCount}
                    </span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
