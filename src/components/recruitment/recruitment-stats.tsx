"use client";

import Link from "next/link";
import { api } from "@/lib/trpc-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, Eye, FileText, UserCheck, CheckCircle2, Timer } from "lucide-react";
import { useI18n } from "@/lib/i18n";

const STAGE_CONFIG = [
  { key: "watching", label: "Na radarze", icon: Eye, color: "text-blue-400", bg: "bg-blue-500/10", gradientClass: "sport-gradient-blue", borderColor: "border-blue-500/15" },
  { key: "invited", label: "Zaproszeni", icon: FileText, color: "text-amber-400", bg: "bg-amber-500/10", gradientClass: "sport-gradient-amber", borderColor: "border-amber-500/15" },
  { key: "afterTryout", label: "Po testach", icon: UserCheck, color: "text-violet-400", bg: "bg-violet-500/10", gradientClass: "sport-gradient-violet", borderColor: "border-violet-500/15" },
  { key: "signed", label: "Podpisani", icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10", gradientClass: "sport-gradient-green", borderColor: "border-emerald-500/15" },
] as const;

export function RecruitmentStats() {
  const { t } = useI18n();
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
            {t("Pipeline rekrutacyjny")}
          </CardTitle>
          <Link href="/recruitment" className="text-xs text-primary hover:underline">
            {t("Zarządzaj →")}
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {STAGE_CONFIG.map(({ key, label, icon: Icon, color, bg, gradientClass, borderColor }) => {
            const value = (stats as Record<string, number>)[key] ?? 0;
            return (
              <Link key={key} href="/recruitment">
                <div className={`${gradientClass} rounded-2xl border ${borderColor} p-4 transition-all hover:border-primary/40`}>
                  <div className="flex items-center gap-1.5 mb-2">
                    <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${bg}`}>
                      <Icon className={`h-3.5 w-3.5 ${color}`} />
                    </div>
                    <span className={`text-[11px] font-medium ${color}`}>{t(label)}</span>
                  </div>
                  <span className={`text-[32px] font-extrabold tabular-nums leading-none ${color}`}>
                    {value}
                  </span>
                </div>
              </Link>
            );
          })}
          {avgTime && (
            <div className="sport-gradient-green rounded-2xl border border-emerald-500/15 p-4">
              <div className="flex items-center gap-1.5 mb-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10">
                  <Timer className="h-3.5 w-3.5 text-emerald-400" />
                </div>
                <span className="text-[11px] font-medium text-emerald-400">{t("Śr. do podpisania")}</span>
              </div>
              <span className="text-[32px] font-extrabold tabular-nums leading-none text-emerald-400">
                {avgTime.avgDays}d
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
