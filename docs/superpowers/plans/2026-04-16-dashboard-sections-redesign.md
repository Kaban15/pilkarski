# Dashboard Sections Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reorganize the club dashboard from a long scroll into 3 navigable sections (Activity, Schedule, Recruitment) with sidebar navigation, and expand the right sidebar from 260px to 320px.

**Architecture:** Query param routing (`?section=X`) in `feed-client.tsx` controls which section renders below the hero zone. A new `SectionNav` component in the right sidebar and `SectionNavMobile` pill bar on mobile provide navigation. Each section is a standalone component with its own data fetching. PLAYER/COACH dashboards remain unchanged.

**Tech Stack:** Next.js App Router, tRPC, TanStack Query, Tailwind CSS, shadcn/ui, Lucide icons

**Spec:** `docs/superpowers/specs/2026-04-16-dashboard-sections-redesign.md`

---

## File Structure

### New files

| File | Responsibility |
|------|---------------|
| `src/components/feed/feed-card-router.tsx` | Extracted FeedCard switch-case + FeedItem type from feed-client.tsx |
| `src/components/dashboard/section-nav.tsx` | Sidebar section navigation (3 items, active state) |
| `src/components/dashboard/section-nav-mobile.tsx` | Mobile horizontal pill bar for section switching |
| `src/components/dashboard/sections/activity-section.tsx` | Feed-only section (existing feed cards, no club sections) |
| `src/components/dashboard/sections/schedule-section.tsx` | Combined sparings + events with type filters |
| `src/components/dashboard/sections/recruitment-section.tsx` | Pipeline + active recruitments + suggested players with sub-tabs |
| `src/components/events/event-card.tsx` | Extracted event card from club-sections.tsx inline rendering |

### Modified files

| File | Change |
|------|--------|
| `src/components/layout/right-panel.tsx` | Width 260→320px |
| `src/app/(dashboard)/feed/page.tsx` | Add `<Suspense>` boundary for `useSearchParams` |
| `src/app/(dashboard)/feed/feed-client.tsx` | Add query param routing for club sections, remove inline club sections, remove `ClubDashboard`/`ClubHeaderCard`/`ClubStatsRow`/`ClubQuickActions` from render, add `SectionNavMobile` |

---

## Task 1: Widen right sidebar

**Files:**
- Modify: `src/components/layout/right-panel.tsx:3`

- [ ] **Step 1: Update width class**

In `right-panel.tsx`, change `w-[260px]` to `w-[320px]`:

```tsx
// Before:
<aside className="hidden w-[260px] shrink-0 border-l border-border pl-6 lg:block">

// After:
<aside className="hidden w-[320px] shrink-0 border-l border-border pl-6 lg:block">
```

- [ ] **Step 2: Verify build**

Run: `npx next build --no-lint 2>&1 | tail -5` (or dev server)
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/right-panel.tsx
git commit -m "refactor: widen right sidebar from 260px to 320px"
```

---

## Task 2: Create SectionNav component

**Files:**
- Create: `src/components/dashboard/section-nav.tsx`

- [ ] **Step 1: Create the component**

```tsx
"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Activity, CalendarDays, Users } from "lucide-react";
import { useI18n } from "@/lib/i18n";

const SECTIONS = [
  { key: "activity", icon: Activity, label: "Aktywność" },
  { key: "schedule", icon: CalendarDays, label: "Terminarz" },
  { key: "recruitment", icon: Users, label: "Rekrutacja" },
] as const;

export type SectionKey = (typeof SECTIONS)[number]["key"];

export function SectionNav() {
  const { t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = (searchParams.get("section") as SectionKey) ?? "activity";

  function navigate(key: SectionKey) {
    const params = new URLSearchParams(searchParams.toString());
    if (key === "activity") {
      params.delete("section");
    } else {
      params.set("section", key);
    }
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  return (
    <div className="mt-6 border-t border-border pt-4">
      <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {t("Sekcje")}
      </p>
      <nav className="space-y-1">
        {SECTIONS.map(({ key, icon: Icon, label }) => {
          const active = current === key;
          return (
            <button
              key={key}
              onClick={() => navigate(key)}
              className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "border-l-2 border-sport-orange bg-sport-orange/10 text-sport-orange"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {t(label)}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `npx next build --no-lint 2>&1 | tail -5`
Expected: No errors (component not yet used, tree-shaken)

- [ ] **Step 3: Commit**

```bash
git add src/components/dashboard/section-nav.tsx
git commit -m "feat: add SectionNav component for dashboard sidebar navigation"
```

---

## Task 3: Create SectionNavMobile component

**Files:**
- Create: `src/components/dashboard/section-nav-mobile.tsx`

- [ ] **Step 1: Create the component**

```tsx
"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Activity, CalendarDays, Users } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import type { SectionKey } from "./section-nav";

const SECTIONS = [
  { key: "activity" as SectionKey, icon: Activity, label: "Aktywność" },
  { key: "schedule" as SectionKey, icon: CalendarDays, label: "Terminarz" },
  { key: "recruitment" as SectionKey, icon: Users, label: "Rekrutacja" },
];

export function SectionNavMobile() {
  const { t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = (searchParams.get("section") as SectionKey) ?? "activity";

  function navigate(key: SectionKey) {
    const params = new URLSearchParams(searchParams.toString());
    if (key === "activity") {
      params.delete("section");
    } else {
      params.set("section", key);
    }
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  return (
    <div className="mb-4 flex gap-2 overflow-x-auto lg:hidden">
      {SECTIONS.map(({ key, icon: Icon, label }) => {
        const active = current === key;
        return (
          <button
            key={key}
            onClick={() => navigate(key)}
            className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
              active
                ? "bg-sport-orange/15 text-sport-orange"
                : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {t(label)}
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/dashboard/section-nav-mobile.tsx
git commit -m "feat: add SectionNavMobile pill bar for mobile section navigation"
```

---

## Task 4: Extract EventCard component

**Files:**
- Create: `src/components/events/event-card.tsx`
- Reference: `src/components/dashboard/club-sections.tsx:186-209` (inline event card rendering)

- [ ] **Step 1: Create EventCard**

Extract the inline event rendering from `club-sections.tsx` lines 186-209 into a reusable component:

```tsx
"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarClock, Users } from "lucide-react";
import { formatDate } from "@/lib/format";

export type EventCardItem = {
  id: string;
  title: string;
  eventDate: string | Date;
  maxParticipants: number | null;
  _count: { applications: number };
};

export function EventCard({ event }: { event: EventCardItem }) {
  return (
    <Link href={`/events/${event.id}`} className="group block">
      <Card className="h-full rounded-xl transition-colors hover:border-primary/40">
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold group-hover:text-primary transition-colors line-clamp-1">
            {event.title}
          </h3>
          <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <CalendarClock className="h-3 w-3" />
              {formatDate(event.eventDate)}
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {event._count.applications}
              {event.maxParticipants && ` / ${event.maxParticipants}`}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
```

- [ ] **Step 2: Update club-sections.tsx to use EventCard**

In `club-sections.tsx`, replace the inline event rendering (lines 187-208) with:

```tsx
import { EventCard } from "@/components/events/event-card";

// Replace the inline card JSX in the map with:
{upcomingEvents.map((e) => (
  <EventCard key={e.id} event={e} />
))}
```

- [ ] **Step 3: Verify build**

Run: `npx next build --no-lint 2>&1 | tail -5`
Expected: No errors, existing event rendering unchanged visually

- [ ] **Step 4: Commit**

```bash
git add src/components/events/event-card.tsx src/components/dashboard/club-sections.tsx
git commit -m "refactor: extract EventCard from inline club-sections rendering"
```

---

## Task 5: Extract FeedCard and FeedItem from feed-client.tsx

`FeedCard` (switch-case router) and `FeedItem` type are defined locally inside `feed-client.tsx` (lines 53-75). They must be extracted to a shared module so `ActivitySection` can import them.

**Files:**
- Create: `src/components/feed/feed-card-router.tsx`
- Modify: `src/app/(dashboard)/feed/feed-client.tsx:53-75`

- [ ] **Step 1: Create feed-card-router.tsx**

```tsx
"use client";

import { SparingFeedCard } from "@/components/feed/sparing-feed-card";
import { EventFeedCard } from "@/components/feed/event-feed-card";
import { TransferFeedCard } from "@/components/feed/transfer-feed-card";
import { TournamentFeedCard } from "@/components/feed/tournament-feed-card";
import { ClubPostFeedCard } from "@/components/feed/club-post-feed-card";
import { NewMemberFeedCard } from "@/components/feed/new-member-feed-card";

export type FeedItem = {
  type: "sparing" | "event" | "transfer" | "club" | "player" | "tournament" | "clubPost";
  data: any;
  createdAt: string | Date;
};

export function FeedCard({ item }: { item: FeedItem }) {
  switch (item.type) {
    case "sparing":
      return <SparingFeedCard data={item.data} createdAt={item.createdAt} />;
    case "event":
      return <EventFeedCard data={item.data} createdAt={item.createdAt} />;
    case "transfer":
      return <TransferFeedCard data={item.data} createdAt={item.createdAt} />;
    case "tournament":
      return <TournamentFeedCard data={item.data} createdAt={item.createdAt} />;
    case "clubPost":
      return <ClubPostFeedCard data={item.data} createdAt={item.createdAt} />;
    case "club":
    case "player":
      return <NewMemberFeedCard type={item.type} data={item.data} createdAt={item.createdAt} />;
  }
}
```

Note: Verify the exact import paths for the feed card components by checking the existing imports at the top of `feed-client.tsx`. Adjust paths as needed.

- [ ] **Step 2: Update feed-client.tsx to import from the new module**

Replace the local `FeedItem` type and `FeedCard` function (lines 53-75) with:

```tsx
import { FeedCard, type FeedItem } from "@/components/feed/feed-card-router";
```

Remove the local definitions.

- [ ] **Step 3: Verify build**

Run: `npx next build --no-lint 2>&1 | tail -5`
Expected: No errors, feed renders identically

- [ ] **Step 4: Commit**

```bash
git add src/components/feed/feed-card-router.tsx src/app/(dashboard)/feed/feed-client.tsx
git commit -m "refactor: extract FeedCard and FeedItem to shared module"
```

---

## Task 6: Create ActivitySection component

**Files:**
- Create: `src/components/dashboard/sections/activity-section.tsx`
- Reference: `src/app/(dashboard)/feed/feed-client.tsx:622-652` (feed rendering block)

- [ ] **Step 1: Create ActivitySection**

Move the feed rendering logic from feed-client.tsx into a standalone section component. This section shows ONLY the social feed — no pipeline, no recruitment, no sparings grid.

```tsx
"use client";

import { api } from "@/lib/trpc-react";
import { useI18n } from "@/lib/i18n";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Swords } from "lucide-react";
import { FeedCard, type FeedItem } from "@/components/feed/feed-card-router";
import { FeedCardSkeleton } from "@/components/card-skeleton";
import { EmptyState } from "@/components/empty-state";

export function ActivitySection() {
  const { t } = useI18n();
  const feed = api.feed.get.useQuery({ limit: 30 }, { staleTime: 300_000 });

  if (feed.isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <FeedCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (feed.error) {
    return (
      <Card className="border-destructive/20">
        <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
          <p className="text-sm text-destructive">{t("Nie udało się załadować feedu")}</p>
          <Button variant="outline" size="sm" onClick={() => feed.refetch()}>
            {t("Spróbuj ponownie")}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if ((feed.data?.items?.length ?? 0) === 0) {
    return (
      <EmptyState
        icon={Swords}
        title={t("Brak aktywności")}
        description={t("Uzupełnij profil i wybierz region, aby zobaczyć dopasowane sparingi, wydarzenia i nowych członków.")}
        actionLabel={t("Uzupełnij profil")}
        actionHref="/profile"
      />
    );
  }

  return (
    <div className="space-y-3">
      {(feed.data!.items as FeedItem[]).map((item) => (
        <FeedCard key={`${item.type}-${item.data.id}`} item={item} />
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/dashboard/sections/activity-section.tsx
git commit -m "feat: add ActivitySection component (feed-only view)"
```

---

## Task 7: Create ScheduleSection component

**Files:**
- Create: `src/components/dashboard/sections/schedule-section.tsx`
- Reference: `src/components/dashboard/club-sections.tsx` (sparings + events grids)
- Reference: `src/components/events/event-card.tsx` (from Task 4)

- [ ] **Step 1: Create ScheduleSection**

Combined sparings + events with type filter tabs:

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/trpc-react";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { CalendarDays, Plus, Swords, Trophy, Users } from "lucide-react";
import { EventCard } from "@/components/events/event-card";
import { EmptyState } from "@/components/empty-state";

type Filter = "all" | "sparings" | "events" | "tournaments";

export function ScheduleSection() {
  const { t } = useI18n();
  const [filter, setFilter] = useState<Filter>("all");

  const { data, isLoading } = api.stats.clubDashboard.useQuery(undefined, {
    staleTime: 120_000,
  });

  if (isLoading || !data) return null;

  const { activeSparings, upcomingEvents } = data;

  // Build combined chronological list
  const sparingItems = activeSparings.map((s) => ({
    type: "sparing" as const,
    id: s.id,
    title: s.title,
    date: new Date(s.matchDate),
    data: s,
  }));

  const eventItems = upcomingEvents.map((e) => ({
    type: "event" as const,
    id: e.id,
    title: e.title,
    date: new Date(e.eventDate),
    data: e,
  }));

  let items = [...sparingItems, ...eventItems].sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  );

  if (filter === "sparings") items = items.filter((i) => i.type === "sparing");
  if (filter === "events") items = items.filter((i) => i.type === "event");

  const FILTERS: { key: Filter; label: string }[] = [
    { key: "all", label: "Wszystko" },
    { key: "sparings", label: "Sparingi" },
    { key: "events", label: "Wydarzenia" },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <CalendarDays className="h-5 w-5 text-primary" />
          {t("Terminarz")}
        </h2>
        <div className="flex items-center gap-2">
          <Link href="/sparings/new">
            <Button size="sm" variant="outline" className="gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              {t("Dodaj")}
            </Button>
          </Link>
          <Link href="/sparings" className="text-xs font-medium text-primary hover:underline">
            {t("Zobacz wszystko →")}
          </Link>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="mb-4 flex gap-1.5">
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              filter === key
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted/50"
            }`}
          >
            {t(label)}
          </button>
        ))}
      </div>

      {/* Items list */}
      {items.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title={t("Brak zaplanowanych wydarzeń")}
          description={t("Dodaj sparing lub wydarzenie, aby zobaczyć je tutaj.")}
          actionLabel={t("Nowy sparing")}
          actionHref="/sparings/new"
        />
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            if (item.type === "sparing") {
              // Render sparing as a simple card (reuse the inline style from club-sections)
              return (
                <Link key={item.id} href={`/sparings/${item.id}`} className="group block">
                  <div className="rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40">
                    <div className="flex items-center gap-2">
                      <Swords className="h-4 w-4 text-sport-orange" />
                      <h3 className="text-sm font-semibold group-hover:text-primary transition-colors line-clamp-1">
                        {item.data.title}
                      </h3>
                    </div>
                    <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" />{item.data.matchDate ? new Date(item.data.matchDate).toLocaleDateString("pl-PL") : ""}</span>
                      <span className="flex items-center gap-1"><Users className="h-3 w-3" />{item.data._count?.applications ?? 0}</span>
                    </div>
                  </div>
                </Link>
              );
            }
            return <EventCard key={item.id} event={item.data} />;
          })}
        </div>
      )}
    </div>
  );
}
```

Note: The `activeSparings` and `upcomingEvents` types come from `api.stats.clubDashboard`. Verify the exact shape matches what's returned. The sparing rendering here is simplified — check if the data shape from `clubDashboard` includes `_count.applications` and `matchDate` fields. Adjust field names to match the actual API response.

- [ ] **Step 2: Verify build**

Run: `npx next build --no-lint 2>&1 | tail -5`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/components/dashboard/sections/schedule-section.tsx
git commit -m "feat: add ScheduleSection with combined sparings + events and filters"
```

---

## Task 8: Create RecruitmentSection component

**Files:**
- Create: `src/components/dashboard/sections/recruitment-section.tsx`
- Modify: `src/components/dashboard/club-recruitment.tsx:14`
- Reference: `src/components/recruitment/recruitment-stats.tsx` (pipeline stats)

- [ ] **Step 1: Update ClubRecruitment to accept `showSection` prop**

In `src/components/dashboard/club-recruitment.tsx`, change the component signature (line 14) from:

```tsx
export function ClubRecruitment() {
```

to:

```tsx
export function ClubRecruitment({ showSection }: { showSection?: "recruitments" | "suggested" }) {
```

Then wrap the two subsections conditionally. The "Active recruitments" block (~lines 41-86):

```tsx
{(!showSection || showSection === "recruitments") && (
  // existing active recruitments JSX
)}
```

The "Suggested players" block (~lines 88-151):

```tsx
{(!showSection || showSection === "suggested") && (
  // existing suggested players JSX
)}
```

When `showSection` is undefined (not passed), both blocks render — backward compatible.

- [ ] **Step 2: Create RecruitmentSection**

```tsx
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
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Users className="h-5 w-5 text-primary" />
          {t("Rekrutacja")}
        </h2>
        <Link href="/recruitment" className="text-xs font-medium text-primary hover:underline">
          {t("Zobacz wszystko →")}
        </Link>
      </div>

      {/* Sub-tabs */}
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

      {/* Content */}
      {subTab === "pipeline" && <RecruitmentStats />}
      {subTab === "recruitments" && <ClubRecruitment showSection="recruitments" />}
      {subTab === "suggested" && <ClubRecruitment showSection="suggested" />}
    </div>
  );
}
```

- [ ] **Step 3: Verify build**

Run: `npx next build --no-lint 2>&1 | tail -5`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/components/dashboard/sections/recruitment-section.tsx src/components/dashboard/club-recruitment.tsx
git commit -m "feat: add RecruitmentSection with sub-tabs (pipeline, recruitments, suggested)"
```

---

## Task 9: Wire up section routing in feed-client.tsx

This is the main integration task. It modifies `feed-client.tsx` to use query param routing for club sections, and updates `page.tsx` with a Suspense boundary. Depends on Tasks 2-3 (nav components), 5-8 (section components).

**Files:**
- Modify: `src/app/(dashboard)/feed/feed-client.tsx`
- Modify: `src/app/(dashboard)/feed/page.tsx`

- [ ] **Step 1: Add Suspense boundary in page.tsx**

```tsx
import { Suspense } from "react";
import { auth } from "@/server/auth/config";
import { HydrateClient, trpc, getQueryClient } from "@/lib/trpc-server";
import FeedClient from "./feed-client";

export default async function FeedPage() {
  const session = await auth();
  const role = session?.user?.role;

  void trpc.feed.get.prefetch({ limit: 30 });
  void trpc.stats.dashboard.prefetch();

  if (role === "CLUB") {
    void trpc.club.me.prefetch();
    void trpc.stats.clubDashboard.prefetch();
  }

  return (
    <HydrateClient>
      <Suspense>
        <FeedClient />
      </Suspense>
    </HydrateClient>
  );
}
```

- [ ] **Step 2: Add section routing to feed-client.tsx**

Add imports at the top of `feed-client.tsx`:

```tsx
import { useSearchParams } from "next/navigation";
import { SectionNavMobile } from "@/components/dashboard/section-nav-mobile";
import { ActivitySection } from "@/components/dashboard/sections/activity-section";
import { ScheduleSection } from "@/components/dashboard/sections/schedule-section";
import { RecruitmentSection } from "@/components/dashboard/sections/recruitment-section";
```

In the `FeedClient` component body, add after the existing state declarations (~line 523):

```tsx
const searchParams = useSearchParams();
const section = searchParams.get("section") ?? "activity";
```

- [ ] **Step 3: Replace club section rendering**

Replace the club-specific rendering block (lines 603-615):

```tsx
{/* OLD — remove this block: */}
{isClub && !showOnboarding && (
  <ClubDashboard ... />
)}
{isClub && <RecruitmentStats />}
{isClub && <ClubRecruitment />}
{isClub && <ClubDashboardSections />}
```

With the new section routing:

```tsx
{/* CLUB — section navigation + routed content */}
{isClub && !showOnboarding && (
  <>
    <SectionNavMobile />
    {section === "schedule" && <ScheduleSection />}
    {section === "recruitment" && <RecruitmentSection />}
    {section !== "schedule" && section !== "recruitment" && <ActivitySection />}
  </>
)}
```

- [ ] **Step 4: Handle feed for non-club**

The existing feed block (lines 622-652) should now only render for PLAYER/COACH. The club feed is handled by `ActivitySection`. Wrap the existing feed block:

```tsx
{/* PLAYER/COACH feed — unchanged */}
{!isClub && (
  <>
    {feed.isLoading ? ( ... ) : feed.error ? ( ... ) : ... }
  </>
)}
```

- [ ] **Step 5: Add SectionNav to RightPanel**

In the same file, update the `RightPanel` block:

```tsx
<RightPanel>
  <MiniCalendar />
  <UpcomingWidget />
  <RankingWidget />
  {isClub && <SectionNav />}
</RightPanel>
```

Add the import:

```tsx
import { SectionNav } from "@/components/dashboard/section-nav";
```

- [ ] **Step 6: Clean up unused imports and components**

Remove from `feed-client.tsx`:
- `ClubDashboard`, `ClubHeaderCard`, `ClubStatsRow`, `ClubQuickActions` component definitions (lines ~197-495) — these were inline components
- `RecruitmentStats` import (now used inside `RecruitmentSection`)
- `ClubRecruitment` import (now used inside `RecruitmentSection`)
- `ClubDashboardSections` import (content moved to `ScheduleSection`)
- `QuickActions` from RightPanel children (replaced by `SectionNav`)

Keep: `DashboardStatsWidget`, `HeroCard`, `ClubPendingAlerts` (if still rendered), `ClubOnboarding`, onboarding logic, pull-to-refresh.

Note: Be careful — `ClubHeaderCard`, `ClubStatsRow`, `ClubQuickActions`, and `ClubDashboard` are defined **inside** `feed-client.tsx` (not imported). Remove these function definitions. `ClubPendingAlerts` is also defined inside — check if it's still needed in the hero zone. If it was part of `ClubDashboard`, it should be removed too since `ClubDashboard` is no longer rendered.

- [ ] **Step 7: Verify build and test**

Run: `npx next build --no-lint 2>&1 | tail -10`
Expected: No errors

Manual verification:
1. Open `/feed` — should show Activity section (feed) by default
2. Click "Terminarz" in right sidebar — URL changes to `?section=schedule`, shows sparings + events
3. Click "Rekrutacja" — URL changes to `?section=recruitment`, shows pipeline + recruitments
4. Click "Aktywność" — returns to feed
5. Direct URL `/feed?section=schedule` — loads schedule section
6. Browser back/forward — navigates between sections
7. Mobile view — pill bar visible, sidebar hidden
8. Login as PLAYER — dashboard unchanged, no section nav

- [ ] **Step 8: Commit**

```bash
git add src/app/(dashboard)/feed/page.tsx src/app/(dashboard)/feed/feed-client.tsx
git commit -m "feat: add section routing to club dashboard with query params"
```

---

## Task 10: Remove QuickActions from RightPanel

**Files:**
- Modify: `src/app/(dashboard)/feed/feed-client.tsx`

- [ ] **Step 1: Remove QuickActions**

In feed-client.tsx, the `RightPanel` children should no longer include `<QuickActions />`. If not already done in Task 9 Step 5, remove it:

```tsx
<RightPanel>
  <MiniCalendar />
  <UpcomingWidget />
  <RankingWidget />
  {isClub && <SectionNav />}
</RightPanel>
```

Also remove the `QuickActions` import if it becomes unused.

- [ ] **Step 2: Verify and commit**

```bash
git add src/app/(dashboard)/feed/feed-client.tsx
git commit -m "refactor: remove QuickActions from right panel, replaced by SectionNav"
```

---

## Task 11: Final verification and cleanup

- [ ] **Step 1: Full build check**

Run: `npx next build --no-lint 2>&1 | tail -20`
Expected: Build succeeds with no errors

- [ ] **Step 2: Check for unused imports/components**

Verify that removed components (`ClubDashboard`, `ClubHeaderCard`, `ClubStatsRow`, `ClubQuickActions`) don't leave dangling imports or dead code in `feed-client.tsx`.

- [ ] **Step 3: Verify PLAYER/COACH dashboards unchanged**

Login as PLAYER and COACH roles — verify their dashboards render exactly as before. No section nav, no query param routing.

- [ ] **Step 4: Commit cleanup if needed**

```bash
git add -u
git commit -m "chore: clean up unused imports after dashboard sections refactor"
```
