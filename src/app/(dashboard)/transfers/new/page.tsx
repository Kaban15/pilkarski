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
import { POSITION_LABELS } from "@/lib/labels";
import { getFieldErrors } from "@/lib/form-errors";
import { createTransferSchema } from "@/lib/validators/transfer";
import { ArrowRightLeft } from "lucide-react";

export default function NewTransferPage() {
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
  });

  const { data: regions = [] } = api.region.list.useQuery();

  const createMut = api.transfer.create.useMutation({
    onSuccess: (result) => {
      toast.success("Ogłoszenie transferowe utworzone");
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
      { value: "LOOKING_FOR_CLUB", label: "Szukam klubu" },
      { value: "FREE_AGENT", label: "Wolny agent" },
    ] : []),
    ...(isClub ? [
      { value: "LOOKING_FOR_PLAYER", label: "Szukam zawodnika" },
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
      type: form.type as any,
      title: form.title,
      description: form.description || undefined,
      position: form.position as any || undefined,
      regionId: form.regionId ? Number(form.regionId) : undefined,
      minAge: form.minAge ? Number(form.minAge) : undefined,
      maxAge: form.maxAge ? Number(form.maxAge) : undefined,
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
          { label: "Transfery", href: "/transfers" },
          { label: "Nowe ogłoszenie" },
        ]}
      />

      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5 text-cyan-500" />
            Nowe ogłoszenie transferowe
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Typ ogłoszenia *</Label>
              <select
                value={form.type}
                onChange={(e) => updateField("type", e.target.value)}
                className="mt-1.5 h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
              >
                <option value="">Wybierz typ</option>
                {typeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              {errors.type && <p className="mt-1 text-xs text-destructive">{errors.type}</p>}
            </div>

            <div>
              <Label>Tytuł *</Label>
              <Input
                value={form.title}
                onChange={(e) => updateField("title", e.target.value)}
                placeholder="np. Doświadczony napastnik szuka klubu w Wielkopolsce"
                className={`mt-1.5 ${errors.title ? "border-destructive" : ""}`}
              />
              {errors.title && <p className="mt-1 text-xs text-destructive">{errors.title}</p>}
            </div>

            <div>
              <Label>Opis</Label>
              <Textarea
                value={form.description}
                onChange={(e) => updateField("description", e.target.value)}
                placeholder="Dodatkowe informacje — doświadczenie, oczekiwania, preferencje..."
                rows={4}
                className="mt-1.5"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Pozycja</Label>
                <select
                  value={form.position}
                  onChange={(e) => updateField("position", e.target.value)}
                  className="mt-1.5 h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
                >
                  <option value="">Dowolna</option>
                  {Object.entries(POSITION_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <Label>Region</Label>
                <select
                  value={form.regionId}
                  onChange={(e) => updateField("regionId", e.target.value)}
                  className="mt-1.5 h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
                >
                  <option value="">Cała Polska</option>
                  {regions.map((r: any) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {form.type === "LOOKING_FOR_PLAYER" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Wiek od</Label>
                  <Input
                    type="number"
                    value={form.minAge}
                    onChange={(e) => updateField("minAge", e.target.value)}
                    placeholder="np. 18"
                    min={10}
                    max={60}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label>Wiek do</Label>
                  <Input
                    type="number"
                    value={form.maxAge}
                    onChange={(e) => updateField("maxAge", e.target.value)}
                    placeholder="np. 30"
                    min={10}
                    max={60}
                    className="mt-1.5"
                  />
                </div>
              </div>
            )}

            <Button type="submit" disabled={createMut.isPending} className="w-full gap-1.5">
              <ArrowRightLeft className="h-4 w-4" />
              {createMut.isPending ? "Tworzenie..." : "Utwórz ogłoszenie"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
