"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { api } from "@/lib/trpc-react";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CardSkeleton } from "@/components/card-skeleton";
import { EmptyState } from "@/components/empty-state";
import { MobileRefresh } from "@/components/mobile-refresh";
import { StagePill } from "@/components/recruitment/stage-pill";
import {
  POSITION_LABELS,
  RECRUITMENT_STAGE_LABELS,
} from "@/lib/labels";
import {
  Target,
  Eye,
  Trash2,
  LayoutGrid,
  List,
  Clock,
  Timer,
  Download,
} from "lucide-react";

type StageValue =
  | "WATCHING"
  | "INVITED_TO_TRYOUT"
  | "AFTER_TRYOUT"
  | "OFFER_SENT"
  | "SIGNED"
  | "REJECTED";

const STAGES: {
  key: StageValue;
  label: string;
  color: "blue" | "amber" | "violet" | "cyan" | "emerald" | "red";
  barColor: string;
  actionLabel: string;
  nextStage: StageValue | null;
  boardColor: string;
}[] = [
  { key: "WATCHING", label: "Radar", color: "blue", barColor: "bg-blue-500", actionLabel: "→ Zaproś", nextStage: "INVITED_TO_TRYOUT", boardColor: "border-t-blue-500" },
  { key: "INVITED_TO_TRYOUT", label: "Zaproszeni", color: "amber", barColor: "bg-amber-500", actionLabel: "→ Na testy", nextStage: "AFTER_TRYOUT", boardColor: "border-t-amber-500" },
  { key: "AFTER_TRYOUT", label: "Po testach", color: "violet", barColor: "bg-violet-500", actionLabel: "→ Oferta", nextStage: "OFFER_SENT", boardColor: "border-t-violet-500" },
  { key: "OFFER_SENT", label: "Oferta", color: "cyan", barColor: "bg-cyan-500", actionLabel: "→ Podpisz", nextStage: "SIGNED", boardColor: "border-t-cyan-500" },
  { key: "SIGNED", label: "Podpisani", color: "emerald", barColor: "bg-emerald-500", actionLabel: "✓ Podpisany", nextStage: null, boardColor: "border-t-emerald-500" },
  { key: "REJECTED", label: "Odrzuceni", color: "red", barColor: "bg-red-500", actionLabel: "✗ Odrzucony", nextStage: null, boardColor: "border-t-red-500" },
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
  const { t } = useI18n();
  if (events.length === 0) return null;

  return (
    <div className="mt-2 space-y-1">
      {events.map((ev) => (
        <div key={ev.id} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Clock className="h-3 w-3 shrink-0 opacity-50" />
          <span>
            {ev.fromStage
              ? `${t(RECRUITMENT_STAGE_LABELS[ev.fromStage] ?? ev.fromStage)} → ${t(RECRUITMENT_STAGE_LABELS[ev.toStage] ?? ev.toStage)}`
              : t(RECRUITMENT_STAGE_LABELS[ev.toStage] ?? ev.toStage)}
          </span>
          {ev.note && <span className="truncate italic">— {ev.note}</span>}
          <span className="ml-auto shrink-0">{formatShort(ev.createdAt)}</span>
        </div>
      ))}
    </div>
  );
}

// Pipeline card used in board view
function BoardCard({
  entry,
  onRemove,
  draggable,
  onDragStart,
}: {
  entry: PipelineEntry;
  onRemove: () => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
}) {
  const { t } = useI18n();
  const player = entry.transfer.user.player;
  const playerName = player
    ? `${player.firstName} ${player.lastName}`
    : entry.transfer.title;

  return (
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      className={`rounded-lg border border-border bg-card p-3 transition-all hover:border-primary/30 ${
        draggable ? "cursor-grab active:cursor-grabbing" : ""
      }`}
    >
      <div className="flex items-start gap-3">
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
                {t(POSITION_LABELS[player.primaryPosition] ?? player.primaryPosition)}
              </Badge>
            )}
            {player?.city && (
              <span className="text-[10px] text-muted-foreground">{player.city}</span>
            )}
          </div>
          {entry.notes && (
            <p className="mt-1 text-[11px] text-muted-foreground line-clamp-1">{entry.notes}</p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-0.5">
          <Link href={`/transfers/${entry.transfer.id}`}>
            <Button size="icon" variant="ghost" className="h-7 w-7" title={t("Zobacz ogłoszenie")}>
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
          <BoardCard
            key={entry.id}
            entry={entry}
            draggable
            onDragStart={(e) => e.dataTransfer.setData("text/plain", entry.id)}
            onRemove={() => onRemove(entry.id)}
          />
        ))}
      </div>
    </div>
  );
}

// List row card
function ListRow({
  entry,
  onStageChange,
  onRemove,
}: {
  entry: PipelineEntry;
  onStageChange: (stage: StageValue) => void;
  onRemove: () => void;
}) {
  const { t } = useI18n();
  const player = entry.transfer.user.player;
  const playerName = player
    ? `${player.firstName} ${player.lastName}`
    : entry.transfer.title;

  const stageConfig = STAGES.find((s) => s.key === entry.stage);

  return (
    <div className="flex items-start gap-3 px-4 py-3">
      {/* Avatar */}
      {player?.photoUrl ? (
        <img src={player.photoUrl} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" />
      ) : (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-500/10 text-sm font-bold text-violet-600 dark:text-violet-400">
          {player ? `${player.firstName[0]}${player.lastName[0]}` : "?"}
        </div>
      )}

      {/* Name + meta */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-2">
          {player ? (
            <Link href={`/players/${player.id}`} className="font-bold hover:underline hover:text-primary">
              {playerName}
            </Link>
          ) : (
            <Link href={`/transfers/${entry.transfer.id}`} className="font-bold hover:underline hover:text-primary">
              {playerName}
            </Link>
          )}
          <div className="flex flex-wrap items-center gap-1">
            {player?.primaryPosition && (
              <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium">
                {t(POSITION_LABELS[player.primaryPosition] ?? player.primaryPosition)}
              </span>
            )}
            {player?.city && (
              <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                {player.city}
              </span>
            )}
          </div>
        </div>
        <MiniTimeline events={entry.events} />
      </div>

      {/* Inline action */}
      <div className="flex shrink-0 items-center gap-1">
        {stageConfig?.nextStage && (
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-[11px] px-2"
            onClick={() => onStageChange(stageConfig.nextStage!)}
          >
            {t(stageConfig.actionLabel)}
          </Button>
        )}
        <Link href={`/transfers/${entry.transfer.id}`}>
          <Button size="icon" variant="ghost" className="h-7 w-7" title={t("Zobacz ogłoszenie")}>
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
  );
}

export default function RecruitmentPage() {
  const { t } = useI18n();
  const { data: session } = useSession();
  const isClub = session?.user?.role === "CLUB";
  const [view, setView] = useState<"list" | "board">("list");
  const [activeStage, setActiveStage] = useState<StageValue | null>(null);

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
      toast.success(t("Przeniesiono"));
    },
    onError: (err) => toast.error(err.message),
  });

  const updateStageMut = api.recruitment.updateStage.useMutation({
    onSuccess: () => {
      invalidatePipeline();
      toast.success(t("Status zaktualizowany"));
    },
    onError: (err) => toast.error(err.message),
  });

  const removeMut = api.recruitment.remove.useMutation({
    onSuccess: () => {
      invalidatePipeline();
      toast.success(t("Usunięto z pipeline"));
    },
    onError: (err) => toast.error(err.message),
  });

  const entries = (pipeline ?? []) as PipelineEntry[];

  const stageCounts = useMemo(() =>
    STAGES.map((s) => ({
      ...s,
      count: entries.filter((e) => e.stage === s.key).length,
    })), [entries]);

  const entriesByStage = useMemo(() =>
    STAGES.reduce<Record<string, PipelineEntry[]>>(
      (acc, s) => {
        acc[s.key] = entries.filter((e) => e.stage === s.key);
        return acc;
      },
      {}
    ), [entries]);

  if (!isClub) {
    return (
      <EmptyState
        icon={Target}
        title={t("Sekcja dla klubów")}
        description={t("Pipeline rekrutacyjny jest dostępny tylko dla kont klubowych.")}
      />
    );
  }

  function handleDrop(entryId: string, newStage: StageValue, position: number) {
    updateStageOrderMut.mutate({ id: entryId, stage: newStage, position });
  }

  const total = stageCounts.reduce((a, b) => a + b.count, 0);

  const filteredEntries = activeStage
    ? entries.filter((e) => e.stage === activeStage)
    : entries;

  function handleCsvExport() {
    const rows = [
      [t("Imię"), t("Nazwisko"), t("Pozycja"), t("Miasto"), t("Etap")],
      ...entries.map((e) => {
        const p = e.transfer.user.player;
        return [
          p?.firstName ?? "",
          p?.lastName ?? e.transfer.title,
          p?.primaryPosition ? (POSITION_LABELS[p.primaryPosition] ?? p.primaryPosition) : "",
          p?.city ?? "",
          RECRUITMENT_STAGE_LABELS[e.stage] ?? e.stage,
        ];
      }),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "pipeline.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Pipeline</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {total} {t("zawodników w procesie")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* CSV export */}
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-[13px]"
            onClick={handleCsvExport}
            disabled={entries.length === 0}
          >
            <Download className="h-3.5 w-3.5" />
            CSV
          </Button>

          {/* View toggle */}
          <div className="flex rounded-lg border border-border">
            <button
              onClick={() => setView("list")}
              className={`flex items-center gap-1.5 rounded-l-lg px-3 py-2 text-[13px] font-medium transition ${
                view === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
              title={t("Widok listy")}
            >
              <List className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setView("board")}
              className={`flex items-center gap-1.5 rounded-r-lg px-3 py-2 text-[13px] font-medium transition ${
                view === "board" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
              title={t("Widok tablicy")}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
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
          title={t("Pusty pipeline")}
          description={t('Dodaj zawodników z zakładki "Transfery" — kliknij ikonę radaru na karcie.')}
          actionLabel={t("Przeglądaj transfery")}
          actionHref="/transfers?type=LOOKING_FOR_CLUB"
        />
      ) : (
        <>
          {/* Progress Bar */}
          {total > 0 && (
            <div className="mb-4 flex h-1.5 gap-0.5 overflow-hidden rounded-full">
              {stageCounts.map((s) =>
                s.count > 0 ? (
                  <div
                    key={s.key}
                    className={`${s.barColor} transition-all`}
                    style={{ flex: s.count }}
                    title={`${s.label}: ${s.count}`}
                  />
                ) : null
              )}
            </div>
          )}

          {/* Stage Pills */}
          {view === "list" && (
            <div className="mb-4 flex gap-2 overflow-x-auto pb-2">
              <StagePill
                label={t("Wszyscy")}
                count={total}
                color="violet"
                active={activeStage === null}
                onClick={() => setActiveStage(null)}
              />
              {stageCounts.map((s) => (
                <StagePill
                  key={s.key}
                  label={t(s.label)}
                  count={s.count}
                  color={s.color}
                  active={activeStage === s.key}
                  onClick={() => setActiveStage(activeStage === s.key ? null : s.key)}
                />
              ))}
            </div>
          )}

          {view === "board" ? (
            /* Kanban Board */
            <div className="grid gap-3 overflow-x-auto lg:grid-cols-6 md:grid-cols-3 sm:grid-cols-2">
              {STAGES.map((s) => (
                <BoardColumn
                  key={s.key}
                  stage={s.key}
                  label={t(s.label)}
                  color={s.boardColor}
                  entries={entriesByStage[s.key] ?? []}
                  onDrop={handleDrop}
                  onRemove={(id) => removeMut.mutate({ id })}
                />
              ))}
            </div>
          ) : (
            /* List View */
            <div className="bg-card rounded-xl divide-y divide-border">
              {filteredEntries.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                  {t("Brak zawodników w tej kategorii")}
                </p>
              ) : (
                filteredEntries.map((entry) => (
                  <ListRow
                    key={entry.id}
                    entry={entry}
                    onStageChange={(stage) => updateStageMut.mutate({ id: entry.id, stage })}
                    onRemove={() => removeMut.mutate({ id: entry.id })}
                  />
                ))
              )}
            </div>
          )}

          {/* MetricCard */}
          {avgTime && (
            <div className="mt-4 bg-card rounded-xl p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-500/10 shrink-0">
                <Timer className="h-5 w-5 text-sky-400" />
              </div>
              <div>
                <p className="text-xl font-extrabold text-sky-400 tabular-nums leading-none">
                  {avgTime.avgDays} {t("dni")}
                </p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {t("Średni czas do podpisania")}
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
