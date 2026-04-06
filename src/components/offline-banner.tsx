"use client";

import { useState, useEffect } from "react";
import { WifiOff, X } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export function OfflineBanner() {
  const { t } = useI18n();
  const [offline, setOffline] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    function handleOnline() { setOffline(false); }
    function handleOffline() { setOffline(true); setDismissed(false); }

    if (!navigator.onLine) {
      setOffline(true);
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!offline || dismissed) return null;

  return (
    <div className="fixed inset-x-0 top-0 z-50 flex items-center justify-center gap-3 bg-amber-500 px-4 py-2 text-sm font-medium text-black md:ml-60">
      <WifiOff className="h-4 w-4 shrink-0" />
      <span>{t("Brak internetu — widzisz ostatnio zapisane dane")}</span>
      <button onClick={() => setDismissed(true)} className="ml-auto shrink-0 p-0.5 hover:opacity-70">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
