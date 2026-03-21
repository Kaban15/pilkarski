"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { POSITION_LABELS } from "@/lib/labels";
import { formatShortDate } from "@/lib/format";

const FOOT_LABELS: Record<string, string> = {
  LEFT: "Lewa",
  RIGHT: "Prawa",
  BOTH: "Obie",
};

export default function PlayerPublicProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { data: session } = useSession();
  const [player, setPlayer] = useState<any>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (id) {
      trpc.player.getById
        .query({ id })
        .then(setPlayer)
        .catch(() => setError(true));
    }
  }, [id]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Zawodnik nie znaleziony</h1>
          <p className="mt-2 text-gray-500">Ten profil nie istnieje lub został usunięty.</p>
          <Link href="/" className="mt-4 inline-block text-blue-600 hover:underline">
            Strona główna
          </Link>
        </div>
      </div>
    );
  }

  if (!player) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Ładowanie...</p>
      </div>
    );
  }

  const age = player.dateOfBirth
    ? Math.floor((Date.now() - new Date(player.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <Link href="/" className="text-sm text-blue-600 hover:underline">
        &larr; PilkaSport
      </Link>

      <div className="mt-6 flex items-center gap-4">
        {player.photoUrl ? (
          <img src={player.photoUrl} alt={`${player.firstName} ${player.lastName}`} className="h-20 w-20 rounded-full object-cover border" />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-full border bg-gray-100 text-2xl font-bold text-gray-400">
            {player.firstName.charAt(0)}{player.lastName.charAt(0)}
          </div>
        )}
        <div>
        <h1 className="text-3xl font-bold">
          {player.firstName} {player.lastName}
        </h1>
        <div className="mt-1 flex flex-wrap gap-2">
          {player.primaryPosition && (
            <span className="rounded-full bg-blue-100 px-3 py-0.5 text-sm font-medium text-blue-800">
              {POSITION_LABELS[player.primaryPosition] ?? player.primaryPosition}
            </span>
          )}
          {player.secondaryPosition && (
            <span className="rounded-full bg-gray-100 px-3 py-0.5 text-sm font-medium text-gray-700">
              {POSITION_LABELS[player.secondaryPosition] ?? player.secondaryPosition}
            </span>
          )}
        </div>
        {player.city && <p className="mt-2 text-gray-600">{player.city}</p>}
        </div>
      </div>

      <Card className="mt-6">
        <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
          {age !== null && (
            <div>
              <p className="text-sm text-gray-500">Wiek</p>
              <p className="font-medium">{age} lat</p>
            </div>
          )}
          {player.region && (
            <div>
              <p className="text-sm text-gray-500">Region</p>
              <p className="font-medium">{player.region.name}</p>
            </div>
          )}
          {player.heightCm && (
            <div>
              <p className="text-sm text-gray-500">Wzrost</p>
              <p className="font-medium">{player.heightCm} cm</p>
            </div>
          )}
          {player.weightKg && (
            <div>
              <p className="text-sm text-gray-500">Waga</p>
              <p className="font-medium">{player.weightKg} kg</p>
            </div>
          )}
          {player.preferredFoot && (
            <div>
              <p className="text-sm text-gray-500">Noga</p>
              <p className="font-medium">{FOOT_LABELS[player.preferredFoot] ?? player.preferredFoot}</p>
            </div>
          )}
          <div>
            <p className="text-sm text-gray-500">Na platformie od</p>
            <p className="font-medium">{formatShortDate(player.createdAt)}</p>
          </div>
          {player.bio && (
            <div className="sm:col-span-2">
              <p className="text-sm text-gray-500">O zawodniku</p>
              <p className="whitespace-pre-wrap">{player.bio}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {player.careerEntries.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Historia kariery</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {player.careerEntries.map((entry: any) => (
                <li key={entry.id} className="flex items-baseline justify-between rounded-md border p-3">
                  <div>
                    <p className="font-medium">{entry.clubName}</p>
                    {entry.notes && <p className="text-sm text-gray-500">{entry.notes}</p>}
                  </div>
                  <span className="text-sm text-gray-500">{entry.season}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <div className="mt-6 flex gap-3">
        {session ? (
          <Link href="/feed">
            <Button variant="outline">Wróć do dashboardu</Button>
          </Link>
        ) : (
          <>
            <Link href="/register">
              <Button>Dołącz do PilkaSport</Button>
            </Link>
            <Link href="/login">
              <Button variant="outline">Zaloguj się</Button>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
