"use client";

import Link from "next/link";
import { api } from "@/lib/trpc-react";
import { useSession } from "next-auth/react";
import { useI18n } from "@/lib/i18n";

type StatCard = {
  label: string;
  value: number | string;
  trend?: string;
  trendDirection?: "up" | "down" | "neutral";
  href: string;
};

function StatCardItem({ stat }: { stat: StatCard }) {
  return (
    <Link href={stat.href}>
      <div className="rounded-xl border border-[var(--card-elevated-border)] bg-card p-4 transition-all hover:border-primary/15 hover:shadow-[var(--shadow-card-hover)]">
        <p className="text-[11px] font-medium text-muted-foreground">{stat.label}</p>
        <p className="mt-1 font-display text-[28px] font-extrabold leading-none tracking-tight text-foreground">
          {stat.value}
        </p>
        {stat.trend && (
          <p className={`mt-1 text-[11px] font-medium ${
            stat.trendDirection === "up" ? "text-emerald-500" :
            stat.trendDirection === "down" ? "text-red-500" :
            "text-muted-foreground"
          }`}>
            {stat.trend}
          </p>
        )}
      </div>
    </Link>
  );
}

export function DashboardStats() {
  const { data: session } = useSession();
  const role = session?.user?.role;

  if (role === "CLUB") return <ClubStats />;
  if (role === "COACH") return <CoachStats />;
  return <PlayerStats />;
}

function ClubStats() {
  const { t } = useI18n();
  // stats.clubDashboard returns: { activeSparings: SparingOffer[], upcomingEvents: Event[],
  //   pendingApplications: SparingApplication[], squadCount: number, winRecord, nextMatch }
  const { data } = api.stats.clubDashboard.useQuery(undefined, { staleTime: 60_000 });
  const { data: ranking } = api.gamification.leaderboard.useQuery({ limit: 20 }, { staleTime: 300_000 });

  const activeSparings = data?.activeSparings?.length ?? 0;
  const pendingApps = data?.pendingApplications?.length ?? 0;
  const events = data?.upcomingEvents?.length ?? 0;
  const myRank = ranking?.findIndex((e: any) => e.isCurrentUser) ?? -1;

  const stats: StatCard[] = [
    { label: t("Aktywne sparingi"), value: activeSparings, href: "/sparings" },
    { label: t("Oczekujące aplikacje"), value: pendingApps, href: "/recruitment" },
    { label: t("Wydarzenia"), value: events, trend: t("ten tydzień"), trendDirection: "neutral", href: "/events" },
    { label: t("Ranking"), value: myRank >= 0 ? `#${myRank + 1}` : "—", href: "/ranking" },
  ];

  return <StatsGrid stats={stats} />;
}

function PlayerStats() {
  const { t } = useI18n();
  // stats.dashboard for PLAYER returns: { role: "PLAYER", eventApps: number, unreadMessages: number }
  const { data } = api.stats.dashboard.useQuery(undefined, { staleTime: 60_000 });
  const playerData = data as { role: string; eventApps?: number; unreadMessages?: number } | undefined;

  const stats: StatCard[] = [
    { label: t("Zgłoszenia"), value: playerData?.eventApps ?? 0, href: "/events" },
    { label: t("Treningi ten tydzień"), value: 0, href: "/trainings" },
    { label: t("Wiadomości"), value: playerData?.unreadMessages ?? 0, href: "/messages" },
    { label: t("Ranking"), value: "—", href: "/ranking" },
  ];

  return <StatsGrid stats={stats} />;
}

function CoachStats() {
  const { t } = useI18n();
  // stats.coachDashboard returns: { activeTrainings: number, weeklySignups: number, regionName?: string }
  const { data } = api.stats.coachDashboard.useQuery(undefined, { staleTime: 60_000 });

  const stats: StatCard[] = [
    { label: t("Zaplanowane treningi"), value: data?.activeTrainings ?? 0, href: "/trainings" },
    { label: t("Zapisy w tym tyg."), value: data?.weeklySignups ?? 0, href: "/trainings" },
    { label: t("Wydarzenia"), value: 0, href: "/events" },
    { label: t("Wiadomości"), value: 0, href: "/messages" },
  ];

  return <StatsGrid stats={stats} />;
}

function StatsGrid({ stats }: { stats: StatCard[] }) {
  return (
    <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
      {stats.map((stat) => (
        <StatCardItem key={stat.label} stat={stat} />
      ))}
    </div>
  );
}
