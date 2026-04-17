"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/trpc-react";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { NotificationSkeleton } from "@/components/card-skeleton";
import { formatDate } from "@/lib/format";
import { EmptyState } from "@/components/empty-state";
import { NOTIFICATION_TYPE_LABELS, NOTIFICATION_TYPE_COLORS } from "@/lib/labels";
import { groupNotificationsByTime } from "@/lib/notification-groups";
import { Bell } from "lucide-react";

export default function NotificationsPage() {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const invitationsOnly = searchParams?.get("filter") === "invitations";
  const utils = api.useUtils();
  const { data, isLoading } = api.notification.list.useQuery({ limit: 50 });
  const allNotifications = data?.notifications ?? [];
  const notifications = invitationsOnly
    ? allNotifications.filter((n) =>
        n.type === "CLUB_INVITATION" ||
        n.type === "SPARING_INVITATION" ||
        n.type === "MEMBERSHIP_REQUEST",
      )
    : allNotifications;

  const markAsRead = api.notification.markAsRead.useMutation({
    onSuccess: () => utils.notification.list.invalidate(),
  });

  const markAllAsRead = api.notification.markAllAsRead.useMutation({
    onSuccess: () => utils.notification.list.invalidate(),
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("Powiadomienia")}</h1>
          {invitationsOnly && (
            <p className="mt-1 text-xs text-muted-foreground">
              {t("Filtr: zaproszenia")} ·{" "}
              <Link href="/notifications" className="underline">
                {t("pokaż wszystkie")}
              </Link>
            </p>
          )}
        </div>
        {notifications.some((n) => !n.read) && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllAsRead.mutate()}
            disabled={markAllAsRead.isPending}
          >
            {t("Oznacz wszystkie jako przeczytane")}
          </Button>
        )}
      </div>


      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <NotificationSkeleton key={i} />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title={t("Brak powiadomień")}
          description={t("Kiedy ktoś zaaplikuje na Twój sparing lub wyśle wiadomość, zobaczysz powiadomienie tutaj.")}
        />
      ) : (
        <div className="space-y-5">
          {groupNotificationsByTime(notifications).map((group) => (
            <section key={group.key}>
              <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70">
                {t(group.label)}{" "}
                <span className="font-normal normal-case tracking-normal text-muted-foreground/50">
                  · {group.items.length}
                </span>
              </h2>
              <div className="divide-y divide-border rounded-lg border border-border">
                {group.items.map((n) => (
                  <div
                    key={n.id}
                    className={`flex items-start justify-between gap-4 px-4 py-3 transition hover:bg-white/[0.02] ${!n.read ? "bg-x-blue/[0.05]" : ""}`}
                  >
                    <div className="min-w-0 flex-1">
                      {n.link ? (
                        <Link
                          href={n.link}
                          onClick={() => !n.read && markAsRead.mutate({ id: n.id })}
                          className="block"
                        >
                          <p className="font-medium">{n.title}</p>
                          {n.message && (
                            <p className="truncate text-sm text-muted-foreground">{n.message}</p>
                          )}
                        </Link>
                      ) : (
                        <>
                          <p className="font-medium">{n.title}</p>
                          {n.message && (
                            <p className="truncate text-sm text-muted-foreground">{n.message}</p>
                          )}
                        </>
                      )}
                      <div className="mt-1 flex items-center gap-2">
                        <span className={`rounded-md px-2 py-0.5 text-[10px] font-medium ${NOTIFICATION_TYPE_COLORS[n.type] ?? "bg-muted text-muted-foreground"}`}>
                          {t(NOTIFICATION_TYPE_LABELS[n.type] ?? n.type)}
                        </span>
                        <span className="text-xs text-muted-foreground">{formatDate(n.createdAt)}</span>
                      </div>
                    </div>
                    {!n.read && (
                      <button
                        onClick={() => markAsRead.mutate({ id: n.id })}
                        className="mt-1 h-3 w-3 shrink-0 rounded-full bg-x-blue"
                        title={t("Oznacz jako przeczytane")}
                      />
                    )}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
