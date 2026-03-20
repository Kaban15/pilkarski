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

const POSITIONS = [
  { value: "GK", label: "Bramkarz" },
  { value: "CB", label: "Środkowy obrońca" },
  { value: "LB", label: "Lewy obrońca" },
  { value: "RB", label: "Prawy obrońca" },
  { value: "CDM", label: "Defensywny pomocnik" },
  { value: "CM", label: "Środkowy pomocnik" },
  { value: "CAM", label: "Ofensywny pomocnik" },
  { value: "LM", label: "Lewy pomocnik" },
  { value: "RM", label: "Prawy pomocnik" },
  { value: "LW", label: "Lewy skrzydłowy" },
  { value: "RW", label: "Prawy skrzydłowy" },
  { value: "ST", label: "Napastnik" },
] as const;

interface PlayerProfileFormProps {
  player: {
    id: string;
    firstName: string;
    lastName: string;
    dateOfBirth: Date | null;
    city: string | null;
    regionId: number | null;
    heightCm: number | null;
    weightKg: number | null;
    preferredFoot: string | null;
    primaryPosition: string | null;
    secondaryPosition: string | null;
    bio: string | null;
    careerEntries: { id: string; clubName: string; season: string; notes: string | null }[];
  };
  regions: { id: number; name: string }[];
}

export function PlayerProfileForm({ player, regions }: PlayerProfileFormProps) {
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [careers, setCareers] = useState(player.careerEntries);

  // Career entry form
  const [newClub, setNewClub] = useState("");
  const [newSeason, setNewSeason] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    setError("");

    const fd = new FormData(e.currentTarget);

    try {
      await trpc.player.update.mutate({
        firstName: fd.get("firstName") as string,
        lastName: fd.get("lastName") as string,
        dateOfBirth: (fd.get("dateOfBirth") as string) || undefined,
        city: (fd.get("city") as string) || undefined,
        regionId: fd.get("regionId") ? Number(fd.get("regionId")) : undefined,
        heightCm: fd.get("heightCm") ? Number(fd.get("heightCm")) : undefined,
        weightKg: fd.get("weightKg") ? Number(fd.get("weightKg")) : undefined,
        preferredFoot: (fd.get("preferredFoot") as any) || undefined,
        primaryPosition: (fd.get("primaryPosition") as any) || undefined,
        secondaryPosition: (fd.get("secondaryPosition") as any) || undefined,
        bio: (fd.get("bio") as string) || undefined,
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Nie udało się zapisać");
    } finally {
      setSaving(false);
    }
  }

  async function addCareer() {
    if (!newClub || !newSeason) return;
    try {
      const entry = await trpc.player.addCareer.mutate({
        clubName: newClub,
        season: newSeason,
      });
      setCareers([entry, ...careers]);
      setNewClub("");
      setNewSeason("");
    } catch {}
  }

  async function deleteCareer(id: string) {
    try {
      await trpc.player.deleteCareer.mutate({ id });
      setCareers(careers.filter((c) => c.id !== id));
    } catch {}
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profil zawodnika</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">Imię</Label>
                <Input id="firstName" name="firstName" defaultValue={player.firstName} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Nazwisko</Label>
                <Input id="lastName" name="lastName" defaultValue={player.lastName} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Data urodzenia</Label>
                <Input
                  id="dateOfBirth"
                  name="dateOfBirth"
                  type="date"
                  defaultValue={
                    player.dateOfBirth
                      ? new Date(player.dateOfBirth).toISOString().split("T")[0]
                      : ""
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">Miasto</Label>
                <Input id="city" name="city" defaultValue={player.city ?? ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="regionId">Region (ZPN)</Label>
                <select
                  id="regionId"
                  name="regionId"
                  defaultValue={player.regionId ?? ""}
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
                <Label htmlFor="heightCm">Wzrost (cm)</Label>
                <Input
                  id="heightCm"
                  name="heightCm"
                  type="number"
                  min={100}
                  max={250}
                  defaultValue={player.heightCm ?? ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weightKg">Waga (kg)</Label>
                <Input
                  id="weightKg"
                  name="weightKg"
                  type="number"
                  min={30}
                  max={200}
                  defaultValue={player.weightKg ?? ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="preferredFoot">Preferowana noga</Label>
                <select
                  id="preferredFoot"
                  name="preferredFoot"
                  defaultValue={player.preferredFoot ?? ""}
                  className="flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm"
                >
                  <option value="">Wybierz</option>
                  <option value="LEFT">Lewa</option>
                  <option value="RIGHT">Prawa</option>
                  <option value="BOTH">Obie</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="primaryPosition">Pozycja główna</Label>
                <select
                  id="primaryPosition"
                  name="primaryPosition"
                  defaultValue={player.primaryPosition ?? ""}
                  className="flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm"
                >
                  <option value="">Wybierz</option>
                  {POSITIONS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="secondaryPosition">Pozycja alternatywna</Label>
                <select
                  id="secondaryPosition"
                  name="secondaryPosition"
                  defaultValue={player.secondaryPosition ?? ""}
                  className="flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm"
                >
                  <option value="">Wybierz</option>
                  {POSITIONS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">O mnie</Label>
              <textarea
                id="bio"
                name="bio"
                defaultValue={player.bio ?? ""}
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

      <Card>
        <CardHeader>
          <CardTitle>Historia kariery</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex gap-2">
            <Input
              placeholder="Nazwa klubu"
              value={newClub}
              onChange={(e) => setNewClub(e.target.value)}
            />
            <Input
              placeholder="Sezon (np. 2024/2025)"
              value={newSeason}
              onChange={(e) => setNewSeason(e.target.value)}
              className="w-48"
            />
            <Button type="button" onClick={addCareer} variant="outline">
              Dodaj
            </Button>
          </div>
          {careers.length === 0 ? (
            <p className="text-sm text-gray-500">Brak wpisów</p>
          ) : (
            <ul className="space-y-2">
              {careers.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between rounded-md border px-3 py-2"
                >
                  <span>
                    <strong>{c.clubName}</strong>{" "}
                    <span className="text-gray-500">({c.season})</span>
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteCareer(c.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    Usuń
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
