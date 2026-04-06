"use client";

import Link from "next/link";
import { api } from "@/lib/trpc-react";
import { formatDate } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { APPLICATION_STATUS_COLORS } from "@/lib/labels";
import { getApplicationStatusLabels } from "@/lib/labels";
import { useI18n } from "@/lib/i18n";
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
  const { t, locale } = useI18n();
  const applicationStatusLabels = getApplicationStatusLabels(locale);
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
              <p className="text-lg font-semibold">{t("Zacznij korzystać z PilkaSport")}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("Dodaj pierwszy sparing lub wydarzenie, aby przyciągnąć rywali i zawodników.")}
              </p>
            </div>
            <div className="flex gap-3">
              <Link href="/sparings/new">
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  {t("Dodaj sparing")}
                </Button>
              </Link>
              <Link href="/events/new">
                <Button variant="outline" className="gap-2">
                  <Plus className="h-4 w-4" />
                  {t("Dodaj wydarzenie")}
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
            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
              <FileText className="h-4 w-4 text-blue-500" />
              {t("Zgłoszenia do rozpatrzenia")}
              <Badge variant="secondary" className="bg-blue-500/10 text-blue-700 dark:text-blue-400">
                {pendingApplications.length}
              </Badge>
            </h2>
          </div>
          <Card className="rounded-xl">
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
                      {applicationStatusLabels[app.status]}
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
            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
              <Swords className="h-4 w-4 text-emerald-500" />
              {t("Aktywne sparingi")}
            </h2>
            <div className="flex items-center gap-2">
              <Link href="/sparings/new">
                <Button size="sm" variant="outline" className="gap-1.5 rounded-lg">
                  <Plus className="h-3.5 w-3.5" />
                  {t("Dodaj")}
                </Button>
              </Link>
              <Link href="/sparings" className="text-xs font-medium text-primary hover:underline">
                {t("Wszystkie →")}
              </Link>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {activeSparings.map((s) => (
              <Link key={s.id} href={`/sparings/${s.id}`} className="group block">
                <Card className="h-full rounded-xl transition-colors hover:border-primary/40">
                  <CardContent className="p-4">
                    <h3 className="text-sm font-semibold group-hover:text-primary transition-colors line-clamp-1">
                      {s.title}
                    </h3>
                    <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(s.matchDate)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {s._count.applications}
                      </span>
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
            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
              <Trophy className="h-4 w-4 text-violet-500" />
              {t("Nadchodzące wydarzenia")}
            </h2>
            <div className="flex items-center gap-2">
              <Link href="/events/new">
                <Button size="sm" variant="outline" className="gap-1.5 rounded-lg">
                  <Plus className="h-3.5 w-3.5" />
                  {t("Dodaj")}
                </Button>
              </Link>
              <Link href="/events" className="text-xs font-medium text-primary hover:underline">
                {t("Wszystkie →")}
              </Link>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {upcomingEvents.map((e) => (
              <Link key={e.id} href={`/events/${e.id}`} className="group block">
                <Card className="h-full rounded-xl transition-colors hover:border-primary/40">
                  <CardContent className="p-4">
                    <h3 className="text-sm font-semibold group-hover:text-primary transition-colors line-clamp-1">
                      {e.title}
                    </h3>
                    <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <CalendarClock className="h-3 w-3" />
                        {formatDate(e.eventDate)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {e._count.applications}
                        {e.maxParticipants && ` / ${e.maxParticipants}`}
                      </span>
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
