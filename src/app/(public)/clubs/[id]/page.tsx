import { notFound } from "next/navigation";
import Link from "next/link";
import { Metadata } from "next";
import { db } from "@/server/db/client";
import { FollowClubButton } from "@/components/follow-club-button";
import { JoinClubButton } from "@/components/join-club-button";
import { ProfileMessageButton } from "@/components/profile-message-button";
import { BackButton } from "@/components/back-button";
import { StatsCell } from "@/components/stats-cell";
import { ClubProfileTabs } from "./club-profile-tabs";
import { Trophy, MapPin, Star } from "lucide-react";
import { RegionLogo } from "@/components/region-logo";
import { SocialLinks } from "@/components/social-links";

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

  const [upcomingMatches, completedMatches, eventsRes, reviewStats, recentReviews, members] =
    await Promise.all([
      // Upcoming — MATCHED sparings in the future
      db.sparingOffer.findMany({
        where: {
          status: "MATCHED",
          matchDate: { gte: new Date() },
          OR: [
            { clubId: id },
            { applications: { some: { status: "ACCEPTED", applicantClub: { id } } } },
          ],
        },
        take: 10,
        orderBy: { matchDate: "asc" },
        include: {
          club: { select: { id: true, name: true, logoUrl: true } },
          applications: {
            where: { status: "ACCEPTED" },
            include: { applicantClub: { select: { id: true, name: true, logoUrl: true } } },
          },
        },
      }),
      // Completed sparings with confirmed scores
      db.sparingOffer.findMany({
        where: {
          status: "COMPLETED",
          scoreConfirmed: true,
          OR: [
            { clubId: id },
            { applications: { some: { status: "ACCEPTED", applicantClub: { id } } } },
          ],
        },
        include: {
          club: { select: { id: true, name: true, logoUrl: true } },
          applications: {
            where: { status: "ACCEPTED" },
            include: { applicantClub: { select: { id: true, name: true, logoUrl: true } } },
          },
          goals: {
            include: {
              scorerUser: {
                select: {
                  player: { select: { firstName: true, lastName: true } },
                  coach: { select: { firstName: true, lastName: true } },
                },
              },
            },
            orderBy: [{ minute: { sort: "asc", nulls: "last" } }],
          },
        },
        take: 10,
        orderBy: { matchDate: "desc" },
      }),
      // Recruitment events (active, upcoming)
      db.event.findMany({
        where: {
          clubId: id,
          eventDate: { gte: new Date() },
          type: { in: ["RECRUITMENT", "TRYOUT", "CAMP", "CONTINUOUS_RECRUITMENT"] },
        },
        take: 20,
        orderBy: { eventDate: "asc" },
        select: {
          id: true,
          type: true,
          title: true,
          eventDate: true,
          location: true,
          targetPosition: true,
          targetAgeMin: true,
          targetAgeMax: true,
        },
      }),
      // Review stats
      db.review.aggregate({
        where: { reviewedClubId: id },
        _avg: { rating: true },
        _count: { rating: true },
      }),
      // Recent reviews
      db.review.findMany({
        where: { reviewedClubId: id },
        include: {
          reviewerClub: { select: { id: true, name: true, logoUrl: true } },
          sparingOffer: { select: { id: true, title: true } },
        },
        take: 10,
        orderBy: { createdAt: "desc" },
      }),
      // Club members (ACCEPTED)
      db.clubMembership.findMany({
        where: { clubId: id, status: "ACCEPTED" },
        include: {
          memberUser: {
            include: {
              player: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  primaryPosition: true,
                  photoUrl: true,
                },
              },
              coach: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  specialization: true,
                  photoUrl: true,
                },
              },
            },
          },
        },
        orderBy: { acceptedAt: "desc" },
      }),
    ]);

  // W/D/L record from completed matches
  const record = { wins: 0, draws: 0, losses: 0 };
  for (const match of completedMatches) {
    const isHome = match.clubId === id;
    const myScore = isHome ? match.homeScore! : match.awayScore!;
    const theirScore = isHome ? match.awayScore! : match.homeScore!;
    if (myScore > theirScore) record.wins++;
    else if (myScore === theirScore) record.draws++;
    else record.losses++;
  }

  const leagueGroupHref =
    club.leagueGroup && club.region
      ? `/leagues/${club.region.slug}/${club.leagueGroup.leagueLevel.id}/${club.leagueGroup.id}`
      : null;

  // Recent activity = has a completed match in last 90 days
  const recentCutoff = new Date();
  recentCutoff.setDate(recentCutoff.getDate() - 90);
  const isActive = completedMatches.some(
    (m) => new Date(m.matchDate) >= recentCutoff
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Hero banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-950 via-slate-900 to-sky-950">
        {/* Dot pattern overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "radial-gradient(circle, white 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
          <BackButton label="Powrót" />
          <div className="flex items-center gap-5 mt-2">
            {club.logoUrl ? (
              <img
                src={club.logoUrl}
                alt={club.name}
                className="h-24 w-24 rounded-2xl border-2 border-white/20 object-cover shadow-lg sm:h-28 sm:w-28 shrink-0"
              />
            ) : (
              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl border-2 border-white/20 bg-white/10 text-4xl font-bold text-white shadow-lg sm:h-28 sm:w-28">
                {club.name.charAt(0)}
              </div>
            )}
            <div className="min-w-0">
              <h1 className="text-3xl font-bold text-white sm:text-4xl truncate">
                {club.name}
              </h1>
              {club.city && (
                <p className="mt-1 flex items-center gap-1.5 text-base text-white/70">
                  <MapPin className="h-4 w-4 shrink-0" />
                  {club.city}
                </p>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                {reviewStats._count.rating > 0 && (
                  <span className="inline-flex items-center gap-1 bg-amber-500/20 text-amber-400 rounded-md px-2 py-0.5 text-[11px] font-semibold">
                    <Star className="h-3 w-3 fill-amber-400" />
                    {reviewStats._avg.rating!.toFixed(1)}{" "}
                    <span className="text-amber-400/70">
                      ({reviewStats._count.rating})
                    </span>
                  </span>
                )}
                {isActive && (
                  <span className="inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-400 rounded-md px-2 py-0.5 text-[11px] font-semibold">
                    Aktywny
                  </span>
                )}
                {club.region && (
                  <Link href={`/leagues/${club.region.slug}`}>
                    <span className="inline-flex items-center gap-1.5 bg-white/10 text-white rounded-md px-2 py-0.5 text-[11px] font-semibold hover:bg-white/20 transition-colors cursor-pointer">
                      <RegionLogo slug={club.region.slug} name={club.region.name} size={16} />
                      {club.region.name}
                    </span>
                  </Link>
                )}
                {leagueGroupHref && club.leagueGroup && (
                  <Link href={leagueGroupHref}>
                    <span className="inline-flex items-center gap-1 bg-white/10 text-white rounded-md px-2 py-0.5 text-[11px] font-semibold hover:bg-white/20 transition-colors cursor-pointer">
                      <Trophy className="h-3 w-3" />
                      {club.leagueGroup.leagueLevel.name} &mdash;{" "}
                      {club.leagueGroup.name}
                    </span>
                  </Link>
                )}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <FollowClubButton clubId={id} />
                <JoinClubButton clubId={id} />
                <ProfileMessageButton recipientUserId={club.userId} />
                <SocialLinks facebookUrl={club.facebookUrl} instagramUrl={club.instagramUrl} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
        {/* StatsBar */}
        <div className="bg-card rounded-xl overflow-hidden flex divide-x divide-border my-4">
          <div className="flex-1">
            <StatsCell value={record.wins} label="Wygrane" color="emerald" />
          </div>
          <div className="flex-1">
            <StatsCell value={record.draws} label="Remisy" color="default" />
          </div>
          <div className="flex-1">
            <StatsCell value={record.losses} label="Porażki" color="red" />
          </div>
          <div className="flex-1">
            <StatsCell value={members.length} label="Kadra" color="sky" />
          </div>
        </div>

        {/* Tabs */}
        <ClubProfileTabs
          clubId={id}
          upcomingMatches={upcomingMatches}
          completedMatches={
            completedMatches as Parameters<typeof ClubProfileTabs>[0]["completedMatches"]
          }
          members={members}
          recruitmentEvents={eventsRes}
          reviews={recentReviews}
          reviewAvg={reviewStats._avg.rating}
          reviewCount={reviewStats._count.rating}
          club={{
            description: club.description,
            contactEmail: club.contactEmail,
            contactPhone: club.contactPhone,
            website: club.website,
            createdAt: club.createdAt,
            leagueGroup: club.leagueGroup
              ? {
                  id: club.leagueGroup.id,
                  name: club.leagueGroup.name,
                  leagueLevel: {
                    id: String(club.leagueGroup.leagueLevel.id),
                    name: club.leagueGroup.leagueLevel.name,
                  },
                }
              : null,
            region: club.region
              ? { slug: club.region.slug, name: club.region.name }
              : null,
          }}
          leagueGroupHref={leagueGroupHref}
        />
      </div>
    </div>
  );
}
