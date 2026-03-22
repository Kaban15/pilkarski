"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EVENT_TYPE_LABELS } from "@/lib/labels";

type CalendarItem = {
  id: string;
  type: "sparing" | "event";
  title: string;
  date: string;
  clubName: string;
  eventType?: string;
};

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1; // Monday = 0
}

const MONTH_NAMES = [
  "Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec",
  "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień",
];

const DAY_NAMES = ["Pn", "Wt", "Śr", "Cz", "Pt", "Sb", "Nd"];

export function CalendarView() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [items, setItems] = useState<CalendarItem[]>([]);
  const [loading, setLoading] = useState(true);

  const dateFrom = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const dateTo = `${year}-${String(month + 1).padStart(2, "0")}-${getDaysInMonth(year, month)}`;

  useEffect(() => {
    setLoading(true);
    Promise.all([
      trpc.sparing.list.query({ dateFrom, dateTo, limit: 50, sortBy: "matchDate", sortOrder: "asc" }),
      trpc.event.list.query({ dateFrom, dateTo, limit: 50, sortBy: "eventDate", sortOrder: "asc" }),
    ]).then(([sparings, events]) => {
      const mapped: CalendarItem[] = [
        ...sparings.items.map((s: any) => ({
          id: s.id,
          type: "sparing" as const,
          title: s.title,
          date: s.matchDate,
          clubName: s.club?.name ?? "",
        })),
        ...events.items.map((e: any) => ({
          id: e.id,
          type: "event" as const,
          title: e.title,
          date: e.eventDate,
          clubName: e.club?.name ?? "",
          eventType: e.type,
        })),
      ];
      setItems(mapped);
    }).finally(() => setLoading(false));
  }, [dateFrom, dateTo]);

  const itemsByDay = useMemo(() => {
    const map = new Map<number, CalendarItem[]>();
    for (const item of items) {
      const d = new Date(item.date);
      if (d.getFullYear() === year && d.getMonth() === month) {
        const day = d.getDate();
        if (!map.has(day)) map.set(day, []);
        map.get(day)!.push(item);
      }
    }
    return map;
  }, [items, year, month]);

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfWeek(year, month);
  const today = now.getDate();
  const isCurrentMonth = now.getFullYear() === year && now.getMonth() === month;

  const prev = () => {
    if (month === 0) { setMonth(11); setYear(year - 1); }
    else setMonth(month - 1);
  };
  const next = () => {
    if (month === 11) { setMonth(0); setYear(year + 1); }
    else setMonth(month + 1);
  };
  const goToday = () => { setYear(now.getFullYear()); setMonth(now.getMonth()); };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={prev}>&larr;</Button>
          <h2 className="text-lg font-semibold min-w-[180px] text-center">
            {MONTH_NAMES[month]} {year}
          </h2>
          <Button variant="outline" size="sm" onClick={next}>&rarr;</Button>
        </div>
        <Button variant="ghost" size="sm" onClick={goToday}>Dziś</Button>
      </div>

      <div className="grid grid-cols-7 gap-px rounded-lg border border-border bg-border overflow-hidden">
        {DAY_NAMES.map((d) => (
          <div key={d} className="bg-muted px-2 py-1.5 text-center text-xs font-medium text-muted-foreground">
            {d}
          </div>
        ))}

        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} className="bg-background min-h-[80px] p-1" />
        ))}

        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dayItems = itemsByDay.get(day) ?? [];
          const isToday = isCurrentMonth && day === today;
          return (
            <div
              key={day}
              className={`bg-background min-h-[80px] p-1 ${isToday ? "ring-2 ring-primary ring-inset" : ""}`}
            >
              <div className={`text-xs font-medium mb-0.5 ${isToday ? "text-primary font-bold" : "text-muted-foreground"}`}>
                {day}
              </div>
              <div className="space-y-0.5">
                {dayItems.slice(0, 3).map((item) => (
                  <Link
                    key={item.id}
                    href={item.type === "sparing" ? `/sparings/${item.id}` : `/events/${item.id}`}
                    className={`block truncate rounded px-1 py-0.5 text-[10px] leading-tight font-medium ${
                      item.type === "sparing"
                        ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
                        : "bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300"
                    }`}
                    title={`${item.title} — ${item.clubName}`}
                  >
                    {item.title}
                  </Link>
                ))}
                {dayItems.length > 3 && (
                  <span className="block text-[10px] text-muted-foreground px-1">
                    +{dayItems.length - 3} więcej
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {loading && (
        <p className="mt-3 text-sm text-muted-foreground text-center">Ładowanie...</p>
      )}

      {!loading && items.length === 0 && (
        <p className="mt-3 text-sm text-muted-foreground text-center">
          Brak sparingów i wydarzeń w tym miesiącu.
        </p>
      )}
    </div>
  );
}
