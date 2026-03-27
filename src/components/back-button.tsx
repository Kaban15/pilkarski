"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

interface BackButtonProps {
  label?: string;
  variant?: "light" | "dark";
}

export function BackButton({ label = "Powrót", variant = "light" }: BackButtonProps) {
  const router = useRouter();

  return (
    <button
      onClick={() => router.back()}
      className={`mb-6 inline-flex items-center gap-1.5 text-sm transition ${
        variant === "light"
          ? "text-white/70 hover:text-white"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      <ArrowLeft className="h-4 w-4" />
      {label}
    </button>
  );
}
