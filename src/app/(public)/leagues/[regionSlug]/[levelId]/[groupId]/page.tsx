import Link from "next/link";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { db } from "@/server/db/client";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { MapPin } from "lucide-react";

type Props = { params: Promise<{ regionSlug: string; levelId: string; groupId: string }> };

async function getData(regionSlug: string, levelId: number, groupId: number) {
  const region = await db.region.findUnique({ where: { slug: regionSlug } });
  if (!region) return null;

  const level = await db.leagueLevel.findFirst({
    where: { id: levelId, regionId: region.id },
  });
  if (!level) return null;

  const group = await db.leagueGroup.findFirst({
    where: { id: groupId, leagueLevelId: levelId },
  });
  if (!group) return null;

  const clubs = await db.club.findMany({
    where: { leagueGroupId: groupId },
    orderBy: { name: "asc" },
    include: { region: true },
  });

  return { region, level, group, clubs };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { regionSlug, levelId, groupId } = await params;
  const data = await getData(regionSlug, Number(levelId), Number(groupId));
  if (!data) return { title: "Nie znaleziono" };
  return {
    title: `${data.level.name} — ${data.group.name} — ${data.region.name}`,
    description: `Drużyny w ${data.level.name}, ${data.group.name} (${data.region.name}).`,
  };
}

export default async function ClubsInGroupPage({ params }: Props) {
  const { regionSlug, levelId, groupId } = await params;
  const data = await getData(regionSlug, Number(levelId), Number(groupId));
  if (!data) notFound();

  const { region, level, group, clubs } = data;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <Breadcrumbs
          items={[
            { label: "Polska", href: "/leagues" },
            { label: region.name, href: `/leagues/${regionSlug}` },
            { label: level.name, href: `/leagues/${regionSlug}/${levelId}` },
            { label: group.name },
          ]}
        />

        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight">
            {level.name} &mdash; {group.name}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {region.name} &middot; {clubs.length}{" "}
            {clubs.length === 1 ? "drużyna" : clubs.length < 5 ? "drużyny" : "drużyn"}
          </p>
        </div>

        {clubs.length === 0 ? (
          <p className="text-muted-foreground">
            Brak drużyn przypisanych do tej grupy.
          </p>
        ) : (
          <div className="space-y-2">
            {clubs.map((club) => (
              <Link
                key={club.id}
                href={`/clubs/${club.id}`}
                className="group flex items-center gap-4 rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/30 hover:shadow-sm"
              >
                {club.logoUrl ? (
                  <img
                    src={club.logoUrl}
                    alt={club.name}
                    className="h-8 w-8 rounded-md object-cover"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-xs font-bold text-primary">
                    {club.name.charAt(0)}
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-medium group-hover:text-primary">{club.name}</p>
                  {club.city && (
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {club.city}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
