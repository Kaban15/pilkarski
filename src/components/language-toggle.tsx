"use client";

import { useI18n } from "@/lib/i18n";
import { Globe } from "lucide-react";

export function LanguageToggle() {
  const { locale, setLocale, t } = useI18n();

  const toggle = () => {
    setLocale(locale === "pl" ? "en" : "pl");
  };

  return (
    <button
      onClick={toggle}
      className="inline-flex h-9 items-center justify-center gap-1 rounded-md px-2 text-[12px] font-semibold hover:bg-accent"
      title={t("Zmień język")}
      aria-label={t("Zmień język")}
    >
      <Globe className="h-4 w-4" />
      <span>{locale === "pl" ? "EN" : "PL"}</span>
    </button>
  );
}
