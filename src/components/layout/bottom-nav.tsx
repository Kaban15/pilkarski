"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { api } from "@/lib/trpc-react";
import { useI18n } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/translations";
import {
  Home,
  Swords,
  Trophy,
  MessageSquare,
  Bell,
  GraduationCap,
  Target,
  Megaphone,
} from "lucide-react";

type NavItem = {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  labelKey: TranslationKey;
};

const FEED: NavItem = { href: "/feed", icon: Home, labelKey: "nav.feed" };
const MSGS: NavItem = { href: "/messages", icon: MessageSquare, labelKey: "nav.messages" };
const NOTIFS: NavItem = { href: "/notifications", icon: Bell, labelKey: "nav.notifications.short" };

const NAV_CLUB: NavItem[] = [
  FEED,
  { href: "/sparings", icon: Swords, labelKey: "nav.sparings" },
  { href: "/recruitment", icon: Target, labelKey: "nav.recruitment" },
  MSGS, NOTIFS,
];

const NAV_PLAYER: NavItem[] = [
  FEED,
  { href: "/events", icon: Trophy, labelKey: "nav.events.mobile" },
  { href: "/trainings", icon: GraduationCap, labelKey: "nav.trainings" },
  MSGS, NOTIFS,
];

const NAV_COACH: NavItem[] = [
  FEED,
  { href: "/trainings", icon: GraduationCap, labelKey: "nav.trainings" },
  { href: "/community", icon: Megaphone, labelKey: "nav.community" },
  MSGS, NOTIFS,
];

function getNavItems(role: string | undefined): NavItem[] {
  if (role === "CLUB") return NAV_CLUB;
  if (role === "COACH") return NAV_COACH;
  return NAV_PLAYER;
}

export function BottomNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = session?.user?.role;
  const { t } = useI18n();

  const { data: unreadMessages = 0 } = api.message.unreadCount.useQuery(undefined, {
    refetchInterval: 60_000,
  });
  const { data: unreadNotifs = 0 } = api.notification.unreadCount.useQuery(undefined, {
    refetchInterval: 60_000,
  });

  const navItems = getNavItems(role);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 backdrop-blur-sm md:hidden">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/feed" && pathname.startsWith(item.href));
          const badge =
            item.href === "/messages" && unreadMessages > 0
              ? unreadMessages
              : item.href === "/notifications" && unreadNotifs > 0
                ? unreadNotifs
                : 0;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-col items-center gap-0.5 px-3 py-1 text-[10px] font-medium transition-colors ${
                isActive
                  ? "text-sport-cyan"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <div className="relative">
                <item.icon className="h-5 w-5" />
                {badge > 0 && (
                  <span className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-sport-cyan px-1 text-[9px] font-bold text-white">
                    {badge > 9 ? "9+" : badge}
                  </span>
                )}
              </div>
              {t(item.labelKey)}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
