"use client";

import Link from "next/link";
import Image from "next/image";
import { useI18n } from "@/lib/i18n";
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
  FileText,
  Pencil,
  Trash2,
  CheckCircle2,
  Trophy,
  Users,
  Clock,
  Banknote,
} from "lucide-react";
import { RegionLogo } from "@/components/region-logo";

type SparingInfoProps = {
  sparing: any;
  isOwner: boolean;
  acceptedApp?: any;
  sessionUserId?: string;
  showDeleteConfirm: boolean;
  setShowDeleteConfirm: (v: boolean) => void;
  showCompleteConfirm: boolean;
  setShowCompleteConfirm: (v: boolean) => void;
  onDelete: () => void;
  onComplete: () => void;
  deleting: boolean;
  completing: boolean;
};

export function SparingInfo({
  sparing,
  isOwner,
  acceptedApp,
  sessionUserId,
  showDeleteConfirm,
  setShowDeleteConfirm,
  showCompleteConfirm,
  setShowCompleteConfirm,
  onDelete,
  onComplete,
  deleting,
  completing,
}: SparingInfoProps) {
  const { t } = useI18n();

  const opponent = acceptedApp?.applicantClub;
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
              className={`inline-flex items-center rounded-md px-3 py-1 text-xs font-semibold ${SPARING_STATUS_COLORS[sparing.status]}`}
            >
              {t(SPARING_STATUS_LABELS[sparing.status])}
            </span>
          </div>
          <p className="mt-1.5 text-muted-foreground">
            {sparing.club.name}
            {sparing.club.city && ` · ${sparing.club.city}`}
          </p>
          {opponent && (sparing.status === "MATCHED" || sparing.status === "COMPLETED") && (
            <div className="mt-3 flex items-center gap-2.5 rounded-lg border bg-muted/40 px-3 py-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
                {opponent.logoUrl ? (
                  <Image src={opponent.logoUrl} alt={opponent.name} width={32} height={32} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-xs font-bold text-muted-foreground">
                    {(opponent.name ?? "?").slice(0, 2).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">{t("Przeciwnik")}: </span>
                <span className="font-medium">{opponent.name}</span>
                {opponent.city && (
                  <span className="text-muted-foreground"> · {opponent.city}</span>
                )}
              </div>
            </div>
          )}
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
                    {t("Edytuj")}
                  </Button>
                </Link>
                <Button
                  size="sm"
                  variant="destructive"
                  className="gap-1.5"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  {t("Usuń")}
                </Button>
              </>
            )}
            {sparing.status === "MATCHED" && (
              <Button
                size="sm"
                className="gap-1.5"
                onClick={() => setShowCompleteConfirm(true)}
                disabled={completing}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                {completing ? t("Oznaczanie...") : t("Oznacz jako zakończony")}
              </Button>
            )}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title={t("Usuń sparing")}
        description={t("Czy na pewno chcesz usunąć ten sparing? Ta operacja jest nieodwracalna.")}
        confirmLabel={t("Tak, usuń")}
        onConfirm={onDelete}
        loading={deleting}
      />

      <ConfirmDialog
        open={showCompleteConfirm}
        onOpenChange={setShowCompleteConfirm}
        title={t("Zakończ sparing")}
        description={t("Czy na pewno chcesz oznaczyć ten sparing jako zakończony? Po zakończeniu uczestnicy będą mogli wystawić recenzje.")}
        confirmLabel={t("Tak, zakończ")}
        onConfirm={onComplete}
        loading={completing}
        variant="default"
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
                <p className="text-xs font-medium text-muted-foreground">{t("Data meczu")}</p>
                <p className="font-medium">{formatDate(sparing.matchDate)}</p>
              </div>
            </div>
            {sparing.location && (
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
                  <MapPin className="h-4 w-4 text-blue-500" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">{t("Miejsce")}</p>
                  <p className="font-medium">{sparing.location}</p>
                </div>
              </div>
            )}
            {sparing.region && (
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-500/10">
                  <RegionLogo slug={sparing.region.slug} name={sparing.region.name} size={20} />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">{t("Region")}</p>
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
                  <p className="text-xs font-medium text-muted-foreground">{t("Poziom")}</p>
                  <p className="font-medium">{t(SPARING_LEVEL_LABELS[sparing.level] ?? sparing.level)}</p>
                </div>
              </div>
            )}
            {sparing.ageCategory && (
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10">
                  <Users className="h-4 w-4 text-cyan-500" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">{t("Kategoria wiekowa")}</p>
                  <p className="font-medium">{t(AGE_CATEGORY_LABELS[sparing.ageCategory] ?? sparing.ageCategory)}</p>
                </div>
              </div>
            )}
            {sparing.preferredTime && (
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10">
                  <Clock className="h-4 w-4 text-indigo-500" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">{t("Preferowane godziny")}</p>
                  <p className="font-medium">{sparing.preferredTime}</p>
                </div>
              </div>
            )}
            {sparing.costPerTeam != null && sparing.costPerTeam > 0 && (
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
                  <Banknote className="h-4 w-4 text-amber-500" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">{t("Koszt")}</p>
                  <p className="font-medium">{sparing.costPerTeam} {t("PLN na drużynę")}</p>
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
                  <p className="text-xs font-medium text-muted-foreground">{t("Opis")}</p>
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
