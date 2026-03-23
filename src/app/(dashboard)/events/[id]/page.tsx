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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DetailPageSkeleton } from "@/components/card-skeleton";
import { SendMessageButton } from "@/components/send-message-button";
import { EVENT_TYPE_LABELS, POSITION_LABELS, APPLICATION_STATUS_LABELS, APPLICATION_STATUS_COLORS } from "@/lib/labels";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Breadcrumbs } from "@/components/breadcrumbs";
import {
  Calendar,
  MapPin,
  Globe,
  Users,
  FileText,
  Pencil,
  Trash2,
  Send,
  CheckCircle2,
  XCircle,
  Trophy,
} from "lucide-react";

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
    <div className="animate-fade-in">
      <Breadcrumbs
        items={[
          { label: "Wydarzenia", href: "/events" },
          { label: event.title },
        ]}
      />

      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {event.title}
            </h1>
            <Badge className="bg-violet-500/10 text-violet-700 hover:bg-violet-500/10 dark:text-violet-400">
              {EVENT_TYPE_LABELS[event.type]}
            </Badge>
          </div>
          <p className="mt-1.5 text-muted-foreground">
            {event.club.name}
            {event.club.city && ` · ${event.club.city}`}
          </p>
          <div className="mt-3">
            <SendMessageButton recipientUserId={event.club.userId} />
          </div>
        </div>
        {isOwner && (
          <div className="flex items-center gap-2">
            <Link href={`/events/${id}/edit`}>
              <Button size="sm" variant="outline" className="gap-1.5">
                <Pencil className="h-3.5 w-3.5" />
                Edytuj
              </Button>
            </Link>
            <Button
              size="sm"
              variant="destructive"
              className="gap-1.5"
              onClick={() => setShowDeleteConfirm(true)}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Usuń
            </Button>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Usuń wydarzenie"
        description="Czy na pewno chcesz usunąć to wydarzenie? Ta operacja jest nieodwracalna."
        confirmLabel="Tak, usuń"
        onConfirm={handleDelete}
        loading={deleting}
      />

      {/* Info grid */}
      <Card className="mb-6">
        <CardContent className="py-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-500/10">
                <Calendar className="h-4 w-4 text-violet-500" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Data</p>
                <p className="font-medium">{formatDate(event.eventDate)}</p>
              </div>
            </div>
            {event.location && (
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
                  <MapPin className="h-4 w-4 text-blue-500" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Miejsce</p>
                  <p className="font-medium">{event.location}</p>
                </div>
              </div>
            )}
            {event.region && (
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-500/10">
                  <Globe className="h-4 w-4 text-orange-500" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Region</p>
                  <p className="font-medium">{event.region.name}</p>
                </div>
              </div>
            )}
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
                <Users className="h-4 w-4 text-emerald-500" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Miejsca</p>
                <p className="font-medium">
                  {acceptedCount} zaakceptowanych
                  {event.maxParticipants && ` / ${event.maxParticipants} miejsc`}
                </p>
              </div>
            </div>
          </div>
          {event.description && (
            <>
              <Separator className="my-6" />
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Opis</p>
                  <p className="mt-1 whitespace-pre-wrap leading-relaxed">{event.description}</p>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Apply section (for players) */}
      {!isOwner && (
        <Card className="mb-6 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Trophy className="h-5 w-5 text-primary" />
              Zgłoś się
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="Wiadomość (opcjonalna)"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <Button onClick={handleApply} disabled={applying} className="gap-1.5">
                <Send className="h-4 w-4" />
                {applying ? "Wysyłanie..." : "Zgłoś się"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Applications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5 text-muted-foreground" />
            Zgłoszenia ({event.applications.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {event.applications.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">Brak zgłoszeń</p>
          ) : (
            <ul className="divide-y divide-border">
              {event.applications.map((app: any) => (
                <li key={app.id} className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-medium">
                      {app.player.firstName} {app.player.lastName}
                      {app.player.primaryPosition && (
                        <Badge variant="secondary" className="ml-2 text-xs">
                          {POSITION_LABELS[app.player.primaryPosition] || app.player.primaryPosition}
                        </Badge>
                      )}
                    </p>
                    {app.message && (
                      <p className="mt-0.5 text-sm text-muted-foreground line-clamp-2">{app.message}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className={APPLICATION_STATUS_COLORS[app.status]}>
                      {APPLICATION_STATUS_LABELS[app.status]}
                    </Badge>
                    {isOwner && app.status === "PENDING" && (
                      <>
                        <Button
                          size="sm"
                          className="gap-1"
                          onClick={() => handleRespond(app.id, "ACCEPTED")}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Akceptuj
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1"
                          onClick={() => handleRespond(app.id, "REJECTED")}
                        >
                          <XCircle className="h-3.5 w-3.5" />
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
    </div>
  );
}
