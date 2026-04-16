"use client";

import Link from "next/link";
import { api } from "@/lib/trpc-react";
import { formatDate } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getLabels, EVENT_TYPE_LABELS, POSITION_LABELS } from "@/lib/labels";
import { useI18n } from "@/lib/i18n";
import { Target, ArrowRight, Calendar } from "lucide-react";

const RECRUITMENT_TYPES = ["RECRUITMENT", "TRYOUT", "CAMP", "CONTINUOUS_RECRUITMENT"];

export function ClubRecruitment({ showSection }: { showSection?: "recruitments" | "suggested" }) {
  const { t, locale } = useI18n();
  const eventTypeLabels = getLabels(EVENT_TYPE_LABELS, locale);
  const positionLabels = getLabels(POSITION_LABELS, locale);
  const { data: myEvents } = api.event.my.useQuery(undefined, { staleTime: 60_000 });
  const { data: suggested } = api.feed.suggestedPlayers.useQuery(
    { limit: 6 },
    { staleTime: 60_000 }
  );

  const activeRecruitments = (myEvents ?? []).filter(
    (e) =>
      RECRUITMENT_TYPES.includes(e.type) &&
      new Date(e.eventDate) >= new Date()
  );

  if (activeRecruitments.length === 0 && (!suggested || suggested.items.length === 0)) {
    return null;
  }

  return (
    <section className="mb-8 space-y-4">
      <h2 className="flex items-center gap-2 text-lg font-semibold">
        <Target className="h-5 w-5 text-purple-500" />
        {t("Rekrutacja")}
      </h2>

      {(!showSection || showSection === "recruitments") && activeRecruitments.length > 0 && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">
              {t("Twoje aktywne nabory")}
            </h3>
            <Link
              href="/events?type=RECRUITMENT"
              className="text-xs text-primary hover:underline"
            >
              {t("Wszystkie")} <ArrowRight className="inline h-3 w-3" />
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {activeRecruitments.slice(0, 4).map((event) => (
              <Link
                key={event.id}
                href={`/events/${event.id}`}
                className="group block"
              >
                <Card className="transition-all hover:border-primary/40">
                  <CardContent className="py-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium group-hover:text-primary truncate">
                          {event.title}
                        </p>
                        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {formatDate(event.eventDate)}
                        </div>
                      </div>
                      <Badge
                        variant="secondary"
                        className="shrink-0 text-[10px]"
                      >
                        {eventTypeLabels[event.type]}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {(!showSection || showSection === "suggested") && suggested && suggested.items.length > 0 && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">
              {t("Sugerowani zawodnicy w regionie")}
            </h3>
            <Link
              href="/transfers?type=LOOKING_FOR_CLUB"
              className="text-xs text-primary hover:underline"
            >
              {t("Wszyscy")} <ArrowRight className="inline h-3 w-3" />
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {suggested.items.map((t) => (
              <Link
                key={t.id}
                href={`/transfers/${t.id}`}
                className="group block"
              >
                <Card className="transition-all hover:border-primary/40">
                  <CardContent className="flex items-center gap-3 py-3">
                    {t.user.player?.photoUrl ? (
                      <img
                        src={t.user.player.photoUrl}
                        alt=""
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-500/10 text-xs font-bold text-violet-600 dark:text-violet-400">
                        {t.user.player
                          ? `${t.user.player.firstName[0]}${t.user.player.lastName[0]}`
                          : "?"}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium group-hover:text-primary truncate">
                        {t.user.player
                          ? `${t.user.player.firstName} ${t.user.player.lastName}`
                          : t.title}
                      </p>
                      <div className="flex gap-1">
                        {t.user.player?.primaryPosition && (
                          <Badge
                            variant="secondary"
                            className="text-[10px]"
                          >
                            {positionLabels[t.user.player.primaryPosition]}
                          </Badge>
                        )}
                        {t.region && (
                          <span className="text-[10px] text-muted-foreground">
                            {t.region.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
