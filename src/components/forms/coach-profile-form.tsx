"use client";

import { useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageUpload } from "@/components/image-upload";
import { COACH_SPECIALIZATION_LABELS, COACH_LEVEL_LABELS } from "@/lib/labels";

interface CoachCareerEntry {
  id: string;
  clubName: string;
  season: string;
  role: string;
  level: string | null;
  notes: string | null;
}

interface CoachProfileFormProps {
  coach: {
    id: string;
    firstName: string;
    lastName: string;
    specialization: string | null;
    level: string | null;
    city: string | null;
    regionId: number | null;
    bio: string | null;
    photoUrl: string | null;
    facebookUrl: string | null;
    instagramUrl: string | null;
    careerEntries: CoachCareerEntry[];
  };
  regions: { id: number; name: string }[];
}

export function CoachProfileForm({ coach, regions }: CoachProfileFormProps) {
  const [firstName, setFirstName] = useState(coach.firstName);
  const [lastName, setLastName] = useState(coach.lastName);
  const [specialization, setSpecialization] = useState(coach.specialization ?? "");
  const [level, setLevel] = useState(coach.level ?? "");
  const [city, setCity] = useState(coach.city ?? "");
  const [regionId, setRegionId] = useState(coach.regionId?.toString() ?? "");
  const [bio, setBio] = useState(coach.bio ?? "");
  const [photoUrl, setPhotoUrl] = useState(coach.photoUrl ?? "");
  const [facebookUrl, setFacebookUrl] = useState(coach.facebookUrl ?? "");
  const [instagramUrl, setInstagramUrl] = useState(coach.instagramUrl ?? "");
  const [careers, setCareers] = useState<CoachCareerEntry[]>(coach.careerEntries);

  // Career entry form
  const [newClubName, setNewClubName] = useState("");
  const [newSeason, setNewSeason] = useState("");
  const [newRole, setNewRole] = useState("");
  const [newLevel, setNewLevel] = useState("");
  const [newNotes, setNewNotes] = useState("");

  const addCareerMut = api.coach.addCareerEntry.useMutation({
    onSuccess: (entry) => {
      setCareers((prev) => [entry, ...prev]);
      setNewClubName("");
      setNewSeason("");
      setNewRole("");
      setNewLevel("");
      setNewNotes("");
      toast.success("Wpis dodany");
    },
    onError: () => toast.error("Nie udało się dodać wpisu"),
  });

  const deleteCareerMut = api.coach.removeCareerEntry.useMutation({
    onSuccess: (_, variables) => {
      setCareers((prev) => prev.filter((c) => c.id !== variables.id));
      toast.success("Wpis usunięty");
    },
    onError: () => toast.error("Nie udało się usunąć wpisu"),
  });

  function addCareer() {
    if (!newClubName || !newSeason || !newRole) return;
    addCareerMut.mutate({
      clubName: newClubName,
      season: newSeason,
      role: newRole,
      level: newLevel || undefined,
      notes: newNotes || undefined,
    });
  }

  const updateMut = api.coach.update.useMutation({
    onSuccess: () => toast.success("Profil zaktualizowany"),
    onError: (err) => toast.error(err.message),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    updateMut.mutate({
      firstName,
      lastName,
      specialization: specialization || undefined,
      level: level || undefined,
      city: city || undefined,
      regionId: regionId ? parseInt(regionId) : undefined,
      bio: bio || undefined,
      photoUrl: photoUrl || undefined,
      facebookUrl: facebookUrl || undefined,
      instagramUrl: instagramUrl || undefined,
    });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Profil trenera</h1>
        <p className="text-muted-foreground">Uzupełnij swój profil trenerski</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Zdjęcie profilowe</CardTitle>
        </CardHeader>
        <CardContent>
          <ImageUpload
            currentUrl={photoUrl}
            onUploaded={(url: string) => setPhotoUrl(url)}
            entityId={coach.id}
            folder="coaches"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dane podstawowe</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Imię</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Nazwisko</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="specialization">Specjalizacja</Label>
                <Select value={specialization} onValueChange={setSpecialization}>
                  <SelectTrigger>
                    <SelectValue placeholder="Wybierz specjalizację" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(COACH_SPECIALIZATION_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="level">Licencja</Label>
                <Select value={level} onValueChange={setLevel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Wybierz licencję" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(COACH_LEVEL_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">Miasto</Label>
                <Input
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="np. Warszawa"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="region">Region (ZPN)</Label>
                <Select value={regionId} onValueChange={setRegionId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Wybierz region" />
                  </SelectTrigger>
                  <SelectContent>
                    {regions.map((r) => (
                      <SelectItem key={r.id} value={r.id.toString()}>
                        {r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">O mnie</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Opisz swoje doświadczenie trenerskie..."
                rows={5}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="facebookUrl">Facebook</Label>
                <Input
                  id="facebookUrl"
                  value={facebookUrl}
                  onChange={(e) => setFacebookUrl(e.target.value)}
                  placeholder="https://facebook.com/..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="instagramUrl">Instagram</Label>
                <Input
                  id="instagramUrl"
                  value={instagramUrl}
                  onChange={(e) => setInstagramUrl(e.target.value)}
                  placeholder="https://instagram.com/..."
                />
              </div>
            </div>

            <Button type="submit" disabled={updateMut.isPending}>
              {updateMut.isPending ? "Zapisywanie..." : "Zapisz profil"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Doświadczenie trenerskie</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Nazwa klubu"
                value={newClubName}
                onChange={(e) => setNewClubName(e.target.value)}
              />
              <Input
                placeholder="Sezon (np. 2024/2025)"
                value={newSeason}
                onChange={(e) => setNewSeason(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Rola (np. Pierwszy trener)"
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
              />
              <Input
                placeholder="Poziom (np. IV liga) – opcjonalnie"
                value={newLevel}
                onChange={(e) => setNewLevel(e.target.value)}
              />
            </div>
            <Input
              placeholder="Notatki – opcjonalnie"
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
            />
            <Button
              type="button"
              onClick={addCareer}
              variant="outline"
              disabled={addCareerMut.isPending}
            >
              {addCareerMut.isPending ? "Dodawanie..." : "Dodaj wpis"}
            </Button>
          </div>
          {careers.length === 0 ? (
            <p className="text-sm text-muted-foreground">Brak wpisów</p>
          ) : (
            <ul className="space-y-2">
              {careers.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between rounded-md border px-3 py-2"
                >
                  <div>
                    <span className="font-medium">{c.clubName}</span>{" "}
                    <span className="text-muted-foreground">({c.season})</span>
                    <span className="ml-2 text-sm text-muted-foreground">
                      — {c.role}
                    </span>
                    {c.level && (
                      <span className="ml-1 text-sm text-muted-foreground">
                        · {c.level}
                      </span>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteCareerMut.mutate({ id: c.id })}
                    className="text-destructive hover:text-destructive"
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
