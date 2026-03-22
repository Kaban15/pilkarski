"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NotificationSkeleton } from "@/components/card-skeleton";
import { formatDate } from "@/lib/format";
import { NOTIFICATION_TYPE_LABELS, NOTIFICATION_TYPE_COLORS } from "@/lib/labels";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    trpc.notification.list
      .query({ limit: 50 })
      .then((data) => setNotifications(data.notifications))
      .finally(() => setLoading(false));
  }, []);

  async function markAsRead(id: string) {
    await trpc.notification.markAsRead.mutate({ id });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }

  async function markAllAsRead() {
    await trpc.notification.markAllAsRead.mutate();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Powiadomienia</h1>
        {notifications.some((n) => !n.read) && (
          <Button variant="outline" size="sm" onClick={markAllAsRead}>
            Oznacz wszystkie jako przeczytane
          </Button>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <NotificationSkeleton key={i} />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <p className="text-muted-foreground">Brak powiadomień</p>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <Card
              key={n.id}
              className={`transition hover:shadow-md ${!n.read ? "border-blue-200 bg-blue-50/30" : ""}`}
            >
              <CardContent className="flex items-start justify-between gap-4 py-3">
                <div className="min-w-0 flex-1">
                  {n.link ? (
                    <Link
                      href={n.link}
                      onClick={() => !n.read && markAsRead(n.id)}
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
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${NOTIFICATION_TYPE_COLORS[n.type] ?? "bg-muted text-muted-foreground"}`}>
                      {NOTIFICATION_TYPE_LABELS[n.type] ?? n.type}
                    </span>
                    <span className="text-xs text-muted-foreground">{formatDate(n.createdAt)}</span>
                  </div>
                </div>
                {!n.read && (
                  <button
                    onClick={() => markAsRead(n.id)}
                    className="mt-1 h-3 w-3 shrink-0 rounded-full bg-blue-500"
                    title="Oznacz jako przeczytane"
                  />
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
