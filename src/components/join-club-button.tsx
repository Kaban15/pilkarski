"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { api } from "@/lib/trpc-react";
import { Button } from "@/components/ui/button";
import { UserPlus, Clock, Check, LogOut } from "lucide-react";

interface JoinClubButtonProps {
  clubId: string;
}

export function JoinClubButton({ clubId }: JoinClubButtonProps) {
  const { data: session } = useSession();
  const [showConfirm, setShowConfirm] = useState(false);
  const role = session?.user?.role;

  const isPlayerOrCoach = role === "PLAYER" || role === "COACH";

  const { data: membership, refetch } = api.clubMembership.myMembership.useQuery(
    { clubId },
    { enabled: isPlayerOrCoach }
  );

  const joinMut = api.clubMembership.requestJoin.useMutation({
    onSuccess: () => {
      toast.success("Prośba o dołączenie wysłana!");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const leaveMut = api.clubMembership.leaveClub.useMutation({
    onSuccess: () => {
      toast.success("Opuściłeś klub");
      refetch();
      setShowConfirm(false);
    },
    onError: (err) => toast.error(err.message),
  });

  if (!isPlayerOrCoach) return null;

  if (membership?.status === "ACCEPTED") {
    return (
      <div className="flex items-center gap-2">
        <span className="flex items-center gap-1.5 rounded-md bg-emerald-500/10 px-3 py-1.5 text-[13px] font-medium text-emerald-600 dark:text-emerald-400">
          <Check className="h-3.5 w-3.5" />
          {role === "COACH" ? "Trener klubu" : "Zawodnik klubu"}
        </span>
        {!showConfirm ? (
          <Button
            size="sm"
            variant="ghost"
            className="h-8 text-xs text-muted-foreground"
            onClick={() => setShowConfirm(true)}
          >
            <LogOut className="mr-1 h-3 w-3" />
            Opuść
          </Button>
        ) : (
          <div className="flex gap-1">
            <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={() => leaveMut.mutate({ clubId })} disabled={leaveMut.isPending}>
              Potwierdź
            </Button>
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setShowConfirm(false)}>
              Anuluj
            </Button>
          </div>
        )}
      </div>
    );
  }

  if (membership?.status === "PENDING") {
    return (
      <span className="flex items-center gap-1.5 rounded-md bg-amber-500/10 px-3 py-1.5 text-[13px] font-medium text-amber-600 dark:text-amber-400">
        <Clock className="h-3.5 w-3.5" />
        Prośba wysłana — oczekuje
      </span>
    );
  }

  return (
    <Button
      size="sm"
      variant="outline"
      className="gap-1.5 bg-white/10 text-white hover:bg-white/20 border-white/20"
      onClick={() => joinMut.mutate({ clubId })}
      disabled={joinMut.isPending}
    >
      <UserPlus className="h-3.5 w-3.5" />
      {role === "COACH" ? "Dołącz jako trener" : "Dołącz do klubu"}
    </Button>
  );
}
