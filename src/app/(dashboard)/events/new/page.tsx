"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/trpc-react";
import { createEventSchema } from "@/lib/validators/event";
import { getFieldErrors, type FieldErrors } from "@/lib/form-errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormTooltip } from "@/components/form-tooltip";
import { EVENT_TYPE_LABELS } from "@/lib/labels";

export default function NewEventPage() {
  const router = useRouter();
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const { data: regions = [] } = api.region.list.useQuery();

  const createMut = api.event.create.useMutation({
    onSuccess: (result) => {
      toast.success("Wydarzenie utworzone");
      router.push(`/events/${result.id}`);
    },
    onError: (err) => {
      toast.error(err.message || "Nie udało się utworzyć wydarzenia");
    },
  });

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFieldErrors({});

    const fd = new FormData(e.currentTarget);
    const data = {
      type: fd.get("type") as "OPEN_TRAINING" | "RECRUITMENT",
      title: fd.get("title") as string,
      description: (fd.get("description") as string) || undefined,
      eventDate: fd.get("eventDate") as string,
      location: (fd.get("location") as string) || undefined,
      maxParticipants: fd.get("maxParticipants") ? Number(fd.get("maxParticipants")) : undefined,
      regionId: fd.get("regionId") ? Number(fd.get("regionId")) : undefined,
    };

    const validation = createEventSchema.safeParse(data);
    if (!validation.success) {
      setFieldErrors(getFieldErrors(validation.error));
      return;
    }

    createMut.mutate(data);
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
              {Object.entries(EVENT_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Tytuł</Label>
            <Input
              id="title"
              name="title"
              required
              placeholder="np. Nabór do drużyny seniorów"
              className={fieldErrors.title ? "border-red-500" : ""}
            />
            {fieldErrors.title && (
              <p className="text-xs text-red-600">{fieldErrors.title}</p>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="eventDate">Data i godzina</Label>
              <Input
                id="eventDate"
                name="eventDate"
                type="datetime-local"
                required
                className={fieldErrors.eventDate ? "border-red-500" : ""}
              />
              {fieldErrors.eventDate && (
                <p className="text-xs text-red-600">{fieldErrors.eventDate}</p>
              )}
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
              <Label htmlFor="maxParticipants" className="inline-flex items-center gap-1.5">
                Maks. uczestników
                <FormTooltip text="Pozostaw puste, jeśli nie chcesz ograniczać liczby zgłoszeń." />
              </Label>
              <Input id="maxParticipants" name="maxParticipants" type="number" min={1} placeholder="np. 30" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Opis</Label>
            <Textarea
              id="description"
              name="description"
              rows={4}
              placeholder="Dodatkowe informacje..."
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={createMut.isPending}>
              {createMut.isPending ? "Tworzenie..." : "Utwórz wydarzenie"}
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
