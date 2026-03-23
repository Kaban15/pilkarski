"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { trpc } from "@/lib/trpc";
import { formatDate } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { CardSkeleton } from "@/components/card-skeleton";
import type { MapMarker } from "@/components/map-view";
import { MapPin, Swords, Trophy } from "lucide-react";

const MapView = dynamic(() => import("@/components/map-view").then((m) => m.MapView), {
  ssr: false,
  loading: () => <div className="h-[500px] animate-pulse rounded-lg bg-muted" />,
});

export default function MapPage() {
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSparings, setShowSparings] = useState(true);
  const [showEvents, setShowEvents] = useState(true);

  useEffect(() => {
    async function load() {
      const [sparings, events] = await Promise.all([
        trpc.sparing.list.query({ limit: 50, status: "OPEN" }),
        trpc.event.list.query({ limit: 50 }),
      ]);

      const sparingMarkers: MapMarker[] = sparings.items
        .filter((s: any) => s.lat && s.lng)
        .map((s: any) => ({
          id: s.id,
          lat: Number(s.lat),
          lng: Number(s.lng),
          title: s.title,
          type: "sparing" as const,
          location: s.location,
          date: formatDate(s.matchDate),
          href: `/sparings/${s.id}`,
        }));

      const eventMarkers: MapMarker[] = events.items
        .filter((e: any) => e.lat && e.lng)
        .map((e: any) => ({
          id: e.id,
          lat: Number(e.lat),
          lng: Number(e.lng),
          title: e.title,
          type: "event" as const,
          location: e.location,
          date: formatDate(e.eventDate),
          href: `/events/${e.id}`,
        }));

      setMarkers([...sparingMarkers, ...eventMarkers]);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = markers.filter((m) =>
    (m.type === "sparing" && showSparings) || (m.type === "event" && showEvents)
  );

  const sparingCount = markers.filter((m) => m.type === "sparing").length;
  const eventCount = markers.filter((m) => m.type === "event").length;

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Mapa</h1>
        <p className="mt-1 text-muted-foreground">Sparingi i wydarzenia na mapie Polski</p>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-2">
        <button
          onClick={() => setShowSparings(!showSparings)}
          className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition ${
            showSparings
              ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
              : "border-input bg-background text-muted-foreground"
          }`}
        >
          <Swords className="h-3.5 w-3.5" />
          Sparingi ({sparingCount})
        </button>
        <button
          onClick={() => setShowEvents(!showEvents)}
          className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition ${
            showEvents
              ? "border-violet-500/50 bg-violet-500/10 text-violet-700 dark:text-violet-300"
              : "border-input bg-background text-muted-foreground"
          }`}
        >
          <Trophy className="h-3.5 w-3.5" />
          Wydarzenia ({eventCount})
        </button>
      </div>

      {loading ? (
        <div className="h-[500px] animate-pulse rounded-lg bg-muted" />
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12">
            <MapPin className="h-10 w-10 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              Brak ogłoszeń z lokalizacją na mapie.
            </p>
            <p className="text-xs text-muted-foreground">
              Sparingi i wydarzenia pojawią się tutaj gdy będą miały ustawione współrzędne.
            </p>
          </CardContent>
        </Card>
      ) : (
        <MapView markers={filtered} />
      )}
    </div>
  );
}
