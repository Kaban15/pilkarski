"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function PublicProfileCTA() {
  const { data: session } = useSession();

  if (session) {
    return (
      <Link href="/feed">
        <Button variant="outline">Wróć do dashboardu</Button>
      </Link>
    );
  }

  return (
    <>
      <Link href="/register">
        <Button>Dołącz do PilkaSport</Button>
      </Link>
      <Link href="/login">
        <Button variant="outline">Zaloguj się</Button>
      </Link>
    </>
  );
}
