"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Activity, CalendarDays, Users } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import type { SectionKey } from "./section-nav";

const SECTIONS = [
  { key: "activity" as SectionKey, icon: Activity, label: "Aktywność" },
  { key: "schedule" as SectionKey, icon: CalendarDays, label: "Terminarz" },
  { key: "recruitment" as SectionKey, icon: Users, label: "Rekrutacja" },
];

export function SectionNavMobile() {
  const { t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = (searchParams.get("section") as SectionKey) ?? "activity";

  function navigate(key: SectionKey) {
    const params = new URLSearchParams(searchParams.toString());
    if (key === "activity") {
      params.delete("section");
    } else {
      params.set("section", key);
    }
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

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
