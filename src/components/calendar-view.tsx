"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { api } from "@/lib/trpc-react";
import { Button } from "@/components/ui/button";

type CalendarItem = {
  id: string;
  type: "sparing" | "event" | "tournament";
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
  const [onlyMine, setOnlyMine] = useState(false);
  const [view, setView] = useState<"calendar" | "list">("calendar");
  const [todayOnly, setTodayOnly] = useState(false);

  const { data: session } = useSession();
  const { data: clubProfile } = api.club.me.useQuery(undefined, {
    staleTime: Infinity,
    enabled: session?.user?.role === "CLUB",
  });

  const dateFrom = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const dateTo = `${year}-${String(month + 1).padStart(2, "0")}-${getDaysInMonth(year, month)}`;

  const sparingQuery = {
    dateFrom,
    dateTo,
    limit: 50,
    sortBy: "matchDate" as const,
    sortOrder: "asc" as const,
    ...(onlyMine && clubProfile?.id ? { clubId: clubProfile.id } : {}),
  };
  const eventQuery = {
    dateFrom,
    dateTo,
    limit: 50,
    sortBy: "eventDate" as const,
    sortOrder: "asc" as const,
    ...(onlyMine && clubProfile?.id ? { clubId: clubProfile.id } : {}),
  };

  const { data: sparingsData, isLoading: sparingsLoading } = api.sparing.list.useQuery(sparingQuery);
  const { data: eventsData, isLoading: eventsLoading } = api.event.list.useQuery(eventQuery);
  const { data: tournamentsData, isLoading: tournamentsLoading } = api.tournament.list.useQuery({
    status: "IN_PROGRESS",
    limit: 50,
  });

  const loading = sparingsLoading || eventsLoading || tournamentsLoading;

  const items = useMemo<CalendarItem[]>(() => {
    const sparings = (sparingsData?.items ?? []).map((s: any) => ({
      id: s.id,
      type: "sparing" as const,
      title: s.title,
      date: s.matchDate,
      clubName: s.club?.name ?? "",
    }));
    const events = (eventsData?.items ?? []).map((e: any) => ({
      id: e.id,
      type: "event" as const,
      title: e.title,
      date: e.eventDate,
      clubName: e.club?.name ?? "",
      eventType: e.type,
    }));
    const tournaments = (tournamentsData?.items ?? [])
      .filter((t: any) => t.startDate)
      .map((t: any) => ({
        id: t.id,
        type: "tournament" as const,
        title: t.title,
        date: t.startDate,
        clubName: t.creator?.club?.name ?? "Organizator",
      }));
    return [...sparings, ...events, ...tournaments];
  }, [sparingsData, eventsData, tournamentsData]);

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

  const listItems = useMemo(() => {
    const filtered = todayOnly
      ? items.filter((item) => {
          const d = new Date(item.date);
          return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
        })
      : items;
    return filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [items, todayOnly]);

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfWeek(year, month);
  const today = now.getDate();
  const isCurrentMonth = now.getFullYear() === year && now.getMonth() === month;

  const prev = () => {
    setTodayOnly(false);
    if (month === 0) { setMonth(11); setYear(year - 1); }
    else setMonth(month - 1);
  };
  const next = () => {
    setTodayOnly(false);
    if (month === 11) { setMonth(0); setYear(year + 1); }
    else setMonth(month + 1);
  };
  const goToday = () => {
    const alreadyCurrent = year === now.getFullYear() && month === now.getMonth();
    setYear(now.getFullYear());
    setMonth(now.getMonth());
    if (alreadyCurrent) {
      setTodayOnly((v) => !v);
    } else {
      setTodayOnly(true);
    }
    if (view === "calendar") setView("list");
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={prev}>&larr;</Button>
          <h2 className="text-lg font-semibold min-w-[180px] text-center">
            {MONTH_NAMES[month]} {year}
          </h2>
          <Button variant="outline" size="sm" onClick={next}>&rarr;</Button>
        </div>
        <div className="flex items-center gap-3">
          {session?.user?.role === "CLUB" && (
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={onlyMine}
                onChange={(e) => setOnlyMine(e.target.checked)}
                className="rounded border-input"
              />
              Tylko moje
            </label>
          )}
          <div className="flex gap-1">
            <Button
              variant={view === "calendar" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setView("calendar")}
            >
              Siatka
            </Button>
            <Button
              variant={view === "list" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setView("list")}
            >
              Lista
            </Button>
          </div>
          <Button variant={todayOnly ? "secondary" : "ghost"} size="sm" onClick={goToday}>Dziś</Button>
        </div>
      </div>

      {view === "list" ? (
        <div className="space-y-2">
          {listItems.length === 0 && !loading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {todayOnly ? "Brak wydarzeń na dziś." : "Brak sparingów, wydarzeń i turniejów w tym miesiącu."}
            </p>
          ) : (
            listItems.map((item) => (
                <Link
                  key={item.id}
                  href={item.type === "sparing" ? `/sparings/${item.id}` : item.type === "tournament" ? `/tournaments/${item.id}` : `/events/${item.id}`}
                  className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                >
                  <div className={`h-2 w-2 rounded-full shrink-0 ${
                    item.type === "sparing" ? "bg-emerald-500" : item.type === "tournament" ? "bg-orange-500" : "bg-violet-500"
                  }`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{item.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.clubName} · {new Date(item.date).toLocaleDateString("pl-PL", { day: "numeric", month: "short" })}
                    </p>
                  </div>
                </Link>
              ))
          )}
        </div>
      ) : (
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
                      href={item.type === "sparing" ? `/sparings/${item.id}` : item.type === "tournament" ? `/tournaments/${item.id}` : `/events/${item.id}`}
                      className={`block truncate rounded px-1 py-0.5 text-[10px] leading-tight font-medium ${
                        item.type === "sparing"
                          ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
                          : item.type === "tournament"
                            ? "bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300"
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
      )}

      {loading && (
        <p className="mt-3 text-sm text-muted-foreground text-center">Ładowanie...</p>
      )}

      {!loading && items.length === 0 && (
        <p className="mt-3 text-sm text-muted-foreground text-center">
          Brak sparingów, wydarzeń i turniejów w tym miesiącu.
        </p>
      )}
    </div>
  );
}
