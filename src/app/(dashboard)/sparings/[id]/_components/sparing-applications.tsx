"use client";

import { toast } from "sonner";
import { api } from "@/lib/trpc-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  APPLICATION_STATUS_LABELS,
  APPLICATION_STATUS_COLORS,
} from "@/lib/labels";
import { formatDate } from "@/lib/format";
import { Users, CheckCircle2, XCircle, CalendarClock, Clock } from "lucide-react";
import Link from "next/link";

type SparingApplicationsProps = {
  applications: any[];
  isOwner: boolean;
  onResponded: () => void;
};

export function SparingApplications({
  applications,
  isOwner,
  onResponded,
}: SparingApplicationsProps) {
  const respondMutation = api.sparing.respond.useMutation({
    onSuccess: (_data, variables) => {
      toast.success(
        variables.status === "ACCEPTED"
          ? "Zgłoszenie zaakceptowane"
          : "Zgłoszenie odrzucone"
      );
      onResponded();
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  function handleRespond(
    applicationId: string,
    status: "ACCEPTED" | "REJECTED"
  ) {
    respondMutation.mutate({ applicationId, status });
  }

  const statusOrder: Record<string, number> = {
    PENDING: 0,
    COUNTER_PROPOSED: 0,
    ACCEPTED: 1,
    REJECTED: 2,
  };

  const sorted = [...applications].sort(
    (a, b) => (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9)
  );

  const pendingCount = applications.filter(
    (a: any) => a.status === "PENDING" || a.status === "COUNTER_PROPOSED"
  ).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users className="h-5 w-5 text-muted-foreground" />
          Zgłoszenia ({applications.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isOwner && pendingCount > 0 && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-amber-50 dark:bg-amber-950/50 px-4 py-2.5 text-sm text-amber-700 dark:text-amber-400">
            <Clock className="h-4 w-4 shrink-0" />
            Masz {pendingCount} {pendingCount === 1 ? "zgłoszenie" : pendingCount < 5 ? "zgłoszenia" : "zgłoszeń"} do rozpatrzenia
          </div>
        )}
        {applications.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Brak zgłoszeń
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {sorted.map((app: any) => {
              const isPending = app.status === "PENDING" || app.status === "COUNTER_PROPOSED";
              return (
                <li
                  key={app.id}
                  className={`flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between ${
                    isPending
                      ? "border-l-2 border-l-amber-400 pl-3 bg-amber-50/50 dark:bg-amber-950/20 -mx-1 rounded-r-md"
                      : ""
                  }`}
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
                      {app.applicantClub?.logoUrl ? (
                        <img src={app.applicantClub.logoUrl} alt={app.applicantClub.name} className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-xs font-bold text-muted-foreground">
                          {(app.applicantClub?.name ?? "?").slice(0, 2).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium">
                        <Link href={`/clubs/${app.applicantClub.id}`} className="hover:underline hover:text-primary">{app.applicantClub.name}</Link>
                        {app.applicantClub.city && (
                          <span className="text-muted-foreground">
                            {" "}
                            · {app.applicantClub.city}
                          </span>
                        )}
                      </p>
                      {app.message && (
                        <p className="mt-0.5 text-sm text-muted-foreground line-clamp-2">
                          {app.message}
                        </p>
                      )}
                      {app.counterProposedDate && (
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400">
                          <CalendarClock className="h-3 w-3" />
                          Proponowany termin: {formatDate(app.counterProposedDate)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className={APPLICATION_STATUS_COLORS[app.status]}
                    >
                      {APPLICATION_STATUS_LABELS[app.status]}
                    </Badge>
                    {isOwner && isPending && (
                      <>
                        <Button
                          size="sm"
                          className="gap-1"
                          onClick={() => handleRespond(app.id, "ACCEPTED")}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Akceptuj
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1"
                          onClick={() => handleRespond(app.id, "REJECTED")}
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          Odrzuć
                        </Button>
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
