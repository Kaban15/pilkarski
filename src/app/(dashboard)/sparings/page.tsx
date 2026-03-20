"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type SparingItem = {
  id: string;
  title: string;
  matchDate: string;
  location: string | null;
  status: string;
  club: { id: string; name: string; city: string | null };
  region: { name: string } | null;
  _count: { applications: number };
};

export default function SparingsPage() {
  const [items, setItems] = useState<SparingItem[]>([]);
  const [regionId, setRegionId] = useState<number | undefined>();
  const [regions, setRegions] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    trpc.region.list.query().then(setRegions);
  }, []);

  useEffect(() => {
    setLoading(true);
    trpc.sparing.list
      .query({ regionId, status: "OPEN" })
      .then((res) => setItems(res.items as any))
      .finally(() => setLoading(false));
  }, [regionId]);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Sparingi</h1>
        <Link href="/sparings/new">
          <Button>Dodaj sparing</Button>
        </Link>
      </div>

      <div className="mb-4">
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
      </div>

      {loading ? (
        <p className="text-gray-500">Ładowanie...</p>
      ) : items.length === 0 ? (
        <p className="text-gray-500">Brak sparingów w tym regionie.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((s) => (
            <Link key={s.id} href={`/sparings/${s.id}`}>
              <Card className="transition hover:shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{s.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 text-sm text-gray-600">
                  <p><strong>{s.club.name}</strong>{s.club.city && ` · ${s.club.city}`}</p>
                  <p>{formatDate(s.matchDate)}</p>
                  {s.location && <p>{s.location}</p>}
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs text-gray-400">{s.region?.name}</span>
                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                      {s._count.applications} {s._count.applications === 1 ? "zgłoszenie" : "zgłoszeń"}
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
