"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DetailPageSkeleton } from "@/components/card-skeleton";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { POSITION_LABELS } from "@/lib/labels";
import { getFieldErrors } from "@/lib/form-errors";
import { updateTransferSchema } from "@/lib/validators/transfer";
import { ArrowRightLeft } from "lucide-react";

export default function EditTransferPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [regions, setRegions] = useState<any[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loaded, setLoaded] = useState(false);

  const [form, setForm] = useState({
    type: "",
    title: "",
    description: "",
    position: "",
    regionId: "",
    minAge: "",
    maxAge: "",
  });

  useEffect(() => {
    trpc.region.list.query().then(setRegions);
    trpc.transfer.getById.query({ id }).then((t) => {
      setForm({
        type: t.type,
        title: t.title,
        description: t.description ?? "",
        position: t.position ?? "",
        regionId: t.regionId?.toString() ?? "",
        minAge: t.minAge?.toString() ?? "",
        maxAge: t.maxAge?.toString() ?? "",
      });
      setLoaded(true);
    });
  }, [id]);

  function updateField(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    const data = {
      id,
      type: form.type as any,
      title: form.title,
      description: form.description || undefined,
      position: form.position as any || undefined,
      regionId: form.regionId ? Number(form.regionId) : undefined,
      minAge: form.minAge ? Number(form.minAge) : undefined,
      maxAge: form.maxAge ? Number(form.maxAge) : undefined,
    };

    const parsed = updateTransferSchema.safeParse(data);
    if (!parsed.success) {
      setErrors(getFieldErrors(parsed.error));
      return;
    }

    setSubmitting(true);
    try {
      await trpc.transfer.update.mutate(data);
      toast.success("Ogłoszenie zaktualizowane");
      router.push(`/transfers/${id}`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (!loaded) return <DetailPageSkeleton />;

  return (
    <div className="animate-fade-in">
      <Breadcrumbs
        items={[
          { label: "Transfery", href: "/transfers" },
          { label: form.title, href: `/transfers/${id}` },
          { label: "Edycja" },
        ]}
      />

      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5 text-cyan-500" />
            Edytuj ogłoszenie
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Tytuł *</Label>
              <Input
                value={form.title}
                onChange={(e) => updateField("title", e.target.value)}
                className={`mt-1.5 ${errors.title ? "border-destructive" : ""}`}
              />
              {errors.title && <p className="mt-1 text-xs text-destructive">{errors.title}</p>}
            </div>

            <div>
              <Label>Opis</Label>
              <Textarea
                value={form.description}
                onChange={(e) => updateField("description", e.target.value)}
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
                    min={10} max={60}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label>Wiek do</Label>
                  <Input
                    type="number"
                    value={form.maxAge}
                    onChange={(e) => updateField("maxAge", e.target.value)}
                    min={10} max={60}
                    className="mt-1.5"
                  />
                </div>
              </div>
            )}

            <Button type="submit" disabled={submitting} className="w-full gap-1.5">
              <ArrowRightLeft className="h-4 w-4" />
              {submitting ? "Zapisywanie..." : "Zapisz zmiany"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
