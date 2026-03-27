"use client";

import { toast } from "sonner";
import { api } from "@/lib/trpc-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, X, Mail } from "lucide-react";

export function ClubInvitations() {
  const { data: invitations = [], refetch } = api.clubMembership.myInvitations.useQuery();

  const respondMut = api.clubMembership.respondToInvite.useMutation({
    onSuccess: (_, vars) => {
      toast.success(vars.decision === "ACCEPT" ? "Dołączyłeś do klubu" : "Zaproszenie odrzucone");
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  if (invitations.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Mail className="h-4 w-4 text-emerald-500" />
          Zaproszenia do klubów
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {invitations.map((inv) => (
            <li key={inv.id} className="flex items-center gap-3">
              {inv.club.logoUrl ? (
                <img src={inv.club.logoUrl} alt="" className="h-8 w-8 rounded-md object-cover" />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-xs font-bold text-primary">
                  {inv.club.name.charAt(0)}
                </div>
              )}
              <div className="flex-1">
                <p className="text-sm font-medium">{inv.club.name}</p>
                {inv.club.city && (
                  <p className="text-xs text-muted-foreground">{inv.club.city}</p>
                )}
              </div>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  onClick={() => respondMut.mutate({ membershipId: inv.id, decision: "ACCEPT" })}
                  disabled={respondMut.isPending}
                >
                  <Check className="mr-1 h-3.5 w-3.5" />
                  Akceptuj
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => respondMut.mutate({ membershipId: inv.id, decision: "REJECT" })}
                  disabled={respondMut.isPending}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
