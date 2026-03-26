"use client";

import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/trpc-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function PlayerOnboarding({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const { data: player } = api.player.me.useQuery();

  const profileComplete = player && player.regionId && player.primaryPosition;

  return (
    <Card className="mb-6 border-primary/20 bg-primary/5">
      <CardContent className="py-5">
        <div className="mb-4 flex items-center gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= step ? "bg-primary" : "bg-muted"}`} />
          ))}
        </div>

        {step === 0 && (
          <div className="space-y-3">
            <p className="text-sm font-semibold">Witaj w PilkaSport!</p>
            <p className="text-xs text-muted-foreground">
              Uzupełnij profil — dodaj pozycję i region, żebyśmy mogli dopasować nabory do Ciebie.
            </p>
            {profileComplete ? (
              <Button size="sm" onClick={() => setStep(1)}>Profil gotowy — dalej →</Button>
            ) : (
              <div className="flex gap-2">
                <Button size="sm" asChild><Link href="/profile">Uzupełnij profil</Link></Button>
                <Button size="sm" variant="ghost" onClick={() => setStep(1)}>Pomiń</Button>
              </div>
            )}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-3">
            <p className="text-sm font-semibold">Co chcesz zrobić?</p>
            <p className="text-xs text-muted-foreground">
              Znajdź nabór i aplikuj, lub dodaj ogłoszenie że szukasz klubu.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" asChild>
                <Link href="/events">Przeglądaj nabory</Link>
              </Button>
              <Button size="sm" variant="outline" asChild>
                <Link href="/transfers/new">Szukam klubu</Link>
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setStep(2)}>Pomiń</Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3 text-center">
            <p className="text-sm font-semibold">Wszystko gotowe!</p>
            <p className="text-xs text-muted-foreground">Sprawdzaj feed i nabory — powodzenia!</p>
            <Button size="sm" onClick={onComplete}>Przejdź do feedu</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
