"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ClubProfileFormProps {
  club: {
    id: string;
    name: string;
    description: string | null;
    city: string | null;
    regionId: number | null;
    contactEmail: string | null;
    contactPhone: string | null;
    website: string | null;
  };
  regions: { id: number; name: string }[];
}

export function ClubProfileForm({ club, regions }: ClubProfileFormProps) {
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    setError("");

    const fd = new FormData(e.currentTarget);

    try {
      await trpc.club.update.mutate({
        name: fd.get("name") as string,
        description: (fd.get("description") as string) || undefined,
        city: (fd.get("city") as string) || undefined,
        regionId: fd.get("regionId") ? Number(fd.get("regionId")) : undefined,
        contactEmail: (fd.get("contactEmail") as string) || undefined,
        contactPhone: (fd.get("contactPhone") as string) || undefined,
        website: (fd.get("website") as string) || undefined,
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Nie udało się zapisać");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profil klubu</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nazwa klubu</Label>
              <Input id="name" name="name" defaultValue={club.name} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">Miasto</Label>
              <Input id="city" name="city" defaultValue={club.city ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="regionId">Region (ZPN)</Label>
              <select
                id="regionId"
                name="regionId"
                defaultValue={club.regionId ?? ""}
                className="flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm"
              >
                <option value="">Wybierz region</option>
                {regions.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactEmail">E-mail kontaktowy</Label>
              <Input
                id="contactEmail"
                name="contactEmail"
                type="email"
                defaultValue={club.contactEmail ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactPhone">Telefon</Label>
              <Input
                id="contactPhone"
                name="contactPhone"
                defaultValue={club.contactPhone ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Strona www</Label>
              <Input
                id="website"
                name="website"
                defaultValue={club.website ?? ""}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Opis</Label>
            <textarea
              id="description"
              name="description"
              defaultValue={club.description ?? ""}
              rows={4}
              className="flex w-full rounded-md border bg-transparent px-3 py-2 text-sm"
            />
          </div>

          {success && <p className="text-sm text-green-600">Zapisano!</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button type="submit" disabled={saving}>
            {saving ? "Zapisywanie..." : "Zapisz profil"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
