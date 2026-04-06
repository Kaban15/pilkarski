"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";
import { api } from "@/lib/trpc-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RegionLogo } from "@/components/region-logo";
import { Send, Search, Clock, Check, X, MapPin, Users, Filter } from "lucide-react";

interface InviteClubDialogProps {
  sparingOfferId: string;
}

type ClubSearchResult = {
  id: string;
  name: string;
  city: string | null;
  logoUrl: string | null;
  region: { name: string; slug: string } | null;
  leagueGroup: {
    name: string;
    leagueLevel: { name: string };
  } | null;
};

export function InviteClubDialog({ sparingOfferId }: InviteClubDialogProps) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedClub, setSelectedClub] = useState<ClubSearchResult | null>(null);
  const [message, setMessage] = useState("");
  const [expiresInHours, setExpiresInHours] = useState(48);

  // Filter state
  const [regionId, setRegionId] = useState<number | null>(null);
  const [leagueLevelId, setLeagueLevelId] = useState<number | null>(null);
  const [leagueGroupId, setLeagueGroupId] = useState<number | null>(null);

  const utils = api.useUtils();

  const { data: myClub } = api.club.me.useQuery(undefined, {
    staleTime: Infinity,
    retry: false,
  });

  const { data: regions = [] } = api.region.list.useQuery(undefined, {
    enabled: open,
    staleTime: Infinity,
  });

  const { data: hierarchy = [] } = api.region.hierarchy.useQuery(
    { regionId: regionId! },
    { enabled: open && !!regionId },
  );

  const selectedLevel = hierarchy.find((l: { id: number }) => l.id === leagueLevelId) as
    | { id: number; name: string; groups: { id: number; name: string }[] }
    | undefined;

  // Search by name
  const searchByName = api.club.list.useQuery(
    { search, limit: 8, prioritizeForClubId: myClub?.id },
    { enabled: open && search.length >= 2 },
  );

  // Browse by filters (when no text search)
  const browseByFilter = api.club.list.useQuery(
    {
      regionId: regionId ?? undefined,
      leagueLevelId: leagueLevelId ?? undefined,
      leagueGroupId: leagueGroupId ?? undefined,
      limit: 10,
      prioritizeForClubId: myClub?.id,
    },
    { enabled: open && search.length < 2 && !!regionId },
  );

  const clubs =
    search.length >= 2
      ? searchByName.data?.clubs ?? []
      : browseByFilter.data?.clubs ?? [];
  const isLoading =
    search.length >= 2 ? searchByName.isLoading : browseByFilter.isLoading;
  const showResults = search.length >= 2 || !!regionId;

  const inviteMut = api.sparing.invite.useMutation({
    onSuccess: () => {
      toast.success(t("Zaproszenie wysłane!"));
      setOpen(false);
      setSelectedClub(null);
      setMessage("");
      setSearch("");
      setRegionId(null);
      setLeagueLevelId(null);
      setLeagueGroupId(null);
      utils.sparing.myInvitations.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  function handleSend() {
    if (!selectedClub) return;
    inviteMut.mutate({
      sparingOfferId,
      toClubId: selectedClub.id,
      message: message || undefined,
      expiresInHours,
    });
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="group flex w-full items-center gap-4 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 px-5 py-4 transition-all hover:border-primary/60 hover:bg-primary/10"
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/15 transition-colors group-hover:bg-primary/25">
          <Send className="h-5 w-5 text-primary" />
        </div>
        <div className="text-left">
          <p className="text-sm font-semibold text-primary">{t("Zaproś klub na sparing")}</p>
          <p className="text-[12px] text-muted-foreground">
            {t("Wyszukaj po nazwie lub przeglądaj kluby z regionu i ligi")}
          </p>
        </div>
      </button>
    );
  }

  return (
    <Card className="border-primary/20">
      <CardContent className="space-y-4 py-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">{t("Zaproś klub na sparing")}</p>
          <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        {!selectedClub ? (
          <>
            {/* Search by name */}
            <div className="space-y-2">
              <Label>{t("Szukaj po nazwie")}</Label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t("Nazwa klubu...")}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Divider */}
            {search.length < 2 && (
              <>
                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-[11px] font-medium text-muted-foreground">{t("lub przeglądaj")}</span>
                  <div className="h-px flex-1 bg-border" />
                </div>

                {/* Filter by region / league / group */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <Filter className="h-3.5 w-3.5" />
                    {t("Filtruj po regionie i lidze")}
                  </div>

                  {/* Region */}
                  <select
                    value={regionId ?? ""}
                    onChange={(e) => {
                      const val = e.target.value ? Number(e.target.value) : null;
                      setRegionId(val);
                      setLeagueLevelId(null);
                      setLeagueGroupId(null);
                    }}
                    className="flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">{t("Wybierz region (ZPN)")}</option>
                    {regions.map((r: { id: number; name: string }) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>

                  {/* League level */}
                  {regionId && hierarchy.length > 0 && (
                    <select
                      value={leagueLevelId ?? ""}
                      onChange={(e) => {
                        const val = e.target.value ? Number(e.target.value) : null;
                        setLeagueLevelId(val);
                        setLeagueGroupId(null);
                      }}
                      className="flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="">{t("Wszystkie szczeble")}</option>
                      {hierarchy.map((l: { id: number; name: string }) => (
                        <option key={l.id} value={l.id}>
                          {l.name}
                        </option>
                      ))}
                    </select>
                  )}

                  {/* League group */}
                  {selectedLevel && selectedLevel.groups.length > 1 && (
                    <select
                      value={leagueGroupId ?? ""}
                      onChange={(e) =>
                        setLeagueGroupId(e.target.value ? Number(e.target.value) : null)
                      }
                      className="flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="">{t("Wszystkie grupy")}</option>
                      {selectedLevel.groups.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </>
            )}

            {/* Results */}
            {showResults && (
              <div className="max-h-60 space-y-1 overflow-y-auto">
                {isLoading ? (
                  <p className="py-3 text-center text-xs text-muted-foreground">{t("Szukam...")}</p>
                ) : clubs.length === 0 ? (
                  <p className="py-3 text-center text-xs text-muted-foreground">
                    {search.length >= 2 ? t("Brak wyników") : t("Brak klubów w wybranym filtrze")}
                  </p>
                ) : (
                  <>
                    <p className="pb-1 text-[11px] font-medium text-muted-foreground">
                      {search.length >= 2
                        ? `${t("Wyniki wyszukiwania")} (${clubs.length})`
                        : `${t("Kluby")} (${clubs.length})`}
                    </p>
                    {clubs.map((club: ClubSearchResult) => (
                      <button
                        key={club.id}
                        onClick={() => setSelectedClub(club)}
                        className="flex w-full items-center gap-3 rounded-lg border border-transparent px-3 py-2 text-left transition hover:border-border hover:bg-muted"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted">
                          {club.logoUrl ? (
                            <img src={club.logoUrl} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <span className="text-[10px] font-bold text-muted-foreground">
                              {club.name.slice(0, 2).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-medium">{club.name}</p>
                          <p className="flex flex-wrap items-center gap-1 text-[11px] text-muted-foreground">
                            {club.city && (
                              <>
                                <MapPin className="h-3 w-3 shrink-0" />
                                <span>{club.city}</span>
                              </>
                            )}
                            {club.region && (
                              <>
                                {club.city && <span>·</span>}
                                <RegionLogo slug={club.region.slug} name={club.region.name} size={12} />
                                <span>{club.region.name}</span>
                              </>
                            )}
                            {club.leagueGroup && (
                              <>
                                <span>·</span>
                                <span>{club.leagueGroup.leagueLevel.name} — {club.leagueGroup.name}</span>
                              </>
                            )}
                          </p>
                        </div>
                      </button>
                    ))}
                  </>
                )}
              </div>
            )}
          </>
        ) : (
          <>
            <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted">
                {selectedClub.logoUrl ? (
                  <img src={selectedClub.logoUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-[10px] font-bold text-muted-foreground">
                    {selectedClub.name.slice(0, 2).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex-1">
                <p className="text-[13px] font-semibold">{selectedClub.name}</p>
                <p className="flex flex-wrap items-center gap-1 text-[11px] text-muted-foreground">
                  {selectedClub.city}
                  {selectedClub.region && (
                    <>
                      {selectedClub.city && <span>·</span>}
                      <RegionLogo slug={selectedClub.region.slug} name={selectedClub.region.name} size={12} />
                      <span>{selectedClub.region.name}</span>
                    </>
                  )}
                  {selectedClub.leagueGroup && (
                    <>
                      <span>·</span>
                      <span>{selectedClub.leagueGroup.leagueLevel.name} — {selectedClub.leagueGroup.name}</span>
                    </>
                  )}
                </p>
              </div>
              <button onClick={() => setSelectedClub(null)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2">
              <Label>{t("Wiadomość (opcjonalnie)")}</Label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t("np. Zapraszamy na sparing, gramy na naszym boisku...")}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                {t("Zaproszenie ważne przez")}
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  max={168}
                  value={expiresInHours}
                  onChange={(e) => setExpiresInHours(Number(e.target.value))}
                  className="w-20"
                />
                <span className="text-sm text-muted-foreground">{t("godzin")}</span>
              </div>
            </div>

            <Button onClick={handleSend} disabled={inviteMut.isPending} className="w-full gap-2">
              <Send className="h-4 w-4" />
              {inviteMut.isPending ? t("Wysyłanie...") : t("Wyślij zaproszenie")}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// Section showing received invitations for the invited club
export function ReceivedInvitations({ sparingOfferId }: { sparingOfferId: string }) {
  const { t } = useI18n();
  const { data } = api.sparing.myInvitations.useQuery();
  const utils = api.useUtils();

  const respondMut = api.sparing.respondToInvitation.useMutation({
    onSuccess: (result) => {
      toast.success(result.accepted ? t("Zaproszenie zaakceptowane!") : t("Zaproszenie odrzucone"));
      utils.sparing.myInvitations.invalidate();
      utils.sparing.getById.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const received = data?.received?.filter((inv) => inv.sparingOfferId === sparingOfferId) ?? [];
  if (received.length === 0) return null;

  return (
    <Card className="border-emerald-500/20 bg-emerald-500/5">
      <CardContent className="py-4">
        <p className="mb-3 text-sm font-semibold">{t("Otrzymane zaproszenie")}</p>
        {received.map((inv) => {
          const isExpired = inv.expiresAt && new Date(inv.expiresAt) < new Date();
          return (
            <div key={inv.id} className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted">
                  {inv.fromClub.logoUrl ? (
                    <img src={inv.fromClub.logoUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-[10px] font-bold text-muted-foreground">
                      {inv.fromClub.name.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-[13px] font-semibold">{inv.fromClub.name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {inv.fromClub.city}
                    {inv.expiresAt && (
                      <span className="ml-1">
                        · {t("ważne do")} {new Date(inv.expiresAt).toLocaleString("pl-PL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    )}
                  </p>
                </div>
              </div>
              {inv.message && (
                <p className="text-[13px] text-muted-foreground italic">"{inv.message}"</p>
              )}
              {isExpired ? (
                <Badge variant="secondary">{t("Wygasło")}</Badge>
              ) : (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="gap-1.5"
                    onClick={() => respondMut.mutate({ invitationId: inv.id, accept: true })}
                    disabled={respondMut.isPending}
                  >
                    <Check className="h-3.5 w-3.5" />
                    {t("Akceptuj")}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5"
                    onClick={() => respondMut.mutate({ invitationId: inv.id, accept: false })}
                    disabled={respondMut.isPending}
                  >
                    <X className="h-3.5 w-3.5" />
                    {t("Odrzuć")}
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

// Section showing sent invitations for the owner
export function SentInvitations({ sparingOfferId }: { sparingOfferId: string }) {
  const { t } = useI18n();
  const { data } = api.sparing.myInvitations.useQuery();

  const sent = data?.sent?.filter((inv) => inv.sparingOfferId === sparingOfferId) ?? [];
  if (sent.length === 0) return null;

  const STATUS_LABELS: Record<string, string> = {
    PENDING: t("Oczekuje"),
    ACCEPTED: t("Zaakceptowane"),
    REJECTED: t("Odrzucone"),
    EXPIRED: t("Wygasło"),
  };

  const STATUS_COLORS: Record<string, string> = {
    PENDING: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
    ACCEPTED: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    REJECTED: "bg-red-500/10 text-red-700 dark:text-red-400",
    EXPIRED: "bg-muted text-muted-foreground",
  };

  return (
    <Card>
      <CardContent className="py-4">
        <p className="mb-3 text-sm font-semibold">{t("Wysłane zaproszenia")}</p>
        <div className="space-y-2">
          {sent.map((inv) => (
            <div key={inv.id} className="flex items-center gap-3 rounded-lg border border-border px-3 py-2">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted">
                {inv.toClub.logoUrl ? (
                  <img src={inv.toClub.logoUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-[9px] font-bold text-muted-foreground">
                    {inv.toClub.name.slice(0, 2).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium">{inv.toClub.name}</p>
                {inv.toClub.city && (
                  <p className="text-[11px] text-muted-foreground">{inv.toClub.city}</p>
                )}
              </div>
              <Badge className={`text-[10px] ${STATUS_COLORS[inv.status] ?? ""}`}>
                {STATUS_LABELS[inv.status] ?? inv.status}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
