"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { api } from "@/lib/trpc-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { POSITION_LABELS, SPARING_LEVEL_LABELS } from "@/lib/labels";
import { useI18n } from "@/lib/i18n";
import { getFieldErrors } from "@/lib/form-errors";
import { createTransferSchema, type TransferType, type TransferPosition } from "@/lib/validators/transfer";
import { ArrowRightLeft } from "lucide-react";

export default function NewTransferPage() {
  const { t } = useI18n();
  const router = useRouter();
  const { data: session } = useSession();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    type: "" as string,
    title: "",
    description: "",
    position: "",
    regionId: "",
    minAge: "",
    maxAge: "",
    availableFrom: "",
    preferredLevel: "",
  });

  const { data: regions = [] } = api.region.list.useQuery();

  const createMut = api.transfer.create.useMutation({
    onSuccess: (result) => {
      toast.success(t("Ogłoszenie transferowe utworzone"));
      router.push(`/transfers/${result.id}`);
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const isClub = session?.user?.role === "CLUB";
  const isPlayer = session?.user?.role === "PLAYER";

  // Filter types based on role
  const typeOptions = [
    ...(isPlayer ? [
      { value: "LOOKING_FOR_CLUB", label: t("Szukam klubu") },
      { value: "FREE_AGENT", label: t("Wolny agent") },
    ] : []),
    ...(isClub ? [
      { value: "LOOKING_FOR_PLAYER", label: t("Szukam zawodnika") },
    ] : []),
  ];

  function updateField(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    const data = {
      type: form.type as TransferType,
      title: form.title,
      description: form.description || undefined,
      position: (form.position || undefined) as TransferPosition | undefined,
      regionId: form.regionId ? Number(form.regionId) : undefined,
      minAge: form.minAge ? Number(form.minAge) : undefined,
      maxAge: form.maxAge ? Number(form.maxAge) : undefined,
      availableFrom: form.availableFrom || undefined,
      preferredLevel: (form.preferredLevel || undefined) as "YOUTH" | "AMATEUR" | "SEMI_PRO" | "PRO" | undefined,
    };

    const parsed = createTransferSchema.safeParse(data);
    if (!parsed.success) {
      setErrors(getFieldErrors(parsed.error));
      return;
    }

    createMut.mutate(data);
  }

  return (
    <div className="animate-fade-in">
      <Breadcrumbs
        items={[
          { label: t("Transfery"), href: "/transfers" },
          { label: t("Nowe ogłoszenie") },
        ]}
      />

      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5 text-cyan-500" />
            {t("Nowe ogłoszenie transferowe")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>{t("Typ ogłoszenia")} *</Label>
              <select
                value={form.type}
                onChange={(e) => updateField("type", e.target.value)}
                className="mt-1.5 h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
              >
                <option value="">{t("Wybierz typ")}</option>
                {typeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              {errors.type && <p className="mt-1 text-xs text-destructive">{errors.type}</p>}
            </div>

            <div>
              <Label>{t("Tytuł")} *</Label>
              <Input
                value={form.title}
                onChange={(e) => updateField("title", e.target.value)}
                placeholder={t("np. Doświadczony napastnik szuka klubu w Wielkopolsce")}
                className={`mt-1.5 ${errors.title ? "border-destructive" : ""}`}
              />
              {errors.title && <p className="mt-1 text-xs text-destructive">{errors.title}</p>}
            </div>

            <div>
              <Label>{t("Opis")}</Label>
              <Textarea
                value={form.description}
                onChange={(e) => updateField("description", e.target.value)}
                placeholder={t("Dodatkowe informacje — doświadczenie, oczekiwania, preferencje...")}
                rows={4}
                className="mt-1.5"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>{t("Pozycja")}</Label>
                <select
                  value={form.position}
                  onChange={(e) => updateField("position", e.target.value)}
                  className="mt-1.5 h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
                >
                  <option value="">{t("Dowolna")}</option>
                  {Object.entries(POSITION_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{t(label)}</option>
                  ))}
                </select>
              </div>

              <div>
                <Label>{t("Region")}</Label>
                <select
                  value={form.regionId}
                  onChange={(e) => updateField("regionId", e.target.value)}
                  className="mt-1.5 h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
                >
                  <option value="">{t("Cała Polska")}</option>
                  {regions.map((r: any) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {(form.type === "LOOKING_FOR_CLUB" || form.type === "FREE_AGENT") && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>{t("Dostępny od")}</Label>
                  <Input
                    type="date"
                    value={form.availableFrom}
                    onChange={(e) => updateField("availableFrom", e.target.value)}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label>{t("Preferowany poziom")}</Label>
                  <select
                    value={form.preferredLevel}
                    onChange={(e) => updateField("preferredLevel", e.target.value)}
                    className="mt-1.5 h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
                  >
                    <option value="">{t("Dowolny")}</option>
                    {Object.entries(SPARING_LEVEL_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{t(label)}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {form.type === "LOOKING_FOR_PLAYER" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>{t("Wiek od")}</Label>
                  <Input
                    type="number"
                    value={form.minAge}
                    onChange={(e) => updateField("minAge", e.target.value)}
                    placeholder={t("np. 18")}
                    min={10}
                    max={60}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label>{t("Wiek do")}</Label>
                  <Input
                    type="number"
                    value={form.maxAge}
                    onChange={(e) => updateField("maxAge", e.target.value)}
                    placeholder={t("np. 30")}
                    min={10}
                    max={60}
                    className="mt-1.5"
                  />
                </div>
              </div>
            )}

            <Button type="submit" disabled={createMut.isPending} className="w-full gap-1.5">
              <ArrowRightLeft className="h-4 w-4" />
              {createMut.isPending ? t("Tworzenie...") : t("Utwórz ogłoszenie")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
