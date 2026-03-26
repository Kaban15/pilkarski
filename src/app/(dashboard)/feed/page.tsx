"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { api } from "@/lib/trpc-react";
import { formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FeedCardSkeleton } from "@/components/card-skeleton";
import { EVENT_TYPE_LABELS, POSITION_LABELS } from "@/lib/labels";
import { EmptyState } from "@/components/empty-state";
import { ClubDashboardSections } from "@/components/dashboard/club-sections";
import { ClubRecruitment } from "@/components/dashboard/club-recruitment";
import { PlayerRecruitments } from "@/components/dashboard/player-recruitments";
import { ClubOnboarding } from "@/components/onboarding/club-onboarding";
import { PlayerOnboarding } from "@/components/onboarding/player-onboarding";
import { CoachOnboarding } from "@/components/onboarding/coach-onboarding";
import { RecruitmentStats } from "@/components/recruitment/recruitment-stats";
import {
  Swords,
  Trophy,
  Calendar,
  MapPin,
  MessageSquare,
  FileText,
  TrendingUp,
  Plus,
  Search,
  CheckCircle2,
  GraduationCap,
  Target,
  ChevronDown,
  Users,
} from "lucide-react";

type FeedItem = {
  type: "sparing" | "event" | "transfer" | "club" | "player";
  data: any;
  createdAt: string | Date;
};

const FEED_CONFIG = {
  sparing: {
    label: "Sparing",
    badge: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  },
  event: {
    label: "Wydarzenie",
    badge: "bg-violet-500/10 text-violet-700 dark:text-violet-400",
  },
  club: {
    label: "Nowy klub",
    badge: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  },
  transfer: {
    label: "Transfer",
    badge: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400",
  },
  player: {
    label: "Nowy zawodnik",
    badge: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
  },
};

function FeedCard({ item }: { item: FeedItem }) {
  const config = FEED_CONFIG[item.type];

  const getHref = () => {
    switch (item.type) {
      case "sparing":
        return `/sparings/${item.data.id}`;
      case "event":
        return `/events/${item.data.id}`;
      case "transfer":
        return `/transfers/${item.data.id}`;
      case "club":
        return `/clubs/${item.data.id}`;
      case "player":
        return `/players/${item.data.id}`;
    }
  };

  const getTitle = () => {
    switch (item.type) {
      case "sparing":
      case "event":
      case "transfer":
        return item.data.title;
      case "club":
        return item.data.name;
      case "player":
        return `${item.data.firstName} ${item.data.lastName}`;
    }
  };

  const getSubtitle = () => {
    switch (item.type) {
      case "sparing":
        return item.data.club.name + (item.data.club.city ? ` · ${item.data.club.city}` : "");
      case "event":
        return (
          (EVENT_TYPE_LABELS[item.data.type] ?? "Wydarzenie") +
          " · " +
          item.data.club.name
        );
      case "transfer": {
        const u = item.data.user;
        const name = u?.club?.name ?? (u?.player ? `${u.player.firstName} ${u.player.lastName}` : "");
        const city = u?.club?.city ?? u?.player?.city ?? "";
        return name + (city ? ` · ${city}` : "") + (item.data.region ? ` · ${item.data.region.name}` : "");
      }
      case "club":
        return (
          (item.data.city ?? "") +
          (item.data.region ? ` · ${item.data.region.name}` : "")
        );
      case "player":
        return (
          (POSITION_LABELS[item.data.primaryPosition] ?? "") +
          (item.data.city ? ` · ${item.data.city}` : "") +
          (item.data.region ? ` · ${item.data.region.name}` : "")
        );
    }
  };

  return (
    <Link href={getHref()} className="group block">
      <div className="flex items-center gap-4 rounded-lg border border-transparent px-4 py-3 transition-all hover:border-border hover:bg-card">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${config.badge}`}
            >
              {item.type === "event"
                ? (EVENT_TYPE_LABELS[item.data.type] ?? config.label)
                : config.label}
            </span>
            <span className="text-[11px] text-muted-foreground">
              {formatDate(item.createdAt)}
            </span>
          </div>
          <p className="text-[14px] font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
            {getTitle()}
          </p>
          <p className="text-[13px] text-muted-foreground line-clamp-1">{getSubtitle()}</p>
        </div>
        {(item.type === "sparing" || item.type === "event") && (
          <div className="shrink-0 text-right text-[12px] text-muted-foreground">
            <div className="flex items-center gap-1 justify-end">
              <Calendar className="h-3 w-3 opacity-50" />
              {item.type === "sparing"
                ? formatDate(item.data.matchDate)
                : formatDate(item.data.eventDate)}
            </div>
            {item.data.location && (
              <div className="mt-0.5 flex items-center gap-1 justify-end">
                <MapPin className="h-3 w-3 opacity-50" />
                <span className="truncate max-w-[120px]">{item.data.location}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}

type DashboardStats = {
  role: "CLUB" | "PLAYER" | "COACH";
  activeSparings?: number;
  pendingApplications?: number;
  upcomingEvents?: number;
  eventApps?: number;
  unreadMessages: number;
};

const STAT_CONFIG_CLUB = [
  { key: "activeSparings", label: "Aktywne sparingi", icon: Swords, href: "/sparings", color: "text-emerald-500", bg: "bg-emerald-500/10" },
  { key: "pendingApplications", label: "Oczekujące zgłoszenia", icon: FileText, href: "/sparings", color: "text-amber-500", bg: "bg-amber-500/10" },
  { key: "upcomingEvents", label: "Nadchodzące wydarzenia", icon: Trophy, href: "/events", color: "text-violet-500", bg: "bg-violet-500/10" },
  { key: "unreadMessages", label: "Nowe wiadomości", icon: MessageSquare, href: "/messages", color: "text-blue-500", bg: "bg-blue-500/10" },
] as const;

const STAT_CONFIG_PLAYER = [
  { key: "eventApps", label: "Zgłoszenia", icon: TrendingUp, href: "/events", color: "text-violet-500", bg: "bg-violet-500/10" },
  { key: "unreadMessages", label: "Nowe wiadomości", icon: MessageSquare, href: "/messages", color: "text-amber-500", bg: "bg-amber-500/10" },
] as const;

function StatsBar({ stats }: { stats: DashboardStats | null }) {
  if (!stats) return null;

  const config = stats.role === "CLUB" ? STAT_CONFIG_CLUB : STAT_CONFIG_PLAYER;

  return (
    <div className="mb-8 grid grid-cols-2 gap-3 sm:flex sm:flex-wrap">
      {config.map((c) => {
        const value = (stats as unknown as Record<string, number>)[c.key] ?? 0;
        return (
          <Link key={c.key} href={c.href}>
            <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 transition-all hover:border-primary/30 hover:shadow-sm">
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${c.bg}`}>
                <c.icon className={`h-4 w-4 ${c.color}`} />
              </div>
              <div>
                <p className="text-xl font-bold tabular-nums leading-none text-foreground">{value}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">{c.label}</p>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

function CoachDashboardStats() {
  const { data: stats } = api.stats.coachDashboard.useQuery(undefined, {
    staleTime: 60_000,
  });

  if (!stats) return null;

  return (
    <Card className="mb-6">
      <CardContent className="py-4">
        <div className="mb-3 flex items-center gap-2">
          <GraduationCap className="h-4 w-4 text-primary" />
          <p className="text-sm font-semibold">Statystyki treningowe</p>
          {stats.regionName && (
            <span className="ml-auto text-[11px] text-muted-foreground">{stats.regionName}</span>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-border px-3 py-2">
            <p className="text-xl font-bold tabular-nums">{stats.activeTrainings}</p>
            <p className="text-[11px] text-muted-foreground">Aktywne treningi</p>
          </div>
          <div className="rounded-lg border border-border px-3 py-2">
            <p className="text-xl font-bold tabular-nums">{stats.weeklySignups}</p>
            <p className="text-[11px] text-muted-foreground">Zapisy w tym tyg.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PlayerDevelopment() {
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
            Rozwój — treningi indywidualne
          </p>
          <Link href="/trainings" className="text-xs text-primary hover:underline">
            Wszystkie →
          </Link>
        </div>
        <div className="space-y-2">
          {items.map((t: { id: string; title: string; eventDate: string | Date; club?: { name: string } | null; coach?: { firstName: string; lastName: string } | null; priceInfo?: string | null }) => (
            <Link key={t.id} href={`/events/${t.id}`}>
              <div className="flex items-center gap-3 rounded-lg border px-3 py-2 transition-colors hover:border-primary/40">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{t.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {t.club?.name ?? (t.coach ? `${t.coach.firstName} ${t.coach.lastName}` : "")} · {new Date(t.eventDate).toLocaleDateString("pl-PL")}
                    {t.priceInfo ? ` · ${t.priceInfo}` : ""}
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
  const { data } = api.club.newInRegion.useQuery({ limit: 4 }, { staleTime: 300_000 });
  const utils = api.useUtils();

  const followMut = api.club.follow.useMutation({
    onSuccess: () => {
      utils.club.newInRegion.invalidate();
      toast.success("Obserwujesz klub");
    },
  });

  const items = data?.items ?? [];
  if (items.length === 0) return null;

  return (
    <Card className="mb-6">
      <CardContent className="py-4">
        <p className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <Users className="h-4 w-4 text-blue-500" />
          Nowe kluby w Twoim regionie
        </p>
        <div className="space-y-2">
          {items.map((club: { id: string; name: string; city: string | null; logoUrl: string | null; region: { name: string } | null; _count: { followers: number } }) => (
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
                Obserwuj
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ClubQuickActions() {
  const [showMore, setShowMore] = useState(false);

  return (
    <div className="mb-8 space-y-3">
      {/* Primary CTAs */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <Link href="/sparings/new">
          <Button className="w-full gap-2 rounded-xl py-5">
            <Swords className="h-4 w-4" />
            Dodaj sparing
          </Button>
        </Link>
        <Link href="/events/new">
          <Button variant="outline" className="w-full gap-2 rounded-xl py-5">
            <Trophy className="h-4 w-4" />
            Dodaj nabór / trening
          </Button>
        </Link>
        <Link href="/recruitment">
          <Button variant="outline" className="w-full gap-2 rounded-xl py-5">
            <Target className="h-4 w-4" />
            Pipeline rekrutacyjny
          </Button>
        </Link>
      </div>

      {/* More actions */}
      <div>
        <button
          onClick={() => setShowMore(!showMore)}
          className="flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground transition hover:text-foreground"
        >
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showMore ? "rotate-180" : ""}`} />
          Więcej działań
        </button>
        {showMore && (
          <div className="mt-2 flex flex-wrap gap-2">
            <Link href="/calendar">
              <Button size="sm" variant="ghost" className="gap-2 rounded-lg">
                <Calendar className="h-3.5 w-3.5" />
                Kalendarz
              </Button>
            </Link>
            <Link href="/search">
              <Button size="sm" variant="ghost" className="gap-2 rounded-lg">
                <Search className="h-3.5 w-3.5" />
                Szukaj rywala
              </Button>
            </Link>
            <Link href="/community">
              <Button size="sm" variant="ghost" className="gap-2 rounded-lg">
                <MessageSquare className="h-3.5 w-3.5" />
                Tablica
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function FeedPage() {
  const { data: session } = useSession();
  const userRole = session?.user?.role;
  const isClub = userRole === "CLUB";
  const isPlayer = userRole === "PLAYER";
  const isCoach = userRole === "COACH";
  const feed = api.feed.get.useQuery({ limit: 30 });
  const stats = api.stats.dashboard.useQuery(undefined, { staleTime: 60_000 });
  const clubProfile = api.club.me.useQuery(undefined, {
    enabled: isClub,
    staleTime: Infinity,
  });
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

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {isClub ? "Pulpit" : "Feed"}
        </h1>
        {isClub && clubProfile.data ? (
          <p className="mt-1 text-sm text-muted-foreground">
            Witaj, <span className="font-medium text-foreground">{clubProfile.data.name}</span>
            {feed.data?.regionName && (
              <span> · {feed.data.regionName}</span>
            )}
          </p>
        ) : feed.data?.regionName ? (
          <p className="mt-1 text-sm text-muted-foreground">
            Aktywności z regionu: <span className="font-medium text-foreground">{feed.data.regionName}</span>
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

      {isClub && !showOnboarding && stats.data &&
        (stats.data as DashboardStats).activeSparings === 0 &&
        (stats.data as DashboardStats).upcomingEvents === 0 && (
        <Card className="mb-8 border-dashed border-primary/20">
          <CardContent className="py-5">
            <p className="mb-3 text-sm font-semibold">Pierwsze kroki</p>
            <div className="space-y-2">
              {[
                { done: true, label: "Zarejestruj konto" },
                { done: !!clubProfile.data?.regionId, label: "Uzupełnij profil klubu", href: "/profile" },
                { done: false, label: "Dodaj pierwszy sparing", href: "/sparings/new" },
                { done: false, label: "Dodaj pierwsze wydarzenie", href: "/events/new" },
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

      <StatsBar stats={(stats.data as DashboardStats) ?? null} />

      {isClub && !showOnboarding && <ClubQuickActions />}
      {isClub && <RecruitmentStats />}
      {isClub && <ClubRecruitment />}
      {isClub && <ClubDashboardSections />}

      {isCoach && <CoachDashboardStats />}
      {isPlayer && <NewClubsInRegion />}
      {(isPlayer || isCoach) && <PlayerRecruitments />}
      {(isPlayer || isCoach) && <PlayerDevelopment />}

      {feed.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <FeedCardSkeleton key={i} />
          ))}
        </div>
      ) : feed.error ? (
        <Card className="border-destructive/20">
          <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
            <p className="text-sm text-destructive">Nie udało się załadować feedu</p>
            <Button variant="outline" size="sm" onClick={() => feed.refetch()}>
              Spróbuj ponownie
            </Button>
          </CardContent>
        </Card>
      ) : (feed.data?.items?.length ?? 0) === 0 ? (
        <EmptyState
          icon={Swords}
          title="Brak aktywności"
          description="Uzupełnij profil i wybierz region, aby zobaczyć dopasowane sparingi, wydarzenia i nowych członków."
          actionLabel="Uzupełnij profil"
          actionHref="/profile"
        />
      ) : (
        <div className="stagger-children space-y-3">
          {(feed.data!.items as FeedItem[]).map((item) => (
            <FeedCard key={`${item.type}-${item.data.id}`} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
