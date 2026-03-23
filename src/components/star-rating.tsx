"use client";

import { Star } from "lucide-react";

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  size?: "sm" | "md" | "lg";
  readonly?: boolean;
}

const SIZES = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
};

export function StarRating({ value, onChange, size = "md", readonly = false }: StarRatingProps) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          className={`${readonly ? "cursor-default" : "cursor-pointer transition-transform hover:scale-110"} focus:outline-none`}
        >
          <Star
            className={`${SIZES[size]} ${
              star <= value
                ? "fill-amber-400 text-amber-400"
                : "fill-transparent text-muted-foreground/30"
            } transition-colors`}
          />
        </button>
      ))}
    </div>
  );
}
