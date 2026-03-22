"use client";

import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface FavoriteButtonProps {
  sparingOfferId?: string;
  eventId?: string;
  initialFavorited?: boolean;
}

export function FavoriteButton({ sparingOfferId, eventId, initialFavorited = false }: FavoriteButtonProps) {
  const [favorited, setFavorited] = useState(initialFavorited);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setFavorited(initialFavorited);
  }, [initialFavorited]);

  async function handleToggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);
    try {
      const result = await trpc.favorite.toggle.mutate({ sparingOfferId, eventId });
      setFavorited(result.favorited);
      toast.success(result.favorited ? "Dodano do ulubionych" : "Usunięto z ulubionych");
    } catch {
      toast.error("Nie udało się zaktualizować ulubionych");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className="rounded-full p-1.5 transition hover:bg-secondary disabled:opacity-50"
      title={favorited ? "Usuń z ulubionych" : "Dodaj do ulubionych"}
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
