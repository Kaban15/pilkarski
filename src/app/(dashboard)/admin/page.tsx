"use client";

import { useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { api } from "@/lib/trpc-react";
import { useI18n } from "@/lib/i18n";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { StatsCell } from "@/components/stats-cell";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { EmptyState } from "@/components/empty-state";
import { formatDate } from "@/lib/format";
import { ROLE_LABELS, CLUB_POST_CATEGORY_LABELS } from "@/lib/labels";
import {
  Shield,
  Eye,
  EyeOff,
  Search,
  Trash2,
  Flag,
  Users,
  BarChart3,
  FileText,
  Inbox,
} from "lucide-react";
import { toast } from "sonner";

// ─── Helpers ───────────────────────────────────────────────

function getUserName(user: {
  email?: string | null;
  club?: { name: string } | null;
  player?: { firstName: string; lastName: string } | null;
  coach?: { firstName: string; lastName: string } | null;
}): string {
  if (user.club) return user.club.name;
  if (user.player) return `${user.player.firstName} ${user.player.lastName}`;
  if (user.coach) return `${user.coach.firstName} ${user.coach.lastName}`;
  return user.email ?? "—";
}

// ─── Reports Tab ───────────────────────────────────────────

function ReportsTab() {
  const { t } = useI18n();
  const utils = api.useUtils();
  const { data, isLoading } = api.admin.reportsList.useQuery({ limit: 50 });

  const dismissReport = api.admin.dismissReport.useMutation({
    onSuccess: () => {
      utils.admin.reportsList.invalidate();
      toast.success(t("Zgłoszenia odrzucone"));
    },
    onError: (err) => toast.error(err.message),
  });

  const hidePost = api.admin.hidePost.useMutation({
    onSuccess: () => {
      utils.admin.reportsList.invalidate();
      toast.success(t("Post ukryty"));
    },
    onError: (err) => toast.error(err.message),
  });

  const [confirmDismiss, setConfirmDismiss] = useState<string | null>(null);
  const [confirmHide, setConfirmHide] = useState<string | null>(null);

  if (isLoading) return <p className="text-center py-10 text-muted-foreground">{t("Ładowanie...")}</p>;

  const items = data?.items ?? [];

  if (items.length === 0) {
    return (
      <EmptyState
        icon={Inbox}
        title={t("Brak zgłoszeń")}
        description={t("Nie ma żadnych zgłoszonych postów do moderacji.")}
      />
    );
  }

  return (
    <div className="space-y-4">
      {items.map((post) => (
        <div key={post.id} className="rounded-xl bg-card p-4 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold truncate">{post.title}</h3>
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mt-1">
                <span>{post.club.name}</span>
                {post.category && (
                  <span className="bg-muted px-1.5 py-0.5 rounded">
                    {t(CLUB_POST_CATEGORY_LABELS[post.category] ?? post.category)}
                  </span>
                )}
                <span className="text-red-500 font-medium">
                  {post.reportCount} {t("zgłosz.")}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {post.content}
              </p>
            </div>

            <div className="flex gap-1 shrink-0">
              <button
                type="button"
                className="rounded-lg p-2 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                title={t("Odrzuć zgłoszenia")}
                onClick={() => setConfirmDismiss(post.id)}
              >
                <Eye className="h-4 w-4" />
              </button>
              <button
                type="button"
                className="rounded-lg p-2 hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
                title={t("Ukryj post")}
                onClick={() => setConfirmHide(post.id)}
              >
                <EyeOff className="h-4 w-4" />
              </button>
            </div>
          </div>

          <details className="text-xs">
            <summary className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors">
              {t("Szczegóły zgłoszeń")} ({post.reports.length})
            </summary>
            <ul className="mt-2 space-y-1 pl-4">
              {post.reports.map((r) => (
                <li key={r.id} className="text-muted-foreground">
                  <span className="font-medium text-foreground">{r.user.email}</span>
                  {" — "}
                  {r.reason}
                  {" · "}
                  {formatDate(r.createdAt)}
                </li>
              ))}
            </ul>
          </details>

          <ConfirmDialog
            open={confirmDismiss === post.id}
            onOpenChange={(o) => !o && setConfirmDismiss(null)}
            title={t("Odrzuć zgłoszenia")}
            description={t("Wszystkie zgłoszenia tego posta zostaną usunięte. Post pozostanie widoczny.")}
            onConfirm={() => {
              dismissReport.mutate({ postId: post.id });
              setConfirmDismiss(null);
            }}
            variant="default"
          />

          <ConfirmDialog
            open={confirmHide === post.id}
            onOpenChange={(o) => !o && setConfirmHide(null)}
            title={t("Ukryj post")}
            description={t("Post zostanie ukryty i nie będzie widoczny dla użytkowników.")}
            onConfirm={() => {
              hidePost.mutate({ postId: post.id });
              setConfirmHide(null);
            }}
          />
        </div>
      ))}
    </div>
  );
}

// ─── Users Tab ─────────────────────────────────────────────

function UsersTab() {
  const { t } = useI18n();
  const utils = api.useUtils();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = (value: string) => {
    setSearch(value);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setDebouncedSearch(value), 300);
  };

  const { data, isLoading } = api.admin.usersList.useQuery({
    limit: 50,
    search: debouncedSearch || undefined,
  });

  const banMutation = api.admin.ban.useMutation({
    onSuccess: () => {
      utils.admin.usersList.invalidate();
      toast.success(t("Użytkownik zbanowany"));
    },
    onError: (err) => toast.error(err.message),
  });

  const unbanMutation = api.admin.unban.useMutation({
    onSuccess: () => {
      utils.admin.usersList.invalidate();
      toast.success(t("Ban usunięty"));
    },
    onError: (err) => toast.error(err.message),
  });

  const setAdminMutation = api.admin.setAdmin.useMutation({
    onSuccess: () => {
      utils.admin.usersList.invalidate();
      toast.success(t("Rola admina zaktualizowana"));
    },
    onError: (err) => toast.error(err.message),
  });

  const [confirmBan, setConfirmBan] = useState<string | null>(null);
  const [confirmUnban, setConfirmUnban] = useState<string | null>(null);
  const [confirmAdmin, setConfirmAdmin] = useState<{ id: string; isAdmin: boolean } | null>(null);

  const items = data?.items ?? [];

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder={t("Szukaj użytkowników...")}
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full rounded-lg border bg-background py-2 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {isLoading && <p className="text-center py-10 text-muted-foreground">{t("Ładowanie...")}</p>}

      {!isLoading && items.length === 0 && (
        <EmptyState
          icon={Users}
          title={t("Brak wyników")}
          description={t("Nie znaleziono użytkowników pasujących do wyszukiwania.")}
        />
      )}

      {items.map((user) => {
        const name = getUserName(user);
        const roleBadgeColor =
          user.role === "CLUB"
            ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
            : user.role === "PLAYER"
              ? "bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300"
              : "bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300";

        return (
          <div key={user.id} className="rounded-xl bg-card p-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold truncate">{name}</span>
                <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${roleBadgeColor}`}>
                  {t(ROLE_LABELS[user.role] ?? user.role)}
                </span>
                {user.isAdmin && (
                  <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-violet-100 dark:bg-violet-900 text-violet-700 dark:text-violet-300">
                    Admin
                  </span>
                )}
                {user.isBanned && (
                  <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300">
                    {t("Zbanowany")}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>

            <div className="flex gap-1 shrink-0">
              {user.isBanned ? (
                <button
                  type="button"
                  className="rounded-lg px-2 py-1 text-xs font-medium bg-muted hover:bg-muted/80 transition-colors"
                  onClick={() => setConfirmUnban(user.id)}
                >
                  {t("Odbanuj")}
                </button>
              ) : (
                <button
                  type="button"
                  className="rounded-lg px-2 py-1 text-xs font-medium bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 hover:opacity-80 transition-colors"
                  onClick={() => setConfirmBan(user.id)}
                >
                  {t("Banuj")}
                </button>
              )}
              <button
                type="button"
                className="rounded-lg px-2 py-1 text-xs font-medium bg-violet-100 dark:bg-violet-900 text-violet-700 dark:text-violet-300 hover:opacity-80 transition-colors"
                onClick={() =>
                  setConfirmAdmin({ id: user.id, isAdmin: !user.isAdmin })
                }
              >
                {user.isAdmin ? t("Odbierz admina") : t("Nadaj admina")}
              </button>
            </div>

            <ConfirmDialog
              open={confirmBan === user.id}
              onOpenChange={(o) => !o && setConfirmBan(null)}
              title={t("Zbanuj użytkownika")}
              description={`${t("Czy na pewno chcesz zbanować")} ${name}? ${t("Użytkownik straci dostęp do platformy.")}`}
              onConfirm={() => {
                banMutation.mutate({ userId: user.id });
                setConfirmBan(null);
              }}
            />

            <ConfirmDialog
              open={confirmUnban === user.id}
              onOpenChange={(o) => !o && setConfirmUnban(null)}
              title={t("Odbanuj użytkownika")}
              description={`${t("Czy na pewno chcesz odbanować")} ${name}?`}
              onConfirm={() => {
                unbanMutation.mutate({ userId: user.id });
                setConfirmUnban(null);
              }}
              variant="default"
            />

            <ConfirmDialog
              open={confirmAdmin?.id === user.id}
              onOpenChange={(o) => !o && setConfirmAdmin(null)}
              title={confirmAdmin?.isAdmin ? t("Nadaj rolę admina") : t("Odbierz rolę admina")}
              description={
                confirmAdmin?.isAdmin
                  ? `${t("Czy na pewno chcesz nadać rolę admina")} ${name}?`
                  : `${t("Czy na pewno chcesz odebrać rolę admina")} ${name}?`
              }
              onConfirm={() => {
                if (confirmAdmin) {
                  setAdminMutation.mutate({
                    userId: confirmAdmin.id,
                    isAdmin: confirmAdmin.isAdmin,
                  });
                }
                setConfirmAdmin(null);
              }}
              variant="default"
            />
          </div>
        );
      })}
    </div>
  );
}

// ─── Metrics Tab ───────────────────────────────────────────

function MetricsTab() {
  const { t } = useI18n();
  const { data, isLoading } = api.admin.dashboard.useQuery();

  if (isLoading) return <p className="text-center py-10 text-muted-foreground">{t("Ładowanie...")}</p>;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">
          {t("Łącznie")}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatsCell label={t("Użytkownicy")} value={data.totalUsers} />
          <StatsCell label={t("Kluby")} value={data.clubCount} color="violet" />
          <StatsCell label={t("Zawodnicy")} value={data.playerCount} color="amber" />
          <StatsCell label={t("Trenerzy")} value={data.coachCount} color="emerald" />
          <StatsCell label={t("Sparingi")} value={data.totalSparings} color="sky" />
          <StatsCell label={t("Wydarzenia")} value={data.totalEvents} color="sky" />
          <StatsCell label={t("Turnieje")} value={data.totalTournaments} color="sky" />
          <StatsCell label={t("Zgłoszenia")} value={data.pendingReports} color="red" />
        </div>
      </div>

      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">
          {t("Ostatnie 7 dni")}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <StatsCell label={t("Nowi użytkownicy")} value={data.newUsers7d} color="emerald" />
          <StatsCell label={t("Nowe sparingi")} value={data.newSparings7d} color="sky" />
          <StatsCell label={t("Nowe wydarzenia")} value={data.newEvents7d} color="amber" />
        </div>
      </div>
    </div>
  );
}

// ─── Content Tab ───────────────────────────────────────────

const CONTENT_TYPES = [
  { value: "sparing" as const, label: "Sparingi" },
  { value: "event" as const, label: "Wydarzenia" },
  { value: "tournament" as const, label: "Turnieje" },
];

function ContentTab() {
  const { t } = useI18n();
  const utils = api.useUtils();
  const [type, setType] = useState<"sparing" | "event" | "tournament">("sparing");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = (value: string) => {
    setSearch(value);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setDebouncedSearch(value), 300);
  };

  const { data, isLoading } = api.admin.contentList.useQuery({
    type,
    limit: 50,
    search: debouncedSearch || undefined,
  });

  const deleteContent = api.admin.deleteContent.useMutation({
    onSuccess: () => {
      utils.admin.contentList.invalidate();
      toast.success(t("Treść anulowana"));
    },
    onError: (err) => toast.error(err.message),
  });

  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const items = (data?.items ?? []) as Record<string, unknown>[];

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {CONTENT_TYPES.map((ct) => (
          <button
            key={ct.value}
            type="button"
            onClick={() => {
              setType(ct.value);
              setSearch("");
              setDebouncedSearch("");
            }}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              type === ct.value
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {t(ct.label)}
          </button>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder={t("Szukaj treści...")}
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full rounded-lg border bg-background py-2 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {isLoading && <p className="text-center py-10 text-muted-foreground">{t("Ładowanie...")}</p>}

      {!isLoading && items.length === 0 && (
        <EmptyState
          icon={FileText}
          title={t("Brak treści")}
          description={t("Nie znaleziono treści pasujących do kryteriów.")}
        />
      )}

      {items.map((item) => {
        const id = item.id as string;
        const title = item.title as string;
        const status = item.status as string | undefined;
        const createdAt = item.createdAt as string | Date;

        const club = item.club as { name: string } | undefined;
        const creator = item.creator as { email: string } | undefined;
        const authorName = club?.name ?? creator?.email ?? "—";

        const statusColor = status === "CANCELLED" || status === "COMPLETED"
          ? "bg-muted text-muted-foreground"
          : status === "OPEN" || status === "REGISTRATION"
            ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
            : "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300";

        return (
          <div key={id} className="rounded-xl bg-card p-4 flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold truncate">{title}</span>
                {status && (
                  <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${statusColor}`}>
                    {status}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {authorName} · {formatDate(createdAt)}
              </p>
            </div>

            <button
              type="button"
              className="rounded-lg p-2 hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive shrink-0"
              title={t("Usuń treść")}
              onClick={() => setConfirmDelete(id)}
            >
              <Trash2 className="h-4 w-4" />
            </button>

            <ConfirmDialog
              open={confirmDelete === id}
              onOpenChange={(o) => !o && setConfirmDelete(null)}
              title={t("Usuń treść")}
              description={t("Czy na pewno chcesz usunąć tę treść? Akcja jest nieodwracalna.")}
              onConfirm={() => {
                deleteContent.mutate({ type, id });
                setConfirmDelete(null);
              }}
            />
          </div>
        );
      })}
    </div>
  );
}

// ─── Badged Tabs ───────────────────────────────────────────

function ReportsBadgedTabs({ children }: { children: React.ReactNode }) {
  const { t } = useI18n();
  const { data } = api.admin.dashboard.useQuery();
  const pendingCount = data?.pendingReports ?? 0;

  return (
    <Tabs defaultValue="reports" className="w-full">
      <TabsList className="w-full">
        <TabsTrigger value="reports" className="relative">
          <Flag className="h-4 w-4" />
          {t("Raporty")}
          {pendingCount > 0 && (
            <span className="ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
              {pendingCount}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="users">
          <Users className="h-4 w-4" />
          {t("Użytkownicy")}
        </TabsTrigger>
        <TabsTrigger value="metrics">
          <BarChart3 className="h-4 w-4" />
          {t("Metryki")}
        </TabsTrigger>
        <TabsTrigger value="content">
          <FileText className="h-4 w-4" />
          {t("Treści")}
        </TabsTrigger>
      </TabsList>
      {children}
    </Tabs>
  );
}

// ─── Main Page ─────────────────────────────────────────────

export default function AdminPage() {
  const { t } = useI18n();
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <p className="text-center py-20 text-muted-foreground">{t("Ładowanie...")}</p>;
  }

  if (!session?.user?.isAdmin) {
    redirect("/feed");
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-6">
      <div className="flex items-center gap-3">
        <Shield className="h-7 w-7 text-primary" />
        <h1 className="text-2xl font-bold">{t("Panel Admina")}</h1>
      </div>

      <ReportsBadgedTabs>
        <TabsContent value="reports">
          <ReportsTab />
        </TabsContent>
        <TabsContent value="users">
          <UsersTab />
        </TabsContent>
        <TabsContent value="metrics">
          <MetricsTab />
        </TabsContent>
        <TabsContent value="content">
          <ContentTab />
        </TabsContent>
      </ReportsBadgedTabs>
    </div>
  );
}
