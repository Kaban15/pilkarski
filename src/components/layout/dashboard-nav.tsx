"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { api } from "@/lib/trpc-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

interface DashboardNavProps {
  user: {
    name?: string | null;
    email?: string | null;
    role: string;
  };
}

const NAV_LINKS = [
  { href: "/feed", label: "Feed" },
  { href: "/sparings", label: "Sparingi" },
  { href: "/events", label: "Wydarzenia" },
  { href: "/messages", label: "Wiadomości" },
  { href: "/favorites", label: "Ulubione" },
  { href: "/calendar", label: "Kalendarz" },
  { href: "/search", label: "Szukaj" },
];

function NotifBell({ count }: { count: number }) {
  return (
    <>
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
      {count > 0 && (
        <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </>
  );
}

export function DashboardNav({ user }: DashboardNavProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const { data: unreadNotifs = 0 } = api.notification.unreadCount.useQuery(undefined, {
    refetchInterval: 30_000,
  });

  return (
    <header className="border-b border-border bg-background">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <Link href="/feed" className="text-xl font-bold">
            PilkaSport
          </Link>
          <nav className="hidden items-center gap-4 text-sm md:flex">
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="hover:text-primary">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="hidden items-center gap-3 md:flex">
          <ThemeToggle />
          <Link href="/notifications" className="relative hover:text-primary" title="Powiadomienia">
            <NotifBell count={unreadNotifs} />
          </Link>
          <Link href="/profile" className="text-sm hover:text-primary">
            {user.name || user.email}
          </Link>
          <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium uppercase">
            {user.role === "CLUB" ? "Klub" : "Zawodnik"}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            Wyloguj
          </Button>
        </div>

        {/* Hamburger button (mobile) */}
        <div className="flex items-center gap-3 md:hidden">
          <ThemeToggle />
          <Link href="/notifications" className="relative" title="Powiadomienia">
            <NotifBell count={unreadNotifs} />
          </Link>
          <button
            className="flex flex-col gap-1.5"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu"
          >
            <span className={`block h-0.5 w-6 bg-foreground transition ${menuOpen ? "translate-y-2 rotate-45" : ""}`} />
            <span className={`block h-0.5 w-6 bg-foreground transition ${menuOpen ? "opacity-0" : ""}`} />
            <span className={`block h-0.5 w-6 bg-foreground transition ${menuOpen ? "-translate-y-2 -rotate-45" : ""}`} />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="border-t px-4 py-3 md:hidden">
          <nav className="flex flex-col gap-3 text-sm">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="hover:text-primary"
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/notifications"
              className="hover:text-primary"
              onClick={() => setMenuOpen(false)}
            >
              Powiadomienia{unreadNotifs > 0 ? ` (${unreadNotifs})` : ""}
            </Link>
            <Link
              href="/profile"
              className="hover:text-primary"
              onClick={() => setMenuOpen(false)}
            >
              Profil ({user.name || user.email})
            </Link>
            <div className="flex items-center gap-2 pt-2 border-t">
              <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium uppercase">
                {user.role === "CLUB" ? "Klub" : "Zawodnik"}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => signOut({ callbackUrl: "/login" })}
              >
                Wyloguj
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
