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

            <Button type="submit" disabled={updateMut.isPending}>
              {updateMut.isPending ? "Zapisywanie..." : "Zapisz profil"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
