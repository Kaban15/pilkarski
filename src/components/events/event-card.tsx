"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarClock, Users } from "lucide-react";
import { formatDate } from "@/lib/format";

export type EventCardItem = {
  id: string;
  title: string;
  eventDate: string | Date;
  maxParticipants: number | null;
  _count: { applications: number };
};

export function EventCard({ event }: { event: EventCardItem }) {
  return (
    <Link href={`/events/${event.id}`} className="group block">
      <Card className="h-full rounded-xl transition-colors hover:border-primary/40">
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold group-hover:text-primary transition-colors line-clamp-1">
            {event.title}
          </h3>
          <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <CalendarClock className="h-3 w-3" />
              {formatDate(event.eventDate)}
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {event._count.applications}
              {event.maxParticipants && ` / ${event.maxParticipants}`}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
