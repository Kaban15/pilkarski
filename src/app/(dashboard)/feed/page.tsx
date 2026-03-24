"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { api } from "@/lib/trpc-react";
import { formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FeedCardSkeleton } from "@/components/card-skeleton";
import { EVENT_TYPE_LABELS, POSITION_LABELS } from "@/lib/labels";
import { EmptyState } from "@/components/empty-state";
import { ClubDashboardSections } from "@/components/dashboard/club-sections";
import { PlayerRecruitments } from "@/components/dashboard/player-recruitments";
import { ClubOnboarding } from "@/components/onboarding/club-onboarding";
import {
  Swords,
  Trophy,
  Shield,
  UserPlus,
  ArrowRightLeft,
  Calendar,
  MapPin,
  MessageSquare,
  FileText,
  TrendingUp,
  ArrowRight,
  Plus,
  Search,
  CheckCircle2,
} from "lucide-react";

type FeedItem = {
  type: "sparing" | "event" | "transfer" | "club" | "player";
  data: any;
  createdAt: string | Date;
};

const FEED_CONFIG = {
  sparing: {
    icon: Swords,
    label: "Sparing",
    border: "border-l-emerald-500",
    badge: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  },
  event: {
    icon: Trophy,
    label: "Wydarzenie",
    border: "border-l-violet-500",
    badge: "bg-violet-500/10 text-violet-700 dark:text-violet-400",
  },
  club: {
    icon: Shield,
    label: "Nowy klub",
    border: "border-l-blue-500",
    badge: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  },
  transfer: {
    icon: ArrowRightLeft,
    label: "Transfer",
    border: "border-l-cyan-500",
    badge: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400",
  },
  player: {
    icon: UserPlus,
    label: "Nowy zawodnik",
    border: "border-l-orange-500",
    badge: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
  },
};

function FeedCard({ item }: { item: FeedItem }) {
  const config = FEED_CONFIG[item.type];
  const Icon = config.icon;

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
        return item.data.title;
      case "event":
        return item.data.title;
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

  const getDateInfo = () => {
    switch (item.type) {
      case "sparing":
        return formatDate(item.data.matchDate) + (item.data.location ? ` · ${item.data.location}` : "");
      case "event":
        return formatDate(item.data.eventDate) + (item.data.location ? ` · ${item.data.location}` : "");
      default:
        return formatDate(item.createdAt);
    }
  };

  return (
    <Link href={getHref()} className="group block">
      <Card
        className={`border-l-[3px] ${config.border} transition-all hover:shadow-md hover:-translate-y-0.5`}
      >
        <CardContent className="flex items-start gap-4 py-4">
          <div
            className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${config.badge}`}
          >
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center gap-2">
              <span
                className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ${config.badge}`}
              >
                {item.type === "event"
                  ? (EVENT_TYPE_LABELS[item.data.type] ?? config.label)
                  : config.label}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatDate(item.createdAt)}
              </span>
            </div>
            <p className="font-semibold text-foreground group-hover:text-primary transition-colors">
              {getTitle()}
            </p>
            <p className="text-sm text-muted-foreground">{getSubtitle()}</p>
            {(item.type === "sparing" || item.type === "event") && (
              <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {item.type === "sparing"
                    ? formatDate(item.data.matchDate)
                    : formatDate(item.data.eventDate)}
                </span>
                {item.data.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {item.data.location}
                  </span>
                )}
              </div>
            )}
          </div>
          <ArrowRight className="mt-2 h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
        </CardContent>
      </Card>
    </Link>
  );
}

type DashboardStats = {
  role: "CLUB" | "PLAYER";
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
    <div className="stagger-children mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
      {config.map((c) => (
        <Link key={c.key} href={c.href}>
          <Card className="transition-all hover:shadow-md hover:-translate-y-0.5">
            <CardContent className="flex items-center gap-3 py-4">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${c.bg}`}
              >
                <c.icon className={`h-5 w-5 ${c.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {(stats as unknown as Record<string, number>)[c.key] ?? 0}
                </p>
                <p className="text-xs text-muted-foreground">{c.label}</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}

function ClubQuickActions() {
  return (
    <div className="mb-8 flex flex-wrap gap-3">
      <Link href="/sparings/new">
        <Button variant="outline" className="gap-2">
          <Plus className="h-4 w-4" />
          Dodaj sparing
        </Button>
      </Link>
      <Link href="/events/new">
        <Button variant="outline" className="gap-2">
          <Plus className="h-4 w-4" />
          Dodaj wydarzenie
        </Button>
      </Link>
      <Link href="/calendar">
        <Button variant="ghost" className="gap-2">
          <Calendar className="h-4 w-4" />
          Kalendarz
        </Button>
      </Link>
      <Link href="/search">
        <Button variant="ghost" className="gap-2">
          <Search className="h-4 w-4" />
          Szukaj rywala
        </Button>
      </Link>
    </div>
  );
}

export default function FeedPage() {
  const { data: session } = useSession();
  const isClub = session?.user?.role === "CLUB";
  const isPlayer = session?.user?.role === "PLAYER";
  const feed = api.feed.get.useQuery({ limit: 30 });
  const stats = api.stats.dashboard.useQuery(undefined, { staleTime: 60_000 });
  const clubProfile = api.club.me.useQuery(undefined, {
    enabled: isClub,
    staleTime: Infinity,
  });
  const [onboardingDismissed, setOnboardingDismissed] = useState(false);

  const showOnboarding = isClub && !onboardingDismissed && clubProfile.data && !clubProfile.data.regionId;

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
      {isClub && <ClubDashboardSections />}
      {isPlayer && <PlayerRecruitments />}

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
