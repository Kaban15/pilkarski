"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Lightbulb, X } from "lucide-react";

interface CoachmarkProps {
  storageKey: string;
  title: string;
  description: string;
}

export function Coachmark({ storageKey, title, description }: CoachmarkProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const seen = localStorage.getItem(storageKey);
    // Hydration: show only if not dismissed previously (SSR-safe).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!seen) setVisible(true);
  }, [storageKey]);

  function dismiss() {
    localStorage.setItem(storageKey, "1");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <Card className="mb-6 border-primary/20 bg-primary/5">
      <CardContent className="flex items-start gap-3 py-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Lightbulb className="h-4 w-4 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{title}</p>
          <p className="mt-0.5 text-[13px] text-muted-foreground">{description}</p>
          <Button size="sm" variant="outline" className="mt-3 h-7 rounded-md text-xs" onClick={dismiss}>
            OK, rozumiem
          </Button>
        </div>
        <button onClick={dismiss} className="shrink-0 text-muted-foreground hover:text-foreground transition">
          <X className="h-4 w-4" />
        </button>
      </CardContent>
    </Card>
  );
}
