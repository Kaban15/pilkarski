"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { DetailPageSkeleton } from "@/components/card-skeleton";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Swords } from "lucide-react";

import { SparingInfo } from "./_components/sparing-info";
import { SparingTimeline } from "./_components/sparing-timeline";
import { ApplyForm } from "./_components/apply-form";
import { SparingApplications } from "./_components/sparing-applications";
import { SparingReviews } from "./_components/sparing-reviews";

export default function SparingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session } = useSession();
  const [sparing, setSparing] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [myReview, setMyReview] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [completing, setCompleting] = useState(false);
  const reviewSectionRef = useRef<HTMLDivElement>(null);

  const reload = useCallback(() => {
    trpc.sparing.getById.query({ id }).then(setSparing).catch(() => setError("Nie znaleziono sparingu"));
    trpc.review.getForSparing.query({ sparingOfferId: id }).then(setReviews).catch(() => {});
    trpc.review.myReview.query({ sparingOfferId: id }).then(setMyReview).catch(() => {});
  }, [id]);

  useEffect(() => {
    if (id) reload();
  }, [id, reload]);

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

  async function handleComplete() {
    setCompleting(true);
    try {
      await trpc.sparing.complete.mutate({ id });
      toast.success("Sparing oznaczony jako zakończony");
      reload();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setCompleting(false);
    }
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <Swords className="h-12 w-12 text-muted-foreground" />
        <p className="text-lg font-medium">{error}</p>
        <Button variant="outline" onClick={() => router.push("/sparings")}>
          Wróć do listy
        </Button>
      </div>
    );
  }

  if (!sparing) return <DetailPageSkeleton />;

  const isOwner = session?.user?.id === sparing.club.userId;
  const isClub = session?.user?.role === "CLUB";
  const acceptedApp = sparing.applications?.find((a: any) => a.status === "ACCEPTED");
  const isAcceptedApplicant =
    acceptedApp &&
    session?.user?.id &&
    sparing.applications?.some(
      (a: any) => a.status === "ACCEPTED" && a.applicantClub?.userId === session.user.id
    );
  const isParticipant = isOwner || isAcceptedApplicant;
  const canReview =
    (sparing.status === "MATCHED" || sparing.status === "COMPLETED") &&
    isParticipant &&
    !myReview &&
    !!session?.user;

  // Find current user's existing application
  const myApplication = isClub && !isOwner && session?.user?.id
    ? sparing.applications?.find((a: any) => a.applicantClub?.userId === session.user.id)
    : null;

  // Determine opponent userId for messaging CTA
  const opponentUserId = isParticipant
    ? isOwner
      ? acceptedApp?.applicantClub?.userId
      : sparing.club.userId
    : undefined;

  return (
    <div className="animate-fade-in">
      <Breadcrumbs
        items={[
          { label: "Sparingi", href: "/sparings" },
          { label: sparing.title },
        ]}
      />

      <SparingInfo
        sparing={sparing}
        isOwner={isOwner}
        showDeleteConfirm={showDeleteConfirm}
        setShowDeleteConfirm={setShowDeleteConfirm}
        onDelete={handleDelete}
        onComplete={handleComplete}
        deleting={deleting}
        completing={completing}
      />

      <SparingTimeline
        status={sparing.status}
        isParticipant={isParticipant}
        canReview={canReview}
        opponentUserId={opponentUserId}
        onScrollToReview={() =>
          reviewSectionRef.current?.scrollIntoView({ behavior: "smooth" })
        }
      />

      <ApplyForm
        sparingId={id}
        status={sparing.status}
        isOwner={isOwner}
        isClub={isClub}
        existingApplication={myApplication}
        onApplied={reload}
      />

      {sparing.applications && (
        <SparingApplications
          applications={sparing.applications}
          isOwner={isOwner}
          onResponded={reload}
        />
      )}

      <div ref={reviewSectionRef}>
        <SparingReviews
          sparingId={id}
          reviews={reviews}
          myReview={myReview}
          canReview={canReview}
          onReviewSubmitted={reload}
        />
      </div>
    </div>
  );
}
