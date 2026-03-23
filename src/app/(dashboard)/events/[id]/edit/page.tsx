"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { updateEventSchema } from "@/lib/validators/event";
import { getFieldErrors, type FieldErrors } from "@/lib/form-errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DetailPageSkeleton } from "@/components/card-skeleton";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { EVENT_TYPE_LABELS } from "@/lib/labels";

export default function EditEventPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [regions, setRegions] = useState<{ id: number; name: string }[]>([]);
  const [event, setEvent] = useState<any>(null);

  useEffect(() => {
    trpc.region.list.query().then(setRegions);
    trpc.event.getById.query({ id }).then(setEvent);
  }, [id]);

  if (!event) return <DetailPageSkeleton />;

  const eventDateLocal = new Date(event.eventDate).toISOString().slice(0, 16);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFieldErrors({});
    setLoading(true);

    const fd = new FormData(e.currentTarget);
    const data = {
      id,
      type: fd.get("type") as "OPEN_TRAINING" | "RECRUITMENT",
      title: fd.get("title") as string,
      description: (fd.get("description") as string) || undefined,
      eventDate: fd.get("eventDate") as string,
      location: (fd.get("location") as string) || undefined,
      maxParticipants: fd.get("maxParticipants") ? Number(fd.get("maxParticipants")) : undefined,
      regionId: fd.get("regionId") ? Number(fd.get("regionId")) : undefined,
    };

    const validation = updateEventSchema.safeParse(data);
    if (!validation.success) {
      setFieldErrors(getFieldErrors(validation.error));
      setLoading(false);
      return;
    }

    try {
      await trpc.event.update.mutate(data);
      toast.success("Wydarzenie zaktualizowane");
      router.push(`/events/${id}`);
    } catch (err: any) {
      toast.error(err.message || "Nie udało się zaktualizować wydarzenia");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "Wydarzenia", href: "/events" },
          { label: event.title, href: `/events/${id}` },
          { label: "Edycja" },
        ]}
      />
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <CardTitle>Edytuj wydarzenie</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type">Typ wydarzenia</Label>
            <select
              id="type"
              name="type"
              required
              defaultValue={event.type}
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
              defaultValue={event.title}
              className={fieldErrors.title ? "border-destructive" : ""}
            />
            {fieldErrors.title && (
              <p className="text-xs text-destructive">{fieldErrors.title}</p>
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
                defaultValue={eventDateLocal}
                className={fieldErrors.eventDate ? "border-destructive" : ""}
              />
              {fieldErrors.eventDate && (
                <p className="text-xs text-destructive">{fieldErrors.eventDate}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Miejsce</Label>
              <Input id="location" name="location" defaultValue={event.location || ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="regionId">Region</Label>
              <select
                id="regionId"
                name="regionId"
                defaultValue={event.regionId || ""}
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
              <Input
                id="maxParticipants"
                name="maxParticipants"
                type="number"
                min={1}
                defaultValue={event.maxParticipants || ""}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Opis</Label>
            <Textarea
              id="description"
              name="description"
              rows={4}
              defaultValue={event.description || ""}
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={loading}>
              {loading ? "Zapisywanie..." : "Zapisz zmiany"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Anuluj
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
    </div>
  );
}
