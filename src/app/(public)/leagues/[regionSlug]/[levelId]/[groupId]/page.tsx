import Link from "next/link";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { db } from "@/server/db/client";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { MapPin, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { pluralPL } from "@/lib/labels";
import { RegionLogo } from "@/components/region-logo";

type Props = { params: Promise<{ regionSlug: string; levelId: string; groupId: string }> };

async function getData(regionSlug: string, levelId: number, groupId: number) {
  const region = await db.region.findUnique({ where: { slug: regionSlug } });
  if (!region) return null;

  const level = await db.leagueLevel.findFirst({
    where: { id: levelId, regionId: region.id },
  });
  if (!level) return null;

  const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
  const [group, clubs] = await Promise.all([
    db.leagueGroup.findFirst({ where: { id: groupId, leagueLevelId: levelId } }),
    db.club.findMany({
      where: { leagueGroupId: groupId },
      orderBy: { name: "asc" },
      include: {
        region: true,
        _count: {
          select: {
            sparingOffers: { where: { createdAt: { gte: sixMonthsAgo } } },
            events: { where: { createdAt: { gte: sixMonthsAgo } } },
          },
        },
      },
    }),
  ]);
  if (!group) return null;

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
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <Breadcrumbs
          items={[
            { label: "Menu", href: "/feed" },
            { label: "Ligi", href: "/leagues" },
            { label: region.name, href: `/leagues/${regionSlug}` },
            { label: level.name, href: `/leagues/${regionSlug}/${levelId}` },
            { label: group.name },
          ]}
        />

        <div className="mb-8 flex items-center gap-4">
          <RegionLogo slug={regionSlug} name={region.name} size={40} />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {level.name} &mdash; {group.name}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {region.name} &middot; {clubs.length}{" "}
              {pluralPL(clubs.length, "drużyna", "drużyny", "drużyn")}
            </p>
          </div>
        </div>

        {clubs.length === 0 ? (
          <p className="text-muted-foreground">
            Brak drużyn przypisanych do tej grupy.
          </p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-border">
            {clubs.map((club, i) => (
              <Link
                key={club.id}
                href={`/clubs/${club.id}`}
                className={`group flex items-center gap-4 px-4 py-3 transition-colors hover:bg-muted/50 ${
                  i > 0 ? "border-t border-border" : ""
                }`}
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center text-[11px] font-medium text-muted-foreground">
                  {i + 1}.
                </div>
                {club.logoUrl ? (
                  <img
                    src={club.logoUrl}
                    alt={club.name}
                    className="h-8 w-8 shrink-0 rounded-md object-cover"
                  />
                ) : (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-xs font-bold text-primary">
                    {club.name.charAt(0)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-[13px] font-semibold group-hover:text-primary">
                      {club.name}
                    </p>
                    {(club._count.sparingOffers + club._count.events > 0) && (
                      <Badge variant="secondary" className="shrink-0 text-[9px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-0">
                        Aktywny
                      </Badge>
                    )}
                  </div>
                  {club.city && (
                    <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {club.city}
                    </p>
                  )}
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50 group-hover:text-primary" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
