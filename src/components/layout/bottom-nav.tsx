"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { api } from "@/lib/trpc-react";
import {
  Home,
  Swords,
  Trophy,
  MessageSquare,
  Bell,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/feed", icon: Home, label: "Feed" },
  { href: "/sparings", icon: Swords, label: "Sparingi" },
  { href: "/events", icon: Trophy, label: "Wydarzenia" },
  { href: "/messages", icon: MessageSquare, label: "Wiadomości" },
  { href: "/notifications", icon: Bell, label: "Powiadomienia" },
];

export function BottomNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isClub = session?.user?.role === "CLUB";

  const { data: unreadMessages = 0 } = api.message.unreadCount.useQuery(undefined, {
    refetchInterval: 60_000,
  });
  const { data: unreadNotifs = 0 } = api.notification.unreadCount.useQuery(undefined, {
    refetchInterval: 60_000,
  });
  const { data: pendingApplications = 0 } = api.stats.clubDashboard.useQuery(undefined, {
    enabled: isClub,
    staleTime: 30_000,
    select: (data) => data?.pendingApplications?.length ?? 0,
  });

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 backdrop-blur-sm md:hidden">
      <div className="flex items-center justify-around py-2">
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/feed" && pathname.startsWith(item.href));
          const badge =
            item.href === "/messages" && unreadMessages > 0
              ? unreadMessages
              : item.href === "/notifications" && unreadNotifs > 0
                ? unreadNotifs
                : item.href === "/sparings" && pendingApplications > 0
                  ? pendingApplications
                  : 0;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-col items-center gap-0.5 px-3 py-1 text-[10px] font-medium transition-colors ${
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <div className="relative">
                <item.icon className="h-5 w-5" />
                {badge > 0 && (
                  <span className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">
                    {badge > 9 ? "9+" : badge}
                  </span>
                )}
              </div>
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
