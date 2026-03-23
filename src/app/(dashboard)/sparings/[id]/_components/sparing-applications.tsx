"use client";

import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  APPLICATION_STATUS_LABELS,
  APPLICATION_STATUS_COLORS,
} from "@/lib/labels";
import { Users, CheckCircle2, XCircle } from "lucide-react";

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
  async function handleRespond(
    applicationId: string,
    status: "ACCEPTED" | "REJECTED"
  ) {
    try {
      await trpc.sparing.respond.mutate({ applicationId, status });
      toast.success(
        status === "ACCEPTED"
          ? "Zgłoszenie zaakceptowane"
          : "Zgłoszenie odrzucone"
      );
      onResponded();
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users className="h-5 w-5 text-muted-foreground" />
          Zgłoszenia ({applications.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {applications.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Brak zgłoszeń
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {applications.map((app: any) => (
              <li
                key={app.id}
                className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-medium">
                    {app.applicantClub.name}
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
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="secondary"
                    className={APPLICATION_STATUS_COLORS[app.status]}
                  >
                    {APPLICATION_STATUS_LABELS[app.status]}
                  </Badge>
                  {isOwner && app.status === "PENDING" && (
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
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
