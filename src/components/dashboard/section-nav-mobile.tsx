"use client";

import { useI18n } from "@/lib/i18n";
import { SECTIONS, useSectionNav } from "./section-nav";

export function SectionNavMobile() {
  const { t } = useI18n();
  const { current, navigate } = useSectionNav();

  return (
    <div className="mb-4 flex gap-2 overflow-x-auto lg:hidden">
      {SECTIONS.map(({ key, icon: Icon, label }) => {
        const active = current === key;
        return (
          <button
            key={key}
            onClick={() => navigate(key)}
            className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
              active
                ? "bg-sport-orange/15 text-sport-orange"
                : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {t(label)}
          </button>
        );
      })}
    </div>
  );
}
