import { notFound } from "next/navigation";
import { Metadata } from "next";
import { db } from "@/server/db/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PublicProfileCTA } from "@/components/public-profile-cta";
import { ProfileMessageButton } from "@/components/profile-message-button";
import { ClubInviteButton } from "@/components/club-invite-button";
import { BackButton } from "@/components/back-button";
import { COACH_SPECIALIZATION_LABELS, COACH_LEVEL_LABELS } from "@/lib/labels";
import {
  MapPin,
  Award,
  User,
  Briefcase,
} from "lucide-react";
import { RegionLogo } from "@/components/region-logo";

type Props = { params: Promise<{ id: string }> };

async function getCoach(id: string) {
  const coach = await db.coach.findUnique({
    where: { id },
    include: { region: true },
  });
  if (!coach) return null;

  let careerEntries: { id: string; clubName: string; season: string; role: string; level: string | null; notes: string | null }[] = [];
  try {
    careerEntries = await db.coachCareerEntry.findMany({
      where: { coachId: id },
      orderBy: { season: "desc" },
    });
  } catch {
    // Table may not exist yet if migration not applied
  }

  return { ...coach, careerEntries };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const coach = await getCoach(id);
  if (!coach) return { title: "Trener nie znaleziony" };

  const name = `${coach.firstName} ${coach.lastName}`;
  const description = [
    coach.specialization && COACH_SPECIALIZATION_LABELS[coach.specialization],
    coach.level && COACH_LEVEL_LABELS[coach.level],
    coach.city,
    coach.region?.name,
  ]
    .filter(Boolean)
    .join(" · ");

  return {
    title: name,
    description: description || `Profil trenera ${name} na PilkaSport`,
  };
}

export default async function CoachProfilePage({ params }: Props) {
  const { id } = await params;
  const coach = await getCoach(id);
  if (!coach) notFound();

  const name = `${coach.firstName} ${coach.lastName}`;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 to-blue-800">
        <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-10" xmlns="http://www.w3.org/2000/svg">
          <pattern id="coach-pattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
            <circle cx="20" cy="20" r="1.5" fill="white" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#coach-pattern)" />
        </svg>

        <div className="relative mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
          <BackButton label="Powrót" />
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-end">
            {/* Photo */}
            {coach.photoUrl ? (
              <img
                src={coach.photoUrl}
                alt={name}
                className="h-28 w-28 rounded-full border-4 border-white/20 object-cover shadow-xl sm:h-32 sm:w-32"
              />
            ) : (
              <div className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-white/20 bg-white/10 text-3xl font-bold text-white sm:h-32 sm:w-32">
                {coach.firstName[0]}{coach.lastName[0]}
              </div>
            )}

            <div className="text-center sm:text-left">
              <h1 className="text-3xl font-bold text-white sm:text-4xl">{name}</h1>
              <div className="mt-2 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                {coach.specialization && (
                  <Badge className="border-white/20 bg-white/10 text-white">
                    {COACH_SPECIALIZATION_LABELS[coach.specialization]}
                  </Badge>
                )}
                {coach.level && (
                  <Badge variant="outline" className="border-white/20 text-white/80">
                    {COACH_LEVEL_LABELS[coach.level]}
                  </Badge>
                )}
              </div>
              <div className="mt-3 flex items-center justify-center gap-2 sm:justify-start">
                <ProfileMessageButton recipientUserId={coach.userId} />
                <ClubInviteButton targetUserId={coach.userId} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="h-4 w-4 text-muted-foreground" />
                Informacje
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {coach.city && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{coach.city}</span>
                </div>
              )}
              {coach.region && (
                <div className="flex items-center gap-2 text-sm">
                  <RegionLogo slug={coach.region.slug} name={coach.region.name} size={18} />
                  <span>{coach.region.name}</span>
                </div>
              )}
              {coach.level && (
                <div className="flex items-center gap-2 text-sm">
                  <Award className="h-4 w-4 text-muted-foreground" />
                  <span>Licencja: {COACH_LEVEL_LABELS[coach.level]}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Bio */}
          {coach.bio && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">O mnie</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm text-muted-foreground leading-relaxed">
                  {coach.bio}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Career timeline */}
        {coach.careerEntries.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Briefcase className="h-4 w-4 text-blue-500" />
                Doświadczenie
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative space-y-0">
                {/* Timeline line */}
                <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />
                {coach.careerEntries.map((entry, i) => (
                  <div key={entry.id} className="relative flex gap-4 pb-5 last:pb-0">
                    {/* Timeline dot */}
                    <div className={`relative z-10 mt-1.5 h-[15px] w-[15px] shrink-0 rounded-full border-2 ${
                      i === 0
                        ? "border-blue-500 bg-blue-500"
                        : "border-border bg-background"
                    }`} />
                    <div className="flex-1">
                      <div className="flex items-baseline justify-between">
                        <p className="font-medium">{entry.clubName}</p>
                        <span className="shrink-0 text-sm font-medium text-muted-foreground">
                          {entry.season}
                        </span>
                      </div>
                      <p className="mt-0.5 text-sm text-muted-foreground">{entry.role}</p>
                      {entry.level && (
                        <p className="text-sm text-muted-foreground">{entry.level}</p>
                      )}
                      {entry.notes && (
                        <p className="mt-0.5 text-sm text-muted-foreground italic">{entry.notes}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* CTA for non-logged users */}
        <div className="mt-8">
          <PublicProfileCTA />
        </div>
      </div>
    </div>
  );
}
