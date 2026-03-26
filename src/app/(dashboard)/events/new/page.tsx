"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/trpc-react";
import { createEventSchema, type EventTypeValue } from "@/lib/validators/event";
import { getFieldErrors, type FieldErrors } from "@/lib/form-errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormTooltip } from "@/components/form-tooltip";
import {
  EVENT_TYPE_LABELS,
  POSITION_LABELS,
  SPARING_LEVEL_LABELS,
} from "@/lib/labels";
import { TRAINING_PRESETS, type TrainingPreset } from "@/lib/training-presets";
import { Zap } from "lucide-react";

const RECRUITMENT_TYPES: EventTypeValue[] = ["RECRUITMENT", "TRYOUT", "CAMP", "CONTINUOUS_RECRUITMENT"];

export default function NewEventPage() {
  const router = useRouter();
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [selectedType, setSelectedType] = useState<EventTypeValue>("OPEN_TRAINING");
  const formRef = useRef<HTMLFormElement>(null);

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

  const isRecruitment = RECRUITMENT_TYPES.includes(selectedType);
  const isTraining = selectedType === "INDIVIDUAL_TRAINING" || selectedType === "GROUP_TRAINING";

  function applyPreset(preset: TrainingPreset) {
    setSelectedType(preset.type);
    const form = formRef.current;
    if (!form) return;
    const setInput = (name: string, value: string) => {
      const el = form.elements.namedItem(name) as HTMLInputElement | HTMLTextAreaElement | null;
      if (el) {
        el.value = value;
        el.dispatchEvent(new Event("input", { bubbles: true }));
      }
    };
    setInput("title", preset.name);
    setInput("description", preset.description);
    if (preset.maxParticipants) setInput("maxParticipants", String(preset.maxParticipants));
    if (preset.priceInfo) setInput("priceInfo", preset.priceInfo);
    toast.success(`Szablon "${preset.name}" zastosowany`);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFieldErrors({});

    const fd = new FormData(e.currentTarget);
    const data: Record<string, unknown> = {
      type: selectedType,
      title: fd.get("title") as string,
      description: (fd.get("description") as string) || undefined,
      eventDate: fd.get("eventDate") as string,
      location: (fd.get("location") as string) || undefined,
      maxParticipants: fd.get("maxParticipants") ? Number(fd.get("maxParticipants")) : undefined,
      regionId: fd.get("regionId") ? Number(fd.get("regionId")) : undefined,
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

    const validation = createEventSchema.safeParse(data);
    if (!validation.success) {
      setFieldErrors(getFieldErrors(validation.error));
      return;
    }

    createMut.mutate(validation.data);
  }

  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <CardTitle>Nowe wydarzenie</CardTitle>
      </CardHeader>
      <CardContent>
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type">Typ wydarzenia</Label>
            <select
              id="type"
              name="type"
              required
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as EventTypeValue)}
              className="flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm"
            >
              {Object.entries(EVENT_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          {/* Training presets */}
          {isTraining && (
            <div className="rounded-lg border border-dashed border-primary/30 bg-primary/5 p-4">
              <div className="mb-3 flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                <p className="text-sm font-semibold">Wybierz szablon</p>
                <span className="text-[11px] text-muted-foreground">— pre-wypełni formularz</span>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {TRAINING_PRESETS.filter((p) => p.type === selectedType).map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => applyPreset(preset)}
                    className="rounded-md border border-border bg-card px-3 py-2 text-left text-[13px] transition hover:border-primary/40 hover:bg-primary/5"
                  >
                    <p className="font-medium">{preset.name}</p>
                    {preset.priceInfo && (
                      <p className="mt-0.5 text-[11px] text-muted-foreground">{preset.priceInfo}</p>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

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

          {isRecruitment && (
            <div className="space-y-4 rounded-lg border border-primary/20 bg-primary/5 p-4">
              <h3 className="text-sm font-semibold">Szczegóły rekrutacyjne</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="targetPosition">Szukana pozycja</Label>
                  <select
                    id="targetPosition"
                    name="targetPosition"
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
                  <Input id="targetAgeMin" name="targetAgeMin" type="number" min={5} max={60} placeholder="np. 16" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="targetAgeMax">Wiek do</Label>
                  <Input id="targetAgeMax" name="targetAgeMax" type="number" min={5} max={60} placeholder="np. 23" />
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
              />
            </div>
          )}

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
