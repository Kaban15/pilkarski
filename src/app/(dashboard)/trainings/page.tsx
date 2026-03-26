"use client";

import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/trpc-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { GraduationCap, Calendar, MapPin, Users } from "lucide-react";

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

export default function TrainingsPage() {
  const [tab, setTab] = useState<"trainings" | "coaches">("trainings");

  const individualTrainings = api.event.list.useQuery(
    { type: "INDIVIDUAL_TRAINING" as "INDIVIDUAL_TRAINING", sortBy: "eventDate", sortOrder: "asc", limit: 20 },
    { enabled: tab === "trainings" }
  );
  const groupTrainings = api.event.list.useQuery(
    { type: "GROUP_TRAINING" as "GROUP_TRAINING", sortBy: "eventDate", sortOrder: "asc", limit: 20 },
    { enabled: tab === "trainings" }
  );

  const coaches = api.coach.list.useQuery(
    { limit: 20 },
    { enabled: tab === "coaches" }
  );

  const allTrainings = [
    ...(individualTrainings.data?.items ?? []),
    ...(groupTrainings.data?.items ?? []),
  ].sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime()) as TrainingItem[];

  const isLoadingTrainings = individualTrainings.isLoading || groupTrainings.isLoading;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Treningi</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Znajdź trening indywidualny lub grupowy, albo przeglądaj trenerów
        </p>
      </div>

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
                          {t.club.name}
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
            (coaches.data?.items as CoachItem[] ?? []).map((c) => (
              <Card key={c.id} className="transition-colors hover:border-primary/40">
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
            ))
          )}
        </div>
      )}
    </div>
  );
}
