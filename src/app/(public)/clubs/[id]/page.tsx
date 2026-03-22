import { notFound } from "next/navigation";
import Link from "next/link";
import { Metadata } from "next";
import { db } from "@/server/db/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PublicProfileCTA } from "@/components/public-profile-cta";
import { formatShortDate, formatDate } from "@/lib/format";
import { EVENT_TYPE_LABELS } from "@/lib/labels";

type Props = { params: Promise<{ id: string }> };

async function getClub(id: string) {
  const club = await db.club.findUnique({
    where: { id },
    include: { region: true, leagueGroup: { include: { leagueLevel: true } } },
  });
  return club;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const club = await getClub(id);
  if (!club) return { title: "Klub nie znaleziony" };

  const description = [
    club.city && `Miasto: ${club.city}`,
    club.region?.name && `Region: ${club.region.name}`,
    club.leagueGroup && `${club.leagueGroup.leagueLevel.name} — ${club.leagueGroup.name}`,
    club.description?.substring(0, 150),
  ]
    .filter(Boolean)
    .join(" · ");

  return {
    title: club.name,
    description: description || `Profil klubu ${club.name} na PilkaSport`,
    openGraph: {
      title: `${club.name} | PilkaSport`,
      description: description || `Profil klubu ${club.name} na PilkaSport`,
      ...(club.logoUrl && { images: [{ url: club.logoUrl, width: 200, height: 200 }] }),
      type: "profile",
    },
  };
}

export default async function ClubPublicProfilePage({ params }: Props) {
  const { id } = await params;
  const club = await getClub(id);
  if (!club) notFound();

  const [sparingsRes, eventsRes] = await Promise.all([
    db.sparingOffer.findMany({
      where: { clubId: id, status: "OPEN" },
      take: 5,
      orderBy: { matchDate: "asc" },
      include: { _count: { select: { applications: true } } },
    }),
    db.event.findMany({
      where: { clubId: id, eventDate: { gte: new Date() } },
      take: 5,
      orderBy: { eventDate: "asc" },
      include: { _count: { select: { applications: true } } },
    }),
  ]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <Link href="/" className="text-sm text-primary hover:underline">
        &larr; PilkaSport
      </Link>

      <div className="mt-6 flex items-center gap-4">
        {club.logoUrl ? (
          <img src={club.logoUrl} alt={club.name} className="h-20 w-20 rounded-full object-cover border" />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-full border bg-secondary text-2xl font-bold text-muted-foreground">
            {club.name.charAt(0)}
          </div>
        )}
        <div>
          <h1 className="text-3xl font-bold">{club.name}</h1>
          {club.city && <p className="mt-1 text-lg text-muted-foreground">{club.city}</p>}
        </div>
      </div>

      <Card className="mt-6">
        <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
          {club.region && (
            <div>
              <p className="text-sm text-muted-foreground">Region</p>
              <p className="font-medium">{club.region.name}</p>
            </div>
          )}
          {club.leagueGroup && (
            <div>
              <p className="text-sm text-muted-foreground">Liga</p>
              <p className="font-medium">
                {club.leagueGroup.leagueLevel.name} &mdash; {club.leagueGroup.name}
              </p>
            </div>
          )}
          {club.contactEmail && (
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{club.contactEmail}</p>
            </div>
          )}
          {club.contactPhone && (
            <div>
              <p className="text-sm text-muted-foreground">Telefon</p>
              <p className="font-medium">{club.contactPhone}</p>
            </div>
          )}
          {club.website && (
            <div className="sm:col-span-2">
              <p className="text-sm text-muted-foreground">Strona www</p>
              <a
                href={club.website.startsWith("http") ? club.website : `https://${club.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary hover:underline"
              >
                {club.website}
              </a>
            </div>
          )}
          {club.description && (
            <div className="sm:col-span-2">
              <p className="text-sm text-muted-foreground">O klubie</p>
              <p className="whitespace-pre-wrap">{club.description}</p>
            </div>
          )}
          <div>
            <p className="text-sm text-muted-foreground">Na platformie od</p>
            <p className="font-medium">{formatShortDate(club.createdAt)}</p>
          </div>
        </CardContent>
      </Card>

      {sparingsRes.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Aktywne sparingi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {sparingsRes.map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <p className="font-medium">{s.title}</p>
                  <p className="text-sm text-muted-foreground">{formatDate(s.matchDate)}{s.location && ` · ${s.location}`}</p>
                </div>
                <span className="rounded-full bg-blue-50 dark:bg-blue-950 px-2 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-300">
                  {s._count.applications} zgłoszeń
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {eventsRes.length > 0 && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-lg">Nadchodzące wydarzenia</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {eventsRes.map((ev) => (
              <div key={ev.id} className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <p className="font-medium">{ev.title}</p>
                  <p className="text-sm text-muted-foreground">{formatDate(ev.eventDate)}{ev.location && ` · ${ev.location}`}</p>
                </div>
                <span className="rounded-full bg-purple-50 dark:bg-purple-950 px-2 py-0.5 text-xs font-medium text-purple-700 dark:text-purple-300">
                  {EVENT_TYPE_LABELS[ev.type]}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="mt-6 flex gap-3">
        <PublicProfileCTA />
      </div>
    </div>
  );
}
