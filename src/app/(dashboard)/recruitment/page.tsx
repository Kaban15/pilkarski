"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { api } from "@/lib/trpc-react";
import { formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CardSkeleton } from "@/components/card-skeleton";
import { EmptyState } from "@/components/empty-state";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  POSITION_LABELS,
  RECRUITMENT_STAGE_LABELS,
  RECRUITMENT_STAGE_COLORS,
} from "@/lib/labels";
import {
  Target,
  Eye,
  Trash2,
  ArrowRightLeft,
  MessageSquare,
} from "lucide-react";

type StageValue =
  | "WATCHING"
  | "INVITED_TO_TRYOUT"
  | "AFTER_TRYOUT"
  | "OFFER_SENT"
  | "SIGNED"
  | "REJECTED";

const STAGE_TABS: { value: StageValue | "ALL"; label: string }[] = [
  { value: "ALL", label: "Wszystkie" },
  { value: "WATCHING", label: "Na radarze" },
  { value: "INVITED_TO_TRYOUT", label: "Zaproszeni" },
  { value: "AFTER_TRYOUT", label: "Po testach" },
  { value: "OFFER_SENT", label: "Oferta" },
  { value: "SIGNED", label: "Podpisani" },
  { value: "REJECTED", label: "Odrzuceni" },
];

export default function RecruitmentPage() {
  const { data: session } = useSession();
  const isClub = session?.user?.role === "CLUB";
  const [activeTab, setActiveTab] = useState<StageValue | "ALL">("ALL");

  const utils = api.useUtils();

  const { data: pipeline, isLoading } = api.recruitment.myPipeline.useQuery(
    { stage: activeTab === "ALL" ? undefined : activeTab },
    { enabled: isClub }
  );

  const updateStageMut = api.recruitment.updateStage.useMutation({
    onSuccess: () => {
      utils.recruitment.myPipeline.invalidate();
      toast.success("Status zaktualizowany");
    },
    onError: (err) => toast.error(err.message),
  });

  const removeMut = api.recruitment.remove.useMutation({
    onSuccess: () => {
      utils.recruitment.myPipeline.invalidate();
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

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Rekrutacja
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Twój pipeline kandydatów — śledź status zawodników
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as StageValue | "ALL")}
        className="mb-6"
      >
        <TabsList className="flex-wrap">
          {STAGE_TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : !pipeline || pipeline.length === 0 ? (
        <EmptyState
          icon={Eye}
          title="Pusty pipeline"
          description='Dodaj zawodników do pipeline z zakładki "Transfery" — kliknij ikonę radaru na karcie zawodnika.'
          actionLabel="Przeglądaj transfery"
          actionHref="/transfers?type=LOOKING_FOR_CLUB"
        />
      ) : (
        <div className="space-y-3 stagger-children">
          {pipeline.map((entry) => {
            const player = entry.transfer.user.player;
            const playerName = player
              ? `${player.firstName} ${player.lastName}`
              : entry.transfer.title;

            return (
              <Card
                key={entry.id}
                className="transition-all hover:border-primary/40"
              >
                <CardContent className="flex items-center gap-4 py-4">
                  {/* Avatar */}
                  {player?.photoUrl ? (
                    <img
                      src={player.photoUrl}
                      alt=""
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-500/10 text-sm font-bold text-violet-600 dark:text-violet-400">
                      {player
                        ? `${player.firstName[0]}${player.lastName[0]}`
                        : "?"}
                    </div>
                  )}

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/transfers/${entry.transfer.id}`}
                      className="text-sm font-semibold hover:text-primary"
                    >
                      {playerName}
                    </Link>
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {player?.primaryPosition && (
                        <Badge variant="secondary" className="text-[10px]">
                          {POSITION_LABELS[player.primaryPosition]}
                        </Badge>
                      )}
                      {player?.city && (
                        <span className="text-[10px] text-muted-foreground">
                          {player.city}
                        </span>
                      )}
                      {entry.transfer.region && (
                        <span className="text-[10px] text-muted-foreground">
                          · {entry.transfer.region.name}
                        </span>
                      )}
                    </div>
                    {entry.notes && (
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-1">
                        {entry.notes}
                      </p>
                    )}
                  </div>

                  {/* Stage selector */}
                  <Select
                    value={entry.stage}
                    onValueChange={(v) =>
                      updateStageMut.mutate({
                        id: entry.id,
                        stage: v as StageValue,
                      })
                    }
                  >
                    <SelectTrigger className="h-8 w-auto min-w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(RECRUITMENT_STAGE_LABELS).map(
                        ([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    {player && (
                      <Link href={`/players/${player.id}`}>
                        <Button size="icon" variant="ghost" className="h-8 w-8">
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                      </Link>
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => removeMut.mutate({ id: entry.id })}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
