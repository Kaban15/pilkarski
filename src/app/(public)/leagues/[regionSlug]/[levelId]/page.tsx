import Link from "next/link";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { db } from "@/server/db/client";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";

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

  // Sort numerically: "Grupa 1", "Grupa 2", ..., "Grupa 13" (not alphabetical)
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

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <Breadcrumbs
          items={[
            { label: "Polska", href: "/leagues" },
            { label: region.name, href: `/leagues/${regionSlug}` },
            { label: level.name },
          ]}
        />

        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight">{level.name}</h1>
          <p className="mt-1 text-muted-foreground">
            {region.name} &middot; Wybierz grupę, aby zobaczyć drużyny.
          </p>
        </div>

        {groups.length === 0 ? (
          <p className="text-muted-foreground">Brak grup w tym szczeblu.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {groups.map((group) => (
              <Link
                key={group.id}
                href={`/leagues/${regionSlug}/${levelId}/${group.id}`}
                className="group flex items-center justify-between rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/30 hover:shadow-sm"
              >
                <span className="font-medium">{group.name}</span>
                <Badge variant="secondary" className="gap-1">
                  <Users className="h-3 w-3" />
                  {group._count.clubs}
                </Badge>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
