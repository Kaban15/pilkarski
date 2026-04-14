"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { api } from "@/lib/trpc-react";
import { useI18n } from "@/lib/i18n";
import { usePrefetchRoute } from "@/hooks/use-prefetch-route";
import { useSidebarState } from "@/hooks/use-sidebar-state";

import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { PushNotificationToggle } from "@/components/push-notification-toggle";
import {
  Home,
  Swords,
  CalendarDays,
  Trophy,
  MessageSquare,
  Bell,
  Target,
  GraduationCap,
  Users,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface SidebarProps {
  user: {
    name?: string | null;
    email?: string | null;
    role: string;
    isAdmin?: boolean;
  };
}

type NavItem = {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  roles?: string[];
};

const NAV_ITEMS: NavItem[] = [
  { href: "/feed", icon: Home, label: "Pulpit" },
  { href: "/sparings", icon: Swords, label: "Sparingi", roles: ["CLUB"] },
  { href: "/events", icon: Trophy, label: "Wydarzenia" },
  { href: "/recruitment", icon: Target, label: "Rekrutacja" },
  { href: "/squad", icon: Users, label: "Kadra", roles: ["CLUB"] },
  { href: "/trainings", icon: GraduationCap, label: "Treningi" },
  { href: "/tournaments", icon: Trophy, label: "Turnieje" },
  { href: "/calendar", icon: CalendarDays, label: "Kalendarz" },
  { href: "/messages", icon: MessageSquare, label: "Wiadomości" },
  { href: "/notifications", icon: Bell, label: "Powiadomienia" },
];

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const { collapsed, toggle, mounted } = useSidebarState();
  const { t } = useI18n();
  const prefetch = usePrefetchRoute();

  const { data: unreadNotifs = 0 } = api.notification.unreadCount.useQuery(undefined, {
    refetchInterval: 60_000,
  });
  const { data: unreadMessages = 0 } = api.message.unreadCount.useQuery(undefined, {
    refetchInterval: 60_000,
  });

  const getBadge = (href: string) => {
    if (href === "/notifications" && unreadNotifs > 0) return unreadNotifs;
    if (href === "/messages" && unreadMessages > 0) return unreadMessages;
    return 0;
  };

  const filterItem = (item: NavItem) => {
    return !item.roles || item.roles.includes(user.role);
  };

  const isActive = (href: string) =>
    pathname === href || (href !== "/feed" && pathname.startsWith(href));

  return (
    <>
      {/* Overlay when expanded */}
      {!collapsed && (
        <div
          className="fixed inset-0 z-30 hidden bg-black/40 md:block"
          onClick={toggle}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-border dark:border-white/[0.06] bg-[var(--sidebar-background,theme(colors.background))] md:flex transition-all duration-200 ${
          collapsed ? "w-16" : "w-60"
        }`}
        style={{ willChange: "width" }}
      >
        {/* Logo header */}
        <div className="flex h-16 items-center justify-center px-3">
          {collapsed ? (
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-sky-500 text-sm font-black text-white">
              PS
            </div>
          ) : (
            <div className="flex items-center gap-3 px-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-sky-500 text-sm font-black text-white">
                PS
              </div>
              <div>
                <p className="text-[15px] font-bold tracking-tight text-foreground dark:text-white">
                  PilkaSport
                </p>
                <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground/50 dark:text-white/30">
                  {t("Panel")}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Separator */}
        <div className="mx-3 h-px bg-border dark:bg-gradient-to-r dark:from-transparent dark:via-white/10 dark:to-transparent" />

        {/* Navigation */}
        <nav className="relative flex-1 overflow-y-auto px-2 py-4 sidebar-scroll">
          <div className="space-y-0.5">
            {NAV_ITEMS.filter(filterItem).map((item) => {
              const active = isActive(item.href);
              const badge = getBadge(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onMouseEnter={() => prefetch(item.href)}
                  title={collapsed ? t(item.label) : undefined}
                  className={`group relative flex items-center rounded-lg transition-all duration-200 ${
                    collapsed
                      ? "h-10 w-10 mx-auto justify-center"
                      : "h-[44px] gap-3.5 px-4"
                  } ${
                    active
                      ? "bg-[var(--sidebar-accent,theme(colors.accent.DEFAULT))] text-[var(--sidebar-accent-foreground,theme(colors.foreground))] font-bold"
                      : "text-muted-foreground dark:text-white/60 hover:bg-accent dark:hover:bg-white/[0.06] hover:text-foreground dark:hover:text-white"
                  }`}
                >
                  {active && (
                    <div className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-gradient-to-b from-primary to-sport-orange" />
                  )}
                  <item.icon
                    className={`h-[22px] w-[22px] shrink-0 transition-colors duration-200 ${
                      active
                        ? "text-sport-orange"
                        : "text-muted-foreground/60 dark:text-white/40 group-hover:text-foreground/70 dark:group-hover:text-white/70"
                    }`}
                  />
                  {!collapsed && (
                    <span className="flex-1 truncate text-[14px] font-medium">
                      {t(item.label)}
                    </span>
                  )}
                  {badge > 0 && (
                    <span
                      className={`pulse-dot flex items-center justify-center rounded-full bg-gradient-to-r from-violet-500 to-sport-orange text-[10px] font-bold text-white ${
                        collapsed
                          ? "absolute -right-0.5 -top-0.5 h-4 min-w-4 px-1"
                          : "h-5 min-w-5 px-1.5"
                      }`}
                    >
                      {badge > 99 ? "99+" : badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Toggle button */}
          <button
            onClick={toggle}
            className={`mt-4 flex items-center justify-center rounded-lg text-muted-foreground/60 dark:text-white/40 hover:bg-accent dark:hover:bg-white/[0.06] hover:text-foreground dark:hover:text-white transition-all duration-200 ${
              collapsed ? "h-10 w-10 mx-auto" : "h-10 w-full px-4 gap-3.5"
            }`}
            title={collapsed ? t("Rozwiń") : t("Zwiń")}
          >
            {collapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <>
                <ChevronLeft className="h-5 w-5 shrink-0" />
                <span className="flex-1 truncate text-left text-[14px] font-medium">
                  {t("Zwiń")}
                </span>
              </>
            )}
          </button>
        </nav>

        {/* Separator */}
        <div className="mx-3 h-px bg-border dark:bg-gradient-to-r dark:from-transparent dark:via-white/10 dark:to-transparent" />

        {/* User section */}
        <div className="relative p-2">
          {collapsed ? (
            /* Collapsed: avatar only */
            <div className="flex flex-col items-center gap-2 py-2">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500/20 to-sky-500/20 text-sm font-bold text-violet-600 dark:text-violet-300 ring-2 ring-violet-400/20">
                {(user.name || user.email || "?")[0].toUpperCase()}
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground/50 dark:text-white/25 transition-all duration-200 hover:bg-accent dark:hover:bg-white/[0.04] hover:text-muted-foreground dark:hover:text-white/50"
                title={t("Wyloguj")}
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            /* Expanded: avatar + toggles */
            <>
              <div className="flex items-center gap-3 rounded-xl bg-accent dark:bg-white/[0.04] px-3.5 py-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500/20 to-sky-500/20 text-sm font-bold text-violet-600 dark:text-violet-300 ring-2 ring-violet-400/20">
                  {(user.name || user.email || "?")[0].toUpperCase()}
                </div>
                <div className="flex-1" />
                <div className="flex items-center gap-0.5">
                  <LanguageToggle />
                  <PushNotificationToggle />
                  <ThemeToggle />
                </div>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl py-2 text-[12px] font-medium text-muted-foreground/50 dark:text-white/25 transition-all duration-200 hover:bg-accent dark:hover:bg-white/[0.04] hover:text-muted-foreground dark:hover:text-white/50"
              >
                <LogOut className="h-3.5 w-3.5" />
                {t("Wyloguj")}
              </button>
            </>
          )}
        </div>
      </aside>
    </>
  );
}
