"use client";

import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CardSkeleton } from "@/components/card-skeleton";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  BarChart3,
  Users,
  Shield,
  Swords,
  Trophy,
  ArrowRightLeft,
  Star,
  TrendingUp,
  Target,
  CheckCircle2,
} from "lucide-react";

const CHART_COLORS = ["#10b981", "#8b5cf6", "#06b6d4", "#f59e0b", "#ef4444"];

export default function StatsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    trpc.stats.detailed.query().then((res) => {
      setData(res);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="animate-fade-in space-y-6">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Statystyki</h1>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => <CardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Statystyki</h1>
        <p className="mt-1 text-muted-foreground">Przegląd aktywności platformy i Twojego konta</p>
      </div>

      {/* Platform totals */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard icon={Shield} label="Kluby" value={data.platform.clubs} color="text-emerald-500" bg="bg-emerald-500/10" />
        <StatCard icon={Users} label="Zawodnicy" value={data.platform.players} color="text-blue-500" bg="bg-blue-500/10" />
        <StatCard icon={Swords} label="Sparingi" value={data.platform.sparings} color="text-emerald-500" bg="bg-emerald-500/10" />
        <StatCard icon={Trophy} label="Wydarzenia" value={data.platform.events} color="text-violet-500" bg="bg-violet-500/10" />
        <StatCard icon={ArrowRightLeft} label="Transfery aktywne" value={data.platform.transfers} color="text-cyan-500" bg="bg-cyan-500/10" />
        <StatCard icon={Star} label="Recenzje" value={data.platform.reviews} color="text-amber-500" bg="bg-amber-500/10" />
      </div>

      {/* Charts row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Monthly activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              Aktywność (ostatnie 6 mies.)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" className="text-xs" tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--color-card)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "0.5rem",
                      color: "var(--color-foreground)",
                    }}
                  />
                  <Bar dataKey="sparingi" fill="#10b981" radius={[4, 4, 0, 0]} name="Sparingi" />
                  <Bar dataKey="wydarzenia" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Wydarzenia" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top regions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              Najaktywniejsze regiony
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.topRegions.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.topRegions}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
                    >
                      {data.topRegions.map((_: any, i: number) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--color-card)",
                        border: "1px solid var(--color-border)",
                        borderRadius: "0.5rem",
                        color: "var(--color-foreground)",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">Brak danych</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* User stats */}
      {data.role === "CLUB" && data.userStats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="h-4 w-4 text-muted-foreground" />
              Twoje statystyki (klub)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <MiniStat label="Sparingi" value={data.userStats.totalSparings} sub={`${data.userStats.matchedSparings} dopasowanych`} />
              <MiniStat label="Match rate" value={`${data.userStats.matchRate}%`} sub="dopasowań" />
              <MiniStat label="Zgłoszenia" value={data.userStats.totalApps} sub={`${data.userStats.acceptedApps} zaakceptowanych`} />
              <MiniStat
                label="Średnia ocena"
                value={data.userStats.reviewCount > 0 ? `${data.userStats.avgRating.toFixed(1)}/5` : "–"}
                sub={`${data.userStats.reviewCount} recenzji`}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {data.role === "PLAYER" && data.userStats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="h-4 w-4 text-muted-foreground" />
              Twoje statystyki (zawodnik)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <MiniStat label="Zgłoszenia" value={data.userStats.totalApps} sub="na wydarzenia" />
              <MiniStat label="Zaakceptowane" value={data.userStats.acceptedApps} sub="zgłoszeń" />
              <MiniStat label="Accept rate" value={`${data.userStats.acceptRate}%`} sub="akceptacji" />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, bg }: {
  icon: any; label: string; value: number; color: string; bg: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 py-4">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${bg}`}>
          <Icon className={`h-5 w-5 ${color}`} />
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function MiniStat({ label, value, sub }: { label: string; value: string | number; sub: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}
