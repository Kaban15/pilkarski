"use client";

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

export function DashboardNav({ user }: DashboardNavProps) {
  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <Link href="/feed" className="text-xl font-bold">
            PilkaSport
          </Link>
          <nav className="hidden items-center gap-4 text-sm md:flex">
            <Link href="/feed" className="hover:text-blue-600">
              Feed
            </Link>
            <Link href="/sparings" className="hover:text-blue-600">
              Sparingi
            </Link>
            <Link href="/events" className="hover:text-blue-600">
              Wydarzenia
            </Link>
            <Link href="/messages" className="hover:text-blue-600">
              Wiadomości
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-3">
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
      </div>
    </header>
  );
}
