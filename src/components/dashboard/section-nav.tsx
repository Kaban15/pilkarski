"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Activity, CalendarDays, Users } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export const SECTIONS = [
  { key: "activity", icon: Activity, label: "Aktywność" },
  { key: "schedule", icon: CalendarDays, label: "Terminarz" },
  { key: "recruitment", icon: Users, label: "Rekrutacja" },
] as const;

export type SectionKey = (typeof SECTIONS)[number]["key"];

export function useSectionNav() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = (searchParams.get("section") as SectionKey) ?? "schedule";

  function navigate(key: SectionKey) {
    const params = new URLSearchParams(searchParams.toString());
    if (key === "schedule") {
      params.delete("section");
    } else {
      params.set("section", key);
    }
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  return { current, navigate };
}

export function SectionNav() {
  const { t } = useI18n();
  const { current, navigate } = useSectionNav();

  return (
    <div className="mt-6 border-t border-border pt-4">
      <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {t("Sekcje")}
      </p>
      <nav className="space-y-1">
        {SECTIONS.map(({ key, icon: Icon, label }) => {
          const active = current === key;
          return (
            <button
              key={key}
              onClick={() => navigate(key)}
              className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "border-l-2 border-sport-orange bg-sport-orange/10 text-sport-orange"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {t(label)}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
