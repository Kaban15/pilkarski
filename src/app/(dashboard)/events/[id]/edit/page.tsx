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
import { useI18n } from "@/lib/i18n";
import {
  EVENT_TYPE_LABELS,
  POSITION_LABELS,
  SPARING_LEVEL_LABELS,
} from "@/lib/labels";

const RECRUITMENT_TYPES: EventTypeValue[] = ["RECRUITMENT", "TRYOUT", "CAMP", "CONTINUOUS_RECRUITMENT"];

export default function EditEventPage() {
  const { t } = useI18n();
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const { data: regions = [] } = api.region.list.useQuery();
  const { data: event } = api.event.getById.useQuery({ id }, { enabled: !!id });

  const [selectedType, setSelectedType] = useState<EventTypeValue | null>(null);
  const [visibility, setVisibility] = useState<string | null>(null);

  const updateMut = api.event.update.useMutation({
    onSuccess: () => {
      toast.success(t("Wydarzenie zaktualizowane"));
      router.push(`/events/${id}`);
    },
    onError: (err) => {
      toast.error(err.message || t("Nie udało się zaktualizować wydarzenia"));
    },
  });

  if (!event) return <DetailPageSkeleton />;

  const eventDateLocal = new Date(event.eventDate).toISOString().slice(0, 16);
  const currentType = selectedType ?? (event.type as EventTypeValue);
  const isRecruitment = RECRUITMENT_TYPES.includes(currentType);

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
          { label: t("Wydarzenia"), href: "/events" },
          { label: event.title, href: `/events/${id}` },
          { label: t("Edycja") },
        ]}
      />
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <CardTitle>{t("Edytuj wydarzenie")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type">{t("Typ wydarzenia")}</Label>
            <select
              id="type"
              name="type"
              required
              value={currentType}
              onChange={(e) => setSelectedType(e.target.value as EventTypeValue)}
              className="flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm"
            >
              {Object.entries(EVENT_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{t(label)}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">{t("Widoczność")}</label>
            <select
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={visibility ?? (event.visibility ?? "PUBLIC")}
              onChange={(e) => setVisibility(e.target.value)}
            >
              <option value="PUBLIC">{t("Publiczne")}</option>
              <option value="INTERNAL">{t("Tylko dla klubu")}</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">{t("Tytuł")}</Label>
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
              <Label htmlFor="eventDate">{t("Data i godzina")}</Label>
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
              <Label htmlFor="location">{t("Miejsce")}</Label>
              <Input id="location" name="location" defaultValue={event.location || ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="regionId">{t("Region")}</Label>
              <select
                id="regionId"
                name="regionId"
                defaultValue={event.regionId || ""}
                className="flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm"
              >
                <option value="">{t("Wybierz region")}</option>
                {regions.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxParticipants">{t("Maks. uczestników")}</Label>
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
              <h3 className="text-sm font-semibold">{t("Szczegóły rekrutacyjne")}</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="targetPosition">{t("Szukana pozycja")}</Label>
                  <select
                    id="targetPosition"
                    name="targetPosition"
                    defaultValue={event.targetPosition || ""}
                    className="flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm"
                  >
                    <option value="">{t("Dowolna")}</option>
                    {Object.entries(POSITION_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{t(label)}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="targetLevel">{t("Wymagany poziom")}</Label>
                  <select
                    id="targetLevel"
                    name="targetLevel"
                    defaultValue={event.targetLevel || ""}
                    className="flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm"
                  >
                    <option value="">{t("Dowolny")}</option>
                    {Object.entries(SPARING_LEVEL_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{t(label)}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="targetAgeMin">{t("Wiek od")}</Label>
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
                  <Label htmlFor="targetAgeMax">{t("Wiek do")}</Label>
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

          <div className="space-y-2">
            <Label htmlFor="description">{t("Opis")}</Label>
            <Textarea
              id="description"
              name="description"
              rows={4}
              defaultValue={event.description || ""}
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={updateMut.isPending}>
              {updateMut.isPending ? t("Zapisywanie...") : t("Zapisz zmiany")}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              {t("Anuluj")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
    </div>
  );
}
