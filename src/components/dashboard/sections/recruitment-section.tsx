"use client";

import { useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { Users } from "lucide-react";
import { RecruitmentStats } from "@/components/recruitment/recruitment-stats";
import { ClubRecruitment } from "@/components/dashboard/club-recruitment";

type SubTab = "pipeline" | "recruitments" | "suggested";

export function RecruitmentSection() {
  const { t } = useI18n();
  const [subTab, setSubTab] = useState<SubTab>("pipeline");

  const TABS: { key: SubTab; label: string }[] = [
    { key: "pipeline", label: "Pipeline" },
    { key: "recruitments", label: "Nabory" },
    { key: "suggested", label: "Sugerowani" },
  ];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Users className="h-5 w-5 text-primary" />
          {t("Rekrutacja")}
        </h2>
        <Link href="/recruitment" className="text-xs font-medium text-primary hover:underline">
          {t("Zobacz wszystko →")}
        </Link>
      </div>

      <div className="mb-4 flex gap-1.5">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setSubTab(key)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              subTab === key
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted/50"
            }`}
          >
            {t(label)}
          </button>
        ))}
      </div>

      {subTab === "pipeline" && <RecruitmentStats />}
      {subTab === "recruitments" && <ClubRecruitment showSection="recruitments" />}
      {subTab === "suggested" && <ClubRecruitment showSection="suggested" />}
    </div>
  );
}
