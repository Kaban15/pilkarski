"use client";

import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/trpc-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Check, X, Trophy } from "lucide-react";

interface ScoreSectionProps {
  sparingId: string;
  homeScore: number | null;
  awayScore: number | null;
  scoreSubmittedBy: string | null;
  scoreConfirmed: boolean;
  status: string;
  isOwner: boolean;
  isRival: boolean;
  userId: string;
  ownerClubName: string;
  rivalClubName: string;
  onUpdate: () => void;
}

export function ScoreSection({
  sparingId,
  homeScore,
  awayScore,
  scoreSubmittedBy,
  scoreConfirmed,
  status,
  isOwner,
  isRival,
  userId,
  ownerClubName,
  rivalClubName,
  onUpdate,
}: ScoreSectionProps) {
  const [home, setHome] = useState("");
  const [away, setAway] = useState("");

  const submitScore = api.sparing.submitScore.useMutation({
    onSuccess: () => {
      toast.success("Wynik wysłany — czeka na potwierdzenie");
      onUpdate();
    },
    onError: (e) => toast.error(e.message),
  });

  const confirmScore = api.sparing.confirmScore.useMutation({
    onSuccess: (_, vars) => {
      toast.success(vars.confirm ? "Wynik potwierdzony" : "Wynik odrzucony");
      onUpdate();
    },
    onError: (e) => toast.error(e.message),
  });

  if (status !== "COMPLETED") return null;
  if (!isOwner && !isRival) {
    if (homeScore !== null && scoreConfirmed) {
      return (
        <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-4">
          <Trophy className="h-5 w-5 text-emerald-500" />
          <span className="font-semibold">
            {ownerClubName} {homeScore}:{awayScore} {rivalClubName}
          </span>
          <Badge className="bg-emerald-500/10 text-emerald-600">Potwierdzony</Badge>
        </div>
      );
    }
    return null;
  }

  if (homeScore !== null && scoreConfirmed) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-4">
        <Trophy className="h-5 w-5 text-emerald-500" />
        <span className="font-semibold">
          {ownerClubName} {homeScore}:{awayScore} {rivalClubName}
        </span>
        <Badge className="bg-emerald-500/10 text-emerald-600">Potwierdzony</Badge>
      </div>
    );
  }

  if (homeScore !== null && !scoreConfirmed) {
    const isSubmitter = scoreSubmittedBy === userId;
    return (
      <div className="space-y-3 rounded-lg border border-border bg-card p-4">
        <div className="flex items-center gap-3">
          <Trophy className="h-5 w-5 text-amber-500" />
          <span className="font-semibold">
            {ownerClubName} {homeScore}:{awayScore} {rivalClubName}
          </span>
          <Badge className="bg-amber-500/10 text-amber-600">Oczekuje potwierdzenia</Badge>
        </div>
        {!isSubmitter && (
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => confirmScore.mutate({ sparingId, confirm: true })}
              disabled={confirmScore.isPending}
            >
              <Check className="mr-1 h-4 w-4" />
              Potwierdź
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => confirmScore.mutate({ sparingId, confirm: false })}
              disabled={confirmScore.isPending}
            >
              <X className="mr-1 h-4 w-4" />
              Odrzuć
            </Button>
          </div>
        )}
        {isSubmitter && (
          <p className="text-sm text-muted-foreground">Czekasz na potwierdzenie drugiego klubu.</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-lg border border-border bg-card p-4">
      <p className="text-sm font-medium">Wpisz wynik sparingu</p>
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">{ownerClubName}</span>
        <Input
          type="number"
          min="0"
          max="99"
          className="w-16 text-center"
          value={home}
          onChange={(e) => setHome(e.target.value)}
          placeholder="0"
        />
        <span className="font-bold">:</span>
        <Input
          type="number"
          min="0"
          max="99"
          className="w-16 text-center"
          value={away}
          onChange={(e) => setAway(e.target.value)}
          placeholder="0"
        />
        <span className="text-sm text-muted-foreground">{rivalClubName}</span>
      </div>
      <Button
        size="sm"
        onClick={() => {
          const h = parseInt(home, 10);
          const a = parseInt(away, 10);
          if (isNaN(h) || isNaN(a) || h < 0 || a < 0) {
            toast.error("Wpisz poprawny wynik");
            return;
          }
          submitScore.mutate({ sparingId, homeScore: h, awayScore: a });
        }}
        disabled={submitScore.isPending}
      >
        Wyślij wynik
      </Button>
    </div>
  );
}
