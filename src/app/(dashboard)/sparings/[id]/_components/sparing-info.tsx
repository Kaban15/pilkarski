"use client";

import Link from "next/link";
import { formatDate } from "@/lib/format";
import {
  SPARING_STATUS_LABELS,
  SPARING_STATUS_COLORS,
  SPARING_LEVEL_LABELS,
  AGE_CATEGORY_LABELS,
} from "@/lib/labels";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SendMessageButton } from "@/components/send-message-button";
import { ConfirmDialog } from "@/components/confirm-dialog";
import {
  Calendar,
  MapPin,
  Globe,
  Banknote,
  FileText,
  Pencil,
  Trash2,
  CheckCircle2,
  Trophy,
  Users,
  Clock,
} from "lucide-react";

type SparingInfoProps = {
  sparing: any;
  isOwner: boolean;
  showDeleteConfirm: boolean;
  setShowDeleteConfirm: (v: boolean) => void;
  onDelete: () => void;
  onComplete: () => void;
  deleting: boolean;
  completing: boolean;
};

export function SparingInfo({
  sparing,
  isOwner,
  showDeleteConfirm,
  setShowDeleteConfirm,
  onDelete,
  onComplete,
  deleting,
  completing,
}: SparingInfoProps) {
  return (
    <>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {sparing.title}
            </h1>
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${SPARING_STATUS_COLORS[sparing.status]}`}
            >
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
        {isOwner && (
          <div className="flex items-center gap-2">
            {sparing.status === "OPEN" && (
              <>
                <Link href={`/sparings/${sparing.id}/edit`}>
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
              </>
            )}
            {sparing.status === "MATCHED" && (
              <Button
                size="sm"
                className="gap-1.5"
                onClick={onComplete}
                disabled={completing}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                {completing ? "Oznaczanie..." : "Oznacz jako zakończony"}
              </Button>
            )}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Usuń sparing"
        description="Czy na pewno chcesz usunąć ten sparing? Ta operacja jest nieodwracalna."
        confirmLabel="Tak, usuń"
        onConfirm={onDelete}
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
                  <p className="text-xs font-medium text-muted-foreground">
                    Podział kosztów
                  </p>
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
            {sparing.level && (
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-purple-500/10">
                  <Trophy className="h-4 w-4 text-purple-500" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Poziom</p>
                  <p className="font-medium">{SPARING_LEVEL_LABELS[sparing.level] ?? sparing.level}</p>
                </div>
              </div>
            )}
            {sparing.ageCategory && (
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10">
                  <Users className="h-4 w-4 text-cyan-500" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Kategoria wiekowa</p>
                  <p className="font-medium">{AGE_CATEGORY_LABELS[sparing.ageCategory] ?? sparing.ageCategory}</p>
                </div>
              </div>
            )}
            {sparing.preferredTime && (
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10">
                  <Clock className="h-4 w-4 text-indigo-500" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Preferowane godziny</p>
                  <p className="font-medium">{sparing.preferredTime}</p>
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
                  <p className="mt-1 whitespace-pre-wrap leading-relaxed">
                    {sparing.description}
                  </p>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </>
  );
}
