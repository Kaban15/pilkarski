"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { api } from "@/lib/trpc-react";
import { createEventSchema, type EventTypeValue } from "@/lib/validators/event";
import { getFieldErrors, type FieldErrors } from "@/lib/form-errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  EVENT_TYPE_LABELS,
  POSITION_LABELS,
  SPARING_LEVEL_LABELS,
} from "@/lib/labels";
import { TRAINING_PRESETS, type TrainingPreset } from "@/lib/training-presets";
import { Zap, MapPin, Plus } from "lucide-react";
import Link from "next/link";

const RECRUITMENT_TYPES: EventTypeValue[] = ["RECRUITMENT", "TRYOUT", "CAMP", "CONTINUOUS_RECRUITMENT"];

export default function NewEventPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [selectedType, setSelectedType] = useState<EventTypeValue>("OPEN_TRAINING");
  const [visibility, setVisibility] = useState("PUBLIC");
  const [location, setLocation] = useState("");
  const [showCustomLocation, setShowCustomLocation] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const role = session?.user?.role;
  const isCoach = role === "COACH";
  const isPlayer = role === "PLAYER";

  const { data: myClub, isLoading: clubLoading } = api.clubMembership.myClub.useQuery(undefined, {
    enabled: isCoach,
  });

  const { data: recentLocations = [] } = api.event.recentLocations.useQuery(undefined, {
    staleTime: Infinity,
  });

  // Auto-set last location on load
  const [autoSet, setAutoSet] = useState(false);
  if (!autoSet && recentLocations.length > 0 && !location) {
    setLocation(recentLocations[0]);
    setAutoSet(true);
  }

  // PLAYER cannot create events
  if (isPlayer) {
    return (
      <div className="mx-auto max-w-2xl py-8 text-center">
        <p className="text-muted-foreground">Tylko kluby i trenerzy z uprawnieniami mogą tworzyć wydarzenia.</p>
        <Button asChild className="mt-4" variant="outline">
          <Link href="/events">Przeglądaj wydarzenia</Link>
        </Button>
      </div>
    );
  }

  // COACH must have club membership with canManageEvents
  if (isCoach && !clubLoading && (!myClub || !myClub.canManageEvents)) {
    return (
      <div className="mx-auto max-w-2xl py-8 text-center">
        <p className="text-lg font-semibold">Brak uprawnień</p>
        <p className="mt-2 text-sm text-muted-foreground">
          {!myClub
            ? "Musisz najpierw dołączyć do klubu, aby tworzyć treningi i wydarzenia."
            : "Twój klub nie nadał Ci jeszcze uprawnień do zarządzania wydarzeniami. Skontaktuj się z klubem."}
        </p>
        <Button asChild className="mt-4" variant="outline">
          <Link href={!myClub ? "/search" : "/events"}>{!myClub ? "Szukaj klubu" : "Przeglądaj wydarzenia"}</Link>
        </Button>
      </div>
    );
  }

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
      location: location || undefined,
      visibility,
    };

    if (isRecruitment) {
      const pos = fd.get("targetPosition") as string;
      const level = fd.get("targetLevel") as string;
      if (pos) data.targetPosition = pos;
      if (level) data.targetLevel = level;
      if (fd.get("targetAgeMin")) data.targetAgeMin = Number(fd.get("targetAgeMin"));
      if (fd.get("targetAgeMax")) data.targetAgeMax = Number(fd.get("targetAgeMax"));
    }

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
              {Object.entries(EVENT_TYPE_LABELS)
                .filter(([value]) => !isCoach || value === "INDIVIDUAL_TRAINING" || value === "GROUP_TRAINING")
                .map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">Widoczność</label>
            <select
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={visibility}
              onChange={(e) => setVisibility(e.target.value)}
            >
              <option value="PUBLIC">Publiczne</option>
              <option value="INTERNAL">Tylko dla klubu</option>
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

            {/* Location picker */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                Miejsce
              </Label>

              {!showCustomLocation && recentLocations.length > 0 ? (
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-1.5">
                    {recentLocations.map((loc) => (
                      <button
                        key={loc}
                        type="button"
                        onClick={() => setLocation(loc)}
                        className={`rounded-lg border px-3 py-1.5 text-[12px] font-medium transition ${
                          location === loc
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                        }`}
                      >
                        {loc}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCustomLocation(true);
                      setLocation("");
                    }}
                    className="flex items-center gap-1.5 text-[12px] font-medium text-primary hover:underline"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Inna lokalizacja
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="np. Stadion Miejski, Kraków"
                    autoFocus={showCustomLocation}
                  />
                  {showCustomLocation && recentLocations.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowCustomLocation(false);
                        setLocation(recentLocations[0]);
                      }}
                      className="text-[12px] font-medium text-muted-foreground hover:text-foreground"
                    >
                      Wybierz z zapisanych
                    </button>
                  )}
                </div>
              )}
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
