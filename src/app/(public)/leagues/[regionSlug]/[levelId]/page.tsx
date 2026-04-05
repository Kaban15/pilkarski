import Link from "next/link";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { db } from "@/server/db/client";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { ChevronRight, Users } from "lucide-react";
import { pluralPL } from "@/lib/labels";
import { RegionLogo } from "@/components/region-logo";

type Props = { params: Promise<{ regionSlug: string; levelId: string }> };

async function getData(regionSlug: string, levelId: number) {
  const region = await db.region.findUnique({ where: { slug: regionSlug } });
  if (!region) return null;

  const level = await db.leagueLevel.findFirst({
    where: { id: levelId, regionId: region.id },
  });
  if (!level) return null;

  const groups = await db.leagueGroup.findMany({
    where: { leagueLevelId: levelId },
    include: { _count: { select: { clubs: true } } },
  });

  groups.sort((a, b) => {
    const numA = parseInt(a.name.replace(/\D/g, ""), 10) || 0;
    const numB = parseInt(b.name.replace(/\D/g, ""), 10) || 0;
    return numA - numB;
  });

  return { region, level, groups };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { regionSlug, levelId } = await params;
  const data = await getData(regionSlug, Number(levelId));
  if (!data) return { title: "Nie znaleziono" };
  return {
    title: `${data.level.name} — ${data.region.name}`,
    description: `Grupy ligowe: ${data.level.name} w regionie ${data.region.name}.`,
  };
}

export default async function GroupsPage({ params }: Props) {
  const { regionSlug, levelId } = await params;
  const data = await getData(regionSlug, Number(levelId));
  if (!data) notFound();

  const { region, level, groups } = data;
  const totalClubs = groups.reduce((sum, g) => sum + g._count.clubs, 0);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <Breadcrumbs
          items={[
            { label: "Menu", href: "/feed" },
            { label: "Ligi", href: "/leagues" },
            { label: region.name, href: `/leagues/${regionSlug}` },
            { label: level.name },
          ]}
        />

        <div className="mb-8 flex items-center gap-4">
          <RegionLogo slug={regionSlug} name={region.name} size={40} />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{level.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {region.name} &middot; {groups.length} {pluralPL(groups.length, "grupa", "grupy", "grup")} &middot; {totalClubs} klubów
            </p>
          </div>
        </div>

        {groups.length === 0 ? (
          <p className="text-muted-foreground">Brak grup w tym szczeblu.</p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-border">
            {groups.map((group, i) => (
              <Link
                key={group.id}
                href={`/leagues/${regionSlug}/${levelId}/${group.id}`}
                className={`group flex items-center gap-4 px-4 py-3 transition-colors hover:bg-muted/50 ${
                  i > 0 ? "border-t border-border" : ""
                }`}
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-bold text-muted-foreground">
                  {i + 1}
                </div>
                <p className="flex-1 text-[13px] font-semibold group-hover:text-primary">
                  {group.name}
                </p>
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Users className="h-3 w-3" />
                    {group._count.clubs}
                  </span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
