"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { api } from "@/lib/trpc-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Swords,
  Trophy,
  ArrowRight,
  CheckCircle2,
  PartyPopper,
} from "lucide-react";

const STEPS = [
  { label: "Profil klubu", description: "Uzupełnij podstawowe dane" },
  { label: "Pierwsze ogłoszenie", description: "Dodaj sparing lub wydarzenie" },
  { label: "Gotowe", description: "Wszystko ustawione!" },
];

export function ClubOnboarding({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const [city, setCity] = useState("");
  const [regionId, setRegionId] = useState<number | null>(null);
  const [leagueLevelId, setLeagueLevelId] = useState<number | null>(null);
  const [leagueGroupId, setLeagueGroupId] = useState<number | null>(null);

  const { data: clubProfile } = api.club.me.useQuery(undefined, { staleTime: Infinity });
  const { data: regions = [] } = api.region.list.useQuery(undefined, { staleTime: Infinity });
  const { data: hierarchy = [] } = api.region.hierarchy.useQuery(
    { regionId: regionId! },
    { enabled: !!regionId },
  );

  const utils = api.useUtils();

  const updateProfile = api.club.update.useMutation({
    onSuccess: () => {
      toast.success("Profil zaktualizowany!");
      utils.club.me.invalidate();
      setStep(1);
    },
    onError: (err) => toast.error(err.message),
  });

  const selectedLevel = hierarchy.find((l: { id: number }) => l.id === leagueLevelId);

  function handleSaveProfile() {
    if (!regionId) {
      toast.error("Wybierz region");
      return;
    }
    updateProfile.mutate({
      name: clubProfile?.name ?? "",
      city: city || undefined,
      regionId,
      leagueGroupId: leagueGroupId ?? undefined,
    });
  }

  return (
    <div className="mb-8">
      <Card className="overflow-hidden border-primary/20">
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground">
              PS
            </div>
            <div>
              <h2 className="text-lg font-bold">Witaj w PilkaSport!</h2>
              <p className="text-sm text-muted-foreground">
                Skonfiguruj klub w 3 prostych krokach
              </p>
            </div>
          </div>
          {/* Step indicator */}
          <div className="mt-4 flex gap-2">
            {STEPS.map((s, i) => (
              <div key={i} className="flex flex-1 items-center gap-2">
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    i <= step
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {i < step ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                </div>
                <span
                  className={`hidden text-xs font-medium sm:inline ${
                    i <= step ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {s.label}
                </span>
                {i < STEPS.length - 1 && (
                  <div
                    className={`hidden h-px flex-1 sm:block ${
                      i < step ? "bg-primary" : "bg-border"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <CardContent className="py-6">
          {step === 0 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Podaj podstawowe dane klubu. Region jest potrzebny, aby sparingi i wydarzenia
                trafiały do właściwych odbiorców.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Miasto</Label>
                  <Input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="np. Poznań"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>
                    Region (ZPN) <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={regionId ? String(regionId) : ""}
                    onValueChange={(v) => {
                      setRegionId(v ? Number(v) : null);
                      setLeagueLevelId(null);
                      setLeagueGroupId(null);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Wybierz region" />
                    </SelectTrigger>
                    <SelectContent>
                      {regions.map((r: { id: number; name: string }) => (
                        <SelectItem key={r.id} value={String(r.id)}>
                          {r.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {regionId && hierarchy.length > 0 && (
                  <>
                    <div className="space-y-1.5">
                      <Label>Szczebel ligowy</Label>
                      <Select
                        value={leagueLevelId ? String(leagueLevelId) : ""}
                        onValueChange={(v) => {
                          setLeagueLevelId(v ? Number(v) : null);
                          setLeagueGroupId(null);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Wybierz szczebel" />
                        </SelectTrigger>
                        <SelectContent>
                          {hierarchy.map((l: { id: number; name: string }) => (
                            <SelectItem key={l.id} value={String(l.id)}>
                              {l.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {selectedLevel &&
                      "groups" in selectedLevel &&
                      (selectedLevel as { groups: { id: number; name: string }[] }).groups.length >
                        0 && (
                        <div className="space-y-1.5">
                          <Label>Grupa</Label>
                          <Select
                            value={leagueGroupId ? String(leagueGroupId) : ""}
                            onValueChange={(v) => setLeagueGroupId(v ? Number(v) : null)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Wybierz grupę" />
                            </SelectTrigger>
                            <SelectContent>
                              {(
                                selectedLevel as { groups: { id: number; name: string }[] }
                              ).groups.map((g) => (
                                <SelectItem key={g.id} value={String(g.id)}>
                                  {g.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                  </>
                )}
              </div>
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={onComplete}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Pomiń na razie
                </button>
                <Button
                  onClick={handleSaveProfile}
                  disabled={!regionId || updateProfile.isPending}
                  className="gap-2"
                >
                  {updateProfile.isPending ? "Zapisywanie..." : "Zapisz i dalej"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Dodaj swoje pierwsze ogłoszenie — rywale i zawodnicy z regionu zobaczą je od razu.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <Link href="/sparings/new" className="group">
                  <Card className="h-full border-2 border-emerald-200 transition-all hover:border-emerald-400 hover:shadow-md dark:border-emerald-800 dark:hover:border-emerald-600">
                    <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10">
                        <Swords className="h-7 w-7 text-emerald-500" />
                      </div>
                      <div>
                        <p className="text-lg font-semibold transition-colors group-hover:text-emerald-600">
                          Dodaj sparing
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Znajdź rywala na mecz sparingowy
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
                <Link href="/events/new" className="group">
                  <Card className="h-full border-2 border-violet-200 transition-all hover:border-violet-400 hover:shadow-md dark:border-violet-800 dark:hover:border-violet-600">
                    <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/10">
                        <Trophy className="h-7 w-7 text-violet-500" />
                      </div>
                      <div>
                        <p className="text-lg font-semibold transition-colors group-hover:text-violet-600">
                          Dodaj wydarzenie
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Nabór lub trening otwarty
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </div>
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Pomiń
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                <PartyPopper className="h-7 w-7 text-primary" />
              </div>
              <div>
                <p className="text-lg font-semibold">Klub gotowy!</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Twój profil jest skonfigurowany. Teraz możesz korzystać z pełni możliwości
                  platformy.
                </p>
              </div>
              <Button onClick={onComplete} className="gap-2">
                Przejdź do pulpitu
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
