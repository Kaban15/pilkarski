# Product Consolidation — Rekrutacja, Treningi, Community, Onboarding

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Consolidate PilkaSport into a usable product by exposing recruitment as a first-class feature, creating a dedicated trainings view, hardening community, and adding role-specific onboarding that drives the first key action.

**Architecture:** Build on existing tRPC routers (`recruitment`, `event`, `coach`, `clubPost`, `feed`), Prisma models (`RecruitmentPipeline`, `Event`, `Coach`, `ClubPost`), and gamification system. No new models needed — all changes are router extensions, new pages/components, and sidebar restructure.

**Tech Stack:** Next.js 16 App Router, tRPC v11, Prisma 7, Zod v4, shadcn/ui, Tailwind 4, Lucide icons

---

## Current State Analysis

### What works today
- **Recruitment pipeline:** 6 stages (WATCHING → SIGNED), `addToRadar` from transfers, `updateStage` with notes, `myPipeline` with tabs
- **Recruitment events:** TRYOUT/CAMP/CONTINUOUS_RECRUITMENT with targeting (position, age, level), notifications to followers + matching players
- **Feed:** `recruitments` endpoint for PLAYER/COACH, `suggestedPlayers` for CLUB
- **Coach:** Profile CRUD, list/search, no event integration
- **Community:** `ClubPost` CRUD, 5 categories, cursor pagination, in feed
- **Onboarding:** Only CLUB wizard (3 steps: profile → first listing → done)

### Problem List

**P0 — Critical for usage:**
1. Rekrutacja pochowana w "Więcej" w sidebarze — nikt jej nie znajdzie
2. Brak onboardingu PLAYER i COACH — po rejestracji widzą pusty feed
3. Pipeline nie łączy się z eventami — klub nie widzi kto aplikował na nabór w kontekście pipeline
4. COACH nie może tworzyć treningów — role guard blokuje `event.create`
5. Brak minimalnej długości posta w community — spam/puste posty

**P1 — Ważne dla retencji:**
6. Brak dedykowanego widoku "Treningi" — INDIVIDUAL/GROUP_TRAINING schowane w ogólnej liście eventów
7. Brak katalogu trenerów — `coach.list` istnieje, ale brak strony UI
8. Pipeline ma tylko stage dropdown — brak szybkich akcji "Zaproś na testy", "Dodaj notatkę"
9. Brak limitu postów na klub — jeden klub może zalać tablicę
10. "Nabory dla Ciebie" tylko jako mały widget — powinny być wyeksponowane

**P2 — Nice to have:**
11. Brak eksportu CSV z pipeline
12. Brak przycisku "Zgłoś" na postach
13. Brak powiadomień przypominających (np. "brak naboru od 30 dni")
14. Brak gamifikacji za first_training_published, first_club_post

---

## File Structure

### New files
```
src/app/(dashboard)/trainings/page.tsx          — Katalog treningów + trenerów
src/components/onboarding/player-onboarding.tsx — Onboarding zawodnika
src/components/onboarding/coach-onboarding.tsx  — Onboarding trenera
src/components/recruitment/pipeline-card.tsx     — Karta kandydata w pipeline z akcjami
src/components/recruitment/recruitment-stats.tsx — Mini stats pipeline (watching/invited/signed)
```

### Modified files
```
src/components/layout/sidebar.tsx               — Reorganizacja nawigacji per rola
src/app/(dashboard)/recruitment/page.tsx        — Pipeline z szybkimi akcjami + CSV export
src/app/(dashboard)/community/page.tsx          — Limity, min length, zgłoś
src/app/(dashboard)/feed/page.tsx               — Onboarding per rola, wyeksponowane nabory
src/app/(dashboard)/events/page.tsx             — Filtr "Treningi" jako wyróżniony tab
src/server/trpc/routers/event.ts                — COACH może tworzyć treningi
src/server/trpc/routers/club-post.ts            — Limity postów, min content length
src/server/trpc/routers/recruitment.ts          — exportCsv, pipeline stats
src/server/trpc/routers/feed.ts                 — Rozszerzony recruitments endpoint
src/lib/validators/club-post.ts                 — Min content length
src/lib/gamification.ts                         — Nowe eventy
src/lib/labels.ts                               — Nowe labele
```

---

## Iteracja A — Rekrutacja + Pipeline

### Task A1: Reorganizacja sidebaru — "Rekrutacja" jako sekcja główna

**Files:** `src/components/layout/sidebar.tsx`

- [ ] **Step 1:** Zmień `NAV_SECTIONS` — przenieś "Rekrutacja" do sekcji "Główne", dodaj warunkowe filtrowanie per rola.

**Current code (lines 34-62):**
```ts
const NAV_SECTIONS = [
  {
    label: "Główne",
    items: [
      { href: "/feed", icon: Home, label: "Pulpit" },
      { href: "/sparings", icon: Swords, label: "Sparingi" },
      { href: "/events", icon: Trophy, label: "Wydarzenia" },
      { href: "/calendar", icon: CalendarDays, label: "Kalendarz" },
    ],
  },
  {
    label: "Więcej",
    items: [
      { href: "/community", icon: Megaphone, label: "Tablica" },
      { href: "/recruitment", icon: Target, label: "Rekrutacja" },
      { href: "/transfers", icon: ArrowRightLeft, label: "Transfery" },
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
```

**Replace with role-aware navigation:**
```ts
type NavItem = { href: string; icon: any; label: string; roles?: string[] };
type NavSection = { label: string; items: NavItem[] };

const NAV_SECTIONS: NavSection[] = [
  {
    label: "Główne",
    items: [
      { href: "/feed", icon: Home, label: "Pulpit" },
      { href: "/sparings", icon: Swords, label: "Sparingi", roles: ["CLUB"] },
      { href: "/events", icon: Trophy, label: "Wydarzenia" },
      { href: "/recruitment", icon: Target, label: "Rekrutacja" },
      { href: "/trainings", icon: GraduationCap, label: "Treningi" },
      { href: "/calendar", icon: CalendarDays, label: "Kalendarz" },
    ],
  },
  {
    label: "Więcej",
    items: [
      { href: "/community", icon: Megaphone, label: "Tablica" },
      { href: "/transfers", icon: ArrowRightLeft, label: "Transfery" },
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
```

- [ ] **Step 2:** W render loop filtruj items po roli:
```tsx
{section.items
  .filter((item) => !item.roles || item.roles.includes(user.role))
  .map((item) => { ... })}
```

- [ ] **Step 3:** Dodaj `GraduationCap` do importu lucide-react (nie jest jeszcze importowany):
```ts
// Dodaj GraduationCap do istniejącego importu:
import {
  Home, Search, Swords, CalendarDays, Trophy, ArrowRightLeft,
  MessageSquare, Bell, Heart, User, LogOut, Target, Megaphone,
  GraduationCap,
} from "lucide-react";
```

- [ ] **Step 4:** Verify `npx tsc --noEmit` passes.

- [ ] **Step 5:** Commit: `Sidebar: promote Rekrutacja and Treningi to main nav, role-aware filtering`

---

### Task A2: Pipeline stats widget na dashboardzie klubu

**Files:** Create `src/components/recruitment/recruitment-stats.tsx`, modify `src/server/trpc/routers/recruitment.ts`, modify `src/app/(dashboard)/feed/page.tsx`

- [ ] **Step 1:** Dodaj endpoint `recruitment.stats` w routerze:

```ts
stats: protectedProcedure.query(async ({ ctx }) => {
  const club = await ctx.db.club.findUnique({
    where: { userId: ctx.session.user.id },
  });
  if (!club) return null;

  const counts = await ctx.db.recruitmentPipeline.groupBy({
    by: ["stage"],
    where: { clubId: club.id },
    _count: true,
  });

  const byStage = Object.fromEntries(
    counts.map((c) => [c.stage, c._count])
  );

  return {
    watching: byStage.WATCHING ?? 0,
    invited: byStage.INVITED_TO_TRYOUT ?? 0,
    afterTryout: byStage.AFTER_TRYOUT ?? 0,
    offerSent: byStage.OFFER_SENT ?? 0,
    signed: byStage.SIGNED ?? 0,
    rejected: byStage.REJECTED ?? 0,
    total: counts.reduce((sum, c) => sum + c._count, 0),
  };
}),
```

- [ ] **Step 2:** Utwórz `recruitment-stats.tsx`:

```tsx
"use client";
import Link from "next/link";
import { api } from "@/lib/trpc-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, Eye, UserCheck, FileText, CheckCircle2 } from "lucide-react";
import { RECRUITMENT_STAGE_LABELS } from "@/lib/labels";

const STAGE_CONFIG = [
  { key: "watching", icon: Eye, color: "text-blue-500", bg: "bg-blue-500/10" },
  { key: "invited", icon: FileText, color: "text-amber-500", bg: "bg-amber-500/10" },
  { key: "afterTryout", icon: UserCheck, color: "text-violet-500", bg: "bg-violet-500/10" },
  { key: "signed", icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10" },
] as const;

export function RecruitmentStats() {
  const { data: stats } = api.recruitment.stats.useQuery(undefined, {
    staleTime: 60_000,
  });

  if (!stats || stats.total === 0) return null;

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Target className="h-4 w-4 text-primary" />
          Pipeline rekrutacyjny
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-3">
          {STAGE_CONFIG.map(({ key, icon: Icon, color, bg }) => (
            <Link key={key} href="/recruitment">
              <div className="flex items-center gap-2 rounded-lg border px-3 py-2 transition-colors hover:border-primary/40">
                <div className={`flex h-7 w-7 items-center justify-center rounded-md ${bg}`}>
                  <Icon className={`h-3.5 w-3.5 ${color}`} />
                </div>
                <span className="text-lg font-bold tabular-nums">
                  {(stats as Record<string, number>)[key] ?? 0}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 3:** Dodaj `<RecruitmentStats />` w `feed/page.tsx` po `<ClubRecruitment />`:
```tsx
{isClub && <RecruitmentStats />}
```

- [ ] **Step 4:** Verify `npx tsc --noEmit` passes.

- [ ] **Step 5:** Commit: `Add recruitment pipeline stats widget to club dashboard`

---

### Task A3: Szybkie akcje w pipeline + eksport CSV

**Files:** `src/app/(dashboard)/recruitment/page.tsx`, `src/server/trpc/routers/recruitment.ts`

- [ ] **Step 1:** Dodaj endpoint `recruitment.exportCsv` w routerze:

```ts
exportCsv: protectedProcedure.query(async ({ ctx }) => {
  const club = await ctx.db.club.findUnique({
    where: { userId: ctx.session.user.id },
  });
  if (!club) return { csv: "" };

  const entries = await ctx.db.recruitmentPipeline.findMany({
    where: { clubId: club.id },
    include: {
      transfer: {
        include: {
          user: { include: { player: { select: { firstName: true, lastName: true, primaryPosition: true, city: true } } } },
          region: { select: { name: true } },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  const header = "Imię,Nazwisko,Pozycja,Miasto,Region,Etap,Notatki,Data aktualizacji";
  const rows = entries.map((e) => {
    const p = e.transfer.user.player;
    return [
      p?.firstName ?? "",
      p?.lastName ?? "",
      p?.primaryPosition ?? "",
      p?.city ?? "",
      e.transfer.region?.name ?? "",
      e.stage,
      (e.notes ?? "").replace(/,/g, ";"),
      e.updatedAt.toISOString().split("T")[0],
    ].join(",");
  });

  return { csv: [header, ...rows].join("\n") };
}),
```

- [ ] **Step 2:** Na stronie `/recruitment` dodaj przycisk "Eksportuj CSV":

```tsx
const { refetch: exportCsv } = api.recruitment.exportCsv.useQuery(undefined, {
  enabled: false,
});

async function handleExport() {
  const { data } = await exportCsv();
  if (!data?.csv) return;
  const blob = new Blob([data.csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `pipeline-${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
```

Button w headerze: `<Button variant="outline" size="sm" onClick={handleExport}><Download className="h-4 w-4 mr-1" /> CSV</Button>`

- [ ] **Step 3:** Dodaj szybkie akcje inline w kartach pipeline — przyciski:
- "Zaproś na testy" → `updateStage({ id, stage: "INVITED_TO_TRYOUT" })`
- "Notatka po testach" → dialog z textarea → `updateStage({ id, stage: "AFTER_TRYOUT", notes })`
- "Wyślij ofertę" → `updateStage({ id, stage: "OFFER_SENT" })`
- Wyświetlane kontekstowo per aktualny stage (np. WATCHING → "Zaproś", INVITED → "Notatka po testach")

- [ ] **Step 4:** Verify `npx tsc --noEmit` passes.

- [ ] **Step 5:** Commit: `Add pipeline quick actions and CSV export`

---

### Task A4: Wyeksponowanie "Nabory dla Ciebie" na dashboardzie

**Files:** `src/app/(dashboard)/feed/page.tsx`, `src/components/dashboard/player-recruitments.tsx`

- [ ] **Step 1:** Przenieś `<PlayerRecruitments />` PRZED feedem (zamiast po nim), i daj mu więcej widoczności — limit 8 zamiast 5, większy heading.

- [ ] **Step 2:** W `player-recruitments.tsx` zmień query limit na 8 i dodaj link "Zobacz wszystkie nabory":

```tsx
<Link href="/events?type=RECRUITMENT" className="text-sm text-primary hover:underline">
  Zobacz wszystkie nabory →
</Link>
```

- [ ] **Step 3:** Verify `npx tsc --noEmit` passes.

- [ ] **Step 4:** Commit: `Promote player recruitments section above feed`

---

## Iteracja B — Treningi + Rozwój

### Task B1: COACH widzi i aplikuje na treningi (MVP)

**Files:** `src/server/trpc/routers/event.ts`

**Podejście MVP:** Model `Event` wymaga `clubId` — zmiana schematu to duży refaktor. Na MVP: COACH widzi treningi (event.list z filtrem typu) i może aplikować (jak PLAYER na nabory). Treningi tworzy CLUB. `/trainings` page to widok filtrujący eventy po INDIVIDUAL/GROUP_TRAINING.

- [ ] **Step 1:** W `event.ts` → `applyFor` mutation: zmień guard żeby COACH mógł aplikować na treningi:

Znajdź guard `role !== "PLAYER"` w `applyFor` i zmień na:
```ts
const isPlayer = ctx.session.user.role === "PLAYER";
const isCoach = ctx.session.user.role === "COACH";
if (!isPlayer && !isCoach) {
  throw new TRPCError({ code: "FORBIDDEN", message: "Tylko zawodnicy i trenerzy mogą się zgłaszać" });
}
```

**UWAGA:** `EventApplication` ma pole `playerId`. Dla COACH, musimy sprawdzić czy to pole jest nullable w schemacie. Jeśli nie — zostawiamy MVP bez aplikowania COACH (COACH tylko przegląda treningi na stronie `/trainings`). W przyszłej iteracji dodamy opcjonalne `coachId` do EventApplication.

- [ ] **Step 2:** Verify `npx tsc --noEmit` passes.

- [ ] **Step 3:** Commit: `Allow COACH to browse trainings via /trainings page`

---

### Task B2: Strona /trainings — katalog treningów + trenerów

**Files:** Create `src/app/(dashboard)/trainings/page.tsx`

- [ ] **Step 1:** Utwórz stronę z dwoma tabami:
- **"Treningi"** — lista eventów typu INDIVIDUAL_TRAINING / GROUP_TRAINING (reuse `event.list` z filtrem typu)
- **"Trenerzy"** — lista trenerów z `coach.list` (avatar, nazwa, specjalizacja, licencja, miasto, region)

```tsx
"use client";
import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/trpc-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CardSkeleton } from "@/components/card-skeleton";
import { EmptyState } from "@/components/empty-state";
import { COACH_SPECIALIZATION_LABELS, COACH_LEVEL_LABELS, EVENT_TYPE_LABELS } from "@/lib/labels";
import { formatShortDate } from "@/lib/format";
import { GraduationCap, Calendar, MapPin, Users } from "lucide-react";

export default function TrainingsPage() {
  const [tab, setTab] = useState<"trainings" | "coaches">("trainings");

  const trainings = api.event.list.useQuery(
    { type: "INDIVIDUAL_TRAINING", sortBy: "eventDate", sortOrder: "asc", limit: 20 },
    { enabled: tab === "trainings" }
  );
  // Also fetch GROUP_TRAINING and merge
  const groupTrainings = api.event.list.useQuery(
    { type: "GROUP_TRAINING", sortBy: "eventDate", sortOrder: "asc", limit: 20 },
    { enabled: tab === "trainings" }
  );

  const coaches = api.coach.list.useQuery(
    { limit: 20 },
    { enabled: tab === "coaches" }
  );

  // ... render with tabs, cards, etc.
}
```

- [ ] **Step 2:** Tab "Treningi" — karty z: typ (individual/group), nazwa, trener/klub, data, lokalizacja, cena, przycisk "Szczegóły".

- [ ] **Step 3:** Tab "Trenerzy" — karty z: avatar, imię nazwisko, specjalizacja badge, licencja badge, miasto, region, przycisk "Profil" → `/coaches/[id]` (nowa publiczna strona lub reuse players pattern).

- [ ] **Step 4:** Verify `npx tsc --noEmit` passes.

- [ ] **Step 5:** Commit: `Add /trainings page with training catalog and coach directory`

---

### Task B3: Zakładka "Rozwój" w dashboardzie zawodnika

**Files:** `src/app/(dashboard)/feed/page.tsx`

- [ ] **Step 1:** Utwórz komponent `PlayerDevelopment` wyświetlany na dashboardzie PLAYER pod "Nabory dla Ciebie":

```tsx
function PlayerDevelopment() {
  const trainings = api.event.list.useQuery({
    type: "INDIVIDUAL_TRAINING",
    sortBy: "eventDate",
    sortOrder: "asc",
    limit: 4,
  });

  if (!trainings.data?.items.length) return null;

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <GraduationCap className="h-4 w-4 text-primary" />
            Rozwój — treningi indywidualne
          </CardTitle>
          <Link href="/trainings" className="text-sm text-primary hover:underline">
            Wszystkie →
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {/* Training cards */}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2:** Dodaj w `FeedPage`: `{isPlayer && <PlayerDevelopment />}`

- [ ] **Step 3:** Verify `npx tsc --noEmit` passes.

- [ ] **Step 4:** Commit: `Add player development section with training recommendations`

---

## Iteracja C — Community + Onboarding

### Task C1: Hardening community — limity, min length, zgłoś

**Files:** `src/lib/validators/club-post.ts`, `src/server/trpc/routers/club-post.ts`, `src/app/(dashboard)/community/page.tsx`

- [ ] **Step 1:** Zmień validator — dodaj min content length:

```ts
// club-post.ts validator
export const createClubPostSchema = z.object({
  category: z.enum(CLUB_POST_CATEGORIES),
  title: z.string().min(5, "Tytuł musi mieć min. 5 znaków").max(300),
  content: z.string().min(10, "Treść musi mieć min. 10 znaków").max(2000),
  expiresAt: z.string().optional(),
});
```

Note: `content` zmieniony z `optional()` na `min(10)`.

- [ ] **Step 2:** W `club-post.ts` router → `create` mutation dodaj limit aktywnych postów:

```ts
// Before creating, check active post count
const activeCount = await ctx.db.clubPost.count({
  where: {
    clubId: club.id,
    OR: [
      { expiresAt: null },
      { expiresAt: { gt: new Date() } },
    ],
  },
});
if (activeCount >= 5) {
  throw new TRPCError({
    code: "BAD_REQUEST",
    message: "Maksymalnie 5 aktywnych postów na klub. Usuń lub poczekaj na wygaśnięcie starszych.",
  });
}
```

- [ ] **Step 3:** Dodaj prosty endpoint `clubPost.report`:

```ts
report: protectedProcedure
  .input(z.object({
    postId: z.string().uuid(),
    reason: z.string().min(5).max(500),
  }))
  .mutation(async ({ ctx, input }) => {
    // For MVP: log to console + create notification for admin
    console.warn(`[REPORT] Post ${input.postId} reported by ${ctx.session.user.id}: ${input.reason}`);
    return { success: true };
  }),
```

- [ ] **Step 4:** W `community/page.tsx` dodaj przycisk "Zgłoś" na kartach postów (mały flag icon):

```tsx
<Button variant="ghost" size="sm" onClick={() => handleReport(post.id)}>
  <Flag className="h-3 w-3" />
</Button>
```

Z dialogiem na powód zgłoszenia.

- [ ] **Step 5:** Verify `npx tsc --noEmit` passes.

- [ ] **Step 6:** Commit: `Community: add post limits, min length, and report button`

---

### Task C2: Onboarding PLAYER

**Files:** Create `src/components/onboarding/player-onboarding.tsx`, modify `src/app/(dashboard)/feed/page.tsx`

- [ ] **Step 1:** Utwórz `PlayerOnboarding` — 3-krokowy inline wizard:

**Krok 1:** "Uzupełnij profil" — CTA do `/profile` + progress bar (jak club)
**Krok 2:** "Znajdź nabór lub dodaj ogłoszenie" — dwa przyciski:
- "Przeglądaj nabory" → `/events?type=RECRUITMENT`
- "Szukam klubu" → `/transfers/new`
**Krok 3:** "Gotowe! 🎯" — przejście do feedu

```tsx
export function PlayerOnboarding({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const { data: player } = api.player.me.useQuery();

  // Step 0: Profile completeness check
  const profileComplete = player && player.regionId && player.primaryPosition;

  return (
    <Card className="mb-6 border-primary/20 bg-primary/5">
      <CardContent className="py-5">
        {/* Step indicator */}
        <div className="mb-4 flex items-center gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-primary" : "bg-muted"}`} />
          ))}
        </div>

        {step === 0 && (
          <div className="space-y-3">
            <p className="text-sm font-semibold">Uzupełnij profil zawodnika</p>
            <p className="text-xs text-muted-foreground">
              Dodaj pozycję i region, żebyśmy mogli dopasować nabory do Ciebie.
            </p>
            {profileComplete ? (
              <Button size="sm" onClick={() => setStep(1)}>Dalej →</Button>
            ) : (
              <Button size="sm" asChild><Link href="/profile">Uzupełnij profil</Link></Button>
            )}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-3">
            <p className="text-sm font-semibold">Co chcesz zrobić?</p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" asChild>
                <Link href="/events">Przeglądaj nabory</Link>
              </Button>
              <Button size="sm" variant="outline" asChild>
                <Link href="/transfers/new">Szukam klubu</Link>
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setStep(2)}>Pomiń</Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3 text-center">
            <p className="text-sm font-semibold">Wszystko gotowe! 🎯</p>
            <Button size="sm" onClick={onComplete}>Przejdź do feedu</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2:** W `feed/page.tsx` dodaj state + render:

```tsx
const [playerOnboardingDone, setPlayerOnboardingDone] = useState(false);
const showPlayerOnboarding = isPlayer && !playerOnboardingDone && /* check: no transfers + no applications */;

// In JSX:
{showPlayerOnboarding && <PlayerOnboarding onComplete={() => setPlayerOnboardingDone(true)} />}
```

- [ ] **Step 3:** Verify `npx tsc --noEmit` passes.

- [ ] **Step 4:** Commit: `Add player onboarding wizard on dashboard`

---

### Task C3: Onboarding COACH

**Files:** Create `src/components/onboarding/coach-onboarding.tsx`, modify `src/app/(dashboard)/feed/page.tsx`

- [ ] **Step 1:** Utwórz `CoachOnboarding` — 3-krokowy:

**Krok 1:** "Uzupełnij profil" — specjalizacja + licencja + region
**Krok 2:** "Zacznij działać" — przyciski:
- "Przeglądaj nabory" → `/events`
- "Napisz na tablicę" → `/community`
**Krok 3:** "Gotowe!"

Pattern identyczny jak PlayerOnboarding, ale sprawdza `coach.me` (specialization + regionId).

- [ ] **Step 2:** W `feed/page.tsx`:

```tsx
const showCoachOnboarding = isCoach && !coachOnboardingDone;
{showCoachOnboarding && <CoachOnboarding onComplete={() => setCoachOnboardingDone(true)} />}
```

- [ ] **Step 3:** Verify `npx tsc --noEmit` passes.

- [ ] **Step 4:** Commit: `Add coach onboarding wizard on dashboard`

---

### Task C4: Gamifikacja — nowe eventy + przypomnienia

**Files:** `src/lib/gamification.ts`, `src/lib/labels.ts`

- [ ] **Step 1:** Dodaj nowe eventy gamifikacyjne:

```ts
// gamification.ts — POINTS_MAP
first_training_published: 15,
first_club_post: 10,
first_nabor_application: 10,
profile_region_set: 5,

// POINTS_LABELS
first_training_published: "Publikacja pierwszego treningu",
first_club_post: "Pierwszy post na tablicy",
first_nabor_application: "Pierwsza aplikacja na nabór",
profile_region_set: "Ustawienie regionu w profilu",
```

- [ ] **Step 2:** W odpowiednich routerach (event.create dla treningów, clubPost.create, event.applyFor) dodaj `awardPoints` fire-and-forget z nowymi action keys. Warunek: `count === 0` (tylko za pierwszy raz).

- [ ] **Step 3:** Verify `npx tsc --noEmit` passes.

- [ ] **Step 4:** Commit: `Add gamification events for first training, post, and application`

---

## Verification Checklist

Po zakończeniu każdej iteracji:

```bash
npx tsc --noEmit          # zero errors
npm run build             # successful build
```

**Testy ręczne:**
1. CLUB: sidebar → Rekrutacja widoczna w "Główne" → dashboard z pipeline stats → /recruitment z CSV export
2. PLAYER: dashboard → onboarding → "Nabory dla Ciebie" wyeksponowane → /trainings z katalogiem
3. COACH: dashboard → onboarding → /trainings → katalog trenerów
4. Community: limit 5 postów → min 10 znaków content → przycisk "Zgłoś"
5. Mobile 375px: sidebar, onboarding, recruitment page
6. Dark mode: pipeline stats, training cards, onboarding banners
