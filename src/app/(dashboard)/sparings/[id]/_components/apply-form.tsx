"use client";

import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/trpc-react";
import { formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { APPLICATION_STATUS_LABELS, APPLICATION_STATUS_COLORS } from "@/lib/labels";
import { Swords, Send, Clock, CalendarClock } from "lucide-react";

type ApplyFormProps = {
  sparingId: string;
  status: string;
  isOwner: boolean;
  isClub: boolean;
  existingApplication: any | null;
  onApplied: () => void;
};

export function ApplyForm({
  sparingId,
  status,
  isOwner,
  isClub,
  existingApplication,
  onApplied,
}: ApplyFormProps) {
  const [message, setMessage] = useState("");
  const [counterDate, setCounterDate] = useState("");
  const [showCounterDate, setShowCounterDate] = useState(false);

  const applyMutation = api.sparing.applyFor.useMutation({
    onSuccess: () => {
      setMessage("");
      setCounterDate("");
      toast.success(
        counterDate
          ? "Zgłoszenie z kontr-propozycją terminu wysłane"
          : "Zgłoszenie wysłane"
      );
      onApplied();
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  if (status !== "OPEN" || isOwner) return null;

  // Already applied — show status badge
  if (existingApplication) {
    return (
      <Card className="mb-6 border-muted">
        <CardContent className="flex items-center gap-3 py-4">
          <Clock className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">Twoje zgłoszenie</p>
            <Badge
              variant="secondary"
              className={`mt-1 ${APPLICATION_STATUS_COLORS[existingApplication.status]}`}
            >
              {APPLICATION_STATUS_LABELS[existingApplication.status]}
            </Badge>
            {existingApplication.counterProposedDate && (
              <p className="mt-1 text-xs text-muted-foreground">
                Proponowana data: {formatDate(existingApplication.counterProposedDate)}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Only clubs can apply
  if (!isClub) return null;

  function handleApply() {
    applyMutation.mutate({
      sparingOfferId: sparingId,
      message: message || undefined,
      counterProposedDate: counterDate || undefined,
    });
  }

  // Minimum date for counter-proposal (tomorrow)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  return (
    <Card className="mb-6 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Swords className="h-5 w-5 text-primary" />
          Zgłoś swój klub
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Input
            placeholder="Wiadomość (opcjonalna)"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <Button onClick={handleApply} disabled={applyMutation.isPending} className="gap-1.5">
            <Send className="h-4 w-4" />
            {applyMutation.isPending ? "Wysyłanie..." : "Aplikuj"}
          </Button>
        </div>

        {/* Counter-proposal toggle */}
        <div>
          <button
            type="button"
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => {
              setShowCounterDate(!showCounterDate);
              if (showCounterDate) setCounterDate("");
            }}
          >
            <CalendarClock className="h-3.5 w-3.5" />
            {showCounterDate ? "Anuluj kontr-propozycję" : "Zaproponuj inny termin"}
          </button>

          {showCounterDate && (
            <div className="mt-2 flex items-center gap-2">
              <Input
                type="date"
                min={minDate}
                value={counterDate}
                onChange={(e) => setCounterDate(e.target.value)}
                className="w-auto"
              />
              {counterDate && (
                <p className="text-xs text-orange-600 dark:text-orange-400">
                  Zgłoszenie zostanie oznaczone jako kontr-propozycja
                </p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
