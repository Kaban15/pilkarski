"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

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
  { href: "/search", label: "Szukaj" },
];

export function DashboardNav({ user }: DashboardNavProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <Link href="/feed" className="text-xl font-bold">
            PilkaSport
          </Link>
          <nav className="hidden items-center gap-4 text-sm md:flex">
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="hover:text-blue-600">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="hidden items-center gap-3 md:flex">
          <Link href="/profile" className="text-sm hover:text-blue-600">
            {user.name || user.email}
          </Link>
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium uppercase">
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
        <button
          className="flex flex-col gap-1.5 md:hidden"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menu"
        >
          <span className={`block h-0.5 w-6 bg-gray-700 transition ${menuOpen ? "translate-y-2 rotate-45" : ""}`} />
          <span className={`block h-0.5 w-6 bg-gray-700 transition ${menuOpen ? "opacity-0" : ""}`} />
          <span className={`block h-0.5 w-6 bg-gray-700 transition ${menuOpen ? "-translate-y-2 -rotate-45" : ""}`} />
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="border-t px-4 py-3 md:hidden">
          <nav className="flex flex-col gap-3 text-sm">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="hover:text-blue-600"
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/profile"
              className="hover:text-blue-600"
              onClick={() => setMenuOpen(false)}
            >
              Profil ({user.name || user.email})
            </Link>
            <div className="flex items-center gap-2 pt-2 border-t">
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium uppercase">
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
