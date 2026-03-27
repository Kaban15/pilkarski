"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";
import { api } from "@/lib/trpc-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { UserPlus, Search, MapPin } from "lucide-react";
import { POSITION_LABELS } from "@/lib/labels";

export function InviteMemberDialog({ onInvited }: { onInvited: () => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const { data } = api.clubMembership.searchUsers.useQuery(
    { query: debouncedQuery },
    { enabled: debouncedQuery.length >= 2 }
  );

  const inviteMut = api.clubMembership.invite.useMutation({
    onSuccess: () => {
      toast.success("Zaproszenie wysłane");
      onInvited();
    },
    onError: (e) => toast.error(e.message),
  });

  const handleSearch = (value: string) => {
    setQuery(value);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setDebouncedQuery(value), 400);
  };

  const allResults = [
    ...(data?.players ?? []).map((p) => ({
      userId: p.userId,
      name: `${p.firstName} ${p.lastName}`,
      detail: p.primaryPosition ? (POSITION_LABELS[p.primaryPosition] ?? p.primaryPosition) : null,
      city: p.city,
      photoUrl: p.photoUrl,
      role: "Zawodnik",
    })),
    ...(data?.coaches ?? []).map((c) => ({
      userId: c.userId,
      name: `${c.firstName} ${c.lastName}`,
      detail: c.specialization,
      city: c.city,
      photoUrl: c.photoUrl,
      role: "Trener",
    })),
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <UserPlus className="mr-1 h-4 w-4" />
          Zaproś
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Zaproś do kadry</DialogTitle>
        </DialogHeader>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Szukaj po imieniu lub nazwisku..."
            className="pl-9"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
        {allResults.length > 0 ? (
          <ul className="space-y-2">
            {allResults.map((user) => (
              <li key={user.userId} className="flex items-center gap-3 rounded-lg border border-border p-3">
                {user.photoUrl ? (
                  <img src={user.photoUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {user.name.charAt(0)}
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium">{user.name}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="secondary" className="text-[10px]">{user.role}</Badge>
                    {user.detail && <span>{user.detail}</span>}
                    {user.city && (
                      <span className="flex items-center gap-0.5">
                        <MapPin className="h-3 w-3" />{user.city}
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => inviteMut.mutate({ userId: user.userId })}
                  disabled={inviteMut.isPending}
                >
                  Zaproś
                </Button>
              </li>
            ))}
          </ul>
        ) : debouncedQuery.length >= 2 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">Brak wyników</p>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
