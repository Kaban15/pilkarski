"use client";

import Link from "next/link";
import { api } from "@/lib/trpc-react";
import { useI18n } from "@/lib/i18n";
import { Card, CardContent } from "@/components/ui/card";
import {
  Swords,
  Trophy,
  MessageSquare,
  ArrowLeftRight,
  CalendarDays,
  Users,
  Clock,
  Mail,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import type { DigestIconKey } from "@/lib/digest";

const ICON_MAP: Record<DigestIconKey, { Icon: typeof Swords; color: string }> = {
  sparing: { Icon: Swords, color: "text-sport-orange" },
  event: { Icon: Trophy, color: "text-violet-500" },
  message: { Icon: MessageSquare, color: "text-amber-500" },
  transfer: { Icon: ArrowLeftRight, color: "text-cyan-500" },
  calendar: { Icon: CalendarDays, color: "text-sky-500" },
  pipeline: { Icon: Users, color: "text-slate-500" },
  attendance: { Icon: Clock, color: "text-red-500" },
  invitation: { Icon: Mail, color: "text-violet-500" },
  recommendation: { Icon: Sparkles, color: "text-emerald-500" },
};

function formatCount(n: number): string {
  return n >= 100 ? "99+" : String(n);
}

export function DigestCard() {
  const { t } = useI18n();
  const { data, isLoading, error } = api.digest.get.useQuery(undefined, {
    staleTime: 120_000,
    refetchInterval: 120_000,
    refetchOnWindowFocus: true,
  });

  if (isLoading) {
    return (
      <div
        className="mb-6 h-[168px] w-full rounded-xl border border-border bg-card animate-pulse"
        aria-hidden
      />
    );
  }

  if (error) {
    console.error("[digest] fetch failed", error);
    return null;
  }

  if (!data || data.totalCount === 0) return null;

  return (
    <Card className="mb-6" data-testid="digest-card">
      <CardContent className="py-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {t("Twój status")}
          </p>
          <span className="text-[11px] text-muted-foreground/60">
            {t("zaktualizowano teraz")}
          </span>
        </div>
        <ul className="divide-y divide-border/40">
          {data.rows.map((row) => {
            const { Icon, color } = ICON_MAP[row.iconKey];
            return (
              <li key={row.key}>
                <Link
                  href={row.href}
                  data-testid={row.key}
                  className="group flex items-center gap-3 rounded-md px-1 py-2.5 transition-colors hover:bg-accent"
                >
                  <Icon className={`h-5 w-5 shrink-0 ${color}`} />
                  <span className="min-w-[28px] text-right font-bold tabular-nums text-[18px] font-display">
                    {formatCount(row.count)}
                  </span>
                  <span className="flex-1 truncate text-[14px] text-foreground/90">
                    {t(row.label)}
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50 transition-colors group-hover:text-foreground" />
                </Link>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
