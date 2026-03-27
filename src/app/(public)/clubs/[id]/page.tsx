import { notFound } from "next/navigation";
import Link from "next/link";
import { Metadata } from "next";
import { db } from "@/server/db/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PublicProfileCTA } from "@/components/public-profile-cta";
import { FollowClubButton } from "@/components/follow-club-button";
import { JoinClubButton } from "@/components/join-club-button";
import { ProfileMessageButton } from "@/components/profile-message-button";
import { formatShortDate, formatDate } from "@/lib/format";
import { EVENT_TYPE_LABELS } from "@/lib/labels";
import {
  Globe,
  Trophy,
  Mail,
  Phone,
  ExternalLink,
  Calendar,
  MapPin,
  Users,
  Swords,
  Shield,
  ArrowLeft,
  Star,
} from "lucide-react";

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

  const [sparingsRes, eventsRes, reviewStats, recentReviews] = await Promise.all([
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
    db.review.aggregate({
      where: { reviewedClubId: id },
      _avg: { rating: true },
      _count: { rating: true },
    }),
    db.review.findMany({
      where: { reviewedClubId: id },
      include: {
        reviewerClub: { select: { id: true, name: true, logoUrl: true } },
        sparingOffer: { select: { id: true, title: true } },
      },
      take: 5,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const leagueGroupHref =
    club.leagueGroup && club.region
      ? `/leagues/${club.region.slug}/${club.leagueGroup.leagueLevel.id}/${club.leagueGroup.id}`
      : null;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 to-emerald-800 dark:from-emerald-900 dark:to-emerald-950">
        <div className="pointer-events-none absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djZoLTJ2LTZoLTZ2LTJoNnYtNmgydjZoNnYyaC02eiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-1.5 text-sm text-white/70 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            PilkaSport
          </Link>
          <div className="flex items-center gap-5">
            {club.logoUrl ? (
              <img
                src={club.logoUrl}
                alt={club.name}
                className="h-24 w-24 rounded-2xl border-2 border-white/20 object-cover shadow-lg sm:h-28 sm:w-28"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-2xl border-2 border-white/20 bg-white/10 text-4xl font-bold text-white shadow-lg sm:h-28 sm:w-28">
                {club.name.charAt(0)}
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold text-white sm:text-4xl">{club.name}</h1>
              {club.city && (
                <p className="mt-1 flex items-center gap-1.5 text-lg text-white/80">
                  <MapPin className="h-4 w-4" />
                  {club.city}
                </p>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                {reviewStats._count.rating > 0 && (
                  <Badge className="border-amber-400/30 bg-amber-400/20 text-white hover:bg-amber-400/30">
                    <Star className="mr-1 h-3 w-3 fill-amber-400 text-amber-400" />
                    {reviewStats._avg.rating!.toFixed(1)} ({reviewStats._count.rating})
                  </Badge>
                )}
                {club.region && (
                  <Link href={`/leagues/${club.region.slug}`}>
                    <Badge className="border-white/20 bg-white/10 text-white hover:bg-white/20 cursor-pointer">
                      <Globe className="mr-1 h-3 w-3" />
                      {club.region.name}
                    </Badge>
                  </Link>
                )}
                {leagueGroupHref && club.leagueGroup && (
                  <Link href={leagueGroupHref}>
                    <Badge className="border-white/20 bg-white/10 text-white hover:bg-white/20 cursor-pointer">
                      <Trophy className="mr-1 h-3 w-3" />
                      {club.leagueGroup.leagueLevel.name} &mdash; {club.leagueGroup.name}
                    </Badge>
                  </Link>
                )}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <FollowClubButton clubId={id} />
                <JoinClubButton clubId={id} />
                <ProfileMessageButton recipientUserId={club.userId} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main content */}
          <div className="space-y-6 lg:col-span-2">
            {/* About */}
            {(club.description || club.leagueGroup) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-emerald-500" />
                    O klubie
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {leagueGroupHref && club.leagueGroup && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Liga</p>
                      <Link
                        href={leagueGroupHref}
                        className="font-medium text-primary hover:underline"
                      >
                        {club.leagueGroup.leagueLevel.name} &mdash; {club.leagueGroup.name}
                      </Link>
                    </div>
                  )}
                  {club.description && (
                    <p className="whitespace-pre-wrap leading-relaxed text-muted-foreground">
                      {club.description}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Na platformie od {formatShortDate(club.createdAt)}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Sparings */}
            {sparingsRes.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Swords className="h-5 w-5 text-emerald-500" />
                    Aktywne sparingi
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="divide-y divide-border">
                    {sparingsRes.map((s) => (
                      <li key={s.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                        <div>
                          <p className="font-medium">{s.title}</p>
                          <div className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(s.matchDate)}
                            </span>
                            {s.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {s.location}
                              </span>
                            )}
                          </div>
                        </div>
                        <Badge variant="secondary" className="gap-1">
                          <Users className="h-3 w-3" />
                          {s._count.applications}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Events */}
            {eventsRes.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-violet-500" />
                    Nadchodzące wydarzenia
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="divide-y divide-border">
                    {eventsRes.map((ev) => (
                      <li key={ev.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                        <div>
                          <p className="font-medium">{ev.title}</p>
                          <div className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(ev.eventDate)}
                            </span>
                            {ev.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {ev.location}
                              </span>
                            )}
                          </div>
                        </div>
                        <Badge className="bg-violet-500/10 text-violet-700 hover:bg-violet-500/10 dark:text-violet-400">
                          {EVENT_TYPE_LABELS[ev.type]}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
            {/* Reviews */}
            {recentReviews.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-amber-500" />
                    Recenzje
                    {reviewStats._count.rating > 0 && (
                      <span className="text-sm font-normal text-muted-foreground">
                        &mdash; {reviewStats._avg.rating!.toFixed(1)}/5 ({reviewStats._count.rating} {reviewStats._count.rating === 1 ? "ocena" : reviewStats._count.rating < 5 ? "oceny" : "ocen"})
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="divide-y divide-border">
                    {recentReviews.map((review) => (
                      <li key={review.id} className="py-3 first:pt-0 last:pb-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium">{review.reviewerClub.name}</p>
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-3.5 w-3.5 ${
                                  star <= review.rating
                                    ? "fill-amber-400 text-amber-400"
                                    : "fill-transparent text-muted-foreground/30"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        {review.comment && (
                          <p className="mt-1 text-sm text-muted-foreground">{review.comment}</p>
                        )}
                        <p className="mt-1 text-xs text-muted-foreground">
                          Sparing: {review.sparingOffer.title}
                        </p>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact card */}
            {(club.contactEmail || club.contactPhone || club.website) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Kontakt</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {club.contactEmail && (
                    <div className="flex items-center gap-2.5 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{club.contactEmail}</span>
                    </div>
                  )}
                  {club.contactPhone && (
                    <div className="flex items-center gap-2.5 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{club.contactPhone}</span>
                    </div>
                  )}
                  {club.website && (
                    <div className="flex items-center gap-2.5 text-sm">
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                      <a
                        href={club.website.startsWith("http") ? club.website : `https://${club.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {club.website}
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <PublicProfileCTA />
          </div>
        </div>
      </div>
    </div>
  );
}
