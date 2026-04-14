"use client";

import Link from "next/link";
import { api } from "@/lib/trpc-react";
import { useI18n } from "@/lib/i18n";

export function RankingWidget() {
  const { t } = useI18n();
  const { data: ranking } = api.gamification.leaderboard.useQuery({ limit: 20 }, { staleTime: 300_000 });

  if (!ranking || ranking.length === 0) return null;

  const myIndex = ranking.findIndex((e: any) => e.isCurrentUser);
  let start = Math.max(0, myIndex - 2);
  const end = Math.min(ranking.length, start + 5);
  if (end - start < 5) start = Math.max(0, end - 5);
  const visible = ranking.slice(start, end);

  return (
    <div className="mb-6">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          {t("Ranking")}
        </p>
        <Link href="/ranking" className="text-[10px] font-medium text-primary hover:underline">
          {t("Pełny →")}
        </Link>
      </div>
      <div className="space-y-0.5">
        {visible.map((entry: any, i: number) => {
          const rank = start + i + 1;
          const isMe = entry.isCurrentUser;
          return (
            <div
              key={entry.userId}
              className={`flex items-center justify-between rounded-md px-2 py-1.5 text-[11px] ${
                isMe
                  ? "bg-sport-orange/8 font-bold text-sport-orange"
                  : ""
              }`}
            >
              <span className={isMe ? "text-sport-orange" : "text-muted-foreground"}>
                {rank}. {entry.name ?? "—"}
              </span>
              <span className={`tabular-nums ${isMe ? "text-sport-orange" : "text-muted-foreground/70"}`}>
                {entry.points}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
