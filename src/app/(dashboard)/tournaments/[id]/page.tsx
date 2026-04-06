"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { api } from "@/lib/trpc-react";
import {
  TOURNAMENT_FORMAT_LABELS,
  TOURNAMENT_STATUS_LABELS,
  TOURNAMENT_STATUS_COLORS,
  TOURNAMENT_PHASE_LABELS,
  getUserDisplayName,
} from "@/lib/labels";
import { formatShortDate, formatDate } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { GroupTable } from "@/components/tournament/group-table";
import { BracketView } from "@/components/tournament/bracket-view";
import { TopScorers } from "@/components/tournament/top-scorers";
import { MatchRow } from "@/components/tournament/match-row";
import { MapPin, Calendar, Users, Trophy, Info, Banknote } from "lucide-react";

// ─── types ────────────────────────────────────────────────────────────────────

type TournamentStatus = "REGISTRATION" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
type TournamentFormat = "GROUP_STAGE" | "KNOCKOUT" | "GROUP_AND_KNOCKOUT";
type ApplicationStatus = "PENDING" | "ACCEPTED" | "REJECTED";

// ─── tabs ─────────────────────────────────────────────────────────────────────

const ALL_TABS = [
  { key: "teams", labelKey: "Drużyny" },
  { key: "groups", labelKey: "Grupy" },
  { key: "bracket", labelKey: "Drabinka" },
  { key: "scorers", labelKey: "Strzelcy" },
  { key: "info", labelKey: "Info" },
] as const;

type TabKey = (typeof ALL_TABS)[number]["key"];

function getVisibleTabs(format: TournamentFormat) {
  return ALL_TABS.filter((tab) => {
    if (tab.key === "groups" && format === "KNOCKOUT") return false;
    if (tab.key === "bracket" && format === "GROUP_STAGE") return false;
    return true;
  });
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function TeamInitials({ name }: { name: string }) {
  const parts = name.trim().split(/\s+/);
  const initials =
    parts.length >= 2
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : name.substring(0, 2).toUpperCase();
  return (
    <div className="h-8 w-8 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center text-[11px] font-bold shrink-0">
      {initials}
    </div>
  );
}

const STATUS_BADGE_MAP: Record<ApplicationStatus, string> = {
  PENDING: "bg-yellow-500/10 text-yellow-500",
  ACCEPTED: "bg-emerald-500/10 text-emerald-500",
  REJECTED: "bg-red-500/10 text-red-500",
};

const STATUS_LABEL_MAP: Record<ApplicationStatus, string> = {
  PENDING: "Oczekuje",
  ACCEPTED: "Zaakceptowana",
  REJECTED: "Odrzucona",
} as const;

// ─── page ─────────────────────────────────────────────────────────────────────

export default function TournamentDetailPage() {
  const { t } = useI18n();
  const { id } = useParams<{ id: string }>();
  const { data: session } = useSession();
  const router = useRouter();
  const userId = session?.user?.id;

  const [activeTab, setActiveTab] = useState<TabKey>("teams");
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [applyTeamName, setApplyTeamName] = useState("");
  const [applyMessage, setApplyMessage] = useState("");

  // ─── queries ────────────────────────────────────────────────────────────────

  const utils = api.useUtils();

  const { data: tournament, isLoading } = api.tournament.getById.useQuery(
    { tournamentId: id },
    { enabled: !!id }
  );

  const { data: topScorersRaw = [] } = api.tournament.getTopScorers.useQuery(
    { tournamentId: id },
    { enabled: !!id }
  );

  const topScorers = topScorersRaw.map((s) => ({
    scorerUserId: s.userId,
    scorerName: s.name,
    teamName: s.teamName,
    goalCount: s.goals,
  }));

  // ─── mutations ──────────────────────────────────────────────────────────────

  const invalidate = () => utils.tournament.getById.invalidate({ tournamentId: id });

  const applyMut = api.tournament.applyTeam.useMutation({
    onSuccess: () => { toast.success(t("Zgłoszenie wysłane!")); setShowApplyForm(false); invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const respondMut = api.tournament.respondToApplication.useMutation({
    onSuccess: () => { toast.success(t("Zaktualizowano status drużyny")); invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const startMut = api.tournament.startTournament.useMutation({
    onSuccess: () => { toast.success(t("Turniej rozpoczęty!")); invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const generateKnockoutMut = api.tournament.generateKnockoutAfterGroups.useMutation({
    onSuccess: () => { toast.success(t("Drabinka wygenerowana!")); invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const completeMut = api.tournament.completeTournament.useMutation({
    onSuccess: () => { toast.success(t("Turniej zakończony!")); invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const submitScoreMut = api.tournament.submitMatchScore.useMutation({
    onSuccess: () => { toast.success(t("Wynik wpisany!")); invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const confirmScoreMut = api.tournament.confirmMatchScore.useMutation({
    onSuccess: (_, vars) => {
      toast.success(vars.confirmed ? t("Wynik potwierdzony!") : t("Wynik odrzucony"));
      invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const markTeamPaidMut = api.tournament.markTeamPaid.useMutation({
    onSuccess: () => { invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  // ─── loading ────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-10 rounded-lg" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="text-center py-16">
        <Trophy className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground">{t("Turniej nie istnieje.")}</p>
      </div>
    );
  }

  // ─── derived state ──────────────────────────────────────────────────────────

  const isCreator = userId === tournament.creatorUserId;
  const myTeam = userId
    ? tournament.teams.find((tm) => tm.user.id === userId)
    : null;
  const isParticipant = !!myTeam;
  const format = tournament.format as TournamentFormat;
  const status = tournament.status as TournamentStatus;
  const creatorName = getUserDisplayName(tournament.creator);
  const visibleTabs = getVisibleTabs(format);

  // Ensure activeTab is valid for this format
  const validTab = visibleTabs.some((tab) => tab.key === activeTab)
    ? activeTab
    : visibleTabs[0].key;

  const allGroupMatches = tournament.matches.filter((m) => m.phase === "GROUP");
  const allGroupsDone =
    allGroupMatches.length > 0 && allGroupMatches.every((m) => m.scoreConfirmed);
  const allMatchesDone =
    tournament.matches.length > 0 && tournament.matches.every((m) => m.scoreConfirmed);

  // Group standings by groupLabel
  const groupLabels = [
    ...new Set(tournament.standings.map((s) => s.groupLabel)),
  ].sort();

  // ─── render ─────────────────────────────────────────────────────────────────

  return (
    <div className="animate-fade-in space-y-4">
      {/* ── Hero ── */}
      <div className="bg-gradient-to-r from-amber-950 to-orange-900 rounded-xl p-4 relative overflow-hidden">
        {/* Dot pattern */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        />
        <div className="relative">
          <div className="flex items-start justify-between gap-3 mb-2">
            <h1 className="text-lg font-extrabold text-white leading-tight">{tournament.title}</h1>
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-md shrink-0 ${TOURNAMENT_STATUS_COLORS[status] ?? ""}`}
            >
              {t(TOURNAMENT_STATUS_LABELS[status] ?? status)}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-orange-200 mb-3">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatShortDate(tournament.startDate)}
              {tournament.endDate && ` – ${formatShortDate(tournament.endDate)}`}
            </span>
            {tournament.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {tournament.location}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {tournament.teams.filter((tm) => tm.status === "ACCEPTED").length}/{tournament.maxTeams}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold bg-orange-500/20 text-orange-300 px-2 py-0.5 rounded-md">
              {t(TOURNAMENT_FORMAT_LABELS[format] ?? format)}
            </span>
            {(tournament as any).costPerTeam != null && (tournament as any).costPerTeam > 0 && (
              <span className="text-[11px] font-semibold bg-amber-500/10 text-amber-300 px-2 py-0.5 rounded-md flex items-center gap-1">
                <Banknote className="h-3 w-3" />
                {t("Wpisowe")}: {(tournament as any).costPerTeam} PLN
              </span>
            )}
            <span className="text-[11px] text-orange-300/70">{creatorName}</span>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2 mt-3">
            {/* Creator: start tournament */}
            {isCreator && status === "REGISTRATION" && (
              <Button
                size="sm"
                onClick={() => startMut.mutate({ tournamentId: id })}
                disabled={startMut.isPending}
                className="bg-orange-500 hover:bg-orange-600 text-white text-[12px]"
              >
                {startMut.isPending ? "..." : t("Rozpocznij turniej")}
              </Button>
            )}

            {/* Creator: generate knockout bracket after groups */}
            {isCreator && status === "IN_PROGRESS" && format === "GROUP_AND_KNOCKOUT" && allGroupsDone && (
              <Button
                size="sm"
                onClick={() => generateKnockoutMut.mutate({ tournamentId: id })}
                disabled={generateKnockoutMut.isPending}
                className="bg-amber-500 hover:bg-amber-600 text-white text-[12px]"
              >
                {generateKnockoutMut.isPending ? "..." : t("Generuj drabinkę")}
              </Button>
            )}

            {/* Creator: complete tournament */}
            {isCreator && status === "IN_PROGRESS" && allMatchesDone && (
              <Button
                size="sm"
                onClick={() => completeMut.mutate({ tournamentId: id })}
                disabled={completeMut.isPending}
                variant="outline"
                className="text-[12px]"
              >
                {completeMut.isPending ? "..." : t("Zakończ turniej")}
              </Button>
            )}

            {/* Non-participant: apply button */}
            {!isParticipant && status === "REGISTRATION" && userId && (
              <Button
                size="sm"
                onClick={() => setShowApplyForm((v) => !v)}
                className="bg-emerald-500 hover:bg-emerald-600 text-white text-[12px]"
              >
                {showApplyForm ? t("Anuluj") : t("Dołącz")}
              </Button>
            )}
          </div>

          {/* Apply form */}
          {showApplyForm && (
            <div className="mt-3 bg-black/20 rounded-lg p-3 space-y-2">
              <div>
                <Label className="text-[11px] text-orange-200">{t("Nazwa drużyny")}</Label>
                <Input
                  value={applyTeamName}
                  onChange={(e) => setApplyTeamName(e.target.value)}
                  placeholder={t("np. FC Warszawa")}
                  className="mt-1 h-8 text-sm bg-black/20 border-orange-500/30 text-white placeholder:text-orange-300/50"
                />
              </div>
              <div>
                <Label className="text-[11px] text-orange-200">{t("Wiadomość (opcjonalnie)")}</Label>
                <Textarea
                  value={applyMessage}
                  onChange={(e) => setApplyMessage(e.target.value)}
                  rows={2}
                  placeholder={t("Kilka słów o drużynie...")}
                  className="mt-1 text-sm bg-black/20 border-orange-500/30 text-white placeholder:text-orange-300/50"
                />
              </div>
              <Button
                size="sm"
                onClick={() =>
                  applyMut.mutate({
                    tournamentId: id,
                    teamName: applyTeamName.trim() || t("Moja drużyna"),
                    message: applyMessage.trim() || undefined,
                  })
                }
                disabled={applyMut.isPending || !applyTeamName.trim()}
                className="bg-emerald-500 hover:bg-emerald-600 text-white text-[12px]"
              >
                {applyMut.isPending ? t("Wysyłanie...") : t("Wyślij zgłoszenie")}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* ── Tab bar ── */}
      <div className="bg-card rounded-lg p-1 flex gap-0.5 overflow-x-auto">
        {visibleTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm rounded-md whitespace-nowrap transition-colors ${
              validTab === tab.key
                ? "bg-muted font-bold text-foreground"
                : "text-muted-foreground font-semibold hover:text-foreground"
            }`}
          >
            {t(tab.labelKey)}
          </button>
        ))}
      </div>

      {/* ── Tab: Drużyny ── */}
      {validTab === "teams" && (
        <div className="space-y-2">
          {tournament.teams.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">{t("Brak zgłoszonych drużyn.")}</p>
          ) : (
            <div className="bg-card rounded-xl overflow-hidden divide-y divide-border">
              {tournament.teams.map((team) => {
                const appStatus = team.status as ApplicationStatus;
                return (
                  <div key={team.id} className="flex items-center gap-3 px-3 py-2.5">
                    <TeamInitials name={team.teamName} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold truncate">{team.teamName}</p>
                      {team.message && (
                        <p className="text-[11px] text-muted-foreground truncate">{team.message}</p>
                      )}
                      {team.groupLabel && (
                        <p className="text-[10px] text-orange-400 font-semibold">{t("Grupa")} {team.groupLabel}</p>
                      )}
                    </div>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-md shrink-0 ${STATUS_BADGE_MAP[appStatus] ?? ""}`}
                    >
                      {t(STATUS_LABEL_MAP[appStatus] ?? appStatus)}
                    </span>
                    {/* Creator: payment badge + toggle */}
                    {isCreator && (tournament as any).costPerTeam != null && (tournament as any).costPerTeam > 0 && appStatus === "ACCEPTED" && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${(team as any).costPaid ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"}`}>
                          {(team as any).costPaid ? t("Opłacone") : t("Nieopłacone")}
                        </span>
                        <button
                          onClick={() => markTeamPaidMut.mutate({ teamId: team.id, paid: !(team as any).costPaid })}
                          disabled={markTeamPaidMut.isPending}
                          className="text-[10px] font-semibold bg-muted hover:bg-muted/80 text-foreground rounded px-2 py-0.5 transition-colors"
                        >
                          {(team as any).costPaid ? t("Cofnij") : t("Oznacz")}
                        </button>
                      </div>
                    )}
                    {/* Creator accept/reject on PENDING */}
                    {isCreator && appStatus === "PENDING" && (
                      <div className="flex gap-1.5 shrink-0">
                        <button
                          onClick={() =>
                            respondMut.mutate({ teamId: team.id, status: "ACCEPTED" })
                          }
                          className="text-[11px] font-semibold bg-emerald-500/10 text-emerald-500 rounded px-2 py-0.5 hover:bg-emerald-500/20"
                        >
                          {t("Akceptuj")}
                        </button>
                        <button
                          onClick={() =>
                            respondMut.mutate({ teamId: team.id, status: "REJECTED" })
                          }
                          className="text-[11px] font-semibold bg-red-500/10 text-red-500 rounded px-2 py-0.5 hover:bg-red-500/20"
                        >
                          {t("Odrzuć")}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Grupy ── */}
      {validTab === "groups" && (
        <div className="space-y-6">
          {groupLabels.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              {t("Grupy nie zostały jeszcze wygenerowane.")}
            </p>
          ) : (
            groupLabels.map((label) => {
              const groupStandings = tournament.standings
                .filter((s) => s.groupLabel === label)
                .sort((a, b) => {
                  if (b.points !== a.points) return b.points - a.points;
                  const gdA = a.goalsFor - a.goalsAgainst;
                  const gdB = b.goalsFor - b.goalsAgainst;
                  return gdB - gdA;
                })
                .map((s) => {
                  const team = tournament.teams.find((tm) => tm.id === s.teamId);
                  return {
                    teamId: s.teamId,
                    teamName: team?.teamName ?? t("Drużyna"),
                    played: s.played,
                    won: s.won,
                    drawn: s.drawn,
                    lost: s.lost,
                    goalsFor: s.goalsFor,
                    goalsAgainst: s.goalsAgainst,
                    points: s.points,
                  };
                });

              const groupMatches = tournament.matches
                .filter((m) => m.phase === "GROUP" && m.groupLabel === label)
                .map((m) => ({
                  id: m.id,
                  homeTeam: m.homeTeam,
                  awayTeam: m.awayTeam,
                  homeScore: m.homeScore,
                  awayScore: m.awayScore,
                  penaltyHome: m.penaltyHome,
                  penaltyAway: m.penaltyAway,
                  scoreConfirmed: m.scoreConfirmed,
                }));

              return (
                <GroupTable
                  key={label}
                  groupLabel={label}
                  standings={groupStandings}
                  advancingCount={tournament.advancingPerGroup}
                  matches={groupMatches}
                />
              );
            })
          )}
        </div>
      )}

      {/* ── Tab: Drabinka ── */}
      {validTab === "bracket" && (
        <div>
          {/* If participant, show score actions for bracket matches */}
          {isParticipant && status === "IN_PROGRESS" && (
            <div className="space-y-2 mb-4">
              {tournament.matches
                .filter((m) => m.phase !== "GROUP")
                .filter(
                  (m) =>
                    (m.homeTeam && m.homeTeamId === myTeam?.id) ||
                    (m.awayTeam && m.awayTeamId === myTeam?.id)
                )
                .map((m) => {
                  if (m.scoreConfirmed) return null;
                  const isHome = m.homeTeamId === myTeam?.id;
                  const submittedByMe = m.scoreSubmittedBy === userId;
                  const submittedByOther =
                    m.homeScore !== null && m.homeScore !== undefined && !submittedByMe;

                  return (
                    <div key={m.id} className="bg-card rounded-xl overflow-hidden">
                      <div className="px-3 pt-2 pb-0">
                        <p className="text-[10px] font-semibold uppercase text-muted-foreground mb-1">
                          {t(TOURNAMENT_PHASE_LABELS[m.phase] ?? m.phase)}
                        </p>
                      </div>
                      <MatchRow
                        homeTeamName={m.homeTeam?.teamName ?? t("Oczekuje")}
                        awayTeamName={m.awayTeam?.teamName ?? t("Oczekuje")}
                        homeScore={m.homeScore}
                        awayScore={m.awayScore}
                        penaltyHome={m.penaltyHome}
                        penaltyAway={m.penaltyAway}
                        scoreConfirmed={m.scoreConfirmed}
                        showActions
                        isSubmitter={submittedByMe}
                        onSubmitScore={(h, a) =>
                          submitScoreMut.mutate({ matchId: m.id, homeScore: h, awayScore: a })
                        }
                        onConfirmScore={(confirmed) =>
                          confirmScoreMut.mutate({ matchId: m.id, confirmed })
                        }
                      />
                    </div>
                  );
                })}
            </div>
          )}

          <BracketView matches={tournament.matches.map((m) => ({
            id: m.id,
            phase: m.phase,
            matchOrder: m.matchOrder,
            homeTeam: m.homeTeam,
            awayTeam: m.awayTeam,
            homeScore: m.homeScore,
            awayScore: m.awayScore,
            penaltyHome: m.penaltyHome,
            penaltyAway: m.penaltyAway,
            scoreConfirmed: m.scoreConfirmed,
          }))} />
        </div>
      )}

      {/* ── Tab: Strzelcy ── */}
      {validTab === "scorers" && (
        <TopScorers scorers={topScorers} />
      )}

      {/* ── Tab: Info ── */}
      {validTab === "info" && (
        <div className="bg-card rounded-xl p-4 space-y-3">
          {tournament.description && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">{t("Opis")}</p>
              <p className="text-sm">{tournament.description}</p>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <InfoRow label={t("Format")} value={t(TOURNAMENT_FORMAT_LABELS[format] ?? format)} />
            <InfoRow label={t("Status")} value={t(TOURNAMENT_STATUS_LABELS[status] ?? status)} />
            <InfoRow label={t("Data rozpoczęcia")} value={formatDate(tournament.startDate)} />
            {tournament.endDate && (
              <InfoRow label={t("Data zakończenia")} value={formatDate(tournament.endDate)} />
            )}
            {tournament.location && (
              <InfoRow label={t("Miejsce")} value={tournament.location} />
            )}
            <InfoRow label={t("Maks. drużyn")} value={String(tournament.maxTeams)} />
            {(format === "GROUP_STAGE" || format === "GROUP_AND_KNOCKOUT") && (
              <>
                <InfoRow label={t("Liczba grup")} value={String(tournament.groupCount)} />
                {format === "GROUP_AND_KNOCKOUT" && (
                  <InfoRow
                    label={t("Awansuje z grupy")}
                    value={String(tournament.advancingPerGroup)}
                  />
                )}
              </>
            )}
            {(tournament as any).costPerTeam != null && (tournament as any).costPerTeam > 0 && (
              <InfoRow label={t("Wpisowe")} value={`${(tournament as any).costPerTeam} PLN`} />
            )}
            <InfoRow label={t("Organizator")} value={creatorName} />
            {tournament.region && (
              <InfoRow label={t("Region")} value={tournament.region.name} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-sm mt-0.5">{value}</p>
    </div>
  );
}
