"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CardSkeleton } from "@/components/card-skeleton";
import { EmptyState } from "@/components/empty-state";
import { BADGES } from "@/lib/gamification";
import { POINTS_LABELS } from "@/lib/gamification";
import { formatDate } from "@/lib/format";
import {
  Trophy,
  Medal,
  Zap,
  Shield,
  User,
  Star,
} from "lucide-react";

const BADGE_MAP = Object.fromEntries(BADGES.map((b) => [b.key, b]));

export default function RankingPage() {
  const { data: session } = useSession();
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [myPoints, setMyPoints] = useState<any>(null);
  const [myBadges, setMyBadges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      trpc.gamification.leaderboard.query({ limit: 20 }),
      trpc.gamification.myPoints.query(),
      trpc.gamification.myBadges.query(),
      trpc.gamification.checkBadges.mutate(),
    ]).then(([lb, pts, badges]) => {
      setLeaderboard(lb);
      setMyPoints(pts);
      setMyBadges(badges);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="animate-fade-in space-y-6">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Ranking</h1>
        <div className="grid gap-4 sm:grid-cols-2">
          {[...Array(4)].map((_, i) => <CardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Ranking</h1>
        <p className="mt-1 text-muted-foreground">Punkty za aktywność i odznaki</p>
      </div>

      {/* My stats */}
      {myPoints && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="border-primary/20">
            <CardContent className="flex items-center gap-3 py-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{myPoints.total}</p>
                <p className="text-xs text-muted-foreground">Twoje punkty</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 py-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
                <Medal className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{myBadges.length}</p>
                <p className="text-xs text-muted-foreground">Odznaki</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 py-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-500/10">
                <Trophy className="h-5 w-5 text-violet-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  #{leaderboard.findIndex((l) => l.userId === session?.user?.id) + 1 || "–"}
                </p>
                <p className="text-xs text-muted-foreground">Pozycja w rankingu</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* My badges */}
      {myBadges.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Medal className="h-4 w-4 text-amber-500" />
              Twoje odznaki
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {myBadges.map((b: any) => {
                const def = BADGE_MAP[b.badge];
                return (
                  <div
                    key={b.id}
                    className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2"
                    title={def?.description}
                  >
                    <span className="text-lg">{def?.icon ?? "🏅"}</span>
                    <div>
                      <p className="text-sm font-medium">{def?.name ?? b.badge}</p>
                      <p className="text-xs text-muted-foreground">{def?.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All available badges */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Star className="h-4 w-4 text-muted-foreground" />
            Wszystkie odznaki
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {BADGES.map((badge) => {
              const earned = myBadges.some((b: any) => b.badge === badge.key);
              return (
                <div
                  key={badge.key}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${
                    earned ? "border-primary/30 bg-primary/5" : "border-border bg-muted/10 opacity-60"
                  }`}
                >
                  <span className="text-lg">{badge.icon}</span>
                  <div>
                    <p className="text-sm font-medium">{badge.name}</p>
                    <p className="text-xs text-muted-foreground">{badge.description}</p>
                  </div>
                  {earned && <Badge className="ml-auto bg-primary/10 text-primary text-xs">✓</Badge>}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Trophy className="h-4 w-4 text-violet-500" />
            Top 20
          </CardTitle>
        </CardHeader>
        <CardContent>
          {leaderboard.length === 0 ? (
            <EmptyState
              icon={Trophy}
              title="Brak danych"
              description="Ranking pojawi się gdy użytkownicy zdobędą punkty."
            />
          ) : (
            <ul className="divide-y divide-border">
              {leaderboard.map((entry: any, i: number) => {
                const isMe = entry.userId === session?.user?.id;
                return (
                  <li
                    key={entry.userId}
                    className={`flex items-center gap-3 py-3 first:pt-0 last:pb-0 ${isMe ? "bg-primary/5 -mx-2 px-2 rounded-lg" : ""}`}
                  >
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                      i === 0 ? "bg-amber-500/20 text-amber-600" :
                      i === 1 ? "bg-gray-300/20 text-gray-500" :
                      i === 2 ? "bg-orange-500/20 text-orange-600" :
                      "bg-muted text-muted-foreground"
                    }`}>
                      {i + 1}
                    </span>
                    {entry.avatar ? (
                      <img src={entry.avatar} alt="" className="h-8 w-8 rounded-full object-cover" />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-bold">
                        {entry.role === "CLUB" ? <Shield className="h-4 w-4" /> : <User className="h-4 w-4" />}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      {entry.profileId ? (
                        <Link
                          href={entry.role === "CLUB" ? `/clubs/${entry.profileId}` : `/players/${entry.profileId}`}
                          className="font-medium hover:text-primary transition"
                        >
                          {entry.name}
                        </Link>
                      ) : (
                        <p className="font-medium">{entry.name}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      {entry.badges > 0 && (
                        <span className="text-xs text-muted-foreground">{entry.badges} 🏅</span>
                      )}
                      <span className="font-bold text-primary">{entry.points} pkt</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Recent points history */}
      {myPoints && myPoints.recent.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Zap className="h-4 w-4 text-primary" />
              Ostatnie punkty
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-border">
              {myPoints.recent.map((p: any) => (
                <li key={p.id} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                  <div>
                    <p className="text-sm">{POINTS_LABELS[p.action] ?? p.action}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(p.createdAt)}</p>
                  </div>
                  <span className="font-bold text-primary">+{p.points}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
