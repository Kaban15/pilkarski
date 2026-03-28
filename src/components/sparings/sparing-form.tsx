"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/trpc-react";
import {
  createSparingSchema,
  updateSparingSchema,
  SPARING_LEVELS,
  AGE_CATEGORIES,
  type SparingLevel,
  type AgeCategory,
} from "@/lib/validators/sparing";
import { SPARING_LEVEL_LABELS, AGE_CATEGORY_LABELS } from "@/lib/labels";
import { getFieldErrors, type FieldErrors } from "@/lib/form-errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormTooltip } from "@/components/form-tooltip";
import {
  ChevronRight,
  ChevronLeft,
  Check,
  FileText,
  Calendar,
  MapPin,
  Zap,
  ArrowRight,
  Banknote,
} from "lucide-react";

type SparingFormProps = {
  mode: "create" | "edit";
  defaultValues?: {
    id?: string;
    title?: string;
    description?: string | null;
    matchDate?: string;
    location?: string | null;
    level?: string | null;
    ageCategory?: string | null;
    preferredTime?: string | null;
    regionId?: number | null;
    costPerTeam?: number | null;
  };
  onSuccess?: (id: string) => void;
};

type FormData = {
  title: string;
  description: string;
  matchDate: string;
  location: string;
  preferredTime: string;
  level: string;
  ageCategory: string;
  regionId: string;
  costPerTeam: string;
};

const STEPS = [
  { label: "Dane sparingu", icon: FileText },
  { label: "Termin i miejsce", icon: Calendar },
  { label: "Podsumowanie", icon: Check },
];

export function SparingForm({ mode, defaultValues, onSuccess }: SparingFormProps) {
  const router = useRouter();
  const isEdit = mode === "edit";
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [step, setStep] = useState(0);

  // Quick mode state
  const [quickMode, setQuickMode] = useState(false);
  const [quickDate, setQuickDate] = useState("");
  const [quickLocation, setQuickLocation] = useState("");
  const [quickCreatePending, setQuickCreatePending] = useState(false);

  const { data: regions = [] } = api.region.list.useQuery();
  const { data: clubProfile } = api.club.me.useQuery(undefined, {
    staleTime: Infinity,
    enabled: !isEdit,
  });
  const createMutation = api.sparing.create.useMutation();
  const updateMutation = api.sparing.update.useMutation();

  const matchDateLocal = defaultValues?.matchDate
    ? new Date(defaultValues.matchDate).toISOString().slice(0, 16)
    : "";

  const [form, setForm] = useState<FormData>({
    title: defaultValues?.title ?? "",
    description: defaultValues?.description ?? "",
    matchDate: matchDateLocal,
    location: defaultValues?.location ?? "",
    preferredTime: defaultValues?.preferredTime ?? "",
    level: defaultValues?.level ?? "",
    ageCategory: defaultValues?.ageCategory ?? "",
    regionId: defaultValues?.regionId ? String(defaultValues.regionId) : "",
    costPerTeam: defaultValues?.costPerTeam ? String(defaultValues.costPerTeam) : "",
  });

  function updateField(field: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function buildPayload() {
    return {
      ...(mode === "edit" && defaultValues?.id ? { id: defaultValues.id } : {}),
      title: form.title,
      description: form.description || undefined,
      matchDate: form.matchDate,
      location: form.location || undefined,
      level: (form.level || undefined) as SparingLevel | undefined,
      ageCategory: (form.ageCategory || undefined) as AgeCategory | undefined,
      preferredTime: form.preferredTime || undefined,
      regionId: form.regionId ? Number(form.regionId) : undefined,
      costPerTeam: form.costPerTeam ? Number(form.costPerTeam) : undefined,
    };
  }

  function validateStep(s: number): boolean {
    setFieldErrors({});
    if (s === 0) {
      if (!form.title || form.title.length < 3) {
        setFieldErrors({ title: "Tytuł musi mieć min. 3 znaki" });
        return false;
      }
    }
    if (s === 1) {
      if (!form.matchDate) {
        setFieldErrors({ matchDate: "Data meczu jest wymagana" });
        return false;
      }
      const d = Date.parse(form.matchDate);
      if (isNaN(d) || (mode === "create" && d <= Date.now())) {
        setFieldErrors({ matchDate: "Data meczu musi być w przyszłości" });
        return false;
      }
    }
    return true;
  }

  function handleNext() {
    if (!validateStep(step)) return;
    setStep((s) => Math.min(s + 1, 2));
  }

  function handleBack() {
    setStep((s) => Math.max(s - 1, 0));
  }

  async function handleSubmit() {
    setFieldErrors({});
    setLoading(true);

    const data = buildPayload();
    const schema = mode === "edit" ? updateSparingSchema : createSparingSchema;
    const validation = schema.safeParse(data);
    if (!validation.success) {
      setFieldErrors(getFieldErrors(validation.error));
      // Go back to the step with the error
      const errorKeys = Object.keys(getFieldErrors(validation.error));
      if (errorKeys.some((k) => ["title", "level", "ageCategory", "regionId"].includes(k))) setStep(0);
      else if (errorKeys.some((k) => ["matchDate", "location", "preferredTime"].includes(k))) setStep(1);
      setLoading(false);
      return;
    }

    try {
      if (mode === "edit") {
        await updateMutation.mutateAsync(data as Parameters<typeof updateMutation.mutateAsync>[0]);
        toast.success("Sparing zaktualizowany");
        onSuccess?.(defaultValues!.id!);
      } else {
        const result = await createMutation.mutateAsync(data);
        toast.success("Sparing utworzony!");
        onSuccess?.(result.id);
      }
    } catch (err: any) {
      toast.error(err.message || "Nie udało się zapisać sparingu");
    } finally {
      setLoading(false);
    }
  }

  async function handleQuickCreate() {
    if (!quickDate) return;
    setQuickCreatePending(true);

    const date = new Date(quickDate);
    const title = `Sparing ${date.toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric" })}`;

    const data = {
      title,
      matchDate: quickDate,
      location: quickLocation || undefined,
      regionId: clubProfile?.regionId ?? undefined,
    };

    const validation = createSparingSchema.safeParse(data);
    if (!validation.success) {
      const errors = getFieldErrors(validation.error);
      toast.error(Object.values(errors).join(", ") || "Sprawdź formularz");
      setQuickCreatePending(false);
      return;
    }

    try {
      const result = await createMutation.mutateAsync(data);
      toast.success("Sparing utworzony!");
      onSuccess?.(result.id);
    } catch (err: any) {
      toast.error(err.message || "Nie udało się utworzyć sparingu");
    } finally {
      setQuickCreatePending(false);
    }
  }

  // Edit mode — flat form (no wizard)
  if (mode === "edit") {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
        className="space-y-4"
      >
        <StepOneFields form={form} updateField={updateField} fieldErrors={fieldErrors} regions={regions} />
        <StepTwoFields form={form} updateField={updateField} fieldErrors={fieldErrors} />
        <div className="space-y-2">
          <Label htmlFor="description">Opis</Label>
          <Textarea
            id="description"
            value={form.description}
            onChange={(e) => updateField("description", e.target.value)}
            rows={4}
            placeholder="Dodatkowe informacje..."
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
    );
  }

  // Create mode — wizard
  return (
    <div className="space-y-6">
      {/* Mode toggle */}
      <div className="mb-6 flex gap-2">
        <Button
          type="button"
          variant={!quickMode ? "secondary" : "ghost"}
          size="sm"
          onClick={() => setQuickMode(false)}
        >
          Pełny formularz
        </Button>
        <Button
          type="button"
          variant={quickMode ? "secondary" : "ghost"}
          size="sm"
          className="gap-1.5"
          onClick={() => setQuickMode(true)}
        >
          <Zap className="h-3.5 w-3.5" />
          Szybki sparing
        </Button>
      </div>

      {/* Quick mode form */}
      {quickMode && (
        <Card>
          <CardContent className="py-6">
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-1">
                <Zap className="h-4 w-4 text-amber-500" />
                <p className="text-sm font-semibold">Szybki sparing</p>
              </div>
              <p className="text-xs text-muted-foreground">
                Tytuł wygenerujemy automatycznie. Podaj tylko termin i miejsce.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Data i godzina <span className="text-destructive">*</span></Label>
                <Input
                  type="datetime-local"
                  value={quickDate}
                  onChange={(e) => setQuickDate(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Miejsce</Label>
                <Input
                  value={quickLocation}
                  onChange={(e) => setQuickLocation(e.target.value)}
                  placeholder="np. Stadion Miejski, ul. Sportowa 1"
                />
              </div>
            </div>
            <Button
              className="mt-4 w-full gap-2"
              onClick={handleQuickCreate}
              disabled={!quickDate || quickCreatePending}
            >
              {quickCreatePending ? "Tworzenie..." : "Opublikuj sparing"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Stepper */}
      {!quickMode && (
        <>
          <div className="flex items-center justify-between">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const isActive = i === step;
              const isDone = i < step;
              return (
                <div key={i} className="flex flex-1 items-center">
                  <div className="flex flex-col items-center gap-1.5">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${
                        isActive
                          ? "border-primary bg-primary text-primary-foreground"
                          : isDone
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-muted-foreground/30 text-muted-foreground"
                      }`}
                    >
                      {isDone ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                    </div>
                    <span
                      className={`text-xs font-medium ${
                        isActive ? "text-primary" : isDone ? "text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {s.label}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div
                      className={`mx-2 h-0.5 flex-1 rounded transition-colors ${
                        isDone ? "bg-primary" : "bg-muted-foreground/20"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Step content */}
          <div className="animate-fade-in">
            {step === 0 && (
              <StepOneFields form={form} updateField={updateField} fieldErrors={fieldErrors} regions={regions} />
            )}
            {step === 1 && (
              <StepTwoFields form={form} updateField={updateField} fieldErrors={fieldErrors} />
            )}
            {step === 2 && (
              <StepThreeSummary form={form} regions={regions} updateField={updateField} />
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between border-t pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={step === 0 ? () => router.back() : handleBack}
              className="gap-1.5"
            >
              <ChevronLeft className="h-4 w-4" />
              {step === 0 ? "Anuluj" : "Wstecz"}
            </Button>
            {step < 2 ? (
              <Button type="button" onClick={handleNext} className="gap-1.5">
                Dalej
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={loading} className="gap-1.5">
                {loading ? "Tworzenie..." : "Opublikuj sparing"}
                <Check className="h-4 w-4" />
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ============================================================
// Step 1: Dane sparingu
// ============================================================

function StepOneFields({
  form,
  updateField,
  fieldErrors,
  regions,
}: {
  form: FormData;
  updateField: (f: keyof FormData, v: string) => void;
  fieldErrors: FieldErrors;
  regions: { id: number; name: string }[];
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Tytuł ogłoszenia *</Label>
        <Input
          id="title"
          value={form.title}
          onChange={(e) => updateField("title", e.target.value)}
          placeholder="np. Szukamy sparingpartnera na sobotę"
          className={fieldErrors.title ? "border-destructive" : ""}
        />
        {fieldErrors.title && (
          <p className="text-xs text-destructive">{fieldErrors.title}</p>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Region</Label>
          <Select value={form.regionId} onValueChange={(v) => updateField("regionId", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Wybierz region" />
            </SelectTrigger>
            <SelectContent>
              {regions.map((r) => (
                <SelectItem key={r.id} value={String(r.id)}>
                  {r.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Poziom</Label>
          <Select value={form.level} onValueChange={(v) => updateField("level", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Wybierz poziom" />
            </SelectTrigger>
            <SelectContent>
              {SPARING_LEVELS.map((l) => (
                <SelectItem key={l} value={l}>
                  {SPARING_LEVEL_LABELS[l]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Kategoria wiekowa</Label>
          <Select value={form.ageCategory} onValueChange={(v) => updateField("ageCategory", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Wybierz kategorię" />
            </SelectTrigger>
            <SelectContent>
              {AGE_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {AGE_CATEGORY_LABELS[c]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Step 2: Termin i lokalizacja
// ============================================================

function StepTwoFields({
  form,
  updateField,
  fieldErrors,
}: {
  form: FormData;
  updateField: (f: keyof FormData, v: string) => void;
  fieldErrors: FieldErrors;
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="matchDate">Data i godzina meczu *</Label>
          <Input
            id="matchDate"
            type="datetime-local"
            value={form.matchDate}
            onChange={(e) => updateField("matchDate", e.target.value)}
            className={fieldErrors.matchDate ? "border-destructive" : ""}
          />
          {fieldErrors.matchDate && (
            <p className="text-xs text-destructive">{fieldErrors.matchDate}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="location">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" />
              Miejsce
            </span>
          </Label>
          <Input
            id="location"
            value={form.location}
            onChange={(e) => updateField("location", e.target.value)}
            placeholder="np. Orlik ul. Sportowa 5, Poznań"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="preferredTime" className="inline-flex items-center gap-1.5">
            Preferowane godziny
            <FormTooltip text="Np. poranki, wieczory, weekendy — jeśli data nie jest jeszcze ustalona." />
          </Label>
          <Input
            id="preferredTime"
            value={form.preferredTime}
            onChange={(e) => updateField("preferredTime", e.target.value)}
            placeholder="np. weekendy 10:00-14:00"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="costPerTeam" className="inline-flex items-center gap-1.5">
            <Banknote className="h-3.5 w-3.5" />
            Koszt na drużynę (PLN)
          </Label>
          <Input
            id="costPerTeam"
            type="number"
            min={0}
            value={form.costPerTeam}
            onChange={(e) => updateField("costPerTeam", e.target.value)}
            placeholder="0 = darmowy"
          />
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Step 3: Podsumowanie
// ============================================================

function StepThreeSummary({
  form,
  regions,
  updateField,
}: {
  form: FormData;
  regions: { id: number; name: string }[];
  updateField: (f: keyof FormData, v: string) => void;
}) {
  const regionName = regions.find((r) => String(r.id) === form.regionId)?.name;
  const dateFormatted = form.matchDate
    ? new Date(form.matchDate).toLocaleString("pl-PL", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="space-y-3 py-4">
          <SummaryRow label="Tytuł" value={form.title} />
          <SummaryRow label="Data meczu" value={dateFormatted} />
          {form.location && <SummaryRow label="Miejsce" value={form.location} />}
          {regionName && <SummaryRow label="Region" value={regionName} />}
          {form.level && <SummaryRow label="Poziom" value={SPARING_LEVEL_LABELS[form.level] ?? form.level} />}
          {form.ageCategory && <SummaryRow label="Kategoria wiekowa" value={AGE_CATEGORY_LABELS[form.ageCategory] ?? form.ageCategory} />}
          {form.preferredTime && <SummaryRow label="Preferowane godziny" value={form.preferredTime} />}
          {form.costPerTeam && Number(form.costPerTeam) > 0 && <SummaryRow label="Koszt na drużynę" value={`${form.costPerTeam} PLN`} />}
        </CardContent>
      </Card>

      <div className="space-y-2">
        <Label htmlFor="description">Opis (opcjonalny)</Label>
        <Textarea
          id="description"
          value={form.description}
          onChange={(e) => updateField("description", e.target.value)}
          rows={4}
          placeholder="Dodatkowe informacje o sparingu..."
        />
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-right">{value}</span>
    </div>
  );
}
