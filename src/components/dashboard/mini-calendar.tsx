"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/trpc-react";

export function MiniCalendar() {
  const router = useRouter();
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  const { data: clubData } = api.stats.clubDashboard.useQuery(undefined, { staleTime: 60_000 });

  const highlightedDays = useMemo(() => {
    const sparingDays = new Set<number>();
    const eventDays = new Set<number>();
    if (clubData?.activeSparings) {
      for (const s of clubData.activeSparings) {
        const d = new Date((s as any).matchDate ?? (s as any).createdAt);
        if (d.getMonth() === month) sparingDays.add(d.getDate());
      }
    }
    if (clubData?.upcomingEvents) {
      for (const e of clubData.upcomingEvents) {
        const d = new Date((e as any).eventDate);
        if (d.getMonth() === month) eventDays.add(d.getDate());
      }
    }
    return { sparingDays, eventDays };
  }, [clubData, month]);

  const firstDay = new Date(year, month, 1).getDay();
  const offset = firstDay === 0 ? 6 : firstDay - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = now.getDate();

  const dayLabels = ["Pn", "Wt", "Śr", "Cz", "Pt", "Sb", "Nd"];

  return (
    <div className="mb-6">
      <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
        {now.toLocaleDateString("pl-PL", { month: "long", year: "numeric" })}
      </p>
      <div className="grid grid-cols-7 gap-0.5 text-center">
        {dayLabels.map((d) => (
          <span key={d} className="py-1 text-[9px] font-semibold text-muted-foreground/50">{d}</span>
        ))}
        {Array.from({ length: offset }).map((_, i) => (
          <span key={`e-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const isToday = day === today;
          const hasSparing = highlightedDays.sparingDays.has(day);
          const hasEvent = highlightedDays.eventDays.has(day);

          return (
            <button
              key={day}
              onClick={() => router.push(`/calendar?date=${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`)}
              className={`rounded py-1 text-[10px] transition-colors hover:bg-accent ${
                isToday ? "bg-primary/15 font-bold text-foreground" :
                hasSparing ? "bg-sport-orange/10 font-semibold text-sport-orange" :
                hasEvent ? "bg-primary/10 font-semibold text-primary" :
                "text-muted-foreground"
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}
