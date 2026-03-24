"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/trpc-react";
import { toast } from "sonner";

interface FavoriteButtonProps {
  sparingOfferId?: string;
  eventId?: string;
  initialFavorited?: boolean;
}

export function FavoriteButton({ sparingOfferId, eventId, initialFavorited = false }: FavoriteButtonProps) {
  const [favorited, setFavorited] = useState(initialFavorited);

  useEffect(() => {
    setFavorited(initialFavorited);
  }, [initialFavorited]);

  const toggle = api.favorite.toggle.useMutation({
    onSuccess: (result) => {
      setFavorited(result.favorited);
      toast.success(result.favorited ? "Dodano do ulubionych" : "Usunięto z ulubionych");
    },
    onError: () => {
      toast.error("Nie udało się zaktualizować ulubionych");
    },
  });

  function handleToggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    toggle.mutate({ sparingOfferId, eventId });
  }

  return (
    <button
      onClick={handleToggle}
      disabled={toggle.isPending}
      className="rounded-full p-1.5 transition hover:bg-secondary disabled:opacity-50"
      title={favorited ? "Usuń z ulubionych" : "Dodaj do ulubionych"}
      aria-label={favorited ? "Usuń z ulubionych" : "Dodaj do ulubionych"}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill={favorited ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={2}
        className={`h-5 w-5 ${favorited ? "text-destructive" : "text-muted-foreground"}`}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
        />
      </svg>
    </button>
  );
}
