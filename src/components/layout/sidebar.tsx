"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { api } from "@/lib/trpc-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { PushNotificationToggle } from "@/components/push-notification-toggle";
import {
  Home,
  Search,
  Swords,
  CalendarDays,
  Trophy,
  ArrowRightLeft,
  MapPin,
  BarChart3,
  Medal,
  MessageSquare,
  Bell,
  Heart,
  User,
  LogOut,
} from "lucide-react";

interface SidebarProps {
  user: {
    name?: string | null;
    email?: string | null;
    role: string;
  };
}

const NAV_SECTIONS = [
  {
    label: "Główne",
    items: [
      { href: "/feed", icon: Home, label: "Pulpit" },
      { href: "/search", icon: Search, label: "Szukaj" },
    ],
  },
  {
    label: "Aktywność",
    items: [
      { href: "/sparings", icon: Swords, label: "Sparingi" },
      { href: "/events", icon: Trophy, label: "Wydarzenia" },
      { href: "/transfers", icon: ArrowRightLeft, label: "Transfery" },
      { href: "/map", icon: MapPin, label: "Mapa" },
      { href: "/calendar", icon: CalendarDays, label: "Kalendarz" },
    ],
  },
  {
    label: "Komunikacja",
    items: [
      { href: "/messages", icon: MessageSquare, label: "Wiadomości" },
      { href: "/notifications", icon: Bell, label: "Powiadomienia" },
    ],
  },
  {
    label: "Moje",
    items: [
      { href: "/profile", icon: User, label: "Profil" },
      { href: "/favorites", icon: Heart, label: "Ulubione" },
      { href: "/stats", icon: BarChart3, label: "Statystyki" },
      { href: "/ranking", icon: Medal, label: "Ranking" },
    ],
  },
];

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();

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

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-sidebar-border bg-sidebar-background md:flex">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2.5 border-b border-sidebar-border px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
          PS
        </div>
        <span className="text-lg font-bold tracking-tight text-foreground">
          PilkaSport
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label} className="mb-5">
            <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-sidebar-muted-foreground">
              {section.label}
            </p>
            {section.items.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/feed" && pathname.startsWith(item.href));
              const badge = getBadge(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-muted hover:text-foreground"
                  }`}
                >
                  <item.icon
                    className={`h-[18px] w-[18px] shrink-0 ${
                      isActive
                        ? "text-primary"
                        : "text-sidebar-muted-foreground group-hover:text-foreground"
                    }`}
                  />
                  <span className="flex-1">{item.label}</span>
                  {badge > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                      {badge > 99 ? "99+" : badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User section */}
      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-3 rounded-lg px-3 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
            {(user.name || user.email || "?")[0].toUpperCase()}
          </div>
          <div className="flex-1 truncate">
            <p className="truncate text-sm font-medium text-foreground">
              {user.name || user.email}
            </p>
            <p className="text-[11px] text-sidebar-muted-foreground">
              {user.role === "CLUB" ? "Klub" : "Zawodnik"}
            </p>
          </div>
          <PushNotificationToggle />
          <ThemeToggle />
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-muted-foreground transition-colors hover:bg-sidebar-muted hover:text-foreground"
        >
          <LogOut className="h-[18px] w-[18px]" />
          Wyloguj
        </button>
      </div>
    </aside>
  );
}
