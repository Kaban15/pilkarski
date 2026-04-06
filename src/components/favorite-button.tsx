"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/trpc-react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";

interface FavoriteButtonProps {
  sparingOfferId?: string;
  eventId?: string;
  initialFavorited?: boolean;
}

export function FavoriteButton({ sparingOfferId, eventId, initialFavorited = false }: FavoriteButtonProps) {
  const { t } = useI18n();
  const [favorited, setFavorited] = useState(initialFavorited);
  const [bouncing, setBouncing] = useState(false);

  useEffect(() => {
    setFavorited(initialFavorited);
  }, [initialFavorited]);

  const toggle = api.favorite.toggle.useMutation({
    onSuccess: (result) => {
      if (result.favorited) {
        setBouncing(true);
        setTimeout(() => setBouncing(false), 400);
      }
      setFavorited(result.favorited);
      toast.success(result.favorited ? t("Dodano do ulubionych") : t("Usunięto z ulubionych"));
    },
    onError: () => {
      toast.error(t("Nie udało się zaktualizować ulubionych"));
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
      title={favorited ? t("Usuń z ulubionych") : t("Dodaj do ulubionych")}
      aria-label={favorited ? t("Usuń z ulubionych") : t("Dodaj do ulubionych")}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill={favorited ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={2}
        className={`h-5 w-5 ${favorited ? "text-destructive" : "text-muted-foreground"} ${bouncing ? "heart-bounce" : ""}`}
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
