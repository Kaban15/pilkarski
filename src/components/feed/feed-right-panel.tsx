"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { api } from "@/lib/trpc-react";
import { useI18n } from "@/lib/i18n";
import { Card, CardContent } from "@/components/ui/card";
import { StatsCell } from "@/components/stats-cell";
import {
  Swords,
  Trophy,
  Target,
  Calendar,
  Search,
} from "lucide-react";

export function FeedRightPanel() {
  const { data: session } = useSession();
  const role = session?.user?.role;
  const isClub = role === "CLUB";

  return (
    <div className="space-y-4">
      {isClub ? <ClubQuickLinks /> : <PlayerQuickLinks />}
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

