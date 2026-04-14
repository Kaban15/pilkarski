"use client";

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
  const { data: clubData } = api.stats.clubDashboard.useQuery(undefined, { staleTime: 60_000 });

  const items: UpcomingItem[] = [];

  if (clubData?.activeSparings) {
    for (const s of clubData.activeSparings) {
      const matchDate = (s as any).matchDate;
      if (matchDate) {
        items.push({
          id: (s as any).id,
          title: (s as any).title ?? t("Sparing"),
          date: new Date(matchDate),
          type: "sparing",
          href: `/sparings/${(s as any).id}`,
        });
      }
    }
  }
  if (clubData?.upcomingEvents) {
    for (const e of clubData.upcomingEvents) {
      items.push({
        id: (e as any).id,
        title: (e as any).title,
        date: new Date((e as any).eventDate),
        type: "event",
        href: `/events/${(e as any).id}`,
      });
    }
  }

  items.sort((a, b) => a.date.getTime() - b.date.getTime());
  const visible = items.slice(0, 4);

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
