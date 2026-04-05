"use client";

import { useState } from "react";
import Link from "next/link";
import { MatchCard } from "@/components/match-card";
import { PositionGroup, POSITION_GROUPS } from "@/components/squad/position-group";
import { StarRating } from "@/components/star-rating";
import { EVENT_TYPE_LABELS, EVENT_TYPE_COLORS } from "@/lib/labels";
import { formatShortDate, formatDate } from "@/lib/format";
import { Mail, Phone, ExternalLink, Shield, Star, Calendar, MapPin } from "lucide-react";
import { RegionLogo } from "@/components/region-logo";

const TABS = [
  { key: "matches", label: "Mecze" },
  { key: "squad", label: "Kadra" },
  { key: "recruitment", label: "Nabory" },
  { key: "reviews", label: "Opinie" },
  { key: "info", label: "Info" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

interface ClubInfo {
  id: string;
  name: string;
  logoUrl?: string | null;
  initials: string;
}

interface UpcomingMatch {
  id: string;
  matchDate: Date;
  homeScore: number | null;
  awayScore: number | null;
  scoreConfirmed: boolean;
  clubId: string;
  club: { id: string; name: string; logoUrl: string | null };
  applications: { applicantClub: { id: string; name: string; logoUrl: string | null } }[];
}

interface MatchGoal {
  id: string;
  minute: number | null;
  ownGoal: boolean;
  scorerUser: {
    player: { firstName: string; lastName: string } | null;
    coach: { firstName: string; lastName: string } | null;
  } | null;
}

interface CompletedMatch extends UpcomingMatch {
  homeScore: number;
  awayScore: number;
  goals: MatchGoal[];
}

interface Member {
  id: string;
  memberUserId: string;
  memberUser: {
    player: {
      id: string;
      firstName: string;
      lastName: string;
      primaryPosition: string | null;
      photoUrl: string | null;
    } | null;
    coach: {
      id: string;
      firstName: string;
      lastName: string;
      specialization: string | null;
      photoUrl: string | null;
    } | null;
  };
}

interface RecruitmentEvent {
  id: string;
  type: string;
  title: string;
  eventDate: Date;
  location: string | null;
  targetPosition: string | null;
  targetAgeMin: number | null;
  targetAgeMax: number | null;
}

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: Date;
  reviewerClub: { id: string; name: string; logoUrl: string | null };
  sparingOffer: { id: string; title: string };
}

interface ClubProfileTabsProps {
  clubId: string;
  upcomingMatches: UpcomingMatch[];
  completedMatches: CompletedMatch[];
  members: Member[];
  recruitmentEvents: RecruitmentEvent[];
  reviews: Review[];
  reviewAvg: number | null;
  reviewCount: number;
  club: {
    description: string | null;
    contactEmail: string | null;
    contactPhone: string | null;
    website: string | null;
    createdAt: Date;
    leagueGroup: {
      id: string | number;
      name: string;
      leagueLevel: { id: string | number; name: string };
    } | null;
    region: { slug: string; name: string } | null;
  };
  leagueGroupHref: string | null;
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
}

function toClubInfo(c: { id: string; name: string; logoUrl: string | null }): ClubInfo {
  return { id: c.id, name: c.name, logoUrl: c.logoUrl, initials: getInitials(c.name) };
}

export function ClubProfileTabs({
  clubId,
  upcomingMatches,
  completedMatches,
  members,
  recruitmentEvents,
  reviews,
  reviewAvg,
  reviewCount,
  club,
  leagueGroupHref,
}: ClubProfileTabsProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("matches");

  return (
    <>
      {/* Tab bar */}
      <div className="bg-card rounded-lg p-1 flex gap-0.5 mb-4 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm rounded-md whitespace-nowrap transition-colors ${
              activeTab === tab.key
                ? "bg-muted font-bold text-foreground"
                : "text-muted-foreground font-semibold hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Mecze */}
      {activeTab === "matches" && (
        <div className="space-y-4">
          {upcomingMatches.length > 0 && (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                Nadchodzące
              </p>
              <div className="bg-card rounded-xl divide-y divide-border overflow-hidden">
                {upcomingMatches.map((match) => {
                  const rival = match.applications[0]?.applicantClub;
                  const homeClub = toClubInfo(match.club);
                  const awayClub = rival ? toClubInfo(rival) : { id: "unknown", name: "Przeciwnik", logoUrl: null, initials: "??" };
                  return (
                    <MatchCard
                      key={match.id}
                      homeClub={homeClub}
                      awayClub={awayClub}
                      date={match.matchDate}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {completedMatches.length > 0 && (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                Ostatnie wyniki
              </p>
              <div className="bg-card rounded-xl divide-y divide-border overflow-hidden">
                {completedMatches.map((match) => {
                  const isHome = match.clubId === clubId;
                  const rival = isHome
                    ? match.applications[0]?.applicantClub
                    : match.club;
                  const homeClubInfo = toClubInfo(match.club);
                  const awayClubInfo = rival
                    ? toClubInfo(rival)
                    : { id: "unknown", name: "Przeciwnik", logoUrl: null, initials: "??" };
                  const goalLine =
                    match.goals.length > 0
                      ? match.goals
                          .map((g) => {
                            const p = g.scorerUser?.player;
                            const c = g.scorerUser?.coach;
                            const lastName = p?.lastName ?? c?.lastName ?? "?";
                            const suffix = g.ownGoal ? " (s)" : "";
                            const minute = g.minute != null ? ` ${g.minute}'` : "";
                            return `${lastName}${suffix}${minute}`;
                          })
                          .join(", ")
                      : null;
                  return (
                    <div key={match.id}>
                      <MatchCard
                        homeClub={homeClubInfo}
                        awayClub={awayClubInfo}
                        date={match.matchDate}
                        homeScore={match.homeScore}
                        awayScore={match.awayScore}
                        scoreConfirmed={match.scoreConfirmed}
                      />
                      {goalLine && (
                        <p className="text-[11px] text-muted-foreground ml-14 mt-0.5 pb-1.5">
                          ⚽ {goalLine}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {upcomingMatches.length === 0 && completedMatches.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              Brak historii meczów
            </p>
          )}
        </div>
      )}

      {/* Tab: Kadra */}
      {activeTab === "squad" && (
        <div>
          {(() => {
            const players = members
              .filter((m) => m.memberUser.player)
              .map((m) => ({
                id: m.memberUser.player!.id,
                userId: m.memberUserId,
                firstName: m.memberUser.player!.firstName,
                lastName: m.memberUser.player!.lastName,
                photoUrl: m.memberUser.player!.photoUrl,
                position: m.memberUser.player!.primaryPosition,
                age: null,
                height: null,
                preferredFoot: null,
              }));

            const coaches = members.filter((m) => m.memberUser.coach);

            return (
              <>
                {POSITION_GROUPS.map((group) => {
                  const groupPlayers = players.filter((p) =>
                    p.position ? group.positions.includes(p.position) : false
                  );
                  return (
                    <PositionGroup
                      key={group.key}
                      label={group.label}
                      color={group.color}
                      players={groupPlayers}
                      showActions={false}
                      collapsedMax={20}
                    />
                  );
                })}

                {/* Players without position */}
                {(() => {
                  const allPositions = POSITION_GROUPS.flatMap((g) => g.positions);
                  const unpositioned = players.filter(
                    (p) => !p.position || !allPositions.includes(p.position)
                  );
                  if (unpositioned.length === 0) return null;
                  return (
                    <PositionGroup
                      label="Inne"
                      color="amber"
                      players={unpositioned}
                      showActions={false}
                      collapsedMax={20}
                    />
                  );
                })()}

                {coaches.length > 0 && (
                  <div className="mt-4">
                    <div className="flex items-center gap-1.5 mb-2">
                      <div className="w-[3px] h-3.5 rounded-sm bg-violet-500" />
                      <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        Trenerzy
                      </span>
                      <span className="text-[11px] text-muted-foreground/60">{coaches.length}</span>
                    </div>
                    <div className="bg-card rounded-xl overflow-hidden divide-y divide-border">
                      {coaches.map((m) => {
                        const c = m.memberUser.coach!;
                        const name = [c.firstName, c.lastName].filter(Boolean).join(" ");
                        const initials = `${(c.firstName?.[0] || "").toUpperCase()}${(c.lastName?.[0] || "").toUpperCase()}`;
                        return (
                          <div key={m.id} className="flex items-center px-3 py-2.5 gap-2.5">
                            {c.photoUrl ? (
                              <img src={c.photoUrl} alt={name} className="w-9 h-9 rounded-full object-cover shrink-0" />
                            ) : (
                              <div className="w-9 h-9 rounded-full bg-violet-500/10 flex items-center justify-center text-xs font-bold shrink-0 text-violet-400">
                                {initials}
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="text-[13px] font-semibold truncate">{name}</div>
                              {c.specialization && (
                                <div className="text-[11px] text-muted-foreground">{c.specialization}</div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {players.length === 0 && coaches.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Brak zawodników w kadrze
                  </p>
                )}
              </>
            );
          })()}
        </div>
      )}

      {/* Tab: Nabory */}
      {activeTab === "recruitment" && (
        <div>
          {recruitmentEvents.length > 0 ? (
            <div className="bg-card rounded-xl divide-y divide-border overflow-hidden">
              {recruitmentEvents.map((ev) => (
                <div key={ev.id} className="px-4 py-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold truncate">{ev.title}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
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
                      {ev.targetPosition && <span>{ev.targetPosition}</span>}
                      {(ev.targetAgeMin || ev.targetAgeMax) && (
                        <span>
                          {ev.targetAgeMin && ev.targetAgeMax
                            ? `${ev.targetAgeMin}–${ev.targetAgeMax} lat`
                            : ev.targetAgeMin
                              ? `od ${ev.targetAgeMin} lat`
                              : `do ${ev.targetAgeMax} lat`}
                        </span>
                      )}
                    </div>
                  </div>
                  <span
                    className={`shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-md ${EVENT_TYPE_COLORS[ev.type] || ""}`}
                  >
                    {EVENT_TYPE_LABELS[ev.type] || ev.type}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              Brak aktywnych naborów
            </p>
          )}
        </div>
      )}

      {/* Tab: Opinie */}
      {activeTab === "reviews" && (
        <div>
          {reviewCount > 0 && (
            <div className="bg-card rounded-xl p-4 flex items-center gap-4 mb-4">
              <div className="text-center">
                <div className="text-4xl font-extrabold text-amber-400">
                  {reviewAvg?.toFixed(1)}
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  {reviewCount} {reviewCount === 1 ? "ocena" : reviewCount < 5 ? "oceny" : "ocen"}
                </div>
              </div>
              <div>
                <StarRating value={Math.round(reviewAvg ?? 0)} readonly size="lg" />
              </div>
            </div>
          )}

          {reviews.length > 0 ? (
            <div className="bg-card rounded-xl divide-y divide-border overflow-hidden">
              {reviews.map((review) => (
                <div key={review.id} className="px-4 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[13px] font-semibold truncate">{review.reviewerClub.name}</p>
                    <StarRating value={review.rating} readonly size="sm" />
                  </div>
                  {review.comment && (
                    <p className="mt-1 text-sm text-muted-foreground">{review.comment}</p>
                  )}
                  <p className="mt-1.5 text-[11px] text-muted-foreground">
                    {review.sparingOffer.title} · {formatShortDate(review.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              Brak recenzji
            </p>
          )}
        </div>
      )}

      {/* Tab: Info */}
      {activeTab === "info" && (
        <div className="space-y-4">
          {club.description && (
            <div className="bg-card rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  O klubie
                </p>
              </div>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {club.description}
              </p>
            </div>
          )}

          {(club.contactEmail || club.contactPhone || club.website) && (
            <div className="bg-card rounded-xl p-4 space-y-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Kontakt
              </p>
              {club.contactEmail && (
                <div className="flex items-center gap-2.5 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>{club.contactEmail}</span>
                </div>
              )}
              {club.contactPhone && (
                <div className="flex items-center gap-2.5 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>{club.contactPhone}</span>
                </div>
              )}
              {club.website && (
                <div className="flex items-center gap-2.5 text-sm">
                  <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
                  <a
                    href={club.website.startsWith("http") ? club.website : `https://${club.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline truncate"
                  >
                    {club.website}
                  </a>
                </div>
              )}
            </div>
          )}

          <div className="bg-card rounded-xl p-4 space-y-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Liga
            </p>
            {leagueGroupHref && club.leagueGroup ? (
              <Link href={leagueGroupHref} className="text-sm text-primary hover:underline">
                {club.leagueGroup.leagueLevel.name} &mdash; {club.leagueGroup.name}
              </Link>
            ) : club.region ? (
              <Link href={`/leagues/${club.region.slug}`} className="flex items-center gap-1.5 text-sm text-primary hover:underline">
                <RegionLogo slug={club.region.slug} name={club.region.name} size={18} />
                {club.region.name}
              </Link>
            ) : (
              <p className="text-sm text-muted-foreground">Brak informacji o lidze</p>
            )}
          </div>

          <div className="bg-card rounded-xl p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
              Na platformie od
            </p>
            <p className="text-sm">{formatShortDate(club.createdAt)}</p>
          </div>
        </div>
      )}
    </>
  );
}
