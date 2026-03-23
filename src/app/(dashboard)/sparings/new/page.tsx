"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { createSparingSchema } from "@/lib/validators/sparing";
import { getFieldErrors, type FieldErrors } from "@/lib/form-errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormTooltip } from "@/components/form-tooltip";

export default function NewSparingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [regions, setRegions] = useState<{ id: number; name: string }[]>([]);

  useEffect(() => {
    trpc.region.list.query().then(setRegions);
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFieldErrors({});
    setLoading(true);

    const fd = new FormData(e.currentTarget);
    const data = {
      title: fd.get("title") as string,
      description: (fd.get("description") as string) || undefined,
      matchDate: fd.get("matchDate") as string,
      location: (fd.get("location") as string) || undefined,
      costSplitInfo: (fd.get("costSplitInfo") as string) || undefined,
      regionId: fd.get("regionId") ? Number(fd.get("regionId")) : undefined,
    };

    const validation = createSparingSchema.safeParse(data);
    if (!validation.success) {
      setFieldErrors(getFieldErrors(validation.error));
      setLoading(false);
      return;
    }

    try {
      const result = await trpc.sparing.create.mutate(data);
      toast.success("Sparing utworzony");
      router.push(`/sparings/${result.id}`);
    } catch (err: any) {
      toast.error(err.message || "Nie udało się utworzyć sparingu");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <CardTitle>Nowy sparing</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Tytuł ogłoszenia</Label>
            <Input
              id="title"
              name="title"
              required
              placeholder="np. Szukamy sparingpartnera na sobotę"
              className={fieldErrors.title ? "border-red-500" : ""}
            />
            {fieldErrors.title && (
              <p className="text-xs text-red-600">{fieldErrors.title}</p>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="matchDate">Data i godzina meczu</Label>
              <Input
                id="matchDate"
                name="matchDate"
                type="datetime-local"
                required
                className={fieldErrors.matchDate ? "border-red-500" : ""}
              />
              {fieldErrors.matchDate && (
                <p className="text-xs text-red-600">{fieldErrors.matchDate}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Miejsce</Label>
              <Input id="location" name="location" placeholder="np. Orlik ul. Sportowa 5, Poznań" />
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
              <Label htmlFor="costSplitInfo" className="inline-flex items-center gap-1.5">
                Podział kosztów
                <FormTooltip text="Opisz jak chcesz podzielić koszty meczu — np. sędzia, wynajem boiska, szatnie." />
              </Label>
              <Input id="costSplitInfo" name="costSplitInfo" placeholder="np. 50/50 sędzia + boisko" />
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
            <Button type="submit" disabled={loading}>
              {loading ? "Tworzenie..." : "Utwórz sparing"}
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
