"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { updateSparingSchema } from "@/lib/validators/sparing";
import { getFieldErrors, type FieldErrors } from "@/lib/form-errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DetailPageSkeleton } from "@/components/card-skeleton";

export default function EditSparingPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [regions, setRegions] = useState<{ id: number; name: string }[]>([]);
  const [sparing, setSparing] = useState<any>(null);

  useEffect(() => {
    trpc.region.list.query().then(setRegions);
    trpc.sparing.getById.query({ id }).then(setSparing);
  }, [id]);

  if (!sparing) return <DetailPageSkeleton />;

  const matchDateLocal = new Date(sparing.matchDate).toISOString().slice(0, 16);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFieldErrors({});
    setLoading(true);

    const fd = new FormData(e.currentTarget);
    const data = {
      id,
      title: fd.get("title") as string,
      description: (fd.get("description") as string) || undefined,
      matchDate: fd.get("matchDate") as string,
      location: (fd.get("location") as string) || undefined,
      costSplitInfo: (fd.get("costSplitInfo") as string) || undefined,
      regionId: fd.get("regionId") ? Number(fd.get("regionId")) : undefined,
    };

    const validation = updateSparingSchema.safeParse(data);
    if (!validation.success) {
      setFieldErrors(getFieldErrors(validation.error));
      setLoading(false);
      return;
    }

    try {
      await trpc.sparing.update.mutate(data);
      toast.success("Sparing zaktualizowany");
      router.push(`/sparings/${id}`);
    } catch (err: any) {
      toast.error(err.message || "Nie udało się zaktualizować sparingu");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <CardTitle>Edytuj sparing</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Tytuł ogłoszenia</Label>
            <Input
              id="title"
              name="title"
              required
              defaultValue={sparing.title}
              className={fieldErrors.title ? "border-destructive" : ""}
            />
            {fieldErrors.title && (
              <p className="text-xs text-destructive">{fieldErrors.title}</p>
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
                defaultValue={matchDateLocal}
                className={fieldErrors.matchDate ? "border-destructive" : ""}
              />
              {fieldErrors.matchDate && (
                <p className="text-xs text-destructive">{fieldErrors.matchDate}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Miejsce</Label>
              <Input id="location" name="location" defaultValue={sparing.location || ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="regionId">Region</Label>
              <select
                id="regionId"
                name="regionId"
                defaultValue={sparing.regionId || ""}
                className="flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm"
              >
                <option value="">Wybierz region</option>
                {regions.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="costSplitInfo">Podział kosztów</Label>
              <Input id="costSplitInfo" name="costSplitInfo" defaultValue={sparing.costSplitInfo || ""} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Opis</Label>
            <textarea
              id="description"
              name="description"
              rows={4}
              className="flex w-full rounded-md border bg-transparent px-3 py-2 text-sm"
              defaultValue={sparing.description || ""}
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
  );
}
