"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { api } from "@/lib/trpc-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Check, X, Trophy, Trash2, ChevronDown, ChevronUp } from "lucide-react";

interface ScoreSectionProps {
  sparingId: string;
  sparingOfferId: string;
  homeScore: number | null;
  awayScore: number | null;
  scoreSubmittedBy: string | null;
  scoreConfirmed: boolean;
  status: string;
  isOwner: boolean;
  isRival: boolean;
  isParticipant: boolean;
  userId: string;
  ownerClubName: string;
  rivalClubName: string;
  homeClubId: string;
  awayClubId: string | null;
  onUpdate: () => void;
}

export function ScoreSection({
  sparingId,
  sparingOfferId,
  homeScore,
  awayScore,
  scoreSubmittedBy,
  scoreConfirmed,
  status,
  isOwner,
  isRival,
  isParticipant,
  userId,
  ownerClubName,
  rivalClubName,
  homeClubId,
  awayClubId,
  onUpdate,
}: ScoreSectionProps) {
  const [home, setHome] = useState("");
  const [away, setAway] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [scorerUserId, setScorerUserId] = useState("");
  const [minute, setMinute] = useState("");
  const [ownGoal, setOwnGoal] = useState(false);

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

  const goalsQuery = api.sparing.getGoals.useQuery(
    { sparingOfferId },
    { enabled: !!scoreConfirmed }
  );

  const homeMembersQuery = api.clubMembership.listMembers.useQuery(
    { clubId: homeClubId },
    { enabled: showAddForm }
  );
  const awayMembersQuery = api.clubMembership.listMembers.useQuery(
    { clubId: awayClubId! },
    { enabled: showAddForm && !!awayClubId }
  );

  const addGoal = api.sparing.addGoal.useMutation({
    onSuccess: () => {
      toast.success("Bramka dodana");
      void goalsQuery.refetch();
      setScorerUserId("");
      setMinute("");
      setOwnGoal(false);
      setShowAddForm(false);
    },
    onError: (e) => toast.error(e.message),
  });

  const removeGoal = api.sparing.removeGoal.useMutation({
    onSuccess: () => {
      toast.success("Bramka usunięta");
      void goalsQuery.refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const goals = goalsQuery.data ?? [];

  function getScorerHref(scorerUser: { player?: { id: string } | null; coach?: { id: string } | null }) {
    if (scorerUser.player) return `/players/${scorerUser.player.id}`;
    if (scorerUser.coach) return `/coaches/${scorerUser.coach.id}`;
    return null;
  }

  function getScorerName(scorerUser: {
    player?: { firstName: string; lastName: string } | null;
    coach?: { firstName: string; lastName: string } | null;
  }) {
    if (scorerUser.player) return `${scorerUser.player.firstName} ${scorerUser.player.lastName}`;
    if (scorerUser.coach) return `${scorerUser.coach.firstName} ${scorerUser.coach.lastName}`;
    return "Nieznany";
  }

  function GoalsSubsection() {
    if (goals.length === 0 && !isParticipant) return null;

    return (
      <div className="bg-card rounded-xl p-4 mt-4">
        {goals.length > 0 && (
          <>
            <p className="text-[11px] font-bold tracking-wider text-muted-foreground mb-2">STRZELCY</p>
            <div className="space-y-0.5">
              {goals.map((goal) => {
                const name = getScorerName(goal.scorerUser);
                const href = getScorerHref(goal.scorerUser);
                return (
                  <div key={goal.id} className="flex items-center gap-2 py-1.5">
                    <span>⚽</span>
                    {href ? (
                      <Link href={href} className="text-[13px] font-semibold hover:text-primary">
                        {name}
                      </Link>
                    ) : (
                      <span className="text-[13px] font-semibold">{name}</span>
                    )}
                    {goal.minute != null && (
                      <span className="text-[11px] text-muted-foreground">{goal.minute}&apos;</span>
                    )}
                    {goal.ownGoal && (
                      <span className="text-[10px] bg-red-500/10 text-red-400 px-1.5 rounded">(SB)</span>
                    )}
                    {isParticipant && (
                      <button
                        className="ml-auto p-1 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded"
                        onClick={() => removeGoal.mutate({ goalId: goal.id })}
                        disabled={removeGoal.isPending}
                        title="Usuń bramkę"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {isParticipant && (
          <div className="mt-3">
            <button
              className="flex items-center gap-1 text-[12px] text-muted-foreground hover:text-foreground"
              onClick={() => setShowAddForm((v) => !v)}
            >
              {showAddForm ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              Dodaj strzelca
            </button>

            {showAddForm && (
              <div className="bg-muted/50 rounded-lg p-3 mt-3 space-y-3">
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground block mb-1">Strzelec</label>
                  <select
                    className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm"
                    value={scorerUserId}
                    onChange={(e) => setScorerUserId(e.target.value)}
                  >
                    <option value="">— wybierz zawodnika —</option>
                    {homeMembersQuery.data && homeMembersQuery.data.length > 0 && (
                      <optgroup label={ownerClubName}>
                        {homeMembersQuery.data.map((m) => {
                          const name = m.memberUser.player
                            ? `${m.memberUser.player.firstName} ${m.memberUser.player.lastName}`
                            : m.memberUser.coach
                              ? `${m.memberUser.coach.firstName} ${m.memberUser.coach.lastName}`
                              : m.memberUser.id;
                          return (
                            <option key={m.memberUser.id} value={m.memberUser.id}>
                              {name}
                            </option>
                          );
                        })}
                      </optgroup>
                    )}
                    {awayMembersQuery.data && awayMembersQuery.data.length > 0 && (
                      <optgroup label={rivalClubName}>
                        {awayMembersQuery.data.map((m) => {
                          const name = m.memberUser.player
                            ? `${m.memberUser.player.firstName} ${m.memberUser.player.lastName}`
                            : m.memberUser.coach
                              ? `${m.memberUser.coach.firstName} ${m.memberUser.coach.lastName}`
                              : m.memberUser.id;
                          return (
                            <option key={m.memberUser.id} value={m.memberUser.id}>
                              {name}
                            </option>
                          );
                        })}
                      </optgroup>
                    )}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-muted-foreground block mb-1">Minuta (opcjonalnie)</label>
                  <Input
                    type="number"
                    min={0}
                    max={120}
                    className="w-24"
                    value={minute}
                    onChange={(e) => setMinute(e.target.value)}
                    placeholder="np. 45"
                  />
                </div>

                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={ownGoal}
                    onChange={(e) => setOwnGoal(e.target.checked)}
                    className="rounded"
                  />
                  Samobójcza bramka (SB)
                </label>

                <Button
                  size="sm"
                  disabled={!scorerUserId || addGoal.isPending}
                  onClick={() => {
                    if (!scorerUserId) return;
                    const min = minute !== "" ? parseInt(minute, 10) : undefined;
                    addGoal.mutate({
                      sparingOfferId,
                      scorerUserId,
                      minute: min,
                      ownGoal,
                    });
                  }}
                >
                  Dodaj
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  if (status !== "COMPLETED") return null;
  if (!isOwner && !isRival) {
    if (homeScore !== null && scoreConfirmed) {
      return (
        <div>
          <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-4">
            <Trophy className="h-5 w-5 text-emerald-500" />
            <span className="font-semibold">
              {ownerClubName} {homeScore}:{awayScore} {rivalClubName}
            </span>
            <Badge className="bg-emerald-500/10 text-emerald-600">Potwierdzony</Badge>
          </div>
          {goals.length > 0 && (
            <div className="bg-card rounded-xl p-4 mt-4">
              <p className="text-[11px] font-bold tracking-wider text-muted-foreground mb-2">STRZELCY</p>
              <div className="space-y-0.5">
                {goals.map((goal) => {
                  const name = getScorerName(goal.scorerUser);
                  const href = getScorerHref(goal.scorerUser);
                  return (
                    <div key={goal.id} className="flex items-center gap-2 py-1.5">
                      <span>⚽</span>
                      {href ? (
                        <Link href={href} className="text-[13px] font-semibold hover:text-primary">
                          {name}
                        </Link>
                      ) : (
                        <span className="text-[13px] font-semibold">{name}</span>
                      )}
                      {goal.minute != null && (
                        <span className="text-[11px] text-muted-foreground">{goal.minute}&apos;</span>
                      )}
                      {goal.ownGoal && (
                        <span className="text-[10px] bg-red-500/10 text-red-400 px-1.5 rounded">(SB)</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      );
    }
    return null;
  }

  if (homeScore !== null && scoreConfirmed) {
    return (
      <div>
        <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-4">
          <Trophy className="h-5 w-5 text-emerald-500" />
          <span className="font-semibold">
            {ownerClubName} {homeScore}:{awayScore} {rivalClubName}
          </span>
          <Badge className="bg-emerald-500/10 text-emerald-600">Potwierdzony</Badge>
        </div>
        <GoalsSubsection />
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
