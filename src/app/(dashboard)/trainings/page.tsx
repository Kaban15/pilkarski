"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { api } from "@/lib/trpc-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { CardSkeleton } from "@/components/card-skeleton";
import { EmptyState } from "@/components/empty-state";
import {
  EVENT_TYPE_LABELS,
  COACH_SPECIALIZATION_LABELS,
  COACH_LEVEL_LABELS,
} from "@/lib/labels";
import { formatShortDate } from "@/lib/format";
import { MobileRefresh } from "@/components/mobile-refresh";
import { GraduationCap, Calendar, MapPin, Users, Sparkles } from "lucide-react";

type TrainingItem = {
  id: string;
  type: string;
  title: string;
  eventDate: string | Date;
  location: string | null;
  maxParticipants: number | null;
  priceInfo: string | null;
  club: { id: string; name: string; city: string | null; logoUrl: string | null };
  region: { name: string } | null;
};

type CoachItem = {
  id: string;
  firstName: string;
  lastName: string;
  specialization: string | null;
  level: string | null;
  city: string | null;
  photoUrl: string | null;
  region: { name: string } | null;
};

function RecommendedTrainings() {
  const recommended = api.event.recommendedTrainings.useQuery({ limit: 6 });
  const items = (recommended.data?.items ?? []) as TrainingItem[];

  if (recommended.isLoading || items.length === 0) return null;

  return (
    <div className="mb-8">
      <div className="mb-4 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <h2 className="text-base font-semibold">Polecane dla Ciebie</h2>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((t) => (
          <Link key={t.id} href={`/events/${t.id}`}>
            <Card className="h-full transition-all hover:border-primary/30 hover:shadow-sm">
              <CardContent className="p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Badge variant="secondary" className="text-[10px]">
                    {EVENT_TYPE_LABELS[t.type] ?? t.type}
                  </Badge>
                  {t.priceInfo && (
                    <span className="ml-auto text-[12px] font-semibold text-primary">{t.priceInfo}</span>
                  )}
                </div>
                <p className="text-[14px] font-semibold leading-snug line-clamp-2">{t.title}</p>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3 opacity-50" />
                    {t.club.name}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 opacity-50" />
                    {new Date(t.eventDate).toLocaleDateString("pl-PL", { day: "numeric", month: "short" })}
                  </span>
                  {t.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 opacity-50" />
                      {t.location}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function TrainingsPage() {
  const { data: session } = useSession();
  const isPlayer = session?.user?.role === "PLAYER";
  const [tab, setTab] = useState<"trainings" | "coaches">("trainings");

  const trainings = api.event.list.useQuery(
    { types: ["INDIVIDUAL_TRAINING", "GROUP_TRAINING"], sortBy: "eventDate", sortOrder: "asc", limit: 40 },
    { enabled: tab === "trainings" }
  );

  const coaches = api.coach.list.useQuery(
    { limit: 20 },
    { enabled: tab === "coaches" }
  );

  const allTrainings = (trainings.data?.items ?? []) as TrainingItem[];
  const isLoadingTrainings = trainings.isLoading;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Treningi</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Znajdź trening indywidualny lub grupowy, albo przeglądaj trenerów
        </p>
      </div>

      {isPlayer && <RecommendedTrainings />}

      <MobileRefresh
        onRefresh={() => {
          trainings.refetch();
          coaches.refetch();
        }}
        loading={tab === "trainings" ? isLoadingTrainings : coaches.isLoading}
      />

      <Tabs value={tab} onValueChange={(v) => setTab(v as "trainings" | "coaches")}>
        <TabsList>
          <TabsTrigger value="trainings">Treningi</TabsTrigger>
          <TabsTrigger value="coaches">Trenerzy</TabsTrigger>
        </TabsList>
      </Tabs>

      {tab === "trainings" && (
        <div className="space-y-3">
          {isLoadingTrainings ? (
            Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
          ) : allTrainings.length === 0 ? (
            <EmptyState
              icon={GraduationCap}
              title="Brak treningów"
              description="Nie ma jeszcze treningów w ofercie. Kluby mogą dodać treningi w sekcji Wydarzenia."
            />
          ) : (
            allTrainings.map((t) => (
              <Link key={t.id} href={`/events/${t.id}`}>
                <Card className="transition-colors hover:border-primary/40">
                  <CardContent className="flex items-center gap-4 py-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <GraduationCap className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-semibold">{t.title}</p>
                        <Badge variant="secondary" className="text-[10px] shrink-0">
                          {EVENT_TYPE_LABELS[t.type] ?? t.type}
                        </Badge>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {t.club?.name ?? "Trener"}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatShortDate(t.eventDate)}
                        </span>
                        {t.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {t.location}
                          </span>
                        )}
                        {t.priceInfo && (
                          <span className="font-medium text-foreground">{t.priceInfo}</span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
        </div>
      )}

      {tab === "coaches" && (
        <div className="space-y-3">
          {coaches.isLoading ? (
            Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
          ) : (coaches.data?.items ?? []).length === 0 ? (
            <EmptyState
              icon={GraduationCap}
              title="Brak trenerów"
              description="Nie ma jeszcze zarejestrowanych trenerów."
            />
          ) : (
            (coaches.data?.items ?? []).map((c: CoachItem) => (
              <Link key={c.id} href={`/coaches/${c.id}`}>
              <Card className="transition-colors hover:border-primary/40">
                <CardContent className="flex items-center gap-4 py-4">
                  {c.photoUrl ? (
                    <img
                      src={c.photoUrl}
                      alt={`${c.firstName} ${c.lastName}`}
                      className="h-10 w-10 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-bold text-muted-foreground">
                      {c.firstName[0]}{c.lastName[0]}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {c.firstName} {c.lastName}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      {c.specialization && (
                        <Badge variant="secondary" className="text-[10px]">
                          {COACH_SPECIALIZATION_LABELS[c.specialization] ?? c.specialization}
                        </Badge>
                      )}
                      {c.level && (
                        <Badge variant="outline" className="text-[10px]">
                          {COACH_LEVEL_LABELS[c.level] ?? c.level}
                        </Badge>
                      )}
                      {c.city && (
                        <span className="text-xs text-muted-foreground">
                          <MapPin className="mr-0.5 inline h-3 w-3" />
                          {c.city}
                        </span>
                      )}
                      {c.region && (
                        <span className="text-xs text-muted-foreground">{c.region.name}</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}
