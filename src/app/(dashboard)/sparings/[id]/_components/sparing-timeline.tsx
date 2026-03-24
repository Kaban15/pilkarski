"use client";

import { CheckCircle2, Circle, MessageSquare, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SendMessageButton } from "@/components/send-message-button";

type TimelineStep = {
  label: string;
  description?: string;
  done: boolean;
  active: boolean;
};

type SparingTimelineProps = {
  status: string;
  isParticipant: boolean;
  canReview: boolean;
  opponentUserId?: string;
  onScrollToReview: () => void;
};

function getSteps(status: string): TimelineStep[] {
  const steps: TimelineStep[] = [
    {
      label: "Utworzony",
      description: "Ogłoszenie opublikowane",
      done: true,
      active: status === "OPEN",
    },
    {
      label: "Dopasowany",
      description: "Rywal zaakceptowany",
      done: status === "MATCHED" || status === "COMPLETED",
      active: status === "MATCHED",
    },
    {
      label: "Rozegrany",
      description: "Sparing zakończony",
      done: status === "COMPLETED",
      active: status === "COMPLETED",
    },
  ];
  return steps;
}

export function SparingTimeline({
  status,
  isParticipant,
  canReview,
  opponentUserId,
  onScrollToReview,
}: SparingTimelineProps) {
  if (status === "CANCELLED") return null;

  const steps = getSteps(status);

  return (
    <Card className="mb-6">
      <CardContent className="py-6">
        {/* Timeline stepper */}
        <div className="flex items-start justify-between">
          {steps.map((step, i) => (
            <div key={step.label} className="flex flex-1 items-start">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
                    step.done
                      ? "bg-emerald-500 text-white"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {step.done ? (
                    <CheckCircle2 className="h-4.5 w-4.5" />
                  ) : (
                    <Circle className="h-4.5 w-4.5" />
                  )}
                </div>
                <p
                  className={`mt-2 text-center text-xs font-semibold ${
                    step.active ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {step.label}
                </p>
                {step.description && (
                  <p className="mt-0.5 text-center text-[10px] text-muted-foreground">
                    {step.description}
                  </p>
                )}
              </div>
              {/* Connector line */}
              {i < steps.length - 1 && (
                <div
                  className={`mt-4 h-0.5 flex-1 transition-colors ${
                    steps[i + 1].done ? "bg-emerald-500" : "bg-muted"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Post-match CTAs */}
        {isParticipant && (status === "MATCHED" || status === "COMPLETED") && (
          <div className="mt-6 flex flex-wrap items-center gap-3 border-t pt-5">
            {opponentUserId && (
              <SendMessageButton recipientUserId={opponentUserId} />
            )}
            {canReview && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={onScrollToReview}
              >
                <Star className="h-3.5 w-3.5 text-amber-500" />
                Oceń sparing
              </Button>
            )}
            {status === "MATCHED" && (
              <p className="text-xs text-muted-foreground">
                Po rozegraniu meczu, właściciel może oznaczyć sparing jako zakończony.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
