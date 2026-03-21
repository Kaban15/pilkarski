"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatShortDate } from "@/lib/format";

export default function ClubPublicProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { data: session } = useSession();
  const [club, setClub] = useState<any>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (id) {
      trpc.club.getById
        .query({ id })
        .then(setClub)
        .catch(() => setError(true));
    }
  }, [id]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Klub nie znaleziony</h1>
          <p className="mt-2 text-gray-500">Ten profil nie istnieje lub został usunięty.</p>
          <Link href="/" className="mt-4 inline-block text-blue-600 hover:underline">
            Strona główna
          </Link>
        </div>
      </div>
    );
  }

  if (!club) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Ładowanie...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <Link href="/" className="text-sm text-blue-600 hover:underline">
        &larr; PilkaSport
      </Link>

      <div className="mt-6 flex items-center gap-4">
        {club.logoUrl ? (
          <img src={club.logoUrl} alt={club.name} className="h-20 w-20 rounded-full object-cover border" />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-full border bg-gray-100 text-2xl font-bold text-gray-400">
            {club.name.charAt(0)}
          </div>
        )}
        <div>
          <h1 className="text-3xl font-bold">{club.name}</h1>
          {club.city && <p className="mt-1 text-lg text-gray-600">{club.city}</p>}
        </div>
      </div>

      <Card className="mt-6">
        <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
          {club.region && (
            <div>
              <p className="text-sm text-gray-500">Region</p>
              <p className="font-medium">{club.region.name}</p>
            </div>
          )}
          {club.leagueGroup && (
            <div>
              <p className="text-sm text-gray-500">Liga</p>
              <p className="font-medium">
                {club.leagueGroup.leagueLevel.name} &mdash; {club.leagueGroup.name}
              </p>
            </div>
          )}
          {club.contactEmail && (
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium">{club.contactEmail}</p>
            </div>
          )}
          {club.contactPhone && (
            <div>
              <p className="text-sm text-gray-500">Telefon</p>
              <p className="font-medium">{club.contactPhone}</p>
            </div>
          )}
          {club.website && (
            <div className="sm:col-span-2">
              <p className="text-sm text-gray-500">Strona www</p>
              <a
                href={club.website.startsWith("http") ? club.website : `https://${club.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-blue-600 hover:underline"
              >
                {club.website}
              </a>
            </div>
          )}
          {club.description && (
            <div className="sm:col-span-2">
              <p className="text-sm text-gray-500">O klubie</p>
              <p className="whitespace-pre-wrap">{club.description}</p>
            </div>
          )}
          <div>
            <p className="text-sm text-gray-500">Na platformie od</p>
            <p className="font-medium">{formatShortDate(club.createdAt)}</p>
          </div>
        </CardContent>
      </Card>

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
