"use client";

import { useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { api } from "@/lib/trpc-react";
import { Button } from "@/components/ui/button";
import { DetailPageSkeleton } from "@/components/card-skeleton";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Swords } from "lucide-react";
import { InviteClubDialog, ReceivedInvitations, SentInvitations } from "@/components/sparings/invite-club-dialog";

type SparingApplication = {
  id: string;
  status: string;
  message: string | null;
  counterProposedDate: Date | null;
  applicantClub: {
    id: string;
    name: string;
    city: string | null;
    logoUrl: string | null;
    userId: string;
  };
};

import { SparingInfo } from "./_components/sparing-info";
import { SparingTimeline } from "./_components/sparing-timeline";
import { ScoreSection } from "./_components/score-section";
import { ApplyForm } from "./_components/apply-form";
import { SparingApplications } from "./_components/sparing-applications";
import { SparingReviews } from "./_components/sparing-reviews";

export default function SparingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session } = useSession();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);
  const reviewSectionRef = useRef<HTMLDivElement>(null);

  const utils = api.useUtils();

  const { data: sparing, error: sparingError } = api.sparing.getById.useQuery(
    { id },
    { enabled: !!id }
  );
  const { data: reviews = [] } = api.review.getForSparing.useQuery(
    { sparingOfferId: id },
    { enabled: !!id }
  );
  const { data: myReview = null } = api.review.myReview.useQuery(
    { sparingOfferId: id },
    { enabled: !!id }
  );

  function reload() {
    utils.sparing.getById.invalidate({ id });
    utils.review.getForSparing.invalidate({ sparingOfferId: id });
    utils.review.myReview.invalidate({ sparingOfferId: id });
  }

  const deleteMutation = api.sparing.delete.useMutation({
    onSuccess: () => {
      toast.success("Sparing usunięty");
      router.push("/sparings");
    },
    onError: (err) => {
      toast.error(err.message);
    },
    onSettled: () => {
      setShowDeleteConfirm(false);
    },
  });

  const completeMutation = api.sparing.complete.useMutation({
    onSuccess: () => {
      toast.success("Sparing oznaczony jako zakończony");
      reload();
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  function handleDelete() {
    deleteMutation.mutate({ id });
  }

  function handleComplete() {
    completeMutation.mutate({ id });
  }

  if (sparingError) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <Swords className="h-12 w-12 text-muted-foreground" />
        <p className="text-lg font-medium">Nie znaleziono sparingu</p>
        <Button variant="outline" onClick={() => router.push("/sparings")}>
          Wróć do listy
        </Button>
      </div>
    );
  }

  if (!sparing) return <DetailPageSkeleton />;

  const isOwner = session?.user?.id === sparing.club.userId;
  const isClub = session?.user?.role === "CLUB";
  const acceptedApp = sparing.applications?.find((a: SparingApplication) => a.status === "ACCEPTED");
  const isAcceptedApplicant =
    acceptedApp &&
    session?.user?.id &&
    sparing.applications?.some(
      (a: SparingApplication) => a.status === "ACCEPTED" && a.applicantClub?.userId === session.user.id
    );
  const isParticipant = !!(isOwner || isAcceptedApplicant);
  const canReview = !!(
    (sparing.status === "MATCHED" || sparing.status === "COMPLETED") &&
    isParticipant &&
    !myReview &&
    session?.user
  );

  // Find current user's existing application
  const myApplication = isClub && !isOwner && session?.user?.id
    ? sparing.applications?.find((a: SparingApplication) => a.applicantClub?.userId === session.user.id)
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
        acceptedApp={acceptedApp}
        showDeleteConfirm={showDeleteConfirm}
        setShowDeleteConfirm={setShowDeleteConfirm}
        showCompleteConfirm={showCompleteConfirm}
        setShowCompleteConfirm={setShowCompleteConfirm}
        onDelete={handleDelete}
        onComplete={handleComplete}
        deleting={deleteMutation.isPending}
        completing={completeMutation.isPending}
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

      {sparing && session?.user && (
        <ScoreSection
          sparingId={id}
          sparingOfferId={id}
          homeScore={sparing.homeScore}
          awayScore={sparing.awayScore}
          scoreSubmittedBy={sparing.scoreSubmittedBy}
          scoreConfirmed={sparing.scoreConfirmed}
          status={sparing.status}
          isOwner={sparing.club.userId === session.user.id}
          isRival={sparing.applications?.some(
            (a: SparingApplication) => a.status === "ACCEPTED" && a.applicantClub.userId === session.user.id
          ) ?? false}
          isParticipant={isParticipant}
          userId={session.user.id}
          ownerClubName={sparing.club.name}
          rivalClubName={
            sparing.applications?.find((a: SparingApplication) => a.status === "ACCEPTED")
              ?.applicantClub.name ?? "Rywal"
          }
          homeClubId={sparing.club.id}
          awayClubId={
            sparing.applications?.find((a: SparingApplication) => a.status === "ACCEPTED")
              ?.applicantClub.id ?? null
          }
          onUpdate={reload}
        />
      )}

      {/* Invitations */}
      {isOwner && sparing.status === "OPEN" && (
        <div className="space-y-4">
          <InviteClubDialog sparingOfferId={id} />
          <SentInvitations sparingOfferId={id} />
        </div>
      )}
      {isClub && !isOwner && (
        <ReceivedInvitations sparingOfferId={id} />
      )}

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
