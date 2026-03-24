"use client";

import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/trpc-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StarRating } from "@/components/star-rating";
import { Star } from "lucide-react";

type SparingReviewsProps = {
  sparingId: string;
  reviews: any[];
  myReview: any | null;
  canReview: boolean;
  onReviewSubmitted: () => void;
};

export function SparingReviews({
  sparingId,
  reviews,
  myReview,
  canReview,
  onReviewSubmitted,
}: SparingReviewsProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  const createReview = api.review.create.useMutation({
    onSuccess: () => {
      setRating(0);
      setComment("");
      toast.success("Recenzja wystawiona");
      onReviewSubmitted();
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  function handleSubmit() {
    if (rating === 0) {
      toast.error("Wybierz ocenę (1-5 gwiazdek)");
      return;
    }
    createReview.mutate({
      sparingOfferId: sparingId,
      rating,
      comment: comment || undefined,
    });
  }

  return (
    <>
      {/* Review form */}
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
              <StarRating value={rating} onChange={setRating} size="lg" />
            </div>
            <Textarea
              placeholder="Komentarz (opcjonalny) — np. jak wyglądała organizacja, atmosfera, poziom gry"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
            />
            <Button
              onClick={handleSubmit}
              disabled={createReview.isPending || rating === 0}
              className="gap-1.5"
            >
              <Star className="h-4 w-4" />
              {createReview.isPending ? "Wysyłanie..." : "Wystaw recenzję"}
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
                    <p className="mt-1.5 text-sm text-muted-foreground">
                      {review.comment}
                    </p>
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
              <p className="text-sm font-medium">
                Twoja ocena: {myReview.rating}/5
              </p>
              {myReview.comment && (
                <p className="text-sm text-muted-foreground">
                  {myReview.comment}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
