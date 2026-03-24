"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { api } from "@/lib/trpc-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ImageUpload } from "@/components/image-upload";

interface LeagueGroup {
  id: number;
  name: string;
}

interface LeagueLevel {
  id: number;
  name: string;
  tier: number;
  groups: LeagueGroup[];
}

interface ClubProfileFormProps {
  club: {
    id: string;
    name: string;
    logoUrl: string | null;
    description: string | null;
    city: string | null;
    regionId: number | null;
    leagueGroupId: number | null;
    leagueGroup: { id: number; leagueLevel: { id: number } } | null;
    contactEmail: string | null;
    contactPhone: string | null;
    website: string | null;
  };
  regions: { id: number; name: string }[];
}

export function ClubProfileForm({ club, regions }: ClubProfileFormProps) {
  const [logoUrl, setLogoUrl] = useState<string | null>(club.logoUrl);

  // Cascading state
  const [regionId, setRegionId] = useState<number | null>(club.regionId);
  const [leagueLevelId, setLeagueLevelId] = useState<number | null>(
    club.leagueGroup?.leagueLevel.id ?? null
  );
  const [leagueGroupId, setLeagueGroupId] = useState<number | null>(club.leagueGroupId);

  const { data: hierarchy = [] } = api.region.hierarchy.useQuery(
    { regionId: regionId! },
    { enabled: !!regionId }
  );

  // Reset cascading fields when region changes
  useEffect(() => {
    if (!regionId) {
      setLeagueLevelId(null);
      setLeagueGroupId(null);
    }
  }, [regionId]);

  const selectedLevel = hierarchy.find((l) => l.id === leagueLevelId);

  const updateMut = api.club.update.useMutation({
    onSuccess: () => toast.success("Profil klubu zapisany"),
    onError: (err) => toast.error(err.message || "Nie udało się zapisać"),
  });

  const profileFields = [
    { key: "regionId", label: "Region", filled: !!club.regionId },
    { key: "city", label: "Miasto", filled: !!club.city },
    { key: "logoUrl", label: "Logo", filled: !!club.logoUrl },
    { key: "description", label: "Opis", filled: !!club.description },
    { key: "contactEmail", label: "E-mail kontaktowy", filled: !!club.contactEmail },
    { key: "leagueGroupId", label: "Liga", filled: !!club.leagueGroupId },
  ];
  const filledCount = profileFields.filter((f) => f.filled).length;
  const progress = Math.round((filledCount / profileFields.length) * 100);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    updateMut.mutate({
      name: fd.get("name") as string,
      logoUrl: logoUrl ?? undefined,
      description: (fd.get("description") as string) || undefined,
      city: (fd.get("city") as string) || undefined,
      regionId: regionId ?? undefined,
      leagueGroupId: leagueGroupId ?? undefined,
      contactEmail: (fd.get("contactEmail") as string) || undefined,
      contactPhone: (fd.get("contactPhone") as string) || undefined,
      website: (fd.get("website") as string) || undefined,
    });
  }

  return (
    <>
      {progress < 100 && (
        <Card className="mb-6 border-primary/20">
          <CardContent className="py-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-medium">
                Profil uzupełniony w {progress}%
              </p>
              <p className="text-xs text-muted-foreground">
                {filledCount} z {profileFields.length}
              </p>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {profileFields
                .filter((f) => !f.filled)
                .map((f) => (
                  <span
                    key={f.key}
                    className="inline-flex items-center rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-950 dark:text-amber-400"
                  >
                    {f.label}
                  </span>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
      <Card>
      <CardHeader>
        <CardTitle>Profil klubu</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <ImageUpload
            currentUrl={logoUrl}
            folder="clubs"
            entityId={club.id}
            onUploaded={setLogoUrl}
          />
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nazwa klubu</Label>
              <Input id="name" name="name" defaultValue={club.name} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">Miasto</Label>
              <Input id="city" name="city" defaultValue={club.city ?? ""} />
            </div>

            {/* Region */}
            <div className="space-y-2">
              <Label>Region (ZPN)</Label>
              <p className="text-[11px] text-muted-foreground">
                Feed i sparingi filtrują po regionie
              </p>
              <select
                value={regionId ?? ""}
                onChange={(e) => {
                  const val = e.target.value ? Number(e.target.value) : null;
                  setRegionId(val);
                  setLeagueLevelId(null);
                  setLeagueGroupId(null);
                }}
                className="flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Wybierz region</option>
                {regions.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>

            {/* League Level */}
            <div className="space-y-2">
              <Label>Szczebel ligowy</Label>
              <select
                value={leagueLevelId ?? ""}
                onChange={(e) => {
                  const val = e.target.value ? Number(e.target.value) : null;
                  setLeagueLevelId(val);
                  setLeagueGroupId(null);
                }}
                disabled={!regionId || hierarchy.length === 0}
                className="flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Wybierz szczebel</option>
                {hierarchy.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>

            {/* League Group */}
            <div className="space-y-2">
              <Label>Grupa</Label>
              <select
                value={leagueGroupId ?? ""}
                onChange={(e) =>
                  setLeagueGroupId(e.target.value ? Number(e.target.value) : null)
                }
                disabled={!selectedLevel}
                className="flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Wybierz grupę</option>
                {selectedLevel?.groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
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
            <Textarea
              id="description"
              name="description"
              defaultValue={club.description ?? ""}
              rows={4}
            />
          </div>

          <Button type="submit" disabled={updateMut.isPending}>
            {updateMut.isPending ? "Zapisywanie..." : "Zapisz profil"}
          </Button>
        </form>
      </CardContent>
    </Card>
    </>
  );
}
