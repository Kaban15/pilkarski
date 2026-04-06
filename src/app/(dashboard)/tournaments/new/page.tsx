"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/trpc-react";
import { TOURNAMENT_FORMAT_LABELS } from "@/lib/labels";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type TournamentFormat = "GROUP_STAGE" | "KNOCKOUT" | "GROUP_AND_KNOCKOUT";

const MAX_TEAMS_OPTIONS = [4, 6, 8, 10, 12, 14, 16];

export default function NewTournamentPage() {
  const { t } = useI18n();
  const router = useRouter();

  const [format, setFormat] = useState<TournamentFormat>("KNOCKOUT");
  const [maxTeams, setMaxTeams] = useState<number>(8);
  const [groupCount, setGroupCount] = useState<string>("2");
  const [advancingPerGroup, setAdvancingPerGroup] = useState<string>("2");
  const [regionId, setRegionId] = useState<string>("");

  const { data: regions = [] } = api.region.list.useQuery();

  const showGroupFields = format === "GROUP_STAGE" || format === "GROUP_AND_KNOCKOUT";
  const showAdvancingField = format === "GROUP_AND_KNOCKOUT";

  const createMut = api.tournament.create.useMutation({
    onSuccess: (result) => {
      toast.success(t("Turniej utworzony!"));
      router.push(`/tournaments/${result.id}`);
    },
    onError: (err) => {
      toast.error(err.message || t("Nie udało się utworzyć turnieju"));
    },
  });

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    const startDateRaw = fd.get("startDate") as string;
    const endDateRaw = fd.get("endDate") as string;

    createMut.mutate({
      title: fd.get("title") as string,
      description: (fd.get("description") as string) || undefined,
      startDate: startDateRaw ? new Date(startDateRaw).toISOString() : "",
      endDate: endDateRaw ? new Date(endDateRaw).toISOString() : undefined,
      location: (fd.get("location") as string) || undefined,
      format,
      maxTeams,
      groupCount: showGroupFields ? Number(groupCount) : 1,
      advancingPerGroup: showAdvancingField ? Number(advancingPerGroup) : 2,
      regionId: regionId ? Number(regionId) : undefined,
    });
  }

  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <CardTitle>{t("Nowy turniej")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">{t("Nazwa turnieju")}</Label>
            <Input id="title" name="title" required placeholder={t("np. Turniej Ligi Jesień 2025")} />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">{t("Opis (opcjonalnie)")}</Label>
            <Textarea id="description" name="description" rows={3} placeholder={t("Dodatkowe informacje o turnieju...")} />
          </div>

          {/* Dates */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="startDate">{t("Data rozpoczęcia")}</Label>
              <Input id="startDate" name="startDate" type="datetime-local" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">{t("Data zakończenia (opcjonalnie)")}</Label>
              <Input id="endDate" name="endDate" type="datetime-local" />
            </div>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">{t("Miejsce (opcjonalnie)")}</Label>
            <Input id="location" name="location" placeholder={t("np. Stadion Miejski, Kraków")} />
          </div>

          {/* Format + Max teams */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>{t("Format")}</Label>
              <Select value={format} onValueChange={(v) => setFormat(v as TournamentFormat)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TOURNAMENT_FORMAT_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {t(label)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t("Maks. drużyn")}</Label>
              <Select value={String(maxTeams)} onValueChange={(v) => setMaxTeams(Number(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MAX_TEAMS_OPTIONS.map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Group fields */}
          {showGroupFields && (
            <div className="grid gap-4 md:grid-cols-2 rounded-lg border border-orange-500/20 bg-orange-500/5 p-4">
              <div className="space-y-2">
                <Label htmlFor="groupCount">{t("Liczba grup")}</Label>
                <Input
                  id="groupCount"
                  name="groupCount"
                  type="number"
                  min={1}
                  max={8}
                  value={groupCount}
                  onChange={(e) => setGroupCount(e.target.value)}
                  placeholder={String(Math.max(1, Math.floor(maxTeams / 4)))}
                />
              </div>

              {showAdvancingField && (
                <div className="space-y-2">
                  <Label>{t("Awansuje z grupy")}</Label>
                  <Select value={advancingPerGroup} onValueChange={setAdvancingPerGroup}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4].map((n) => (
                        <SelectItem key={n} value={String(n)}>
                          {n}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}

          {/* Region */}
          <div className="space-y-2">
            <Label>{t("Region (opcjonalnie)")}</Label>
            <Select value={regionId || "__none__"} onValueChange={(v) => setRegionId(v === "__none__" ? "" : v)}>
              <SelectTrigger>
                <SelectValue placeholder={t("Wybierz region")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">{t("Bez regionu")}</SelectItem>
                {regions.map((r) => (
                  <SelectItem key={r.id} value={String(r.id)}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={createMut.isPending}>
              {createMut.isPending ? t("Tworzenie...") : t("Utwórz turniej")}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              {t("Anuluj")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
