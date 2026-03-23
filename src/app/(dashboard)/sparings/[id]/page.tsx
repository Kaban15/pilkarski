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
import { SPARING_STATUS_LABELS, SPARING_STATUS_COLORS, APPLICATION_STATUS_LABELS, APPLICATION_STATUS_COLORS } from "@/lib/labels";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Textarea } from "@/components/ui/textarea";
import { StarRating } from "@/components/star-rating";
import {
  Calendar,
  MapPin,
  Globe,
  Banknote,
  FileText,
  Pencil,
  Trash2,
  Send,
  CheckCircle2,
  XCircle,
  Swords,
  Users,
  Star,
} from "lucide-react";

export default function SparingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session } = useSession();
  const [sparing, setSparing] = useState<any>(null);
  const [message, setMessage] = useState("");
  const [applying, setApplying] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);
  const [myReview, setMyReview] = useState<any>(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    if (id) {
      trpc.sparing.getById.query({ id }).then(setSparing);
      trpc.review.getForSparing.query({ sparingOfferId: id }).then(setReviews);
      trpc.review.myReview.query({ sparingOfferId: id }).then(setMyReview).catch(() => {});
    }
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

  async function handleDelete() {
    setDeleting(true);
    try {
      await trpc.sparing.delete.mutate({ id });
      toast.success("Sparing usunięty");
      router.push("/sparings");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  }

  async function handleSubmitReview() {
    if (reviewRating === 0) {
      toast.error("Wybierz ocenę (1-5 gwiazdek)");
      return;
    }
    setSubmittingReview(true);
    try {
      const review = await trpc.review.create.mutate({
        sparingOfferId: id,
        rating: reviewRating,
        comment: reviewComment || undefined,
      });
      setMyReview(review);
      setReviews((prev) => [{ ...review, reviewerClub: { id: "", name: "Ty" } }, ...prev]);
      setReviewRating(0);
      setReviewComment("");
      toast.success("Recenzja wystawiona");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmittingReview(false);
    }
  }

  if (!sparing) return <DetailPageSkeleton />;

  const isOwner = session?.user?.id === sparing.club.userId;
  const acceptedApp = sparing.applications.find((a: any) => a.status === "ACCEPTED");
  const isParticipant = isOwner || (acceptedApp && session?.user?.id && sparing.applications.some(
    (a: any) => a.status === "ACCEPTED" && a.applicantClub
  ));
  const canReview = (sparing.status === "MATCHED" || sparing.status === "COMPLETED") && isParticipant && !myReview && session?.user;

  return (
    <div className="animate-fade-in">
      <Breadcrumbs
        items={[
          { label: "Sparingi", href: "/sparings" },
          { label: sparing.title },
        ]}
      />

      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {sparing.title}
            </h1>
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${SPARING_STATUS_COLORS[sparing.status]}`}>
              {SPARING_STATUS_LABELS[sparing.status]}
            </span>
          </div>
          <p className="mt-1.5 text-muted-foreground">
            {sparing.club.name}
            {sparing.club.city && ` · ${sparing.club.city}`}
          </p>
          <div className="mt-3">
            <SendMessageButton recipientUserId={sparing.club.userId} />
          </div>
        </div>
        {isOwner && sparing.status === "OPEN" && (
          <div className="flex items-center gap-2">
            <Link href={`/sparings/${id}/edit`}>
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
        title="Usuń sparing"
        description="Czy na pewno chcesz usunąć ten sparing? Ta operacja jest nieodwracalna."
        confirmLabel="Tak, usuń"
        onConfirm={handleDelete}
        loading={deleting}
      />

      {/* Info grid */}
      <Card className="mb-6">
        <CardContent className="py-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
                <Calendar className="h-4 w-4 text-emerald-500" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Data meczu</p>
                <p className="font-medium">{formatDate(sparing.matchDate)}</p>
              </div>
            </div>
            {sparing.location && (
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
                  <MapPin className="h-4 w-4 text-blue-500" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Miejsce</p>
                  <p className="font-medium">{sparing.location}</p>
                </div>
              </div>
            )}
            {sparing.costSplitInfo && (
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
                  <Banknote className="h-4 w-4 text-amber-500" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Podział kosztów</p>
                  <p className="font-medium">{sparing.costSplitInfo}</p>
                </div>
              </div>
            )}
            {sparing.region && (
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-500/10">
                  <Globe className="h-4 w-4 text-orange-500" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Region</p>
                  <p className="font-medium">{sparing.region.name}</p>
                </div>
              </div>
            )}
          </div>
          {sparing.description && (
            <>
              <Separator className="my-6" />
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Opis</p>
                  <p className="mt-1 whitespace-pre-wrap leading-relaxed">{sparing.description}</p>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Apply section (for other clubs) */}
      {sparing.status === "OPEN" && !isOwner && (
        <Card className="mb-6 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Swords className="h-5 w-5 text-primary" />
              Zgłoś swój klub
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
                {applying ? "Wysyłanie..." : "Aplikuj"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Applications list */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5 text-muted-foreground" />
            Zgłoszenia ({sparing.applications.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sparing.applications.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">Brak zgłoszeń</p>
          ) : (
            <ul className="divide-y divide-border">
              {sparing.applications.map((app: any) => (
                <li key={app.id} className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-medium">
                      {app.applicantClub.name}
                      {app.applicantClub.city && (
                        <span className="text-muted-foreground"> · {app.applicantClub.city}</span>
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

      {/* Review form (for participants of matched/completed sparings) */}
      {canReview && (
        <Card className="mt-6 border-amber-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Star className="h-5 w-5 text-amber-500" />
              Oceń sparing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="mb-2 text-sm text-muted-foreground">Twoja ocena</p>
              <StarRating value={reviewRating} onChange={setReviewRating} size="lg" />
            </div>
            <Textarea
              placeholder="Komentarz (opcjonalny) — np. jak wyglądała organizacja, atmosfera, poziom gry"
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              rows={3}
            />
            <Button onClick={handleSubmitReview} disabled={submittingReview || reviewRating === 0} className="gap-1.5">
              <Star className="h-4 w-4" />
              {submittingReview ? "Wysyłanie..." : "Wystaw recenzję"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Reviews list */}
      {reviews.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Star className="h-5 w-5 text-amber-500" />
              Recenzje ({reviews.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-border">
              {reviews.map((review: any) => (
                <li key={review.id} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{review.reviewerClub.name}</p>
                    <StarRating value={review.rating} readonly size="sm" />
                  </div>
                  {review.comment && (
                    <p className="mt-1.5 text-sm text-muted-foreground">{review.comment}</p>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Already reviewed indicator */}
      {myReview && (
        <Card className="mt-6 border-amber-500/20 bg-amber-500/5">
          <CardContent className="flex items-center gap-3 py-4">
            <Star className="h-5 w-5 text-amber-500" />
            <div>
              <p className="text-sm font-medium">Twoja ocena: {myReview.rating}/5</p>
              {myReview.comment && <p className="text-sm text-muted-foreground">{myReview.comment}</p>}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
