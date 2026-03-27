"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/trpc-react";
import { updateEventSchema, type EventTypeValue } from "@/lib/validators/event";
import { getFieldErrors, type FieldErrors } from "@/lib/form-errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DetailPageSkeleton } from "@/components/card-skeleton";
import { Breadcrumbs } from "@/components/breadcrumbs";
import {
  EVENT_TYPE_LABELS,
  POSITION_LABELS,
  SPARING_LEVEL_LABELS,
} from "@/lib/labels";

const RECRUITMENT_TYPES: EventTypeValue[] = ["RECRUITMENT", "TRYOUT", "CAMP", "CONTINUOUS_RECRUITMENT"];

export default function EditEventPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const { data: regions = [] } = api.region.list.useQuery();
  const { data: event } = api.event.getById.useQuery({ id }, { enabled: !!id });

  const [selectedType, setSelectedType] = useState<EventTypeValue | null>(null);
  const [visibility, setVisibility] = useState<string | null>(null);

  const updateMut = api.event.update.useMutation({
    onSuccess: () => {
      toast.success("Wydarzenie zaktualizowane");
      router.push(`/events/${id}`);
    },
    onError: (err) => {
      toast.error(err.message || "Nie udało się zaktualizować wydarzenia");
    },
  });

  if (!event) return <DetailPageSkeleton />;

  const eventDateLocal = new Date(event.eventDate).toISOString().slice(0, 16);
  const currentType = selectedType ?? (event.type as EventTypeValue);
  const isRecruitment = RECRUITMENT_TYPES.includes(currentType);
  const isTraining = currentType === "INDIVIDUAL_TRAINING" || currentType === "GROUP_TRAINING";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFieldErrors({});

    const fd = new FormData(e.currentTarget);
    const currentVisibility = visibility ?? (event?.visibility ?? "PUBLIC");
    const data: Record<string, unknown> = {
      id,
      type: currentType,
      title: fd.get("title") as string,
      description: (fd.get("description") as string) || undefined,
      eventDate: fd.get("eventDate") as string,
      location: (fd.get("location") as string) || undefined,
      maxParticipants: fd.get("maxParticipants") ? Number(fd.get("maxParticipants")) : undefined,
      regionId: fd.get("regionId") ? Number(fd.get("regionId")) : undefined,
      visibility: currentVisibility,
    };

    if (isRecruitment) {
      const pos = fd.get("targetPosition") as string;
      const level = fd.get("targetLevel") as string;
      if (pos) data.targetPosition = pos;
      if (level) data.targetLevel = level;
      if (fd.get("targetAgeMin")) data.targetAgeMin = Number(fd.get("targetAgeMin"));
      if (fd.get("targetAgeMax")) data.targetAgeMax = Number(fd.get("targetAgeMax"));
    }

    const price = fd.get("priceInfo") as string;
    if (price) data.priceInfo = price;

    const validation = updateEventSchema.safeParse(data);
    if (!validation.success) {
      setFieldErrors(getFieldErrors(validation.error));
      return;
    }

    updateMut.mutate(validation.data);
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
              value={currentType}
              onChange={(e) => setSelectedType(e.target.value as EventTypeValue)}
              className="flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm"
            >
              {Object.entries(EVENT_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">Widoczność</label>
            <select
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={visibility ?? (event.visibility ?? "PUBLIC")}
              onChange={(e) => setVisibility(e.target.value)}
            >
              <option value="PUBLIC">Publiczne</option>
              <option value="INTERNAL">Tylko dla klubu</option>
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

          {isRecruitment && (
            <div className="space-y-4 rounded-lg border border-primary/20 bg-primary/5 p-4">
              <h3 className="text-sm font-semibold">Szczegóły rekrutacyjne</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="targetPosition">Szukana pozycja</Label>
                  <select
                    id="targetPosition"
                    name="targetPosition"
                    defaultValue={event.targetPosition || ""}
                    className="flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm"
                  >
                    <option value="">Dowolna</option>
                    {Object.entries(POSITION_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="targetLevel">Wymagany poziom</Label>
                  <select
                    id="targetLevel"
                    name="targetLevel"
                    defaultValue={event.targetLevel || ""}
                    className="flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm"
                  >
                    <option value="">Dowolny</option>
                    {Object.entries(SPARING_LEVEL_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="targetAgeMin">Wiek od</Label>
                  <Input
                    id="targetAgeMin"
                    name="targetAgeMin"
                    type="number"
                    min={5}
                    max={60}
                    defaultValue={event.targetAgeMin || ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="targetAgeMax">Wiek do</Label>
                  <Input
                    id="targetAgeMax"
                    name="targetAgeMax"
                    type="number"
                    min={5}
                    max={60}
                    defaultValue={event.targetAgeMax || ""}
                  />
                </div>
              </div>
            </div>
          )}

          {isTraining && (
            <div className="space-y-2 rounded-lg border border-indigo-500/20 bg-indigo-500/5 p-4">
              <Label htmlFor="priceInfo">Cena</Label>
              <Input
                id="priceInfo"
                name="priceInfo"
                placeholder="np. 120 zł/h, 200 zł za sesję"
                maxLength={200}
                defaultValue={event.priceInfo || ""}
              />
            </div>
          )}

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
            <Button type="submit" disabled={updateMut.isPending}>
              {updateMut.isPending ? "Zapisywanie..." : "Zapisz zmiany"}
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
