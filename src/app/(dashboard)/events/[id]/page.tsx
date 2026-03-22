"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DetailPageSkeleton } from "@/components/card-skeleton";
import { SendMessageButton } from "@/components/send-message-button";
import { EVENT_TYPE_LABELS, POSITION_LABELS, APPLICATION_STATUS_LABELS, APPLICATION_STATUS_COLORS } from "@/lib/labels";

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session } = useSession();
  const [event, setEvent] = useState<any>(null);
  const [message, setMessage] = useState("");
  const [applying, setApplying] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (id) trpc.event.getById.query({ id }).then(setEvent);
  }, [id]);

  async function handleApply() {
    setApplying(true);
    try {
      await trpc.event.applyFor.mutate({ eventId: id, message: message || undefined });
      const updated = await trpc.event.getById.query({ id });
      setEvent(updated);
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
      await trpc.event.respond.mutate({ applicationId, status });
      const updated = await trpc.event.getById.query({ id });
      setEvent(updated);
      toast.success(status === "ACCEPTED" ? "Zgłoszenie zaakceptowane" : "Zgłoszenie odrzucone");
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await trpc.event.delete.mutate({ id });
      toast.success("Wydarzenie usunięte");
      router.push("/events");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  }

  if (!event) return <DetailPageSkeleton />;

  const isOwner = session?.user?.id === event.club.userId;
  const acceptedCount = event.applications.filter((a: any) => a.status === "ACCEPTED").length;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{event.title}</h1>
            <span className="rounded-full bg-purple-50 dark:bg-purple-950 px-2 py-0.5 text-xs font-medium text-purple-700 dark:text-purple-300">
              {EVENT_TYPE_LABELS[event.type]}
            </span>
          </div>
          <p className="mt-1 text-muted-foreground">
            {event.club.name}{event.club.city && ` · ${event.club.city}`}
          </p>
          <div className="mt-2">
            <SendMessageButton recipientUserId={event.club.userId} />
          </div>
        </div>
        {isOwner && (
          <div className="flex items-center gap-2">
            <Link href={`/events/${id}/edit`}>
              <Button size="sm" variant="outline">Edytuj</Button>
            </Link>
            <Button size="sm" variant="destructive" onClick={() => setShowDeleteConfirm(true)}>
              Usuń
            </Button>
          </div>
        )}
      </div>

      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-950">
          <CardContent className="flex items-center justify-between pt-6">
            <p className="text-sm text-red-800">Czy na pewno chcesz usunąć to wydarzenie? Ta operacja jest nieodwracalna.</p>
            <div className="flex gap-2">
              <Button size="sm" variant="destructive" onClick={handleDelete} disabled={deleting}>
                {deleting ? "Usuwanie..." : "Tak, usuń"}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                Anuluj
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="grid gap-4 pt-6 md:grid-cols-2">
          <div>
            <p className="text-sm text-muted-foreground">Data</p>
            <p className="font-medium">{formatDate(event.eventDate)}</p>
          </div>
          {event.location && (
            <div>
              <p className="text-sm text-muted-foreground">Miejsce</p>
              <p className="font-medium">{event.location}</p>
            </div>
          )}
          {event.region && (
            <div>
              <p className="text-sm text-muted-foreground">Region</p>
              <p className="font-medium">{event.region.name}</p>
            </div>
          )}
          <div>
            <p className="text-sm text-muted-foreground">Miejsca</p>
            <p className="font-medium">
              {acceptedCount} zaakceptowanych
              {event.maxParticipants && ` / ${event.maxParticipants} miejsc`}
            </p>
          </div>
          {event.description && (
            <div className="md:col-span-2">
              <p className="text-sm text-muted-foreground">Opis</p>
              <p className="whitespace-pre-wrap">{event.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Apply section (for players) */}
      {!isOwner && <Card>
        <CardHeader>
          <CardTitle className="text-lg">Zgłoś się</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Wiadomość (opcjonalna)"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <Button onClick={handleApply} disabled={applying}>
              {applying ? "Wysyłanie..." : "Zgłoś się"}
            </Button>
          </div>
        </CardContent>
      </Card>}

      {/* Applications */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Zgłoszenia ({event.applications.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {event.applications.length === 0 ? (
            <p className="text-sm text-muted-foreground">Brak zgłoszeń</p>
          ) : (
            <ul className="space-y-3">
              {event.applications.map((app: any) => (
                  <li key={app.id} className="flex items-center justify-between rounded-md border p-3">
                    <div>
                      <p className="font-medium">
                        {app.player.firstName} {app.player.lastName}
                        {app.player.primaryPosition && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            {POSITION_LABELS[app.player.primaryPosition] || app.player.primaryPosition}
                          </span>
                        )}
                      </p>
                      {app.message && <p className="text-sm text-muted-foreground">{app.message}</p>}
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
