"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { type Locale, plToEn } from "./translations";

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (polish: string) => string;
}

const I18nContext = createContext<I18nContextValue>({
  locale: "pl",
  setLocale: () => {},
  t: (s) => s,
});

const identity = (s: string) => s;

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
    (polish: string): string => {
      if (locale === "pl") return polish;
      return plToEn[polish] ?? polish;
    },
    [locale],
  );

  const value = useMemo<I18nContextValue>(() => ({
    locale: mounted ? locale : "pl",
    setLocale,
    t: mounted ? t : identity,
  }), [mounted, locale, setLocale, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}

export { type Locale };
