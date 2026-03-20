"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type EventItem = {
  id: string;
  type: string;
  title: string;
  eventDate: string;
  location: string | null;
  maxParticipants: number | null;
  club: { id: string; name: string; city: string | null };
  region: { name: string } | null;
  _count: { applications: number };
};

const TYPE_LABELS: Record<string, string> = {
  OPEN_TRAINING: "Trening otwarty",
  RECRUITMENT: "Nabór",
};

const TYPE_COLORS: Record<string, string> = {
  OPEN_TRAINING: "bg-green-50 text-green-700",
  RECRUITMENT: "bg-purple-50 text-purple-700",
};

export default function EventsPage() {
  const [items, setItems] = useState<EventItem[]>([]);
  const [regionId, setRegionId] = useState<number | undefined>();
  const [type, setType] = useState<"OPEN_TRAINING" | "RECRUITMENT" | undefined>();
  const [regions, setRegions] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    trpc.region.list.query().then(setRegions);
  }, []);

  useEffect(() => {
    setLoading(true);
    trpc.event.list
      .query({ regionId, type })
      .then((res) => setItems(res.items as any))
      .finally(() => setLoading(false));
  }, [regionId, type]);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Wydarzenia</h1>
        <Link href="/events/new">
          <Button>Dodaj wydarzenie</Button>
        </Link>
      </div>

      <div className="mb-4 flex gap-3">
        <select
          value={regionId ?? ""}
          onChange={(e) => setRegionId(e.target.value ? Number(e.target.value) : undefined)}
          className="rounded-md border bg-transparent px-3 py-1.5 text-sm"
        >
          <option value="">Wszystkie regiony</option>
          {regions.map((r) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
        <select
          value={type ?? ""}
          onChange={(e) => setType((e.target.value || undefined) as any)}
          className="rounded-md border bg-transparent px-3 py-1.5 text-sm"
        >
          <option value="">Wszystkie typy</option>
          <option value="OPEN_TRAINING">Treningi otwarte</option>
          <option value="RECRUITMENT">Nabory</option>
        </select>
      </div>

      {loading ? (
        <p className="text-gray-500">Ładowanie...</p>
      ) : items.length === 0 ? (
        <p className="text-gray-500">Brak wydarzeń.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((ev) => (
            <Link key={ev.id} href={`/events/${ev.id}`}>
              <Card className="transition hover:shadow-md">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{ev.title}</CardTitle>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_COLORS[ev.type]}`}>
                      {TYPE_LABELS[ev.type]}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-1 text-sm text-gray-600">
                  <p><strong>{ev.club.name}</strong>{ev.club.city && ` · ${ev.club.city}`}</p>
                  <p>{formatDate(ev.eventDate)}</p>
                  {ev.location && <p>{ev.location}</p>}
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs text-gray-400">{ev.region?.name}</span>
                    <span className="text-xs text-gray-500">
                      {ev._count.applications} zgłoszeń
                      {ev.maxParticipants && ` / ${ev.maxParticipants} miejsc`}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
