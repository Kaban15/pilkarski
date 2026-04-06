"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

export function PublicProfileCTA() {
  const { t } = useI18n();
  const { data: session } = useSession();

  if (session) {
    return (
      <Link href="/feed">
        <Button variant="outline">{t("Wróć do dashboardu")}</Button>
      </Link>
    );
  }

  return (
    <>
      <Link href="/register">
        <Button>{t("Dołącz do PilkaSport")}</Button>
      </Link>
      <Link href="/login">
        <Button variant="outline">{t("Zaloguj się")}</Button>
      </Link>
    </>
  );
}
