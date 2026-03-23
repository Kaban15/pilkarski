"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { createSparingSchema, updateSparingSchema } from "@/lib/validators/sparing";
import { getFieldErrors, type FieldErrors } from "@/lib/form-errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormTooltip } from "@/components/form-tooltip";

type SparingFormProps = {
  mode: "create" | "edit";
  defaultValues?: {
    id?: string;
    title?: string;
    description?: string | null;
    matchDate?: string;
    location?: string | null;
    costSplitInfo?: string | null;
    regionId?: number | null;
  };
  onSuccess?: (id: string) => void;
};

export function SparingForm({ mode, defaultValues, onSuccess }: SparingFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [regions, setRegions] = useState<{ id: number; name: string }[]>([]);
  const [regionId, setRegionId] = useState<string>(
    defaultValues?.regionId ? String(defaultValues.regionId) : ""
  );

  useEffect(() => {
    trpc.region.list.query().then(setRegions).catch(() => {});
  }, []);

  const matchDateLocal = defaultValues?.matchDate
    ? new Date(defaultValues.matchDate).toISOString().slice(0, 16)
    : "";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFieldErrors({});
    setLoading(true);

    const fd = new FormData(e.currentTarget);
    const data = {
      ...(mode === "edit" && defaultValues?.id ? { id: defaultValues.id } : {}),
      title: fd.get("title") as string,
      description: (fd.get("description") as string) || undefined,
      matchDate: fd.get("matchDate") as string,
      location: (fd.get("location") as string) || undefined,
      costSplitInfo: (fd.get("costSplitInfo") as string) || undefined,
      regionId: regionId ? Number(regionId) : undefined,
    };

    const schema = mode === "edit" ? updateSparingSchema : createSparingSchema;
    const validation = schema.safeParse(data);
    if (!validation.success) {
      setFieldErrors(getFieldErrors(validation.error));
      setLoading(false);
      return;
    }

    try {
      if (mode === "edit") {
        await trpc.sparing.update.mutate(data as any);
        toast.success("Sparing zaktualizowany");
        onSuccess?.(defaultValues!.id!);
      } else {
        const result = await trpc.sparing.create.mutate(data);
        toast.success("Sparing utworzony");
        onSuccess?.(result.id);
      }
    } catch (err: any) {
      toast.error(err.message || "Nie udało się zapisać sparingu");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Tytuł ogłoszenia</Label>
        <Input
          id="title"
          name="title"
          required
          defaultValue={defaultValues?.title ?? ""}
          placeholder="np. Szukamy sparingpartnera na sobotę"
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
          <Input
            id="location"
            name="location"
            defaultValue={defaultValues?.location ?? ""}
            placeholder="np. Orlik ul. Sportowa 5, Poznań"
          />
        </div>
        <div className="space-y-2">
          <Label>Region</Label>
          <Select value={regionId} onValueChange={setRegionId}>
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
          <Label htmlFor="costSplitInfo" className="inline-flex items-center gap-1.5">
            Podział kosztów
            <FormTooltip text="Opisz jak chcesz podzielić koszty meczu — np. sędzia, wynajem boiska, szatnie." />
          </Label>
          <Input
            id="costSplitInfo"
            name="costSplitInfo"
            defaultValue={defaultValues?.costSplitInfo ?? ""}
            placeholder="np. 50/50 sędzia + boisko"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Opis</Label>
        <Textarea
          id="description"
          name="description"
          rows={4}
          defaultValue={defaultValues?.description ?? ""}
          placeholder="Dodatkowe informacje..."
        />
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={loading}>
          {loading
            ? mode === "edit" ? "Zapisywanie..." : "Tworzenie..."
            : mode === "edit" ? "Zapisz zmiany" : "Utwórz sparing"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Anuluj
        </Button>
      </div>
    </form>
  );
}
