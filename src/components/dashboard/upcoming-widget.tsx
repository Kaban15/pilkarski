"use client";

import { useMemo } from "react";
import Link from "next/link";
import { api } from "@/lib/trpc-react";
import { useI18n } from "@/lib/i18n";

type UpcomingItem = {
  id: string;
  title: string;
  date: Date;
  type: "sparing" | "event";
  href: string;
};

export function UpcomingWidget() {
  const { t } = useI18n();
  const { data: clubData } = api.stats.clubDashboard.useQuery(undefined, { staleTime: 300_000 });

  const visible = useMemo(() => {
    const items: UpcomingItem[] = [];

    if (clubData?.activeSparings) {
      for (const s of clubData.activeSparings) {
        if (s.matchDate) {
          items.push({
            id: s.id,
            title: s.title ?? t("Sparing"),
            date: new Date(s.matchDate),
            type: "sparing",
            href: `/sparings/${s.id}`,
          });
        }
      }
    }
    if (clubData?.upcomingEvents) {
      for (const e of clubData.upcomingEvents) {
        items.push({
          id: e.id,
          title: e.title,
          date: new Date(e.eventDate),
          type: "event",
          href: `/events/${e.id}`,
        });
      }
    }

    items.sort((a, b) => a.date.getTime() - b.date.getTime());
    return items.slice(0, 4);
  }, [clubData, t]);

  if (visible.length === 0) return null;

  return (
    <div className="mb-6">
      <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
        {t("Nadchodzące")}
      </p>
      <div className="space-y-1">
        {visible.map((item) => (
          <Link key={item.id} href={item.href}>
            <div className="flex gap-2.5 rounded-lg p-2 transition-colors hover:bg-accent">
              <div className={`mt-1 w-[3px] shrink-0 rounded ${
                item.type === "sparing" ? "bg-sport-orange" : "bg-primary"
              }`} style={{ minHeight: "28px" }} />
              <div>
                <p className="text-[10px] text-muted-foreground">
                  {item.date.toLocaleDateString("pl-PL", { weekday: "short", day: "numeric" })}
                  {" · "}
                  {item.date.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" })}
                </p>
                <p className="text-[12px] font-medium text-foreground">{item.title}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
