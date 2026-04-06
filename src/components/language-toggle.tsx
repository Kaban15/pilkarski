"use client";

import { useI18n } from "@/lib/i18n";

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
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
        <path d="M2 12h20" />
      </svg>
      <span>{locale === "pl" ? "EN" : "PL"}</span>
    </button>
  );
}
