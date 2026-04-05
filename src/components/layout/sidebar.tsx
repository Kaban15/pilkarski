"use client";

import { useState } from "react";
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
  UsersRound,
  Shield,
  MoreHorizontal,
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

const MAIN_NAV: NavItem[] = [
  { href: "/feed", icon: Home, label: "Pulpit" },
  { href: "/sparings", icon: Swords, label: "Sparingi", roles: ["CLUB"] },
  { href: "/events", icon: Trophy, label: "Wydarzenia" },
  { href: "/recruitment", icon: Target, label: "Rekrutacja" },
  { href: "/messages", icon: MessageSquare, label: "Wiadomości" },
  { href: "/notifications", icon: Bell, label: "Powiadomienia" },
  { href: "/profile", icon: User, label: "Profil" },
];

const MORE_NAV: NavItem[] = [
  { href: "/squad", icon: Users, label: "Kadra", roles: ["CLUB"] },
  { href: "/trainings", icon: GraduationCap, label: "Treningi" },
  { href: "/calendar", icon: CalendarDays, label: "Kalendarz" },
  { href: "/tournaments", icon: Trophy, label: "Turnieje" },
  { href: "/community", icon: Megaphone, label: "Tablica" },
  { href: "/transfers", icon: ArrowRightLeft, label: "Transfery" },
  { href: "/leagues", icon: Medal, label: "Ligi" },
  { href: "/search", icon: Search, label: "Szukaj" },
  { href: "/club-chat", icon: UsersRound, label: "Czat klubu" },
  { href: "/favorites", icon: Heart, label: "Ulubione" },
  { href: "/admin", icon: Shield, label: "Admin" },
];

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

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
    if (item.href === "/admin") return user.isAdmin;
    return !item.roles || item.roles.includes(user.role);
  };

  const renderNavLink = (item: NavItem, onClick?: () => void) => {
    const isActive =
      pathname === item.href ||
      (item.href !== "/feed" && pathname.startsWith(item.href));
    const badge = getBadge(item.href);

    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={onClick}
        className={`group relative flex h-[50px] items-center gap-4 rounded-xl px-4 text-[15px] font-medium transition-all duration-200 ${
          isActive
            ? "bg-white/[0.08] text-white font-bold shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]"
            : "text-white/60 hover:bg-white/[0.06] hover:text-white"
        }`}
      >
        {isActive && (
          <div className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-gradient-to-b from-primary to-sport-cyan" />
        )}
        <item.icon
          className={`h-6 w-6 shrink-0 transition-colors duration-200 ${
            isActive
              ? "text-sport-cyan"
              : "text-white/40 group-hover:text-white/70"
          }`}
        />
        <span className="flex-1 truncate">{item.label}</span>
        {badge > 0 && (
          <span className="pulse-dot flex h-5 min-w-5 items-center justify-center rounded-full bg-gradient-to-r from-violet-500 to-sky-500 px-1.5 text-[10px] font-bold text-white shadow-lg shadow-violet-500/30">
            {badge > 99 ? "99+" : badge}
          </span>
        )}
      </Link>
    );
  };

  // Check if any "more" item is currently active
  const moreItems = MORE_NAV.filter(filterItem);
  const moreHasActive = moreItems.some(
    (item) => pathname === item.href || (item.href !== "/feed" && pathname.startsWith(item.href))
  );

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-white/[0.06] bg-[#0b1120]/95 backdrop-blur-xl md:flex">
      {/* Decorative gradient orb */}
      <div className="pointer-events-none absolute -left-20 -top-20 h-60 w-60 rounded-full bg-violet-600/10 blur-[80px]" />
      <div className="pointer-events-none absolute -bottom-20 -left-10 h-40 w-40 rounded-full bg-sky-600/8 blur-[60px]" />

      {/* Logo header */}
      <div className="relative flex h-16 items-center gap-3 px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-sky-500 text-sm font-black text-white shadow-lg shadow-violet-500/25">
          PS
        </div>
        <div>
          <p className="text-[15px] font-bold tracking-tight text-white">PilkaSport</p>
          <p className="text-[10px] font-medium uppercase tracking-widest text-white/30">Panel</p>
        </div>
      </div>

      {/* Separator */}
      <div className="mx-5 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* Navigation */}
      <nav className="relative flex-1 overflow-y-auto px-3 py-5">
        <div className="space-y-0.5">
          {MAIN_NAV.filter(filterItem).map((item) => renderNavLink(item))}

          {/* More button */}
          <div className="relative">
            <button
              onClick={() => setMoreOpen(!moreOpen)}
              className={`group relative flex h-[50px] w-full items-center gap-4 rounded-xl px-4 text-[15px] font-medium transition-all duration-200 ${
                moreOpen || moreHasActive
                  ? "bg-white/[0.08] text-white"
                  : "text-white/60 hover:bg-white/[0.06] hover:text-white"
              }`}
            >
              <MoreHorizontal
                className={`h-6 w-6 shrink-0 transition-colors duration-200 ${
                  moreOpen || moreHasActive
                    ? "text-sport-cyan"
                    : "text-white/40 group-hover:text-white/70"
                }`}
              />
              <span className="flex-1 truncate text-left">Więcej</span>
            </button>

            {/* More popup */}
            {moreOpen && (
              <>
                {/* Backdrop */}
                <div className="fixed inset-0 z-40" onClick={() => setMoreOpen(false)} />

                {/* Popup — positioned above the button */}
                <div className="absolute bottom-full left-0 z-50 mb-2 w-full rounded-2xl border border-white/[0.08] bg-[#111827] p-2 shadow-2xl shadow-black/60">
                  <div className="space-y-0.5 max-h-[60vh] overflow-y-auto">
                    {moreItems.map((item) =>
                      renderNavLink(item, () => setMoreOpen(false))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Separator */}
      <div className="mx-5 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* User section */}
      <div className="relative p-4">
        <div className="flex items-center gap-3 rounded-xl bg-white/[0.04] px-3.5 py-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500/20 to-sky-500/20 text-sm font-bold text-violet-300 ring-2 ring-violet-400/20">
            {(user.name || user.email || "?")[0].toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold text-white/90">
              {user.name || user.email}
            </p>
            <p className="text-[11px] font-medium text-white/30">
              {ROLE_LABELS[user.role] ?? "Użytkownik"}
            </p>
          </div>
          <div className="flex items-center gap-0.5">
            <PushNotificationToggle />
            <ThemeToggle />
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl py-2 text-[12px] font-medium text-white/25 transition-all duration-200 hover:bg-white/[0.04] hover:text-white/50"
        >
          <LogOut className="h-3.5 w-3.5" />
          Wyloguj
        </button>
      </div>
    </aside>
  );
}
