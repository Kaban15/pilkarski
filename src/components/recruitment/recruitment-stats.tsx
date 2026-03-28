"use client";

import Link from "next/link";
import { api } from "@/lib/trpc-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, Eye, FileText, UserCheck, CheckCircle2, Timer } from "lucide-react";

const STAGE_CONFIG = [
  { key: "watching", label: "Na radarze", icon: Eye, color: "text-blue-500", bg: "bg-blue-500/10" },
  { key: "invited", label: "Zaproszeni", icon: FileText, color: "text-amber-500", bg: "bg-amber-500/10" },
  { key: "afterTryout", label: "Po testach", icon: UserCheck, color: "text-violet-500", bg: "bg-violet-500/10" },
  { key: "signed", label: "Podpisani", icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10" },
] as const;

export function RecruitmentStats() {
  const { data: stats } = api.recruitment.stats.useQuery(undefined, {
    staleTime: 60_000,
  });
  const { data: avgTime } = api.recruitment.avgTimeToSign.useQuery(undefined, {
    staleTime: 300_000,
  });

  if (!stats || stats.total === 0) return null;

  return (
    <Card className="mb-6 rounded-xl">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Target className="h-4 w-4 text-primary" />
            Pipeline rekrutacyjny
          </CardTitle>
          <Link href="/recruitment" className="text-xs text-primary hover:underline">
            Zarządzaj →
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-3">
          {STAGE_CONFIG.map(({ key, label, icon: Icon, color, bg }) => {
            const value = (stats as Record<string, number>)[key] ?? 0;
            return (
              <Link key={key} href="/recruitment">
                <div className="flex items-center gap-2 rounded-xl border px-3 py-2 transition-colors hover:border-primary/40">
                  <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${bg}`}>
                    <Icon className={`h-3.5 w-3.5 ${color}`} />
                  </div>
                  <div>
                    <span className="text-lg font-bold tabular-nums">{value}</span>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
                  </div>
                </div>
              </Link>
            );
          })}
          {avgTime && (
            <div className="flex items-center gap-2 rounded-xl border px-3 py-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10">
                <Timer className="h-3.5 w-3.5 text-emerald-500" />
              </div>
              <div>
                <span className="text-lg font-bold tabular-nums">{avgTime.avgDays}d</span>
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Śr. do podpisania</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
