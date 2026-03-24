"use client";

import { api } from "@/lib/trpc-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { UserPlus, UserCheck } from "lucide-react";

interface FollowClubButtonProps {
  clubId: string;
}

export function FollowClubButton({ clubId }: FollowClubButtonProps) {
  const { data: isFollowing, refetch } = api.club.isFollowing.useQuery(
    { clubId },
    { staleTime: 30_000 }
  );

  const followMutation = api.club.follow.useMutation({
    onSuccess: () => {
      toast.success("Obserwujesz ten klub");
      refetch();
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const unfollowMutation = api.club.unfollow.useMutation({
    onSuccess: () => {
      toast.success("Przestałeś obserwować ten klub");
      refetch();
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const isPending = followMutation.isPending || unfollowMutation.isPending;

  function handleToggle() {
    if (isFollowing) {
      unfollowMutation.mutate({ clubId });
    } else {
      followMutation.mutate({ clubId });
    }
  }

  return (
    <Button
      variant={isFollowing ? "secondary" : "outline"}
      size="sm"
      className="gap-1.5"
      onClick={handleToggle}
      disabled={isPending || isFollowing === undefined}
    >
      {isFollowing ? (
        <>
          <UserCheck className="h-3.5 w-3.5" />
          Obserwujesz
        </>
      ) : (
        <>
          <UserPlus className="h-3.5 w-3.5" />
          Obserwuj
        </>
      )}
    </Button>
  );
}
