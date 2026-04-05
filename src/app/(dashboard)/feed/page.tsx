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
import { ClubInvitations } from "@/components/dashboard/club-invitations";
import { ClubOnboarding } from "@/components/onboarding/club-onboarding";
import { PlayerOnboarding } from "@/components/onboarding/player-onboarding";
import { CoachOnboarding } from "@/components/onboarding/coach-onboarding";
import { RecruitmentStats } from "@/components/recruitment/recruitment-stats";
import { StatsCell } from "@/components/stats-cell";
import { MatchCard } from "@/components/match-card";
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
  Star,
} from "lucide-react";

type FeedItem = {
  type: "sparing" | "event" | "transfer" | "club" | "player" | "tournament" | "clubPost";
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
  tournament: {
    label: "Turniej",
    badge: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
  },
  clubPost: {
    label: "Ogłoszenie",
    badge: "bg-rose-500/10 text-rose-700 dark:text-rose-400",
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
      case "tournament":
        return `/tournaments/${item.data.id}`;
      case "clubPost":
        return `/community`;
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
      case "tournament":
        return item.data.title;
      case "clubPost":
        return item.data.title;
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
      case "tournament": {
        const creator = item.data.creator;
        const organizerName =
          creator?.club?.name ||
          (creator?.player ? `${creator.player.firstName} ${creator.player.lastName}` : "") ||
          (creator?.coach ? `${creator.coach.firstName} ${creator.coach.lastName}` : "") ||
          "Organizator";
        return `${organizerName} · ${item.data._count?.teams ?? 0}/${item.data.maxTeams} drużyn`;
      }
      case "clubPost":
        return item.data.club?.name ?? "";
    }
  };

  const hoverGlowClass =
    item.type === "sparing"
      ? "hover-glow-violet"
      : item.type === "event"
        ? "hover-glow-sky"
        : item.type === "transfer"
          ? "hover-glow-emerald"
          : item.type === "tournament"
            ? "hover-glow-violet"
            : "hover-glow-pink";

  return (
    <Link href={getHref()} className="group block">
      <div className={`flex items-center gap-4 rounded-lg border border-transparent px-4 py-3 transition-all hover:border-border hover:bg-card ${hoverGlowClass}`}>
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
        {(item.type === "sparing" || item.type === "event" || item.type === "tournament") && (
          <div className="shrink-0 text-right text-[12px] text-muted-foreground">
            <div className="flex items-center gap-1 justify-end">
              <Calendar className="h-3 w-3 opacity-50" />
              {item.type === "sparing"
                ? formatDate(item.data.matchDate)
                : item.type === "event"
                  ? formatDate(item.data.eventDate)
                  : formatDate(item.data.startDate)}
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

const STAT_CONFIG_PLAYER = [
  { key: "eventApps", label: "Zgłoszenia", icon: TrendingUp, href: "/events", color: "text-violet-500", bg: "bg-violet-500/10" },
  { key: "unreadMessages", label: "Nowe wiadomości", icon: MessageSquare, href: "/messages", color: "text-amber-500", bg: "bg-amber-500/10" },
] as const;

function StatsBar({ stats }: { stats: DashboardStats | null }) {
  if (!stats || stats.role === "CLUB") return null;

  const config = STAT_CONFIG_PLAYER;

  return (
    <div className="mb-8 grid grid-cols-2 gap-3 sm:flex sm:flex-wrap">
      {config.map((c) => {
        const value = (stats as unknown as Record<string, number>)[c.key] ?? 0;
        return (
          <Link key={c.key} href={c.href}>
            <div className="flex items-center gap-3 rounded-xl border bg-gradient-to-r from-violet-500/10 to-sky-500/10 border-violet-500/20 px-4 py-3 transition-all hover:border-primary/30 hover:shadow-sm">
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
                Obserwuj
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────
// CLUB DASHBOARD — FotMob/Sofascore card stack
// ─────────────────────────────────────────────────────────

type ClubDashboardData = {
  activeSparings: number;
  pendingApplications: number;
  squadCount: number;
  winRecord: { wins: number; draws: number; losses: number };
  nextMatch: {
    id: string;
    title: string;
    matchDate: Date;
    opponentClub: { id: string; name: string; logoUrl: string | null } | null;
  } | null;
  pendingAlerts: {
    id: string;
    type: "counter_proposal" | "new_application" | "message";
    title: string;
    description: string;
    createdAt: Date | string;
    href: string;
  }[];
};

function ClubHeaderCard({
  clubProfile,
  stats,
}: {
  clubProfile: {
    name: string;
    city: string | null;
    logoUrl: string | null;
    region: { name: string } | null;
    leagueGroup: { name: string; leagueLevel?: { name: string } | null } | null;
  } | null | undefined;
  stats: { avgRating?: number } | null;
}) {
  if (!clubProfile) return null;

  const initials = clubProfile.name.slice(0, 2).toUpperCase();
  const regionLabel = clubProfile.region?.name ?? null;
  const leagueLabel = clubProfile.leagueGroup?.name ?? null;
  const rating = stats?.avgRating ?? null;

  return (
    <div className="bg-gradient-to-r from-indigo-950 to-slate-900 rounded-xl p-4 relative overflow-hidden mb-3">
      {/* Dot pattern overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      />
      <div className="relative flex items-center gap-3">
        {/* Club logo */}
        <div className="h-14 w-14 shrink-0 rounded-xl overflow-hidden bg-white/10 flex items-center justify-center">
          {clubProfile.logoUrl ? (
            <img src={clubProfile.logoUrl} alt={clubProfile.name} className="h-full w-full object-cover" />
          ) : (
            <span className="text-lg font-extrabold text-white">{initials}</span>
          )}
        </div>
        {/* Club info */}
        <div className="min-w-0 flex-1">
          <p className="text-lg font-extrabold text-white leading-tight line-clamp-1">
            {clubProfile.name}
          </p>
          {(clubProfile.city || regionLabel) && (
            <p className="text-xs text-white/60 mt-0.5">
              {[clubProfile.city, regionLabel].filter(Boolean).join(" · ")}
            </p>
          )}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {leagueLabel && (
              <span className="inline-flex items-center rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-white/80">
                {leagueLabel}
              </span>
            )}
            {rating != null && rating > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold text-amber-400">
                <Star className="h-2.5 w-2.5" />
                {rating.toFixed(1)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ClubStatsRow({
  activeSparings,
  pendingApplications,
  squadCount,
  winRecord,
}: {
  activeSparings: number;
  pendingApplications: number;
  squadCount: number;
  winRecord: { wins: number; draws: number; losses: number };
}) {
  const { wins, draws, losses } = winRecord;
  const bilansParts: string[] = [];
  if (wins > 0 || draws > 0 || losses > 0) {
    bilansParts.push(`${wins}-${draws}-${losses}`);
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
      <Link href="/sparings">
        <StatsCell value={activeSparings} label="Aktywne sparingi" color="violet" />
      </Link>
      <Link href="/sparings">
        <StatsCell value={pendingApplications} label="Zgłoszenia" color="amber" />
      </Link>
      <Link href="/squad">
        <StatsCell value={squadCount} label="Kadra" color="sky" />
      </Link>
      <div>
        <StatsCell
          value={bilansParts.length > 0 ? bilansParts[0] : "—"}
          label="Bilans W-R-P"
          color="emerald"
        />
      </div>
    </div>
  );
}

function ClubNextMatch({
  nextMatch,
  clubProfile,
}: {
  nextMatch: ClubDashboardData["nextMatch"];
  clubProfile: { id?: string; name: string; logoUrl: string | null } | null | undefined;
}) {
  if (!nextMatch || !clubProfile) return null;

  const homeClub = {
    id: "me",
    name: clubProfile.name,
    logoUrl: clubProfile.logoUrl,
    initials: clubProfile.name.slice(0, 2).toUpperCase(),
  };

  const awayClub = nextMatch.opponentClub
    ? {
        id: nextMatch.opponentClub.id,
        name: nextMatch.opponentClub.name,
        logoUrl: nextMatch.opponentClub.logoUrl,
        initials: nextMatch.opponentClub.name.slice(0, 2).toUpperCase(),
      }
    : {
        id: "opp",
        name: "Rywal",
        logoUrl: null,
        initials: "RY",
      };

  return (
    <Link href={`/sparings/${nextMatch.id}`} className="block mb-3">
      <MatchCard
        homeClub={homeClub}
        awayClub={awayClub}
        date={new Date(nextMatch.matchDate)}
        variant="highlight"
      />
    </Link>
  );
}

function ClubQuickActions() {
  const [showMore, setShowMore] = useState(false);

  return (
    <div className="mb-3">
      <div className="flex gap-2">
        <Link href="/sparings/new" className="flex-1">
          <Button className="w-full h-10 rounded-lg text-sm font-semibold gap-2 bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 text-white border-0">
            <Swords className="h-4 w-4" />
            Nowy sparing
          </Button>
        </Link>
        <Link href="/events/new">
          <Button variant="outline" className="h-10 rounded-lg text-sm font-semibold gap-2">
            <Trophy className="h-4 w-4" />
            Nabór
          </Button>
        </Link>
        <Link href="/recruitment">
          <Button variant="outline" className="h-10 rounded-lg text-sm font-semibold gap-2">
            <Target className="h-4 w-4" />
            Pipeline
          </Button>
        </Link>
      </div>

      <div className="mt-2">
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

function relativeTime(date: Date | string) {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  if (diffMins < 1) return "przed chwilą";
  if (diffMins < 60) return `${diffMins} min temu`;
  if (diffHours < 24) return `${diffHours} godz. temu`;
  return `${diffDays} dni temu`;
}

function ClubPendingAlerts({ pendingApplications }: { pendingApplications: any[] }) {
  if (!pendingApplications || pendingApplications.length === 0) return null;

  const alerts = pendingApplications.slice(0, 5).map((app) => ({
    id: app.id,
    type: app.status === "COUNTER_PROPOSED" ? "counter_proposal" : "new_application",
    title: app.applicantClub.name,
    description: app.sparingOffer.title,
    createdAt: app.createdAt ?? new Date(),
    href: `/sparings/${app.sparingOffer.id}`,
    dotColor:
      app.status === "COUNTER_PROPOSED"
        ? "bg-amber-400"
        : "bg-emerald-400",
    statusLabel:
      app.status === "COUNTER_PROPOSED"
        ? "Kontrpropozycja"
        : "Nowe zgłoszenie",
  }));

  return (
    <div className="bg-card rounded-xl border mb-3">
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <p className="text-sm font-semibold">Wymagają uwagi</p>
        <span className="inline-flex items-center justify-center h-5 min-w-[20px] rounded-full bg-red-500/15 text-red-500 text-[11px] font-bold px-1.5">
          {alerts.length}
        </span>
      </div>
      <div className="divide-y divide-border">
        {alerts.map((alert) => (
          <Link
            key={alert.id}
            href={alert.href}
            className="flex items-start gap-3 px-4 py-3 hover:bg-muted/40 transition-colors"
          >
            <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${alert.dotColor}`} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold leading-tight truncate">{alert.title}</p>
              <p className="text-xs text-muted-foreground truncate mt-0.5">{alert.description}</p>
              <p className="text-[10px] text-muted-foreground mt-1">{alert.statusLabel}</p>
            </div>
            <span className="text-[11px] text-muted-foreground shrink-0 mt-0.5">
              {relativeTime(alert.createdAt)}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

type ClubDashboardQueryData = {
  squadCount: number;
  winRecord: { wins: number; draws: number; losses: number };
  nextMatch: {
    id: string;
    title: string;
    matchDate: Date;
    opponentClub: { id: string; name: string; logoUrl: string | null } | null;
  } | null;
  pendingApplications: any[];
  activeSparings: any[];
  upcomingEvents: any[];
} | null | undefined;

function ClubDashboard({
  clubProfile,
  dashboardStats,
  clubDashboard,
}: {
  clubProfile: any;
  dashboardStats: DashboardStats | null;
  clubDashboard: ClubDashboardQueryData;
}) {
  const activeSparings = dashboardStats?.activeSparings ?? 0;
  const pendingApplications = dashboardStats?.pendingApplications ?? 0;
  const squadCount = clubDashboard?.squadCount ?? 0;
  const winRecord = clubDashboard?.winRecord ?? { wins: 0, draws: 0, losses: 0 };
  const nextMatch = clubDashboard?.nextMatch ?? null;
  const pendingApplicationsList = clubDashboard?.pendingApplications ?? [];

  // Build a review-based stats object from detailed stats if available
  const statsForHeader = null; // avgRating would come from stats.detailed, skip for now

  return (
    <div className="mb-6">
      {/* 1. Hero header card */}
      <ClubHeaderCard clubProfile={clubProfile} stats={statsForHeader} />

      {/* 2. Stats row */}
      <ClubStatsRow
        activeSparings={activeSparings}
        pendingApplications={pendingApplications}
        squadCount={squadCount}
        winRecord={winRecord}
      />

      {/* 3. Next match (conditional) */}
      <ClubNextMatch nextMatch={nextMatch} clubProfile={clubProfile} />

      {/* 4. Quick actions */}
      <ClubQuickActions />

      {/* 5. Pending alerts (conditional) */}
      <ClubPendingAlerts pendingApplications={pendingApplicationsList} />
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
  const clubDashboard = api.stats.clubDashboard.useQuery(undefined, {
    enabled: isClub,
    staleTime: 30_000,
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {isClub ? "Pulpit" : "Feed"}
        </h1>
        {!isClub && feed.data?.regionName ? (
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
        <Card className="mb-6 border-dashed border-primary/20">
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

      {/* CLUB — new FotMob-style card stack */}
      {isClub && !showOnboarding && (
        <ClubDashboard
          clubProfile={clubProfile.data}
          dashboardStats={(stats.data as DashboardStats) ?? null}
          clubDashboard={clubDashboard.data as ClubDashboardQueryData}
        />
      )}

      {/* CLUB — existing sections below the new card stack */}
      {isClub && <RecruitmentStats />}
      {isClub && <ClubRecruitment />}
      {isClub && <ClubDashboardSections />}

      {/* PLAYER / COACH stats bar */}
      <StatsBar stats={(stats.data as DashboardStats) ?? null} />

      {isCoach && <CoachDashboardStats />}
      {(isPlayer || isCoach) && <ClubInvitations />}
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
        <div className="space-y-3">
          {(feed.data!.items as FeedItem[]).map((item) => (
            <FeedCard key={`${item.type}-${item.data.id}`} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
