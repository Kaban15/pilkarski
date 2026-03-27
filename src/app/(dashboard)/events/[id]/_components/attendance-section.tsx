"use client";

import { toast } from "sonner";
import { api } from "@/lib/trpc-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, X, HelpCircle, Users } from "lucide-react";
import { ATTENDANCE_STATUS_LABELS } from "@/lib/labels";

interface AttendanceSectionProps {
  eventId: string;
  isClubMember: boolean;
  isAdmin: boolean;
}

export function AttendanceSection({ eventId, isClubMember, isAdmin }: AttendanceSectionProps) {
  const { data, refetch } = api.event.getAttendance.useQuery(
    { eventId },
    { enabled: isClubMember }
  );

  const setAttendance = api.event.setAttendance.useMutation({
    onSuccess: () => {
      toast.success("Obecność zapisana");
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  if (!isClubMember || !data) return null;

  const { stats, myStatus, items } = data;

  const buttons = [
    { status: "YES" as const, icon: Check, label: "Tak", color: "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20" },
    { status: "NO" as const, icon: X, label: "Nie", color: "bg-red-500/10 text-red-500 hover:bg-red-500/20" },
    { status: "MAYBE" as const, icon: HelpCircle, label: "Nie wiem", color: "bg-amber-500/10 text-amber-600 hover:bg-amber-500/20" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Users className="h-4 w-4" />
          Obecność
          <div className="ml-auto flex gap-2 text-sm font-normal">
            <Badge className="bg-emerald-500/10 text-emerald-600">{stats.yes} tak</Badge>
            <Badge className="bg-red-500/10 text-red-500">{stats.no} nie</Badge>
            <Badge className="bg-amber-500/10 text-amber-600">{stats.maybe} ?</Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="mb-2 text-sm text-muted-foreground">Twoja obecność:</p>
          <div className="flex gap-2">
            {buttons.map((btn) => (
              <Button
                key={btn.status}
                size="sm"
                variant={myStatus === btn.status ? "default" : "outline"}
                className={myStatus === btn.status ? btn.color : ""}
                onClick={() => setAttendance.mutate({ eventId, status: btn.status })}
                disabled={setAttendance.isPending}
              >
                <btn.icon className="mr-1 h-3.5 w-3.5" />
                {btn.label}
              </Button>
            ))}
          </div>
        </div>

        {isAdmin && items.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-medium">Lista obecności:</p>
            <ul className="divide-y divide-border">
              {items.map((item) => {
                const name = item.user.player
                  ? `${item.user.player.firstName} ${item.user.player.lastName}`
                  : item.user.coach
                    ? `${item.user.coach.firstName} ${item.user.coach.lastName}`
                    : "Nieznany";
                const statusLabel = ATTENDANCE_STATUS_LABELS[item.status] ?? item.status;
                const statusColor =
                  item.status === "YES" ? "text-emerald-600" :
                  item.status === "NO" ? "text-red-500" : "text-amber-600";

                return (
                  <li key={item.id} className="flex items-center justify-between py-2">
                    <span className="text-sm">{name}</span>
                    <span className={`text-xs font-medium ${statusColor}`}>{statusLabel}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
