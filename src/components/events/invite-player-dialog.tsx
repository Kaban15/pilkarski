"use client";

import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/trpc-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RegionLogo } from "@/components/region-logo";
import { POSITION_LABELS } from "@/lib/labels";
import { Send, Search, X, Filter, UserPlus } from "lucide-react";

interface InvitePlayerDialogProps {
  eventId: string;
  regionId?: number | null;
}

type PlayerSearchResult = {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  primaryPosition: string | null;
  photoUrl: string | null;
  clubName: string | null;
  clubCity: string | null;
  region: { name: string; slug: string } | null;
};

export function InvitePlayerDialog({ eventId, regionId: eventRegionId }: InvitePlayerDialogProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerSearchResult | null>(null);
  const [message, setMessage] = useState("");

  // Filters
  const [regionId, setRegionId] = useState<number | null>(eventRegionId ?? null);
  const [leagueLevelId, setLeagueLevelId] = useState<number | null>(null);
  const [leagueGroupId, setLeagueGroupId] = useState<number | null>(null);
  const [position, setPosition] = useState<string | null>(null);

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

  // Search query
  const searchQuery = api.player.search.useQuery(
    {
      search: search.length >= 2 ? search : undefined,
      regionId: regionId ?? undefined,
      leagueLevelId: leagueLevelId ?? undefined,
      leagueGroupId: leagueGroupId ?? undefined,
      position: (position as any) ?? undefined,
      prioritizeForRegionId: eventRegionId ?? undefined,
      limit: 20,
    },
    { enabled: open && (search.length >= 2 || !!regionId || !!position) },
  );

  const players = searchQuery.data ?? [];
  const isLoading = searchQuery.isLoading;
  const showResults = search.length >= 2 || !!regionId || !!position;

  const inviteMut = api.event.invitePlayer.useMutation({
    onSuccess: () => {
      toast.success("Zaproszenie wysłane!");
      setSelectedPlayer(null);
      setMessage("");
    },
    onError: (err) => toast.error(err.message),
  });

  function handleSend() {
    if (!selectedPlayer) return;
    inviteMut.mutate({
      eventId,
      toUserId: selectedPlayer.userId,
      message: message || undefined,
    });
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="group flex w-full items-center gap-4 rounded-xl border-2 border-dashed border-sport-cyan/30 bg-sport-cyan/5 px-5 py-4 transition-all hover:border-sport-cyan/60 hover:bg-sport-cyan/10"
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sport-cyan/15 transition-colors group-hover:bg-sport-cyan/25">
          <UserPlus className="h-5 w-5 text-sport-cyan" />
        </div>
        <div className="text-left">
          <p className="text-sm font-semibold text-sport-cyan">Zaproś zawodników</p>
          <p className="text-[12px] text-muted-foreground">
            Wyszukaj po imieniu, pozycji, regionie lub lidze
          </p>
        </div>
      </button>
    );
  }

  return (
    <Card className="border-sport-cyan/20">
      <CardContent className="space-y-4 py-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Zaproś zawodników</p>
          <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        {!selectedPlayer ? (
          <>
            {/* Search by name */}
            <div className="space-y-2">
              <Label>Szukaj po imieniu</Label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Imię lub nazwisko..."
                  className="pl-9"
                />
              </div>
            </div>

            {/* Filters */}
            {search.length < 2 && (
              <>
                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-[11px] font-medium text-muted-foreground">lub przeglądaj</span>
                  <div className="h-px flex-1 bg-border" />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <Filter className="h-3.5 w-3.5" />
                    Filtruj po regionie, lidze i pozycji
                  </div>

                  {/* Position */}
                  <select
                    value={position ?? ""}
                    onChange={(e) => setPosition(e.target.value || null)}
                    className="flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Wszystkie pozycje</option>
                    {Object.entries(POSITION_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>

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
                    <option value="">Wybierz region (ZPN)</option>
                    {regions.map((r: { id: number; name: string }) => (
                      <option key={r.id} value={r.id}>{r.name}</option>
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
                      <option value="">Wszystkie szczeble</option>
                      {hierarchy.map((l: { id: number; name: string }) => (
                        <option key={l.id} value={l.id}>{l.name}</option>
                      ))}
                    </select>
                  )}

                  {/* League group */}
                  {selectedLevel && selectedLevel.groups.length > 1 && (
                    <select
                      value={leagueGroupId ?? ""}
                      onChange={(e) => setLeagueGroupId(e.target.value ? Number(e.target.value) : null)}
                      className="flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="">Wszystkie grupy</option>
                      {selectedLevel.groups.map((g) => (
                        <option key={g.id} value={g.id}>{g.name}</option>
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
                  <p className="py-3 text-center text-xs text-muted-foreground">Szukam...</p>
                ) : players.length === 0 ? (
                  <p className="py-3 text-center text-xs text-muted-foreground">
                    {search.length >= 2 ? "Brak wyników" : "Brak zawodników w wybranym filtrze"}
                  </p>
                ) : (
                  <>
                    <p className="pb-1 text-[11px] font-medium text-muted-foreground">
                      Zawodnicy ({players.length})
                    </p>
                    {players.map((player: PlayerSearchResult) => (
                      <button
                        key={player.id}
                        onClick={() => setSelectedPlayer(player)}
                        className="flex w-full items-center gap-3 rounded-lg border border-transparent px-3 py-2 text-left transition hover:border-border hover:bg-muted"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
                          {player.photoUrl ? (
                            <img src={player.photoUrl} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <span className="text-[10px] font-bold text-muted-foreground">
                              {player.firstName[0]}{player.lastName[0]}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-medium">
                            {player.firstName} {player.lastName}
                          </p>
                          <p className="flex flex-wrap items-center gap-1 text-[11px] text-muted-foreground">
                            {player.primaryPosition && (
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                {POSITION_LABELS[player.primaryPosition] ?? player.primaryPosition}
                              </Badge>
                            )}
                            {player.clubName && (
                              <>
                                <span>{player.clubName}</span>
                              </>
                            )}
                            {player.region && (
                              <>
                                {player.clubName && <span>·</span>}
                                <RegionLogo slug={player.region.slug} name={player.region.name} size={12} />
                                <span>{player.region.name}</span>
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
            {/* Selected player */}
            <div className="flex items-center gap-3 rounded-lg border border-sport-cyan/20 bg-sport-cyan/5 px-3 py-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
                {selectedPlayer.photoUrl ? (
                  <img src={selectedPlayer.photoUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-[10px] font-bold text-muted-foreground">
                    {selectedPlayer.firstName[0]}{selectedPlayer.lastName[0]}
                  </span>
                )}
              </div>
              <div className="flex-1">
                <p className="text-[13px] font-semibold">{selectedPlayer.firstName} {selectedPlayer.lastName}</p>
                <p className="flex flex-wrap items-center gap-1 text-[11px] text-muted-foreground">
                  {selectedPlayer.primaryPosition && (
                    <span>{POSITION_LABELS[selectedPlayer.primaryPosition]}</span>
                  )}
                  {selectedPlayer.clubName && (
                    <>
                      {selectedPlayer.primaryPosition && <span>·</span>}
                      <span>{selectedPlayer.clubName}</span>
                    </>
                  )}
                  {selectedPlayer.region && (
                    <>
                      <span>·</span>
                      <RegionLogo slug={selectedPlayer.region.slug} name={selectedPlayer.region.name} size={12} />
                      <span>{selectedPlayer.region.name}</span>
                    </>
                  )}
                </p>
              </div>
              <button onClick={() => setSelectedPlayer(null)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2">
              <Label>Wiadomość (opcjonalnie)</Label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="np. Zapraszamy na testy do naszego klubu..."
                rows={2}
              />
            </div>

            <Button onClick={handleSend} disabled={inviteMut.isPending} className="w-full gap-2">
              <Send className="h-4 w-4" />
              {inviteMut.isPending ? "Wysyłanie..." : "Wyślij zaproszenie"}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
