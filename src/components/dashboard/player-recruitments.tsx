"use client";

import Link from "next/link";
import { api } from "@/lib/trpc-react";
import { formatDate } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Target,
  Calendar,
  MapPin,
  Users,
  ArrowRight,
} from "lucide-react";

export function PlayerRecruitments() {
  const { data, isLoading } = api.feed.recruitments.useQuery(
    { limit: 5 },
    { staleTime: 60_000 }
  );

  if (isLoading || !data || data.items.length === 0) return null;

  return (
    <section className="mb-8">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Target className="h-5 w-5 text-amber-500" />
          Nabory dla Ciebie
          {data.matched && (
            <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[10px]">
              Dopasowane
            </Badge>
          )}
        </h2>
        <Link href="/events" className="text-xs font-medium text-primary hover:underline">
          Wszystkie →
        </Link>
      </div>
      <div className="stagger-children grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {data.items.map((event) => (
          <Link key={event.id} href={`/events/${event.id}`} className="group block">
            <Card className="h-full border-l-[3px] border-l-amber-500 transition-all hover:shadow-md hover:-translate-y-0.5">
              <CardContent className="py-3">
                <div className="mb-2 flex items-start gap-2">
                  {event.club.logoUrl ? (
                    <img
                      src={event.club.logoUrl}
                      alt={event.club.name}
                      className="h-8 w-8 shrink-0 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-xs font-bold text-amber-600 dark:text-amber-400">
                      {event.club.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold group-hover:text-primary transition-colors line-clamp-1">
                      {event.title}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {event.club.name}
                      {event.club.city && ` · ${event.club.city}`}
                    </p>
                  </div>
                </div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3 w-3" />
                    {formatDate(event.eventDate)}
                  </div>
                  {event.location && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3 w-3" />
                      <span className="line-clamp-1">{event.location}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-1">
                    {event.maxParticipants && (
                      <div className="flex items-center gap-1.5">
                        <Users className="h-3 w-3" />
                        {event.maxParticipants} miejsc
                      </div>
                    )}
                    <ArrowRight className="ml-auto h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
