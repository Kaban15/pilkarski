"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { api } from "@/lib/trpc-react";
import { ROLE_LABELS } from "@/lib/labels";
import { ThemeToggle } from "@/components/theme-toggle";
import { PushNotificationToggle } from "@/components/push-notification-toggle";
import {
  Home,
  Search,
  Swords,
  CalendarDays,
  Trophy,
  ArrowRightLeft,
  MessageSquare,
  Bell,
  Heart,
  User,
  LogOut,
  Target,
  Megaphone,
  GraduationCap,
  Users,
  Medal,
} from "lucide-react";

interface SidebarProps {
  user: {
    name?: string | null;
    email?: string | null;
    role: string;
  };
}

type NavItem = {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  roles?: string[];
};

type NavSection = { label: string; items: NavItem[] };

const NAV_SECTIONS: NavSection[] = [
  {
    label: "Główne",
    items: [
      { href: "/feed", icon: Home, label: "Pulpit" },
      { href: "/sparings", icon: Swords, label: "Sparingi", roles: ["CLUB"] },
      { href: "/events", icon: Trophy, label: "Wydarzenia" },
      { href: "/recruitment", icon: Target, label: "Rekrutacja" },
      { href: "/squad", icon: Users, label: "Kadra", roles: ["CLUB"] },
      { href: "/trainings", icon: GraduationCap, label: "Treningi" },
      { href: "/calendar", icon: CalendarDays, label: "Kalendarz" },
    ],
  },
  {
    label: "Więcej",
    items: [
      { href: "/community", icon: Megaphone, label: "Tablica" },
      { href: "/transfers", icon: ArrowRightLeft, label: "Transfery" },
      { href: "/leagues", icon: Medal, label: "Ligi" },
      { href: "/search", icon: Search, label: "Szukaj" },
      { href: "/messages", icon: MessageSquare, label: "Wiadomości" },
      { href: "/notifications", icon: Bell, label: "Powiadomienia" },
    ],
  },
  {
    label: "Konto",
    items: [
      { href: "/profile", icon: User, label: "Profil" },
      { href: "/favorites", icon: Heart, label: "Ulubione" },
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
      <div className="flex h-14 items-center gap-2.5 border-b border-sidebar-border px-5">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-violet-500 to-sky-500 text-xs font-black text-white">
          PS
        </div>
        <span className="text-[15px] font-semibold tracking-tight text-foreground">
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
            {section.items.filter((item) => !item.roles || item.roles.includes(user.role)).map((item) => {
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
                      ? "bg-sidebar-accent text-sidebar-accent-foreground border-l-2 border-violet-500"
                      : "text-sidebar-foreground hover:bg-sidebar-muted hover:text-foreground"
                  }`}
                >
                  <item.icon
                    className={`h-4 w-4 shrink-0 ${
                      isActive
                        ? "text-primary"
                        : "text-sidebar-muted-foreground group-hover:text-foreground"
                    }`}
                  />
                  <span className="flex-1">{item.label}</span>
                  {badge > 0 && (
                    <span className="pulse-dot flex h-5 min-w-5 items-center justify-center rounded-full bg-violet-500 px-1.5 text-[10px] font-bold text-white">
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
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary ring-2 ring-violet-500/30">
            {(user.name || user.email || "?")[0].toUpperCase()}
          </div>
          <div className="flex-1 truncate">
            <p className="truncate text-sm font-medium text-foreground">
              {user.name || user.email}
            </p>
            <p className="text-[11px] text-sidebar-muted-foreground">
              {ROLE_LABELS[user.role] ?? "Użytkownik"}
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
