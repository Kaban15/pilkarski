"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function NewEventPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [regions, setRegions] = useState<{ id: number; name: string }[]>([]);

  useEffect(() => {
    trpc.region.list.query().then(setRegions);
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const fd = new FormData(e.currentTarget);

    try {
      const result = await trpc.event.create.mutate({
        type: fd.get("type") as "OPEN_TRAINING" | "RECRUITMENT",
        title: fd.get("title") as string,
        description: (fd.get("description") as string) || undefined,
        eventDate: fd.get("eventDate") as string,
        location: (fd.get("location") as string) || undefined,
        maxParticipants: fd.get("maxParticipants") ? Number(fd.get("maxParticipants")) : undefined,
        regionId: fd.get("regionId") ? Number(fd.get("regionId")) : undefined,
      });
      router.push(`/events/${result.id}`);
    } catch (err: any) {
      setError(err.message || "Nie udało się utworzyć wydarzenia");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <CardTitle>Nowe wydarzenie</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type">Typ wydarzenia</Label>
            <select
              id="type"
              name="type"
              required
              className="flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm"
            >
              <option value="OPEN_TRAINING">Trening otwarty</option>
              <option value="RECRUITMENT">Nabór</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Tytuł</Label>
            <Input id="title" name="title" required placeholder="np. Nabór do drużyny seniorów" />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="eventDate">Data i godzina</Label>
              <Input id="eventDate" name="eventDate" type="datetime-local" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Miejsce</Label>
              <Input id="location" name="location" placeholder="np. Stadion Miejski, Kraków" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="regionId">Region</Label>
              <select
                id="regionId"
                name="regionId"
                className="flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm"
              >
                <option value="">Wybierz region</option>
                {regions.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxParticipants">Maks. uczestników</Label>
              <Input id="maxParticipants" name="maxParticipants" type="number" min={1} placeholder="np. 30" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Opis</Label>
            <textarea
              id="description"
              name="description"
              rows={4}
              className="flex w-full rounded-md border bg-transparent px-3 py-2 text-sm"
              placeholder="Dodatkowe informacje..."
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-2">
            <Button type="submit" disabled={loading}>
              {loading ? "Tworzenie..." : "Utwórz wydarzenie"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Anuluj
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
