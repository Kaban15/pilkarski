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

function StatCardItem({ stat, compact }: { stat: StatCard; compact?: boolean }) {
  return (
    <Link href={stat.href}>
      <div className={`rounded-xl border border-[var(--card-elevated-border)] bg-card transition-all hover:border-primary/15 hover:shadow-[var(--shadow-card-hover)] ${compact ? "p-3" : "p-4"}`}>
        <p className="text-[11px] font-medium text-muted-foreground">{stat.label}</p>
        <p className={`mt-1 font-display font-extrabold leading-none tracking-tight text-foreground ${compact ? "text-[22px]" : "text-[28px]"}`}>
          {stat.value}
        </p>
        {stat.trend && !compact && (
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

type StatsVariant = "main" | "sidebar";

export function DashboardStats({ variant = "main" }: { variant?: StatsVariant } = {}) {
  const { data: session } = useSession();
  const role = session?.user?.role;

  if (role === "CLUB") return <ClubStats variant={variant} />;
  if (role === "COACH") return <CoachStats variant={variant} />;
  return <PlayerStats variant={variant} />;
}

function ClubStats({ variant }: { variant: StatsVariant }) {
  const { t } = useI18n();
  const { data } = api.stats.clubDashboard.useQuery(undefined, { staleTime: 300_000 });

  const activeSparings = data?.activeSparings?.length ?? 0;
  const pendingApps = data?.pendingApplications?.length ?? 0;
  const events = data?.upcomingEvents?.length ?? 0;

  const stats: StatCard[] = [
    { label: t("Aktywne sparingi"), value: activeSparings, href: "/sparings" },
    { label: t("Oczekujące aplikacje"), value: pendingApps, href: "/recruitment" },
    { label: t("Wydarzenia"), value: events, trend: t("ten tydzień"), trendDirection: "neutral", href: "/events" },
  ];

  return <StatsGrid stats={stats} variant={variant} />;
}

function PlayerStats({ variant }: { variant: StatsVariant }) {
  const { t } = useI18n();
  const { data } = api.stats.dashboard.useQuery(undefined, { staleTime: 300_000 });
  const playerData = data as { role: string; eventApps?: number; unreadMessages?: number } | undefined;

  const stats: StatCard[] = [
    { label: t("Zgłoszenia"), value: playerData?.eventApps ?? 0, href: "/events" },
    { label: t("Treningi ten tydzień"), value: 0, href: "/trainings" },
    { label: t("Wiadomości"), value: playerData?.unreadMessages ?? 0, href: "/messages" },
  ];

  return <StatsGrid stats={stats} variant={variant} />;
}

function CoachStats({ variant }: { variant: StatsVariant }) {
  const { t } = useI18n();
  const { data } = api.stats.coachDashboard.useQuery(undefined, { staleTime: 300_000 });

  const stats: StatCard[] = [
    { label: t("Zaplanowane treningi"), value: data?.activeTrainings ?? 0, href: "/trainings" },
    { label: t("Zapisy w tym tyg."), value: data?.weeklySignups ?? 0, href: "/trainings" },
    { label: t("Wydarzenia"), value: 0, href: "/events" },
    { label: t("Wiadomości"), value: 0, href: "/messages" },
  ];

  return <StatsGrid stats={stats} variant={variant} />;
}

function StatsGrid({ stats, variant }: { stats: StatCard[]; variant: StatsVariant }) {
  if (variant === "sidebar") {
    return (
      <div className="grid grid-cols-2 gap-2">
        {stats.map((stat) => (
          <StatCardItem key={stat.label} stat={stat} compact />
        ))}
      </div>
    );
  }
  return (
    <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
      {stats.map((stat) => (
        <StatCardItem key={stat.label} stat={stat} />
      ))}
    </div>
  );
}
