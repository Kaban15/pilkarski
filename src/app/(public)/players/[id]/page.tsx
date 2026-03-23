import { notFound } from "next/navigation";
import Link from "next/link";
import { Metadata } from "next";
import { db } from "@/server/db/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PublicProfileCTA } from "@/components/public-profile-cta";
import { POSITION_LABELS, FOOT_LABELS } from "@/lib/labels";
import { formatShortDate } from "@/lib/format";
import {
  MapPin,
  Globe,
  Ruler,
  Weight,
  Footprints,
  User,
  Clock,
  ArrowLeft,
  Briefcase,
} from "lucide-react";

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

  const stats = [
    age !== null && { label: "Wiek", value: `${age} lat`, icon: Clock },
    player.heightCm && { label: "Wzrost", value: `${player.heightCm} cm`, icon: Ruler },
    player.weightKg && { label: "Waga", value: `${player.weightKg} kg`, icon: Weight },
    player.preferredFoot && { label: "Noga", value: FOOT_LABELS[player.preferredFoot] ?? player.preferredFoot, icon: Footprints },
  ].filter(Boolean) as { label: string; value: string; icon: any }[];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-violet-600 to-violet-800 dark:from-violet-900 dark:to-violet-950">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djZoLTJ2LTZoLTZ2LTJoNnYtNmgydjZoNnYyaC02eiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-1.5 text-sm text-white/70 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            PilkaSport
          </Link>
          <div className="flex items-center gap-5">
            {player.photoUrl ? (
              <img
                src={player.photoUrl}
                alt={`${player.firstName} ${player.lastName}`}
                className="h-24 w-24 rounded-2xl border-2 border-white/20 object-cover shadow-lg sm:h-28 sm:w-28"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-2xl border-2 border-white/20 bg-white/10 text-3xl font-bold text-white shadow-lg sm:h-28 sm:w-28">
                {player.firstName.charAt(0)}{player.lastName.charAt(0)}
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold text-white sm:text-4xl">
                {player.firstName} {player.lastName}
              </h1>
              <div className="mt-2 flex flex-wrap gap-2">
                {player.primaryPosition && (
                  <Badge className="border-white/20 bg-white/10 text-white hover:bg-white/20">
                    {POSITION_LABELS[player.primaryPosition] ?? player.primaryPosition}
                  </Badge>
                )}
                {player.secondaryPosition && (
                  <Badge className="border-white/20 bg-white/10 text-white/80 hover:bg-white/20">
                    {POSITION_LABELS[player.secondaryPosition] ?? player.secondaryPosition}
                  </Badge>
                )}
                {player.region && (
                  <Badge className="border-white/20 bg-white/10 text-white/80 hover:bg-white/20">
                    <Globe className="mr-1 h-3 w-3" />
                    {player.region.name}
                  </Badge>
                )}
              </div>
              {player.city && (
                <p className="mt-2 flex items-center gap-1.5 text-white/70">
                  <MapPin className="h-4 w-4" />
                  {player.city}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        {/* Stats bar */}
        {stats.length > 0 && (
          <div className="-mt-12 mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {stats.map((stat) => (
              <Card key={stat.label} className="text-center shadow-md">
                <CardContent className="py-4">
                  <stat.icon className="mx-auto mb-1.5 h-5 w-5 text-muted-foreground" />
                  <p className="text-lg font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="space-y-6">
          {/* Bio */}
          {player.bio && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-violet-500" />
                  O zawodniku
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap leading-relaxed text-muted-foreground">
                  {player.bio}
                </p>
                <p className="mt-4 text-xs text-muted-foreground">
                  Na platformie od {formatShortDate(player.createdAt)}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Career timeline */}
          {player.careerEntries.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-violet-500" />
                  Historia kariery
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative space-y-0">
                  {/* Timeline line */}
                  <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />
                  {player.careerEntries.map((entry, i) => (
                    <div key={entry.id} className="relative flex gap-4 pb-5 last:pb-0">
                      {/* Timeline dot */}
                      <div className={`relative z-10 mt-1.5 h-[15px] w-[15px] shrink-0 rounded-full border-2 ${
                        i === 0
                          ? "border-violet-500 bg-violet-500"
                          : "border-border bg-background"
                      }`} />
                      <div className="flex-1">
                        <div className="flex items-baseline justify-between">
                          <p className="font-medium">{entry.clubName}</p>
                          <span className="shrink-0 text-sm font-medium text-muted-foreground">
                            {entry.season}
                          </span>
                        </div>
                        {entry.notes && (
                          <p className="mt-0.5 text-sm text-muted-foreground">{entry.notes}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <PublicProfileCTA />
        </div>
      </div>
    </div>
  );
}
