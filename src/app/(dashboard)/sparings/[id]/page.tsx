"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DetailPageSkeleton } from "@/components/card-skeleton";
import { SendMessageButton } from "@/components/send-message-button";
import { SPARING_STATUS_LABELS, SPARING_STATUS_COLORS, APPLICATION_STATUS_LABELS, APPLICATION_STATUS_COLORS } from "@/lib/labels";

export default function SparingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [sparing, setSparing] = useState<any>(null);
  const [message, setMessage] = useState("");
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    if (id) trpc.sparing.getById.query({ id }).then(setSparing);
  }, [id]);

  async function handleApply() {
    setApplying(true);
    try {
      await trpc.sparing.applyFor.mutate({ sparingOfferId: id, message: message || undefined });
      const updated = await trpc.sparing.getById.query({ id });
      setSparing(updated);
      setMessage("");
      toast.success("Zgłoszenie wysłane");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setApplying(false);
    }
  }

  async function handleRespond(applicationId: string, status: "ACCEPTED" | "REJECTED") {
    try {
      await trpc.sparing.respond.mutate({ applicationId, status });
      const updated = await trpc.sparing.getById.query({ id });
      setSparing(updated);
      toast.success(status === "ACCEPTED" ? "Zgłoszenie zaakceptowane" : "Zgłoszenie odrzucone");
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  async function handleCancel() {
    try {
      await trpc.sparing.cancel.mutate({ id });
      toast.success("Sparing anulowany");
      router.push("/sparings");
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  if (!sparing) return <DetailPageSkeleton />;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{sparing.title}</h1>
          <p className="mt-1 text-gray-600">
            {sparing.club.name}{sparing.club.city && ` · ${sparing.club.city}`}
          </p>
          <div className="mt-2">
            <SendMessageButton recipientUserId={sparing.club.userId} />
          </div>
        </div>
        <span className={`rounded-full px-3 py-1 text-sm font-medium ${SPARING_STATUS_COLORS[sparing.status]}`}>
          {SPARING_STATUS_LABELS[sparing.status]}
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
              {sparing.applications.map((app: any) => (
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
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${APPLICATION_STATUS_COLORS[app.status]}`}>
                        {APPLICATION_STATUS_LABELS[app.status]}
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
              ))}
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
