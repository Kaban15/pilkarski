"use client";

import { CalendarView } from "@/components/calendar-view";
import { useI18n } from "@/lib/i18n";

export default function CalendarPage() {
  const { t } = useI18n();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{t("Kalendarz")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("Sparingi i wydarzenia w widoku miesięcznym")}
        </p>
      </div>
      <div className="flex gap-2 mb-4 text-xs">
        <span className="inline-flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800" />
          {t("Sparingi")}
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-800" />
          {t("Wydarzenia")}
        </span>
      </div>
      <CalendarView />
    </div>
  );
}
