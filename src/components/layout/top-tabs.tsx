"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useI18n } from "@/lib/i18n";
import { usePrefetchRoute } from "@/hooks/use-prefetch-route";

type Tab = { href: string; label: string };

const TABS_CLUB: Tab[] = [
  { href: "/feed", label: "Przegląd" },
  { href: "/sparings", label: "Sparingi" },
  { href: "/recruitment", label: "Rekrutacja" },
  { href: "/events", label: "Wydarzenia" },
  { href: "/squad", label: "Kadra" },
  { href: "/tournaments", label: "Turnieje" },
];

const TABS_PLAYER: Tab[] = [
  { href: "/feed", label: "Przegląd" },
  { href: "/events", label: "Wydarzenia" },
  { href: "/trainings", label: "Treningi" },
  { href: "/transfers", label: "Transfery" },
];

const TABS_COACH: Tab[] = [
  { href: "/feed", label: "Przegląd" },
  { href: "/trainings", label: "Treningi" },
  { href: "/events", label: "Wydarzenia" },
  { href: "/squad", label: "Kadra" },
  { href: "/community", label: "Tablica" },
];

function getTabsForRole(role: string | undefined): Tab[] {
  if (role === "CLUB") return TABS_CLUB;
  if (role === "COACH") return TABS_COACH;
  return TABS_PLAYER;
}

export function TopTabs() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { t } = useI18n();
  const prefetch = usePrefetchRoute();
  const tabs = getTabsForRole(session?.user?.role);

  return (
    <div className="sticky top-0 z-20 flex items-center gap-1 overflow-x-auto border-b border-border bg-background px-4 py-2 scrollbar-none md:px-6">
      {tabs.map((tab) => {
        const isActive =
          tab.href === "/feed"
            ? pathname === "/feed"
            : pathname.startsWith(tab.href);

        return (
          <Link
            key={tab.href}
            href={tab.href}
            onMouseEnter={() => prefetch(tab.href)}
            className={`shrink-0 rounded-lg px-4 py-2 text-[13px] font-medium transition-all ${
              isActive
                ? "bg-sport-orange/10 text-sport-orange font-semibold"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            }`}
          >
            {t(tab.label)}
          </Link>
        );
      })}
    </div>
  );
}
