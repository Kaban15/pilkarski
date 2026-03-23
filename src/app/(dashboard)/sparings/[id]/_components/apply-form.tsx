"use client";

import { useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { APPLICATION_STATUS_LABELS, APPLICATION_STATUS_COLORS } from "@/lib/labels";
import { Swords, Send, Clock } from "lucide-react";

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
  const [applying, setApplying] = useState(false);

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
          </div>
        </CardContent>
      </Card>
    );
  }

  // Only clubs can apply
  if (!isClub) return null;

  async function handleApply() {
    setApplying(true);
    try {
      await trpc.sparing.applyFor.mutate({
        sparingOfferId: sparingId,
        message: message || undefined,
      });
      setMessage("");
      toast.success("Zgłoszenie wysłane");
      onApplied();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setApplying(false);
    }
  }

  return (
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
  );
}
