"use client";

import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { api } from "@/lib/trpc-react";
import { Button } from "@/components/ui/button";
import { UserPlus, Check } from "lucide-react";

interface ClubInviteButtonProps {
  targetUserId: string;
}

export function ClubInviteButton({ targetUserId }: ClubInviteButtonProps) {
  const { data: session } = useSession();

  const inviteMut = api.clubMembership.invite.useMutation({
    onSuccess: () => toast.success("Zaproszenie wysłane"),
    onError: (e) => toast.error(e.message),
  });

  if (!session || session.user.role !== "CLUB") return null;
  if (session.user.id === targetUserId) return null;

  if (inviteMut.isSuccess) {
    return (
      <Button size="sm" variant="outline" disabled className="border-white/20 bg-white/10 text-white">
        <Check className="mr-1 h-4 w-4" />
        Zaproszono
      </Button>
    );
  }

  return (
    <Button
      size="sm"
      variant="outline"
      className="border-white/20 bg-white/10 text-white hover:bg-white/20"
      onClick={() => inviteMut.mutate({ userId: targetUserId })}
      disabled={inviteMut.isPending}
    >
      <UserPlus className="mr-1 h-4 w-4" />
      Zaproś do klubu
    </Button>
  );
}
