"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { toast } from "sonner";
import { api } from "@/lib/trpc-react";
import { formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DetailPageSkeleton } from "@/components/card-skeleton";
import { SendMessageButton } from "@/components/send-message-button";
import { EVENT_TYPE_LABELS, POSITION_LABELS, APPLICATION_STATUS_LABELS, APPLICATION_STATUS_COLORS, SPARING_LEVEL_LABELS } from "@/lib/labels";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { AttendanceSection } from "./_components/attendance-section";
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
  Target,
  Banknote,
} from "lucide-react";

type EventApplication = {
  id: string;
  status: string;
  message: string | null;
  player: {
    id: string;
    firstName: string;
    lastName: string;
    primaryPosition: string | null;
    photoUrl: string | null;
  };
};

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session } = useSession();
  const [message, setMessage] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const utils = api.useUtils();
  const { data: event } = api.event.getById.useQuery({ id }, { enabled: !!id });

  const { data: myMembership } = api.clubMembership.myMembership.useQuery(
    { clubId: event?.clubId ?? "" },
    { enabled: !!event?.clubId && event?.visibility === "INTERNAL" && !!session?.user }
  );

  const applyMut = api.event.applyFor.useMutation({
    onSuccess: () => {
      utils.event.getById.invalidate({ id });
      setMessage("");
      toast.success("Zgłoszenie wysłane");
    },
    onError: (err) => toast.error(err.message),
  });

  const respondMut = api.event.respond.useMutation({
    onSuccess: (_, variables) => {
      utils.event.getById.invalidate({ id });
      toast.success(variables.status === "ACCEPTED" ? "Zgłoszenie zaakceptowane" : "Zgłoszenie odrzucone");
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMut = api.event.delete.useMutation({
    onSuccess: () => {
      toast.success("Wydarzenie usunięte");
      router.push("/events");
    },
    onError: (err) => toast.error(err.message),
    onSettled: () => setShowDeleteConfirm(false),
  });

  if (!event) return <DetailPageSkeleton />;

  const isOwner = session?.user?.id === event.club?.userId;
  const hasApplications = event.applications.length > 0;
  const myApplication = !isOwner && hasApplications ? event.applications[0] : null;

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
            {event.visibility === "INTERNAL" && (
              <Badge className="bg-amber-500/10 text-amber-600">Tylko dla klubu</Badge>
            )}
          </div>
          <p className="mt-1.5 text-muted-foreground">
            {event.club ? (
              <Link href={`/clubs/${event.club.id}`} className="hover:underline hover:text-primary">{event.club.name}</Link>
            ) : "Trener"}
            {event.club?.city && ` · ${event.club.city}`}
          </p>
          <div className="mt-3">
            {event.club && <SendMessageButton recipientUserId={event.club.userId} />}
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
        onConfirm={() => deleteMut.mutate({ id })}
        loading={deleteMut.isPending}
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
            {event.maxParticipants && (
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
                  <Users className="h-4 w-4 text-emerald-500" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Limit miejsc</p>
                  <p className="font-medium">{event.maxParticipants}</p>
                </div>
              </div>
            )}
            {(event as any).costPerPerson != null && (event as any).costPerPerson > 0 && (
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
                  <Banknote className="h-4 w-4 text-amber-500" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Koszt</p>
                  <p className="font-medium">{(event as any).costPerPerson} PLN na osobę</p>
                </div>
              </div>
            )}
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

      {/* Requirements section (for recruitment events) */}
      {(event.targetPosition || event.targetAgeMin || event.targetLevel) && (
        <Card className="mb-6 border-amber-500/20 bg-amber-500/5">
          <CardContent className="py-4">
            <div className="flex items-center gap-2 mb-3">
              <Target className="h-4 w-4 text-amber-600" />
              <p className="text-sm font-semibold">Wymagania</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {event.targetPosition && (
                <Badge variant="secondary" className="bg-violet-500/10 text-violet-700 dark:text-violet-400">
                  {POSITION_LABELS[event.targetPosition] || event.targetPosition}
                </Badge>
              )}
              {(event.targetAgeMin || event.targetAgeMax) && (
                <Badge variant="secondary" className="bg-blue-500/10 text-blue-700 dark:text-blue-400">
                  Wiek: {event.targetAgeMin ?? "?"}&ndash;{event.targetAgeMax ?? "?"} lat
                </Badge>
              )}
              {event.targetLevel && (
                <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                  {SPARING_LEVEL_LABELS[event.targetLevel] || event.targetLevel}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Attendance section (for INTERNAL events) */}
      {event.visibility === "INTERNAL" && session?.user && (
        <AttendanceSection
          eventId={id}
          isClubMember={myMembership?.status === "ACCEPTED" || event?.club?.userId === session?.user?.id}
          isAdmin={event?.club?.userId === session?.user?.id}
        />
      )}

      {/* Apply section (for players) */}
      {!isOwner && session?.user?.role === "PLAYER" && (
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
              <Button onClick={() => applyMut.mutate({ eventId: id, message: message || undefined })} disabled={applyMut.isPending} className="gap-1.5">
                <Send className="h-4 w-4" />
                {applyMut.isPending ? "Wysyłanie..." : "Zgłoś się"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Applications — owner sees full list, applicant sees own status */}
      {isOwner && (
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
                {event.applications.map((app: EventApplication) => (
                  <li key={app.id} className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="font-medium">
                        <Link href={`/players/${app.player.id}`} className="hover:underline hover:text-primary">{app.player.firstName} {app.player.lastName}</Link>
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
                      {app.status === "PENDING" && (
                        <>
                          <Button
                            size="sm"
                            className="gap-1"
                            onClick={() => respondMut.mutate({ applicationId: app.id, status: "ACCEPTED" })}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Akceptuj
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1"
                            onClick={() => respondMut.mutate({ applicationId: app.id, status: "REJECTED" })}
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
      )}

      {/* Applicant sees only their own application status */}
      {myApplication && (
        <Card className="border-primary/20">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Twoje zgłoszenie</p>
              <Badge variant="secondary" className={APPLICATION_STATUS_COLORS[myApplication.status]}>
                {APPLICATION_STATUS_LABELS[myApplication.status]}
              </Badge>
            </div>
            {myApplication.message && (
              <p className="mt-1.5 text-sm text-muted-foreground">{myApplication.message}</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
