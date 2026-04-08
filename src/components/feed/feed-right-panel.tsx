"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { api } from "@/lib/trpc-react";
import { useI18n } from "@/lib/i18n";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatsCell } from "@/components/stats-cell";
import {
  Swords,
  Trophy,
  Target,
  Calendar,
  Search,
  TrendingUp,
  MessageSquare,
  Medal,
} from "lucide-react";

export function FeedRightPanel() {
  const { data: session } = useSession();
  const role = session?.user?.role;
  const isClub = role === "CLUB";

  return (
    <div className="space-y-4">
      {isClub ? <ClubQuickLinks /> : <PlayerQuickLinks />}
      <TopLeaderboard />
    </div>
  );
}

function ClubQuickLinks() {
  const { t } = useI18n();
  return (
    <Card>
      <CardContent className="py-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("Szybkie akcje")}</p>
        <div className="space-y-1">
          {[
            { href: "/sparings/new", icon: Swords, label: "Nowy sparing" },
            { href: "/events/new", icon: Trophy, label: "Nowy nabór" },
            { href: "/recruitment", icon: Target, label: "Pipeline" },
            { href: "/calendar", icon: Calendar, label: "Kalendarz" },
            { href: "/search", icon: Search, label: "Szukaj rywala" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <item.icon className="h-4 w-4" />
              {t(item.label)}
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function PlayerQuickLinks() {
  const { t } = useI18n();
  const stats = api.stats.dashboard.useQuery(undefined, { staleTime: 300_000 });
  const data = stats.data as { eventApps?: number; unreadMessages?: number } | null;

  return (
    <Card>
      <CardContent className="py-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("Twoje statystyki")}</p>
        <div className="grid grid-cols-2 gap-2">
          <Link href="/events">
            <StatsCell value={data?.eventApps ?? 0} label={t("Zgłoszenia")} color="violet" />
          </Link>
          <Link href="/messages">
            <StatsCell value={data?.unreadMessages ?? 0} label={t("Wiadomości")} color="amber" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function TopLeaderboard() {
  const { t } = useI18n();
  const { data } = api.gamification.leaderboard.useQuery({ limit: 5 }, { staleTime: 300_000 });

  if (!data || data.length === 0) return null;

  return (
    <Card>
      <CardContent className="py-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Medal className="mr-1 inline h-3.5 w-3.5" />
            {t("Top 5")}
          </p>
          <Link href="/ranking" className="text-[11px] text-primary hover:underline">{t("Ranking →")}</Link>
        </div>
        <div className="space-y-1.5">
          {data.map((entry, i) => (
            <div key={entry.userId} className="flex items-center gap-2 text-[12px]">
              <span className="w-4 text-center font-bold tabular-nums text-muted-foreground">{i + 1}</span>
              <span className="flex-1 truncate">{entry.name ?? "—"}</span>
              <span className="font-semibold tabular-nums text-foreground">{entry.points}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
