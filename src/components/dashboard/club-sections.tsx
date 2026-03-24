"use client";

import Link from "next/link";
import { api } from "@/lib/trpc-react";
import { formatDate } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { APPLICATION_STATUS_LABELS, APPLICATION_STATUS_COLORS } from "@/lib/labels";
import {
  Swords,
  Trophy,
  Plus,
  ArrowRight,
  Calendar,
  Users,
  CalendarClock,
  FileText,
} from "lucide-react";

export function ClubDashboardSections() {
  const { data, isLoading } = api.stats.clubDashboard.useQuery(undefined, {
    staleTime: 30_000,
  });

  if (isLoading || !data) return null;

  const { activeSparings, upcomingEvents, pendingApplications } = data;
  const hasContent =
    activeSparings.length > 0 ||
    upcomingEvents.length > 0 ||
    pendingApplications.length > 0;

  if (!hasContent) {
    return (
      <div className="mb-8">
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <Swords className="h-7 w-7 text-primary" />
            </div>
            <div>
              <p className="text-lg font-semibold">Zacznij korzystać z PilkaSport</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Dodaj pierwszy sparing lub wydarzenie, aby przyciągnąć rywali i zawodników.
              </p>
            </div>
            <div className="flex gap-3">
              <Link href="/sparings/new">
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Dodaj sparing
                </Button>
              </Link>
              <Link href="/events/new">
                <Button variant="outline" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Dodaj wydarzenie
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mb-8 space-y-6">
      {/* Pending applications */}
      {pendingApplications.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <FileText className="h-5 w-5 text-blue-500" />
              Zgłoszenia do rozpatrzenia
              <Badge variant="secondary" className="bg-blue-500/10 text-blue-700 dark:text-blue-400">
                {pendingApplications.length}
              </Badge>
            </h2>
          </div>
          <Card>
            <CardContent className="divide-y divide-border py-2">
              {pendingApplications.map((app) => (
                <Link
                  key={app.id}
                  href={`/sparings/${app.sparingOffer.id}`}
                  className="group flex items-center justify-between gap-3 py-3 transition-colors hover:bg-muted/50 -mx-6 px-6"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium group-hover:text-primary transition-colors">
                      {app.applicantClub.name}
                      {app.applicantClub.city && (
                        <span className="text-muted-foreground"> · {app.applicantClub.city}</span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {app.sparingOffer.title}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className={APPLICATION_STATUS_COLORS[app.status]}
                    >
                      {APPLICATION_STATUS_LABELS[app.status]}
                    </Badge>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        </section>
      )}

      {/* Active sparings */}
      {activeSparings.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <Swords className="h-5 w-5 text-emerald-500" />
              Aktywne sparingi
            </h2>
            <div className="flex items-center gap-2">
              <Link href="/sparings/new">
                <Button size="sm" variant="outline" className="gap-1.5">
                  <Plus className="h-3.5 w-3.5" />
                  Dodaj
                </Button>
              </Link>
              <Link href="/sparings" className="text-xs font-medium text-primary hover:underline">
                Wszystkie →
              </Link>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {activeSparings.map((s) => (
              <Link key={s.id} href={`/sparings/${s.id}`} className="group block">
                <Card className="h-full border-l-[3px] border-l-emerald-500 transition-all hover:shadow-md hover:-translate-y-0.5">
                  <CardContent className="py-3">
                    <h3 className="text-sm font-semibold group-hover:text-primary transition-colors line-clamp-1">
                      {s.title}
                    </h3>
                    <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3 w-3" />
                        {formatDate(s.matchDate)}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Users className="h-3 w-3" />
                        {s._count.applications} zgłoszeń
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Upcoming events */}
      {upcomingEvents.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <Trophy className="h-5 w-5 text-violet-500" />
              Nadchodzące wydarzenia
            </h2>
            <div className="flex items-center gap-2">
              <Link href="/events/new">
                <Button size="sm" variant="outline" className="gap-1.5">
                  <Plus className="h-3.5 w-3.5" />
                  Dodaj
                </Button>
              </Link>
              <Link href="/events" className="text-xs font-medium text-primary hover:underline">
                Wszystkie →
              </Link>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {upcomingEvents.map((e) => (
              <Link key={e.id} href={`/events/${e.id}`} className="group block">
                <Card className="h-full border-l-[3px] border-l-violet-500 transition-all hover:shadow-md hover:-translate-y-0.5">
                  <CardContent className="py-3">
                    <h3 className="text-sm font-semibold group-hover:text-primary transition-colors line-clamp-1">
                      {e.title}
                    </h3>
                    <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <CalendarClock className="h-3 w-3" />
                        {formatDate(e.eventDate)}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Users className="h-3 w-3" />
                        {e._count.applications} zapisanych
                        {e.maxParticipants && ` / ${e.maxParticipants}`}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
