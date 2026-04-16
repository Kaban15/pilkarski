"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { api } from "@/lib/trpc-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FeedCardSkeleton } from "@/components/card-skeleton";
import { useI18n } from "@/lib/i18n";
import { EmptyState } from "@/components/empty-state";
import { FeedCard, type FeedItem } from "@/components/feed/feed-card-router";
import { PullToRefreshIndicator } from "@/components/feed/pull-to-refresh-indicator";
import { RightPanel } from "@/components/layout/right-panel";
import { MiniCalendar } from "@/components/dashboard/mini-calendar";
import { UpcomingWidget } from "@/components/dashboard/upcoming-widget";
import { RankingWidget } from "@/components/dashboard/ranking-widget";
import { SectionNav } from "@/components/dashboard/section-nav";
import { SectionNavMobile } from "@/components/dashboard/section-nav-mobile";
import { ActivitySection } from "@/components/dashboard/sections/activity-section";
import { ScheduleSection } from "@/components/dashboard/sections/schedule-section";
import { RecruitmentSection } from "@/components/dashboard/sections/recruitment-section";
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh";
import { DashboardStats as DashboardStatsWidget } from "@/components/dashboard/dashboard-stats";
import { HeroCard } from "@/components/dashboard/hero-card";
import { PlayerRecruitments } from "@/components/dashboard/player-recruitments";
import { ClubInvitations } from "@/components/dashboard/club-invitations";
import { ClubOnboarding } from "@/components/onboarding/club-onboarding";
import { PlayerOnboarding } from "@/components/onboarding/player-onboarding";
import { CoachOnboarding } from "@/components/onboarding/coach-onboarding";
import {
  Swords,
  CheckCircle2,
  GraduationCap,
  Users,
} from "lucide-react";

type DashboardStats = {
  role: "CLUB" | "PLAYER" | "COACH";
  activeSparings?: number;
  pendingApplications?: number;
  upcomingEvents?: number;
  eventApps?: number;
  unreadMessages: number;
};



function PlayerDevelopment() {
  const { t } = useI18n();
  const trainings = api.event.list.useQuery({
    type: "INDIVIDUAL_TRAINING",
    sortBy: "eventDate",
    sortOrder: "asc",
    limit: 4,
  });

  const items = trainings.data?.items ?? [];
  if (items.length === 0 && !trainings.isLoading) return null;

  return (
    <Card className="mb-6">
      <CardContent className="py-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <GraduationCap className="h-4 w-4 text-primary" />
            {t("Rozwój — treningi indywidualne")}
          </p>
          <Link href="/trainings" className="text-xs text-primary hover:underline">
            {t("Wszystkie →")}
          </Link>
        </div>
        <div className="space-y-2">
          {items.map((t: { id: string; title: string; eventDate: string | Date; club?: { name: string } | null; coach?: { firstName: string; lastName: string } | null }) => (
            <Link key={t.id} href={`/events/${t.id}`}>
              <div className="flex items-center gap-3 rounded-lg border px-3 py-2 transition-colors hover:border-primary/40">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{t.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {t.club?.name ?? (t.coach ? `${t.coach.firstName} ${t.coach.lastName}` : "")} · {new Date(t.eventDate).toLocaleDateString("pl-PL")}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function NewClubsInRegion() {
  const { t } = useI18n();
  const { data } = api.club.newInRegion.useQuery({ limit: 4 }, { staleTime: 300_000 });
  const utils = api.useUtils();

  const followMut = api.club.follow.useMutation({
    onSuccess: () => {
      utils.club.newInRegion.invalidate();
      toast.success(t("Obserwujesz klub"));
    },
  });

  const items = data?.items ?? [];
  if (items.length === 0) return null;

  return (
    <Card className="mb-6">
      <CardContent className="py-4">
        <p className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <Users className="h-4 w-4 text-blue-500" />
          {t("Nowe kluby w Twoim regionie")}
        </p>
        <div className="space-y-2">
          {items.map((club: any) => (
            <div key={club.id} className="flex items-center gap-3 rounded-lg border border-border px-3 py-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted">
                {club.logoUrl ? (
                  <img src={club.logoUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-[10px] font-bold text-muted-foreground">
                    {club.name.slice(0, 2).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <Link href={`/clubs/${club.id}`} className="text-[13px] font-semibold hover:text-primary">
                  {club.name}
                </Link>
                <p className="text-[11px] text-muted-foreground">
                  {club.city}{club.region ? ` · ${club.region.name}` : ""}
                  {club.leagueGroup && ` · ${club.leagueGroup.leagueLevel.name} — ${club.leagueGroup.name}`}
                  {club._count.followers > 0 && ` · ${club._count.followers} obs.`}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="h-7 shrink-0 text-xs"
                onClick={() => followMut.mutate({ clubId: club.id })}
                disabled={followMut.isPending}
              >
                {t("Obserwuj")}
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function FeedClient() {
  const { t } = useI18n();
  const { data: session } = useSession();
  const userRole = session?.user?.role;
  const isClub = userRole === "CLUB";
  const isPlayer = userRole === "PLAYER";
  const isCoach = userRole === "COACH";
  const feed = api.feed.get.useQuery({ limit: 30 }, { staleTime: 300_000, enabled: !isClub });
  const stats = api.stats.dashboard.useQuery(undefined, { staleTime: 300_000 });
  const clubProfile = api.club.me.useQuery(undefined, {
    enabled: isClub,
    staleTime: Infinity,
  });
  const searchParams = useSearchParams();
  const section = searchParams.get("section") ?? "schedule";
  const [onboardingDismissed, setOnboardingDismissed] = useState(false);
  const [playerOnboardingDone, setPlayerOnboardingDone] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("ps_player_onboarded") === "1";
  });
  const [coachOnboardingDone, setCoachOnboardingDone] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("ps_coach_onboarded") === "1";
  });

  const showOnboarding = isClub && !onboardingDismissed && clubProfile.data && !clubProfile.data.regionId;
  const showPlayerOnboarding = isPlayer && !playerOnboardingDone;
  const showCoachOnboarding = isCoach && !coachOnboardingDone;

  const { pullDistance, refreshing, progress } = usePullToRefresh({
    onRefresh: async () => {
      await feed.refetch();
      await stats.refetch();
    },
  });

  return (
    <div className="animate-fade-in lg:flex lg:gap-6">
      {/* Main feed column */}
      <div className="min-w-0 flex-1 lg:max-w-2xl">
      <PullToRefreshIndicator pullDistance={pullDistance} refreshing={refreshing} progress={progress} />
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {isClub ? t("Pulpit") : "Feed"}
        </h1>
        {!isClub && feed.data?.regionName ? (
          <p className="mt-1 text-sm text-muted-foreground">
            {t("Aktywności z regionu:")} <span className="font-medium text-foreground">{feed.data.regionName}</span>
          </p>
        ) : null}
      </div>

      {showOnboarding && (
        <ClubOnboarding onComplete={() => {
          setOnboardingDismissed(true);
          clubProfile.refetch();
        }} />
      )}
      {showPlayerOnboarding && (
        <PlayerOnboarding onComplete={() => { localStorage.setItem("ps_player_onboarded", "1"); setPlayerOnboardingDone(true); }} />
      )}
      {showCoachOnboarding && (
        <CoachOnboarding onComplete={() => { localStorage.setItem("ps_coach_onboarded", "1"); setCoachOnboardingDone(true); }} />
      )}

      <DashboardStatsWidget />
      <HeroCard />

      {isClub && !showOnboarding && stats.data &&
        (stats.data as DashboardStats).activeSparings === 0 &&
        (stats.data as DashboardStats).upcomingEvents === 0 && (
        <Card className="mb-6 border-dashed border-primary/20">
          <CardContent className="py-5">
            <p className="mb-3 text-sm font-semibold">{t("Pierwsze kroki")}</p>
            <div className="space-y-2">
              {[
                { done: true, label: t("Zarejestruj konto") },
                { done: !!clubProfile.data?.regionId, label: t("Uzupełnij profil klubu"), href: "/profile" },
                { done: false, label: t("Dodaj pierwszy sparing"), href: "/sparings/new" },
                { done: false, label: t("Dodaj pierwsze wydarzenie"), href: "/events/new" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2.5">
                  {item.done ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                  ) : (
                    <div className="h-4 w-4 shrink-0 rounded-full border-2 border-muted-foreground/30" />
                  )}
                  {item.href && !item.done ? (
                    <Link href={item.href} className="text-sm text-primary hover:underline">
                      {item.label}
                    </Link>
                  ) : (
                    <span className={`text-sm ${item.done ? "text-muted-foreground line-through" : "text-foreground"}`}>
                      {item.label}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* CLUB — section navigation + routed content */}
      {isClub && !showOnboarding && (
        <>
          <SectionNavMobile />
          {section === "schedule" && <ScheduleSection />}
          {section === "recruitment" && <RecruitmentSection />}
          {section !== "schedule" && section !== "recruitment" && <ActivitySection />}
        </>
      )}

      {(isPlayer || isCoach) && <ClubInvitations />}
      {isPlayer && <NewClubsInRegion />}
      {(isPlayer || isCoach) && <PlayerRecruitments />}
      {(isPlayer || isCoach) && <PlayerDevelopment />}

      {!isClub && (
        <>
          {feed.isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <FeedCardSkeleton key={i} />
              ))}
            </div>
          ) : feed.error ? (
            <Card className="border-destructive/20">
              <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
                <p className="text-sm text-destructive">{t("Nie udało się załadować feedu")}</p>
                <Button variant="outline" size="sm" onClick={() => feed.refetch()}>
                  {t("Spróbuj ponownie")}
                </Button>
              </CardContent>
            </Card>
          ) : (feed.data?.items?.length ?? 0) === 0 ? (
            <EmptyState
              icon={Swords}
              title={t("Brak aktywności")}
              description={t("Uzupełnij profil i wybierz region, aby zobaczyć dopasowane sparingi, wydarzenia i nowych członków.")}
              actionLabel={t("Uzupełnij profil")}
              actionHref="/profile"
            />
          ) : (
            <div className="space-y-3">
              {(feed.data!.items as FeedItem[]).map((item) => (
                <FeedCard key={`${item.type}-${item.data.id}`} item={item} />
              ))}
            </div>
          )}
        </>
      )}
      </div>

      <RightPanel>
        <MiniCalendar />
        <UpcomingWidget />
        <RankingWidget />
        {isClub && <SectionNav />}
      </RightPanel>
    </div>
  );
}
