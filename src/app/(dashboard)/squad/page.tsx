"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { api } from "@/lib/trpc-react";
import { useI18n } from "@/lib/i18n";
import { Badge } from "@/components/ui/badge";
import { CardSkeleton } from "@/components/card-skeleton";
import { EmptyState } from "@/components/empty-state";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { POSITION_LABELS, COACH_SPECIALIZATION_LABELS } from "@/lib/labels";
import { Users, Check, X, UserMinus, Shield } from "lucide-react";
import { InviteMemberDialog } from "@/components/squad/invite-member-dialog";
import { PositionGroup, POSITION_GROUPS } from "@/components/squad/position-group";
import Link from "next/link";

export default function SquadPage() {
  const { t } = useI18n();
  const { data: session } = useSession();
  const isClub = session?.user?.role === "CLUB";
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
      toast.success(t("Obsłużono"));
    },
    onError: (err) => toast.error(err.message),
  });

  const removeMut = api.clubMembership.removeMember.useMutation({
    onSuccess: () => {
      utils.clubMembership.listMembers.invalidate();
      setRemovingId(null);
      toast.success(t("Członek usunięty"));
    },
    onError: (err) => toast.error(err.message),
  });

  const permMut = api.clubMembership.setPermissions.useMutation({
    onSuccess: () => {
      toast.success(t("Uprawnienia zaktualizowane"));
      utils.clubMembership.listMembers.invalidate();
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });

  const isOwner = club?.userId === session?.user?.id;

  if (!isClub) {
    return (
      <EmptyState
        icon={Shield}
        title={t("Sekcja dla klubów")}
        description={t("Zarządzanie kadrą dostępne tylko dla kont klubowych.")}
      />
    );
  }

  const players = members.filter((m) => m.memberType === "PLAYER");
  const coaches = members.filter((m) => m.memberType === "COACH");

  // Group players by position
  const matchedPlayerIds = new Set<string>();
  const positionGroupData = POSITION_GROUPS.map((group) => {
    const groupPlayers = players
      .filter((m) => {
        const pos = m.memberUser.player?.primaryPosition ?? null;
        return pos && group.positions.includes(pos);
      })
      .map((m) => {
        const p = m.memberUser.player!;
        matchedPlayerIds.add(m.id);
        return {
          id: p.id,
          userId: m.id, // membership id used as key / for remove
          firstName: p.firstName,
          lastName: p.lastName,
          photoUrl: p.photoUrl,
          position: p.primaryPosition,
          age: null,
          height: null,
          preferredFoot: null,
        };
      });
    return { ...group, groupPlayers };
  });

  // Players with no matched position → "Inni"
  const otherPlayers = players
    .filter((m) => !matchedPlayerIds.has(m.id))
    .map((m) => {
      const p = m.memberUser.player;
      if (!p) return null;
      return {
        id: p.id,
        userId: m.id,
        firstName: p.firstName,
        lastName: p.lastName,
        photoUrl: p.photoUrl,
        position: p.primaryPosition ?? null,
        age: null,
        height: null,
        preferredFoot: null,
      };
    })
    .filter(Boolean) as {
      id: string;
      userId: string;
      firstName: string | null;
      lastName: string | null;
      photoUrl?: string | null;
      position?: string | null;
      age?: number | null;
      height?: number | null;
      preferredFoot?: string | null;
    }[];

  const hasAnyPlayer = players.length > 0;

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t("Kadra")}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {players.length} {t("zawodników")} · {coaches.length} {t("trenerów")}
            </p>
          </div>
          {isOwner && (
            <InviteMemberDialog
              onInvited={() => {
                utils.clubMembership.listMembers.invalidate();
                utils.clubMembership.listRequestsForClub.invalidate();
              }}
            />
          )}
        </div>
      </div>

      {/* Position Groups */}
      {loadingMembers ? (
        <div className="space-y-3 mb-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : !hasAnyPlayer ? (
        <EmptyState
          icon={Users}
          title={t("Brak zawodników")}
          description={t("Twój klub nie ma jeszcze zawodników. Zaakceptuj prośby o dołączenie.")}
        />
      ) : (
        <div className="mb-6">
          {positionGroupData.map((group) => (
            <PositionGroup
              key={group.key}
              label={group.label}
              color={group.color}
              players={group.groupPlayers}
              showActions={isOwner}
              onRemove={(membershipId) => setRemovingId(membershipId)}
              removingId={removingId}
              collapsedMax={20}
            />
          ))}
          {otherPlayers.length > 0 && (
            <PositionGroup
              label={t("Inni")}
              color="blue"
              players={otherPlayers}
              showActions={isOwner}
              onRemove={(membershipId) => setRemovingId(membershipId)}
              removingId={removingId}
              collapsedMax={20}
            />
          )}
        </div>
      )}

      {/* Coaches Section */}
      {coaches.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-1.5 mb-2">
            <div className="w-[3px] h-3.5 rounded-sm bg-amber-500" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              {t("Trenerzy")}
            </span>
            <span className="text-[11px] text-muted-foreground/60">{coaches.length}</span>
          </div>
          <div className="bg-card rounded-xl overflow-hidden divide-y divide-border">
            {coaches.map((m) => {
              const c = m.memberUser.coach;
              if (!c) return null;
              const name = `${c.firstName} ${c.lastName}`;
              const initials = `${(c.firstName?.[0] || "").toUpperCase()}${(c.lastName?.[0] || "").toUpperCase()}`;
              const specialization = c.specialization
                ? t(COACH_SPECIALIZATION_LABELS[c.specialization] ?? c.specialization)
                : null;

              return (
                <div key={m.id} className="flex items-center px-3 py-2.5 gap-2.5">
                  <Link
                    href={`/coaches/${c.id}`}
                    className="flex items-center gap-2.5 flex-1 min-w-0 hover:text-primary transition-colors"
                  >
                    {c.photoUrl ? (
                      <img
                        src={c.photoUrl}
                        alt={name}
                        className="w-9 h-9 rounded-full object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold shrink-0">
                        {initials}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="text-[13px] font-semibold truncate">{name}</div>
                      {specialization && (
                        <div className="text-[11px] text-muted-foreground">
                          {specialization}
                        </div>
                      )}
                    </div>
                  </Link>
                  {m.canManageEvents && (
                    <Badge className="bg-amber-500/10 text-amber-600 text-[10px] shrink-0">
                      {t("Zarządza")}
                    </Badge>
                  )}
                  {isOwner && (
                    <button
                      onClick={() => setRemovingId(m.id)}
                      className="ml-1 p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors shrink-0"
                    >
                      <UserMinus className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Pending Requests */}
      {loadingReqs ? (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : requests.length > 0 ? (
        <div className="mb-6">
          <div className="flex items-center gap-1.5 mb-2">
            <div className="w-[3px] h-3.5 rounded-sm bg-violet-500" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              {t("Oczekujące")}
            </span>
            <span className="text-[11px] text-muted-foreground/60">{requests.length}</span>
          </div>
          <div className="bg-card rounded-xl overflow-hidden divide-y divide-border">
            {requests.map((req) => {
              const p = req.memberUser.player;
              const c = req.memberUser.coach;
              const name = p
                ? `${p.firstName} ${p.lastName}`
                : c
                ? `${c.firstName} ${c.lastName}`
                : "—";
              const initials = name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase();
              const photo = p?.photoUrl ?? c?.photoUrl;
              const profileHref = p
                ? `/players/${p.id}`
                : c
                ? `/coaches/${c.id}`
                : null;
              const detail = p?.primaryPosition
                ? t(POSITION_LABELS[p.primaryPosition] ?? p.primaryPosition)
                : c?.specialization
                ? t(COACH_SPECIALIZATION_LABELS[c.specialization] ?? c.specialization)
                : null;

              return (
                <div key={req.id} className="flex items-center px-3 py-2.5 gap-2.5">
                  {photo ? (
                    <img
                      src={photo}
                      alt={name}
                      className="w-9 h-9 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold shrink-0">
                      {initials}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-semibold truncate">
                      {profileHref ? (
                        <Link
                          href={profileHref}
                          className="hover:underline hover:text-primary"
                        >
                          {name}
                        </Link>
                      ) : (
                        name
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <Badge variant="secondary" className="text-[10px]">
                        {req.memberType === "COACH" ? t("Trener") : t("Zawodnik")}
                      </Badge>
                      <Badge
                        className={
                          req.status === "INVITED"
                            ? "bg-amber-500/10 text-amber-600 text-[10px]"
                            : "bg-blue-500/10 text-blue-600 text-[10px]"
                        }
                      >
                        {req.status === "INVITED" ? t("ZAPROSZONY") : t("PROŚBA")}
                      </Badge>
                      {detail && (
                        <span className="text-[11px] text-muted-foreground">{detail}</span>
                      )}
                    </div>
                    {req.message && (
                      <p className="mt-1 text-[11px] text-muted-foreground italic">
                        &ldquo;{req.message}&rdquo;
                      </p>
                    )}
                  </div>
                  {req.status !== "INVITED" && (
                    <div className="flex gap-1.5 shrink-0">
                      <button
                        className="flex items-center gap-1 bg-emerald-600 text-white text-[11px] font-semibold px-2.5 py-1.5 rounded-lg disabled:opacity-50"
                        onClick={() =>
                          respondMut.mutate({
                            membershipId: req.id,
                            decision: "ACCEPT",
                          })
                        }
                        disabled={respondMut.isPending}
                      >
                        <Check className="h-3 w-3" />
                      </button>
                      <button
                        className="flex items-center gap-1 bg-red-600 text-white text-[11px] font-semibold px-2.5 py-1.5 rounded-lg disabled:opacity-50"
                        onClick={() =>
                          respondMut.mutate({
                            membershipId: req.id,
                            decision: "REJECT",
                          })
                        }
                        disabled={respondMut.isPending}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={!!removingId}
        onOpenChange={(open) => !open && setRemovingId(null)}
        title={t("Usuń z klubu")}
        description={t("Czy na pewno chcesz usunąć tego członka z klubu?")}
        onConfirm={() => removingId && removeMut.mutate({ membershipId: removingId })}
        loading={removeMut.isPending}
        variant="destructive"
      />
    </div>
  );
}
