"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SparingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [sparing, setSparing] = useState<any>(null);
  const [message, setMessage] = useState("");
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (id) trpc.sparing.getById.query({ id }).then(setSparing);
  }, [id]);

  async function handleApply() {
    setApplying(true);
    setError("");
    try {
      await trpc.sparing.applyFor.mutate({ sparingOfferId: id, message: message || undefined });
      const updated = await trpc.sparing.getById.query({ id });
      setSparing(updated);
      setMessage("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setApplying(false);
    }
  }

  async function handleRespond(applicationId: string, status: "ACCEPTED" | "REJECTED") {
    try {
      await trpc.sparing.respond.mutate({ applicationId, status });
      const updated = await trpc.sparing.getById.query({ id });
      setSparing(updated);
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleCancel() {
    try {
      await trpc.sparing.cancel.mutate({ id });
      router.push("/sparings");
    } catch (err: any) {
      setError(err.message);
    }
  }

  if (!sparing) return <p className="text-gray-500">Ładowanie...</p>;

  const statusLabels: Record<string, string> = {
    OPEN: "Otwarty",
    MATCHED: "Dopasowany",
    CANCELLED: "Anulowany",
    COMPLETED: "Zakończony",
  };

  const statusColors: Record<string, string> = {
    OPEN: "bg-green-100 text-green-800",
    MATCHED: "bg-blue-100 text-blue-800",
    CANCELLED: "bg-gray-100 text-gray-600",
    COMPLETED: "bg-purple-100 text-purple-800",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{sparing.title}</h1>
          <p className="mt-1 text-gray-600">
            {sparing.club.name}{sparing.club.city && ` · ${sparing.club.city}`}
          </p>
        </div>
        <span className={`rounded-full px-3 py-1 text-sm font-medium ${statusColors[sparing.status]}`}>
          {statusLabels[sparing.status]}
        </span>
      </div>

      <Card>
        <CardContent className="grid gap-4 pt-6 md:grid-cols-2">
          <div>
            <p className="text-sm text-gray-500">Data meczu</p>
            <p className="font-medium">{formatDate(sparing.matchDate)}</p>
          </div>
          {sparing.location && (
            <div>
              <p className="text-sm text-gray-500">Miejsce</p>
              <p className="font-medium">{sparing.location}</p>
            </div>
          )}
          {sparing.costSplitInfo && (
            <div>
              <p className="text-sm text-gray-500">Podział kosztów</p>
              <p className="font-medium">{sparing.costSplitInfo}</p>
            </div>
          )}
          {sparing.region && (
            <div>
              <p className="text-sm text-gray-500">Region</p>
              <p className="font-medium">{sparing.region.name}</p>
            </div>
          )}
          {sparing.description && (
            <div className="md:col-span-2">
              <p className="text-sm text-gray-500">Opis</p>
              <p className="whitespace-pre-wrap">{sparing.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Apply section (for other clubs) */}
      {sparing.status === "OPEN" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Zgłoś swój klub</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="Wiadomość (opcjonalna)"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <Button onClick={handleApply} disabled={applying}>
                {applying ? "Wysyłanie..." : "Aplikuj"}
              </Button>
            </div>
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          </CardContent>
        </Card>
      )}

      {/* Applications list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Zgłoszenia ({sparing.applications.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sparing.applications.length === 0 ? (
            <p className="text-sm text-gray-500">Brak zgłoszeń</p>
          ) : (
            <ul className="space-y-3">
              {sparing.applications.map((app: any) => {
                const appStatusLabels: Record<string, string> = {
                  PENDING: "Oczekuje",
                  ACCEPTED: "Zaakceptowany",
                  REJECTED: "Odrzucony",
                };
                const appStatusColors: Record<string, string> = {
                  PENDING: "text-yellow-700 bg-yellow-50",
                  ACCEPTED: "text-green-700 bg-green-50",
                  REJECTED: "text-red-700 bg-red-50",
                };

                return (
                  <li key={app.id} className="flex items-center justify-between rounded-md border p-3">
                    <div>
                      <p className="font-medium">
                        {app.applicantClub.name}
                        {app.applicantClub.city && (
                          <span className="text-gray-500"> · {app.applicantClub.city}</span>
                        )}
                      </p>
                      {app.message && <p className="text-sm text-gray-600">{app.message}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${appStatusColors[app.status]}`}>
                        {appStatusLabels[app.status]}
                      </span>
                      {app.status === "PENDING" && (
                        <>
                          <Button size="sm" onClick={() => handleRespond(app.id, "ACCEPTED")}>
                            Akceptuj
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleRespond(app.id, "REJECTED")}>
                            Odrzuć
                          </Button>
                        </>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <Button variant="outline" onClick={() => router.back()}>
        Wróć
      </Button>
    </div>
  );
}
