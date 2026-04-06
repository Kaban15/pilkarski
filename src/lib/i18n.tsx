"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { type Locale, type TranslationKey, translations } from "./translations";

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey) => string;
}

const I18nContext = createContext<I18nContextValue>({
  locale: "pl",
  setLocale: () => {},
  t: (key) => translations[key]?.pl ?? key,
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("pl");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("locale") as Locale | null;
    if (saved === "en" || saved === "pl") {
      setLocaleState(saved);
      document.documentElement.lang = saved;
    }
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    localStorage.setItem("locale", next);
    document.documentElement.lang = next;
  }, []);

  const t = useCallback(
    (key: TranslationKey) => translations[key]?.[locale] ?? key,
    [locale],
  );

  // SSR: always render Polish first, then switch on client
  const value: I18nContextValue = {
    locale: mounted ? locale : "pl",
    setLocale,
    t: mounted ? t : (key) => translations[key]?.pl ?? key,
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}

export function useTranslation() {
  const { t, locale } = useContext(I18nContext);
  return { t, locale };
}
