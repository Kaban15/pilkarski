"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { api } from "@/lib/trpc-react";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Swords, Plus } from "lucide-react";

function formatCountdown(date: Date): string {
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  if (diff <= 0) return "teraz";
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  if (days > 0) return `za ${days}d ${hours}h`;
  return `za ${hours}h`;
}

function ClubCrest({ name, logoUrl }: { name: string; logoUrl?: string | null }) {
  return (
    <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[var(--card-elevated-border)] bg-secondary shadow-lg">
      {logoUrl ? (
        <Image src={logoUrl} alt={name} width={40} height={40} className="h-10 w-10 rounded-lg object-contain" />
      ) : (
        <span className="text-2xl font-black text-muted-foreground">
          {name.charAt(0).toUpperCase()}
        </span>
      )}
    </div>
  );
}

function ClubHero() {
  const { t } = useI18n();
  const { data } = api.stats.clubDashboard.useQuery(undefined, { staleTime: 300_000 });
  const { data: club } = api.club.me.useQuery(undefined, { staleTime: 300_000 });

  const nextMatch = data?.nextMatch;

  if (!nextMatch) {
    return (
      <div className="mb-5 rounded-2xl border border-[var(--card-elevated-border)] bg-gradient-to-br from-card to-primary/5 p-6 relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-primary to-sport-orange" />
        <p className="text-sm font-semibold text-foreground">{t("Brak nadchodzących sparingów")}</p>
        <p className="mt-1 text-xs text-muted-foreground">{t("Utwórz ofertę sparingową i znajdź rywala")}</p>
        <Button asChild size="sm" className="mt-4">
          <Link href="/sparings/new"><Plus className="mr-1.5 h-3.5 w-3.5" />{t("Nowy sparing")}</Link>
        </Button>
      </div>
    );
  }

  const matchDate = new Date(nextMatch.matchDate);

  return (
    <div className="mb-5 rounded-2xl border border-primary/10 bg-gradient-to-br from-card via-primary/[0.03] to-sport-orange/[0.02] p-6 relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-primary to-sport-orange" />

      <div className="mb-4 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-sport-orange">
        <Swords className="h-3.5 w-3.5" />
        {t("Najbliższy sparing")}
        <span className="rounded bg-sport-orange/10 px-2 py-0.5 text-[10px] font-semibold">
          {formatCountdown(matchDate)}
        </span>
      </div>

      <div className="flex items-center justify-center gap-8">
        <div className="text-center">
          <ClubCrest name={club?.name ?? "?"} logoUrl={club?.logoUrl} />
          <p className="mt-2 font-display text-sm font-bold">{club?.name ?? "Twój klub"}</p>
        </div>
        <div className="text-center">
          <p className="font-display text-xl font-black tracking-widest text-primary">VS</p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {matchDate.toLocaleDateString("pl-PL", { weekday: "short", day: "numeric", month: "short" })}
            {" · "}
            {matchDate.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
        <div className="text-center">
          <ClubCrest
            name={nextMatch.opponentClub?.name ?? "?"}
            logoUrl={nextMatch.opponentClub?.logoUrl}
          />
          <p className="mt-2 font-display text-sm font-bold">
            {nextMatch.opponentClub?.name ?? "Rywal"}
          </p>
        </div>
      </div>

      <div className="mt-5 flex justify-center gap-3">
        <Button asChild size="sm">
          <Link href={`/sparings/${nextMatch.id}`}>{t("Szczegóły")}</Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href={`/sparings/${nextMatch.id}`}>{t("Ustaw skład")}</Link>
        </Button>
      </div>
    </div>
  );
}

function SimpleHeroCard({ heading, subheading, actionLabel, actionHref }: {
  heading: string;
  subheading: string;
  actionLabel: string;
  actionHref: string;
}) {
  return (
    <div className="mb-5 rounded-2xl border border-[var(--card-elevated-border)] bg-gradient-to-br from-card to-primary/5 p-6 relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-primary to-sport-orange" />
      <p className="text-sm font-semibold">{heading}</p>
      <p className="mt-1 text-xs text-muted-foreground">{subheading}</p>
      <Button asChild size="sm" className="mt-4">
        <Link href={actionHref}>{actionLabel}</Link>
      </Button>
    </div>
  );
}

function PlayerHero() {
  const { t } = useI18n();
  return <SimpleHeroCard heading={t("Szukasz drużyny?")} subheading={t("Przeglądaj nabory i wydarzenia w swoim regionie")} actionLabel={t("Przeglądaj wydarzenia")} actionHref="/events" />;
}

function CoachHero() {
  const { t } = useI18n();
  return <SimpleHeroCard heading={t("Twoje treningi")} subheading={t("Zaplanuj treningi i zarządzaj kadrą")} actionLabel={t("Zaplanuj trening")} actionHref="/trainings" />;
}

export function HeroCard() {
  const { data: session } = useSession();
  const role = session?.user?.role;

  if (role === "CLUB") return <ClubHero />;
  if (role === "COACH") return <CoachHero />;
  return <PlayerHero />;
}
