"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/trpc-react";
import { Button } from "@/components/ui/button";
import { Bell, BellOff } from "lucide-react";
import { toast } from "sonner";

export function PushNotificationToggle() {
  const [supported, setSupported] = useState(false);
  const [loading, setLoading] = useState(false);

  const { data: statusData, refetch } = api.push.status.useQuery(undefined, {
    enabled: supported,
  });
  const subscribed = statusData?.subscribed ?? false;

  const subscribeMut = api.push.subscribe.useMutation({ onSuccess: () => refetch() });
  const unsubscribeMut = api.push.unsubscribe.useMutation({ onSuccess: () => refetch() });

  useEffect(() => {
    if ("serviceWorker" in navigator && "PushManager" in window) {
      setSupported(true);
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  async function handleToggle() {
    if (!supported) return;
    setLoading(true);

    try {
      const registration = await navigator.serviceWorker.ready;

      if (subscribed) {
        const sub = await registration.pushManager.getSubscription();
        if (sub) {
          await unsubscribeMut.mutateAsync({ endpoint: sub.endpoint });
          await sub.unsubscribe();
        }
        toast.success("Powiadomienia push wyłączone");
      } else {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          toast.error("Brak zgody na powiadomienia");
          setLoading(false);
          return;
        }

        const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!vapidKey) {
          toast.error("Konfiguracja push nie jest dostępna");
          setLoading(false);
          return;
        }

        const sub = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey),
        });

        const keys = sub.toJSON().keys!;
        await subscribeMut.mutateAsync({
          endpoint: sub.endpoint,
          p256dh: keys.p256dh!,
          auth: keys.auth!,
        });

        toast.success("Powiadomienia push włączone!");
      }
    } catch (err) {
      toast.error("Błąd: " + (err instanceof Error ? err.message : "spróbuj ponownie"));
    } finally {
      setLoading(false);
    }
  }

  if (!supported) return null;

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleToggle}
      disabled={loading}
      className="gap-1.5 text-xs"
      title={subscribed ? "Wyłącz powiadomienia push" : "Włącz powiadomienia push"}
    >
      {subscribed ? (
        <>
          <Bell className="h-3.5 w-3.5 text-primary" />
          Push ON
        </>
      ) : (
        <>
          <BellOff className="h-3.5 w-3.5" />
          Push OFF
        </>
      )}
    </Button>
  );
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
