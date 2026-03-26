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
import { Send, Search, Clock, Check, X, MapPin } from "lucide-react";

interface InviteClubDialogProps {
  sparingOfferId: string;
}

type ClubSearchResult = {
  id: string;
  name: string;
  city: string | null;
  logoUrl: string | null;
  region: { name: string } | null;
};

export function InviteClubDialog({ sparingOfferId }: InviteClubDialogProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedClub, setSelectedClub] = useState<ClubSearchResult | null>(null);
  const [message, setMessage] = useState("");
  const [expiresInHours, setExpiresInHours] = useState(48);

  const utils = api.useUtils();

  const searchResults = api.club.list.useQuery(
    { search, limit: 5 },
    { enabled: search.length >= 2 }
  );

  const inviteMut = api.sparing.invite.useMutation({
    onSuccess: () => {
      toast.success("Zaproszenie wysłane!");
      setOpen(false);
      setSelectedClub(null);
      setMessage("");
      setSearch("");
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
      <Button variant="outline" size="sm" className="gap-2" onClick={() => setOpen(true)}>
        <Send className="h-3.5 w-3.5" />
        Zaproś klub
      </Button>
    );
  }

  return (
    <Card className="border-primary/20">
      <CardContent className="space-y-4 py-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Zaproś klub na sparing</p>
          <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        {!selectedClub ? (
          <>
            <div className="space-y-2">
              <Label>Szukaj klubu</Label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Nazwa klubu..."
                  className="pl-9"
                />
              </div>
            </div>

            {search.length >= 2 && (
              <div className="max-h-48 space-y-1 overflow-y-auto">
                {searchResults.isLoading ? (
                  <p className="py-2 text-center text-xs text-muted-foreground">Szukam...</p>
                ) : (searchResults.data?.clubs ?? []).length === 0 ? (
                  <p className="py-2 text-center text-xs text-muted-foreground">Brak wyników</p>
                ) : (
                  (searchResults.data?.clubs ?? []).map((club: ClubSearchResult) => (
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
                      <div>
                        <p className="text-[13px] font-medium">{club.name}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {club.city}{club.region ? ` · ${club.region.name}` : ""}
                        </p>
                      </div>
                    </button>
                  ))
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
                <p className="text-[11px] text-muted-foreground">
                  {selectedClub.city}{selectedClub.region ? ` · ${selectedClub.region.name}` : ""}
                </p>
              </div>
              <button onClick={() => setSelectedClub(null)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2">
              <Label>Wiadomość (opcjonalnie)</Label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="np. Zapraszamy na sparing, gramy na naszym boisku..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                Zaproszenie ważne przez
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
                <span className="text-sm text-muted-foreground">godzin</span>
              </div>
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

// Section showing received invitations for the invited club
export function ReceivedInvitations({ sparingOfferId }: { sparingOfferId: string }) {
  const { data } = api.sparing.myInvitations.useQuery();
  const utils = api.useUtils();

  const respondMut = api.sparing.respondToInvitation.useMutation({
    onSuccess: (result) => {
      toast.success(result.accepted ? "Zaproszenie zaakceptowane!" : "Zaproszenie odrzucone");
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
        <p className="mb-3 text-sm font-semibold">Otrzymane zaproszenie</p>
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
                        · ważne do {new Date(inv.expiresAt).toLocaleString("pl-PL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    )}
                  </p>
                </div>
              </div>
              {inv.message && (
                <p className="text-[13px] text-muted-foreground italic">"{inv.message}"</p>
              )}
              {isExpired ? (
                <Badge variant="secondary">Wygasło</Badge>
              ) : (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="gap-1.5"
                    onClick={() => respondMut.mutate({ invitationId: inv.id, accept: true })}
                    disabled={respondMut.isPending}
                  >
                    <Check className="h-3.5 w-3.5" />
                    Akceptuj
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5"
                    onClick={() => respondMut.mutate({ invitationId: inv.id, accept: false })}
                    disabled={respondMut.isPending}
                  >
                    <X className="h-3.5 w-3.5" />
                    Odrzuć
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
  const { data } = api.sparing.myInvitations.useQuery();

  const sent = data?.sent?.filter((inv) => inv.sparingOfferId === sparingOfferId) ?? [];
  if (sent.length === 0) return null;

  const STATUS_LABELS: Record<string, string> = {
    PENDING: "Oczekuje",
    ACCEPTED: "Zaakceptowane",
    REJECTED: "Odrzucone",
    EXPIRED: "Wygasło",
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
        <p className="mb-3 text-sm font-semibold">Wysłane zaproszenia</p>
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
