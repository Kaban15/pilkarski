import { cache } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { db } from "@/server/db/client";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Badge } from "@/components/ui/badge";
import { Trophy, Users } from "lucide-react";
import { pluralPL } from "@/lib/labels";

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
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <Breadcrumbs
          items={[
            { label: "Polska", href: "/leagues" },
            { label: region.name },
          ]}
        />

        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight">{region.name}</h1>
          <p className="mt-1 text-muted-foreground">
            Wybierz szczebel ligowy, aby zobaczyć grupy i drużyny.
          </p>
        </div>

        {levels.length === 0 ? (
          <p className="text-muted-foreground">Brak szczebli ligowych w tym regionie.</p>
        ) : (
          <div className="space-y-2">
            {levels.map((level) => {
              const href =
                level.groups.length === 1
                  ? `/leagues/${regionSlug}/${level.id}/${level.groups[0].id}`
                  : `/leagues/${regionSlug}/${level.id}`;

              return (
                <Link
                  key={level.id}
                  href={href}
                  className="group flex items-center justify-between rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/30 hover:shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <Trophy className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                    <div>
                      <span className="font-medium">{level.name}</span>
                      {level.groups.length > 1 && (
                        <p className="text-xs text-muted-foreground">
                          {level.groups.length} {pluralPL(level.groups.length, "grupa", "grupy", "grup")}
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge variant="secondary" className="gap-1">
                    <Users className="h-3 w-3" />
                    {level.clubCount}
                  </Badge>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
