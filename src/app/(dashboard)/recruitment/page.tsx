"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { api } from "@/lib/trpc-react";
import { Button } from "@/components/ui/button";
import { MobileRefresh } from "@/components/mobile-refresh";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CardSkeleton } from "@/components/card-skeleton";
import { EmptyState } from "@/components/empty-state";
import {
  POSITION_LABELS,
  RECRUITMENT_STAGE_LABELS,
  RECRUITMENT_STAGE_COLORS,
} from "@/lib/labels";
import {
  Target,
  Eye,
  Trash2,
  MessageSquare,
  LayoutGrid,
  List,
  Clock,
  ArrowRight,
  Timer,
} from "lucide-react";

type StageValue =
  | "WATCHING"
  | "INVITED_TO_TRYOUT"
  | "AFTER_TRYOUT"
  | "OFFER_SENT"
  | "SIGNED"
  | "REJECTED";

const BOARD_COLUMNS: { stage: StageValue; label: string; color: string }[] = [
  { stage: "WATCHING", label: "Na radarze", color: "border-t-blue-500" },
  { stage: "INVITED_TO_TRYOUT", label: "Zaproszeni", color: "border-t-amber-500" },
  { stage: "AFTER_TRYOUT", label: "Po testach", color: "border-t-violet-500" },
  { stage: "OFFER_SENT", label: "Oferta", color: "border-t-cyan-500" },
  { stage: "SIGNED", label: "Podpisani", color: "border-t-emerald-500" },
  { stage: "REJECTED", label: "Odrzuceni", color: "border-t-red-500" },
];

type PipelineEntry = {
  id: string;
  stage: string;
  position: number;
  notes: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  transfer: {
    id: string;
    title: string;
    user: {
      player: {
        id: string;
        firstName: string;
        lastName: string;
        photoUrl: string | null;
        primaryPosition: string | null;
        city: string | null;
      } | null;
    };
    region: { name: string } | null;
  };
  events: {
    id: string;
    fromStage: string | null;
    toStage: string;
    note: string | null;
    createdAt: string | Date;
  }[];
};

function formatShort(d: string | Date): string {
  return new Date(d).toLocaleDateString("pl-PL", { day: "numeric", month: "short" });
}

// Mini timeline on pipeline cards
function MiniTimeline({ events }: { events: PipelineEntry["events"] }) {
  if (events.length === 0) return null;

  return (
    <div className="mt-2 space-y-1">
      {events.map((ev) => (
        <div key={ev.id} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Clock className="h-3 w-3 shrink-0 opacity-50" />
          <span>
            {ev.fromStage
              ? `${RECRUITMENT_STAGE_LABELS[ev.fromStage] ?? ev.fromStage} → ${RECRUITMENT_STAGE_LABELS[ev.toStage] ?? ev.toStage}`
              : RECRUITMENT_STAGE_LABELS[ev.toStage] ?? ev.toStage}
          </span>
          {ev.note && <span className="truncate italic">— {ev.note}</span>}
          <span className="ml-auto shrink-0">{formatShort(ev.createdAt)}</span>
        </div>
      ))}
    </div>
  );
}

// Pipeline card used in both board and list view
function PipelineCard({
  entry,
  compact,
  onStageChange,
  onRemove,
  draggable,
  onDragStart,
}: {
  entry: PipelineEntry;
  compact?: boolean;
  onStageChange?: (stage: StageValue) => void;
  onRemove: () => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
}) {
  const player = entry.transfer.user.player;
  const playerName = player
    ? `${player.firstName} ${player.lastName}`
    : entry.transfer.title;

  return (
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      className={`rounded-lg border border-border bg-card p-3 transition-all hover:border-primary/30 ${
        draggable ? "cursor-grab active:cursor-grabbing active:shadow-md" : ""
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        {player?.photoUrl ? (
          <img src={player.photoUrl} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover" />
        ) : (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-500/10 text-xs font-bold text-violet-600 dark:text-violet-400">
            {player ? `${player.firstName[0]}${player.lastName[0]}` : "?"}
          </div>
        )}

        <div className="min-w-0 flex-1">
          {player ? (
            <Link href={`/players/${player.id}`} className="text-[13px] font-semibold hover:underline hover:text-primary">
              {playerName}
            </Link>
          ) : (
            <Link href={`/transfers/${entry.transfer.id}`} className="text-[13px] font-semibold hover:underline hover:text-primary">
              {playerName}
            </Link>
          )}
          <div className="flex flex-wrap items-center gap-1 mt-0.5">
            {player?.primaryPosition && (
              <Badge variant="secondary" className="text-[10px]">
                {POSITION_LABELS[player.primaryPosition]}
              </Badge>
            )}
            {player?.city && (
              <span className="text-[10px] text-muted-foreground">{player.city}</span>
            )}
          </div>
          {entry.notes && !compact && (
            <p className="mt-1 text-[11px] text-muted-foreground line-clamp-1">{entry.notes}</p>
          )}
          {!compact && <MiniTimeline events={entry.events} />}
        </div>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-0.5">
          <Link href={`/transfers/${entry.transfer.id}`}>
            <Button size="icon" variant="ghost" className="h-7 w-7" title="Zobacz ogłoszenie">
              <Eye className="h-3.5 w-3.5" />
            </Button>
          </Link>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
            onClick={onRemove}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// Kanban board column
function BoardColumn({
  stage,
  label,
  color,
  entries,
  onDrop,
  onRemove,
}: {
  stage: StageValue;
  label: string;
  color: string;
  entries: PipelineEntry[];
  onDrop: (entryId: string, newStage: StageValue, position: number) => void;
  onRemove: (id: string) => void;
}) {
  const [dragOver, setDragOver] = useState(false);

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(true);
  }

  function handleDragLeave() {
    setDragOver(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const entryId = e.dataTransfer.getData("text/plain");
    if (entryId) {
      onDrop(entryId, stage, entries.length);
    }
  }

  return (
    <div
      className={`flex min-h-[200px] flex-col rounded-xl border border-border bg-muted/30 ${color} border-t-2 ${
        dragOver ? "ring-2 ring-primary/30" : ""
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex items-center justify-between px-3 py-2.5">
        <p className="text-[13px] font-semibold">{label}</p>
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-muted px-1.5 text-[11px] font-bold text-muted-foreground">
          {entries.length}
        </span>
      </div>
      <div className="flex-1 space-y-2 px-2 pb-2">
        {entries.map((entry) => (
          <PipelineCard
            key={entry.id}
            entry={entry}
            compact
            draggable
            onDragStart={(e) => e.dataTransfer.setData("text/plain", entry.id)}
            onRemove={() => onRemove(entry.id)}
          />
        ))}
      </div>
    </div>
  );
}

export default function RecruitmentPage() {
  const { data: session } = useSession();
  const isClub = session?.user?.role === "CLUB";
  const [view, setView] = useState<"board" | "list">("board");

  const utils = api.useUtils();

  const { data: pipeline, isLoading } = api.recruitment.myPipeline.useQuery(
    {},
    { enabled: isClub }
  );

  const { data: avgTime } = api.recruitment.avgTimeToSign.useQuery(undefined, {
    enabled: isClub,
    staleTime: 300_000,
  });

  function invalidatePipeline() {
    utils.recruitment.myPipeline.invalidate();
    utils.recruitment.stats.invalidate();
  }

  const updateStageOrderMut = api.recruitment.updateStageAndOrder.useMutation({
    onSuccess: () => {
      invalidatePipeline();
      toast.success("Przeniesiono");
    },
    onError: (err) => toast.error(err.message),
  });

  const updateStageMut = api.recruitment.updateStage.useMutation({
    onSuccess: () => {
      invalidatePipeline();
      toast.success("Status zaktualizowany");
    },
    onError: (err) => toast.error(err.message),
  });

  const removeMut = api.recruitment.remove.useMutation({
    onSuccess: () => {
      invalidatePipeline();
      toast.success("Usunięto z pipeline");
    },
    onError: (err) => toast.error(err.message),
  });

  if (!isClub) {
    return (
      <EmptyState
        icon={Target}
        title="Sekcja dla klubów"
        description="Pipeline rekrutacyjny jest dostępny tylko dla kont klubowych."
      />
    );
  }

  function handleDrop(entryId: string, newStage: StageValue, position: number) {
    updateStageOrderMut.mutate({ id: entryId, stage: newStage, position });
  }

  const entries = (pipeline ?? []) as PipelineEntry[];
  const entriesByStage = useMemo(() =>
    BOARD_COLUMNS.reduce<Record<string, PipelineEntry[]>>(
      (acc, col) => {
        acc[col.stage] = entries.filter((e) => e.stage === col.stage);
        return acc;
      },
      {}
    ), [entries]);

  return (
    <div className="animate-fade-in">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Rekrutacja</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Pipeline kandydatów — przeciągnij karty między kolumnami
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Avg time to sign */}
          {avgTime && (
            <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-2">
              <Timer className="h-4 w-4 text-emerald-500" />
              <div>
                <p className="text-sm font-bold tabular-nums">{avgTime.avgDays} dni</p>
                <p className="text-[10px] text-muted-foreground">Śr. czas do podpisania</p>
              </div>
            </div>
          )}

          {/* View toggle */}
          <div className="flex rounded-lg border border-border">
            <button
              onClick={() => setView("board")}
              className={`flex items-center gap-1.5 rounded-l-lg px-3 py-2 text-[13px] font-medium transition ${
                view === "board" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              Board
            </button>
            <button
              onClick={() => setView("list")}
              className={`flex items-center gap-1.5 rounded-r-lg px-3 py-2 text-[13px] font-medium transition ${
                view === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <List className="h-3.5 w-3.5" />
              Lista
            </button>
          </div>
        </div>
      </div>

      <MobileRefresh onRefresh={() => utils.recruitment.myPipeline.invalidate()} loading={isLoading} />

      {isLoading ? (
        <div className="grid gap-3 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <EmptyState
          icon={Eye}
          title="Pusty pipeline"
          description='Dodaj zawodników z zakładki "Transfery" — kliknij ikonę radaru na karcie.'
          actionLabel="Przeglądaj transfery"
          actionHref="/transfers?type=LOOKING_FOR_CLUB"
        />
      ) : view === "board" ? (
        /* Kanban Board */
        <div className="grid gap-3 overflow-x-auto lg:grid-cols-6 md:grid-cols-3 sm:grid-cols-2">
          {BOARD_COLUMNS.map((col) => (
            <BoardColumn
              key={col.stage}
              stage={col.stage}
              label={col.label}
              color={col.color}
              entries={entriesByStage[col.stage] ?? []}
              onDrop={handleDrop}
              onRemove={(id) => removeMut.mutate({ id })}
            />
          ))}
        </div>
      ) : (
        /* List View */
        <div className="space-y-3 stagger-children">
          {entries.map((entry) => (
            <PipelineCard
              key={entry.id}
              entry={entry}
              onStageChange={(stage) => updateStageMut.mutate({ id: entry.id, stage })}
              onRemove={() => removeMut.mutate({ id: entry.id })}
            />
          ))}
        </div>
      )}
    </div>
  );
}
