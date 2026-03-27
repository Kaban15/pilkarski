"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { api } from "@/lib/trpc-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CardSkeleton } from "@/components/card-skeleton";
import { EmptyState } from "@/components/empty-state";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { POSITION_LABELS, COACH_SPECIALIZATION_LABELS } from "@/lib/labels";
import { Users, Check, X, UserMinus, Shield } from "lucide-react";
import { InviteMemberDialog } from "@/components/squad/invite-member-dialog";

export default function SquadPage() {
  const { data: session } = useSession();
  const isClub = session?.user?.role === "CLUB";
  const [tab, setTab] = useState<"requests" | "players" | "coaches">("players");
  const [removingId, setRemovingId] = useState<string | null>(null);

  const utils = api.useUtils();

  const { data: club } = api.club.me.useQuery(undefined, { enabled: isClub, staleTime: Infinity });
  const clubId = club?.id;

  const { data: requests = [], isLoading: loadingReqs } = api.clubMembership.listRequestsForClub.useQuery(
    undefined, { enabled: isClub }
  );
  const { data: members = [], isLoading: loadingMembers } = api.clubMembership.listMembers.useQuery(
    { clubId: clubId! }, { enabled: !!clubId }
  );

  const respondMut = api.clubMembership.respond.useMutation({
    onSuccess: () => {
      utils.clubMembership.listRequestsForClub.invalidate();
      utils.clubMembership.listMembers.invalidate();
      toast.success("Obsłużono");
    },
    onError: (err) => toast.error(err.message),
  });

  const removeMut = api.clubMembership.removeMember.useMutation({
    onSuccess: () => {
      utils.clubMembership.listMembers.invalidate();
      setRemovingId(null);
      toast.success("Członek usunięty");
    },
    onError: (err) => toast.error(err.message),
  });

  const permMut = api.clubMembership.setPermissions.useMutation({
    onSuccess: () => {
      toast.success("Uprawnienia zaktualizowane");
      utils.clubMembership.listMembers.invalidate();
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });

  const isOwner = club?.userId === session?.user?.id;

  if (!isClub) {
    return <EmptyState icon={Shield} title="Sekcja dla klubów" description="Zarządzanie kadrą dostępne tylko dla kont klubowych." />;
  }

  const players = members.filter((m) => m.memberType === "PLAYER");
  const coaches = members.filter((m) => m.memberType === "COACH");
  const pendingCount = requests.length;

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Kadra klubu</h1>
          {isOwner && (
            <InviteMemberDialog onInvited={() => {
              utils.clubMembership.listMembers.invalidate();
              utils.clubMembership.listRequestsForClub.invalidate();
            }} />
          )}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">Zarządzaj zawodnikami i trenerami</p>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="mb-6">
        <TabsList>
          <TabsTrigger value="players">Zawodnicy ({players.length})</TabsTrigger>
          <TabsTrigger value="coaches">Trenerzy ({coaches.length})</TabsTrigger>
          <TabsTrigger value="requests">
            Prośby {pendingCount > 0 && <Badge className="ml-1.5 h-5 min-w-5 rounded-full px-1.5 text-[10px]">{pendingCount}</Badge>}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Requests tab */}
      {tab === "requests" && (
        loadingReqs ? (
          <div className="space-y-3">{Array.from({ length: 2 }).map((_, i) => <CardSkeleton key={i} />)}</div>
        ) : requests.length === 0 ? (
          <EmptyState icon={Users} title="Brak próśb" description="Nie ma oczekujących próśb o dołączenie." />
        ) : (
          <div className="space-y-3">
            {requests.map((req) => {
              const p = req.memberUser.player;
              const c = req.memberUser.coach;
              const name = p ? `${p.firstName} ${p.lastName}` : c ? `${c.firstName} ${c.lastName}` : "—";
              const detail = p?.primaryPosition ? POSITION_LABELS[p.primaryPosition] : c?.specialization ? COACH_SPECIALIZATION_LABELS[c.specialization] ?? c.specialization : null;
              const photo = p?.photoUrl ?? c?.photoUrl;

              return (
                <Card key={req.id}>
                  <CardContent className="flex items-center gap-4 py-4">
                    {photo ? (
                      <img src={photo} alt="" className="h-10 w-10 rounded-full object-cover" />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-bold text-muted-foreground">
                        {name.split(" ").map((n) => n[0]).join("")}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">{name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="secondary" className="text-[10px]">{req.memberType === "COACH" ? "Trener" : "Zawodnik"}</Badge>
                        <Badge className={req.status === "INVITED" ? "bg-amber-500/10 text-amber-600" : "bg-blue-500/10 text-blue-600"}>
                          {req.status === "INVITED" ? "Zaproszony" : "Prośba"}
                        </Badge>
                        {detail && <span className="text-[11px] text-muted-foreground">{detail}</span>}
                      </div>
                      {req.message && <p className="mt-1 text-[11px] text-muted-foreground italic">"{req.message}"</p>}
                    </div>
                    {req.status !== "INVITED" && (
                      <div className="flex gap-1.5">
                        <Button size="sm" className="h-8 gap-1" onClick={() => respondMut.mutate({ membershipId: req.id, decision: "ACCEPT" })} disabled={respondMut.isPending}>
                          <Check className="h-3.5 w-3.5" /> Akceptuj
                        </Button>
                        <Button size="sm" variant="outline" className="h-8 gap-1" onClick={() => respondMut.mutate({ membershipId: req.id, decision: "REJECT" })} disabled={respondMut.isPending}>
                          <X className="h-3.5 w-3.5" /> Odrzuć
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )
      )}

      {/* Players tab */}
      {tab === "players" && (
        loadingMembers ? (
          <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)}</div>
        ) : players.length === 0 ? (
          <EmptyState icon={Users} title="Brak zawodników" description="Twój klub nie ma jeszcze zawodników. Zaakceptuj prośby o dołączenie." />
        ) : (
          <div className="space-y-2">
            {players.map((m) => {
              const p = m.memberUser.player;
              if (!p) return null;
              return (
                <div key={m.id} className="flex items-center gap-3 rounded-lg border border-border px-4 py-3">
                  {p.photoUrl ? (
                    <img src={p.photoUrl} alt="" className="h-9 w-9 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                      {p.firstName[0]}{p.lastName[0]}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold">{p.firstName} {p.lastName}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {p.primaryPosition ? POSITION_LABELS[p.primaryPosition] : ""}
                      {p.city ? ` · ${p.city}` : ""}
                    </p>
                  </div>
                  {isOwner && (
                    <Button
                      size="sm"
                      variant={m.canManageEvents ? "default" : "outline"}
                      className={`text-xs ${m.canManageEvents ? "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20" : ""}`}
                      onClick={() => permMut.mutate({
                        membershipId: m.id,
                        canManageEvents: !m.canManageEvents,
                      })}
                      disabled={permMut.isPending}
                    >
                      {m.canManageEvents ? "✓ Zarządza wydarzeniami" : "Nadaj uprawnienia"}
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" className="h-7 text-xs text-muted-foreground hover:text-destructive" onClick={() => setRemovingId(m.id)}>
                    <UserMinus className="h-3.5 w-3.5" />
                  </Button>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Coaches tab */}
      {tab === "coaches" && (
        loadingMembers ? (
          <div className="space-y-3">{Array.from({ length: 2 }).map((_, i) => <CardSkeleton key={i} />)}</div>
        ) : coaches.length === 0 ? (
          <EmptyState icon={Users} title="Brak trenerów" description="Twój klub nie ma jeszcze trenerów." />
        ) : (
          <div className="space-y-2">
            {coaches.map((m) => {
              const c = m.memberUser.coach;
              if (!c) return null;
              return (
                <div key={m.id} className="flex items-center gap-3 rounded-lg border border-border px-4 py-3">
                  {c.photoUrl ? (
                    <img src={c.photoUrl} alt="" className="h-9 w-9 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                      {c.firstName[0]}{c.lastName[0]}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold">{c.firstName} {c.lastName}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {c.specialization ? COACH_SPECIALIZATION_LABELS[c.specialization] ?? c.specialization : "Trener"}
                    </p>
                  </div>
                  {isOwner && (
                    <Button
                      size="sm"
                      variant={m.canManageEvents ? "default" : "outline"}
                      className={`text-xs ${m.canManageEvents ? "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20" : ""}`}
                      onClick={() => permMut.mutate({
                        membershipId: m.id,
                        canManageEvents: !m.canManageEvents,
                      })}
                      disabled={permMut.isPending}
                    >
                      {m.canManageEvents ? "✓ Zarządza wydarzeniami" : "Nadaj uprawnienia"}
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" className="h-7 text-xs text-muted-foreground hover:text-destructive" onClick={() => setRemovingId(m.id)}>
                    <UserMinus className="h-3.5 w-3.5" />
                  </Button>
                </div>
              );
            })}
          </div>
        )
      )}

      <ConfirmDialog
        open={!!removingId}
        onOpenChange={(open) => !open && setRemovingId(null)}
        title="Usuń z klubu"
        description="Czy na pewno chcesz usunąć tego członka z klubu?"
        onConfirm={() => removingId && removeMut.mutate({ membershipId: removingId })}
        loading={removeMut.isPending}
        variant="destructive"
      />
    </div>
  );
}
