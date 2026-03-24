"use client";

import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/trpc-react";
import { formatDate } from "@/lib/format";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { POSITION_LABELS, EVENT_TYPE_LABELS } from "@/lib/labels";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: results, isLoading } = api.search.global.useQuery(
    { query: searchQuery },
    { enabled: searchQuery.length > 0 },
  );

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setSearchQuery(query.trim());
  }

  const hasResults = results && (
    (results.clubs?.length ?? 0) > 0 ||
    (results.players?.length ?? 0) > 0 ||
    (results.sparings?.length ?? 0) > 0 ||
    (results.events?.length ?? 0) > 0
  );

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Szukaj</h1>

      <form onSubmit={handleSearch} className="mb-6 flex gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Szukaj klubów, zawodników, sparingów, wydarzeń..."
          maxLength={100}
        />
        <Button type="submit" disabled={isLoading || !query.trim()}>
          {isLoading ? "..." : "Szukaj"}
        </Button>
      </form>

      {searchQuery && results && !hasResults && (
        <p className="text-muted-foreground">Brak wyników dla &quot;{searchQuery}&quot;</p>
      )}

      {(results?.clubs?.length ?? 0) > 0 && (
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Kluby ({results!.clubs!.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {results!.clubs!.map((club: any) => (
                <Link key={club.id} href={`/clubs/${club.id}`} className="block">
                  <li className="rounded-md border p-3 transition hover:bg-muted">
                    <p className="font-medium">{club.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {club.city ?? ""}{club.region ? ` · ${club.region.name}` : ""}
                    </p>
                  </li>
                </Link>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {(results?.players?.length ?? 0) > 0 && (
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Zawodnicy ({results!.players!.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {results!.players!.map((player: any) => (
                <Link key={player.id} href={`/players/${player.id}`} className="block">
                  <li className="rounded-md border p-3 transition hover:bg-muted">
                    <p className="font-medium">
                      {player.firstName} {player.lastName}
                      {player.primaryPosition && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          {POSITION_LABELS[player.primaryPosition] ?? player.primaryPosition}
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {player.city ?? ""}{player.region ? ` · ${player.region.name}` : ""}
                    </p>
                  </li>
                </Link>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {(results?.sparings?.length ?? 0) > 0 && (
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Sparingi ({results!.sparings!.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {results!.sparings!.map((s: any) => (
                <Link key={s.id} href={`/sparings/${s.id}`} className="block">
                  <li className="rounded-md border p-3 transition hover:bg-muted">
                    <p className="font-medium">{s.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {s.club.name} · {formatDate(s.matchDate)}
                      {s.region && ` · ${s.region.name}`}
                    </p>
                  </li>
                </Link>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {(results?.events?.length ?? 0) > 0 && (
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Wydarzenia ({results!.events!.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {results!.events!.map((ev: any) => (
                <Link key={ev.id} href={`/events/${ev.id}`} className="block">
                  <li className="rounded-md border p-3 transition hover:bg-muted">
                    <p className="font-medium">
                      {ev.title}
                      <span className="ml-2 text-xs text-muted-foreground">{EVENT_TYPE_LABELS[ev.type] ?? ev.type}</span>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {ev.club.name} · {formatDate(ev.eventDate)}
                      {ev.region && ` · ${ev.region.name}`}
                    </p>
                  </li>
                </Link>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
