"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { toast } from "sonner";
import { api } from "@/lib/trpc-react";
import { formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { DetailPageSkeleton } from "@/components/card-skeleton";
import { SendMessageButton } from "@/components/send-message-button";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Breadcrumbs } from "@/components/breadcrumbs";
import {
  TRANSFER_TYPE_LABELS,
  TRANSFER_TYPE_COLORS,
  TRANSFER_STATUS_LABELS,
  TRANSFER_STATUS_COLORS,
  POSITION_LABELS,
} from "@/lib/labels";
import {
  ArrowRightLeft,
  Calendar,
  MapPin,
  FileText,
  Pencil,
  Trash2,
  User,
  Shield,
  XCircle,
  Target,
} from "lucide-react";
import { RegionLogo } from "@/components/region-logo";

export default function TransferDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session } = useSession();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const utils = api.useUtils();

  const { data: transfer } = api.transfer.getById.useQuery(
    { id },
    { enabled: !!id }
  );

  const deleteMutation = api.transfer.delete.useMutation({
    onSuccess: () => {
      toast.success("Ogłoszenie usunięte");
      router.push("/transfers");
    },
    onError: (err) => {
      toast.error(err.message);
    },
    onSettled: () => {
      setShowDeleteConfirm(false);
    },
  });

  const closeMutation = api.transfer.close.useMutation({
    onSuccess: () => {
      toast.success("Ogłoszenie zamknięte");
      utils.transfer.getById.invalidate({ id });
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  if (!transfer) return <DetailPageSkeleton />;

  const isOwner = session?.user?.id === transfer.userId;
  const authorName = transfer.user.club?.name
    ?? (transfer.user.player ? `${transfer.user.player.firstName} ${transfer.user.player.lastName}` : "Nieznany");
  const authorUserId = transfer.user.club?.userId ?? transfer.user.player?.userId;
  const profileLink = transfer.user.club
    ? `/clubs/${transfer.user.club.id}`
    : transfer.user.player
      ? `/players/${transfer.user.player.id}`
      : null;

  return (
    <div className="animate-fade-in">
      <Breadcrumbs
        items={[
          { label: "Transfery", href: "/transfers" },
          { label: transfer.title },
        ]}
      />

      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {transfer.title}
            </h1>
            <Badge variant="secondary" className={TRANSFER_TYPE_COLORS[transfer.type]}>
              {TRANSFER_TYPE_LABELS[transfer.type]}
            </Badge>
            <span className={`inline-flex items-center rounded-md px-3 py-1 text-xs font-semibold ${TRANSFER_STATUS_COLORS[transfer.status]}`}>
              {TRANSFER_STATUS_LABELS[transfer.status]}
            </span>
          </div>
          <p className="mt-1.5 text-muted-foreground">
            {profileLink ? (
              <Link href={profileLink} className="hover:text-primary transition">
                {authorName}
              </Link>
            ) : authorName}
          </p>
          {!isOwner && authorUserId && (
            <div className="mt-3">
              <SendMessageButton recipientUserId={authorUserId} />
            </div>
          )}
        </div>
        {isOwner && transfer.status === "ACTIVE" && (
          <div className="flex items-center gap-2">
            <Link href={`/transfers/${id}/edit`}>
              <Button size="sm" variant="outline" className="gap-1.5">
                <Pencil className="h-3.5 w-3.5" />
                Edytuj
              </Button>
            </Link>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={() => closeMutation.mutate({ id })}
              disabled={closeMutation.isPending}
            >
              <XCircle className="h-3.5 w-3.5" />
              {closeMutation.isPending ? "Zamykanie..." : "Zamknij"}
            </Button>
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
        title="Usuń ogłoszenie"
        description="Czy na pewno chcesz usunąć to ogłoszenie transferowe? Ta operacja jest nieodwracalna."
        confirmLabel="Tak, usuń"
        onConfirm={() => deleteMutation.mutate({ id })}
        loading={deleteMutation.isPending}
      />

      {/* Info grid */}
      <Card className="mb-6">
        <CardContent className="py-6">
          <div className="grid gap-6 sm:grid-cols-2">
            {transfer.position && (
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10">
                  <Target className="h-4 w-4 text-cyan-500" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Pozycja</p>
                  <p className="font-medium">{POSITION_LABELS[transfer.position]}</p>
                </div>
              </div>
            )}
            {transfer.region && (
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-500/10">
                  <RegionLogo slug={transfer.region.slug} name={transfer.region.name} size={20} />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Region</p>
                  <p className="font-medium">{transfer.region.name}</p>
                </div>
              </div>
            )}
            {(transfer.minAge || transfer.maxAge) && (
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-500/10">
                  <User className="h-4 w-4 text-violet-500" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Wiek</p>
                  <p className="font-medium">
                    {transfer.minAge && transfer.maxAge
                      ? `${transfer.minAge}–${transfer.maxAge} lat`
                      : transfer.minAge
                        ? `od ${transfer.minAge} lat`
                        : `do ${transfer.maxAge} lat`}
                  </p>
                </div>
              </div>
            )}
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
                <Calendar className="h-4 w-4 text-emerald-500" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Dodano</p>
                <p className="font-medium">{formatDate(transfer.createdAt)}</p>
              </div>
            </div>
          </div>
          {transfer.description && (
            <>
              <Separator className="my-6" />
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Opis</p>
                  <p className="mt-1 whitespace-pre-wrap leading-relaxed">{transfer.description}</p>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
