import { notFound } from "next/navigation";
import Link from "next/link";
import { Metadata } from "next";
import { db } from "@/server/db/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PublicProfileCTA } from "@/components/public-profile-cta";
import { POSITION_LABELS, FOOT_LABELS } from "@/lib/labels";
import { formatShortDate } from "@/lib/format";

type Props = { params: Promise<{ id: string }> };

async function getPlayer(id: string) {
  const player = await db.player.findUnique({
    where: { id },
    include: { region: true, careerEntries: { orderBy: { season: "desc" } } },
  });
  return player;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const player = await getPlayer(id);
  if (!player) return { title: "Zawodnik nie znaleziony" };

  const name = `${player.firstName} ${player.lastName}`;
  const description = [
    player.primaryPosition && POSITION_LABELS[player.primaryPosition],
    player.city,
    player.region?.name && `Region: ${player.region.name}`,
    player.bio?.substring(0, 150),
  ]
    .filter(Boolean)
    .join(" · ");

  return {
    title: name,
    description: description || `Profil zawodnika ${name} na PilkaSport`,
    openGraph: {
      title: `${name} | PilkaSport`,
      description: description || `Profil zawodnika ${name} na PilkaSport`,
      ...(player.photoUrl && { images: [{ url: player.photoUrl, width: 200, height: 200 }] }),
      type: "profile",
    },
  };
}

export default async function PlayerPublicProfilePage({ params }: Props) {
  const { id } = await params;
  const player = await getPlayer(id);
  if (!player) notFound();

  const age = player.dateOfBirth
    ? Math.floor((Date.now() - new Date(player.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <Link href="/" className="text-sm text-primary hover:underline">
        &larr; PilkaSport
      </Link>

      <div className="mt-6 flex items-center gap-4">
        {player.photoUrl ? (
          <img src={player.photoUrl} alt={`${player.firstName} ${player.lastName}`} className="h-20 w-20 rounded-full object-cover border" />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-full border bg-secondary text-2xl font-bold text-muted-foreground">
            {player.firstName.charAt(0)}{player.lastName.charAt(0)}
          </div>
        )}
        <div>
          <h1 className="text-3xl font-bold">
            {player.firstName} {player.lastName}
          </h1>
          <div className="mt-1 flex flex-wrap gap-2">
            {player.primaryPosition && (
              <span className="rounded-full bg-blue-100 dark:bg-blue-900 px-3 py-0.5 text-sm font-medium text-blue-800 dark:text-blue-200">
                {POSITION_LABELS[player.primaryPosition] ?? player.primaryPosition}
              </span>
            )}
            {player.secondaryPosition && (
              <span className="rounded-full bg-secondary px-3 py-0.5 text-sm font-medium text-foreground">
                {POSITION_LABELS[player.secondaryPosition] ?? player.secondaryPosition}
              </span>
            )}
          </div>
          {player.city && <p className="mt-2 text-muted-foreground">{player.city}</p>}
        </div>
      </div>

      <Card className="mt-6">
        <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
          {age !== null && (
            <div>
              <p className="text-sm text-muted-foreground">Wiek</p>
              <p className="font-medium">{age} lat</p>
            </div>
          )}
          {player.region && (
            <div>
              <p className="text-sm text-muted-foreground">Region</p>
              <p className="font-medium">{player.region.name}</p>
            </div>
          )}
          {player.heightCm && (
            <div>
              <p className="text-sm text-muted-foreground">Wzrost</p>
              <p className="font-medium">{player.heightCm} cm</p>
            </div>
          )}
          {player.weightKg && (
            <div>
              <p className="text-sm text-muted-foreground">Waga</p>
              <p className="font-medium">{player.weightKg} kg</p>
            </div>
          )}
          {player.preferredFoot && (
            <div>
              <p className="text-sm text-muted-foreground">Noga</p>
              <p className="font-medium">{FOOT_LABELS[player.preferredFoot] ?? player.preferredFoot}</p>
            </div>
          )}
          <div>
            <p className="text-sm text-muted-foreground">Na platformie od</p>
            <p className="font-medium">{formatShortDate(player.createdAt)}</p>
          </div>
          {player.bio && (
            <div className="sm:col-span-2">
              <p className="text-sm text-muted-foreground">O zawodniku</p>
              <p className="whitespace-pre-wrap">{player.bio}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {player.careerEntries.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Historia kariery</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {player.careerEntries.map((entry) => (
                <li key={entry.id} className="flex items-baseline justify-between rounded-md border p-3">
                  <div>
                    <p className="font-medium">{entry.clubName}</p>
                    {entry.notes && <p className="text-sm text-muted-foreground">{entry.notes}</p>}
                  </div>
                  <span className="text-sm text-muted-foreground">{entry.season}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <div className="mt-6 flex gap-3">
        <PublicProfileCTA />
      </div>
    </div>
  );
}
