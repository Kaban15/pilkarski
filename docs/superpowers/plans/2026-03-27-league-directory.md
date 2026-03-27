# League Directory Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Public hierarchical team directory browsing Region → League Level → Group → Clubs.

**Architecture:** 3 new tRPC public procedures in regionRouter + club.list extension. 4 new Next.js pages under `src/app/(public)/leagues/`. Direct Prisma queries in server components (same pattern as existing `/clubs/[id]`). Middleware updated for `/leagues/` public prefix.

**Tech Stack:** Next.js 16 (App Router, server components), tRPC v11, Prisma 7, Tailwind 4, shadcn/ui, lucide-react

---

### File Map

**Create:**
- `src/app/(public)/leagues/page.tsx` — regions list (16 województw)
- `src/app/(public)/leagues/[regionSlug]/page.tsx` — league levels in region
- `src/app/(public)/leagues/[regionSlug]/[levelId]/page.tsx` — groups in level
- `src/app/(public)/leagues/[regionSlug]/[levelId]/[groupId]/page.tsx` — clubs in group

**Modify:**
- `src/server/trpc/routers/region.ts` — add `listWithStats`, `levelsWithStats`, `groupsWithStats`
- `src/server/trpc/routers/club.ts` — add `leagueGroupId` filter to `list`, extend include
- `src/server/trpc/routers/search.ts` — include leagueGroup in club results
- `src/middleware.ts` — add `/leagues/` to publicPrefixes
- `src/components/layout/sidebar.tsx` — add "Ligi" link
- `src/app/(public)/clubs/[id]/page.tsx` — make league badges clickable

---

### Task 1: Middleware + Sidebar

**Files:**
- Modify: `src/middleware.ts:6`
- Modify: `src/components/layout/sidebar.tsx:45-75`

- [ ] **Step 1: Add `/leagues/` to public prefixes**

In `src/middleware.ts`, add to the `publicPrefixes` array:

```typescript
const publicPrefixes = ["/clubs/", "/players/", "/coaches/", "/leagues/"];
```

- [ ] **Step 2: Add "Ligi" link to sidebar**

In `src/components/layout/sidebar.tsx`:

Add `Trophy as TrophyIcon` import (Trophy already imported — alias it or use `Shield` instead). Actually `Trophy` is already imported and used for "Wydarzenia". Use `Medal` from lucide-react.

Add to imports:
```typescript
import { ..., Medal } from "lucide-react";
```

Add to "Więcej" section in `NAV_SECTIONS`, after "Transfery":
```typescript
{ href: "/leagues", icon: Medal, label: "Ligi" },
```

- [ ] **Step 3: Verify — run TypeScript check**

Run: `npx tsc --noEmit`
Expected: No new errors

- [ ] **Step 4: Commit**

```bash
git add src/middleware.ts src/components/layout/sidebar.tsx
git commit -m "feat: add /leagues/ public prefix and sidebar link"
```

---

### Task 2: Backend — region procedures with stats

**Files:**
- Modify: `src/server/trpc/routers/region.ts`

- [ ] **Step 1: Add `listWithStats` procedure**

Append to the regionRouter object in `src/server/trpc/routers/region.ts`:

```typescript
// Regions with club counts (for directory)
listWithStats: publicProcedure.query(async ({ ctx }) => {
  return ctx.db.region.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { clubs: true } } },
  });
}),
```

- [ ] **Step 2: Add `levelsWithStats` procedure**

```typescript
// League levels with club counts (for directory)
levelsWithStats: publicProcedure
  .input(z.object({ regionId: z.number().int() }))
  .query(async ({ ctx, input }) => {
    const levels = await ctx.db.leagueLevel.findMany({
      where: { regionId: input.regionId },
      orderBy: { tier: "asc" },
      include: {
        groups: {
          include: { _count: { select: { clubs: true } } },
        },
      },
    });

    return levels.map((level) => ({
      id: level.id,
      name: level.name,
      tier: level.tier,
      regionId: level.regionId,
      groupCount: level.groups.length,
      clubCount: level.groups.reduce((sum, g) => sum + g._count.clubs, 0),
    }));
  }),
```

- [ ] **Step 3: Add `groupsWithStats` procedure**

```typescript
// Groups with club counts (for directory)
groupsWithStats: publicProcedure
  .input(z.object({ leagueLevelId: z.number().int() }))
  .query(async ({ ctx, input }) => {
    return ctx.db.leagueGroup.findMany({
      where: { leagueLevelId: input.leagueLevelId },
      orderBy: { name: "asc" },
      include: { _count: { select: { clubs: true } } },
    });
  }),
```

- [ ] **Step 4: Verify — TypeScript check**

Run: `npx tsc --noEmit`
Expected: No new errors

- [ ] **Step 5: Commit**

```bash
git add src/server/trpc/routers/region.ts
git commit -m "feat: add region directory procedures with club counts"
```

---

### Task 3: Backend — club.list extension + search enhancement

**Files:**
- Modify: `src/server/trpc/routers/club.ts:45-76`
- Modify: `src/server/trpc/routers/search.ts:14-24`

- [ ] **Step 1: Add `leagueGroupId` filter to `club.list`**

In `src/server/trpc/routers/club.ts`, update the `list` procedure:

Input — add field:
```typescript
leagueGroupId: z.number().int().optional(),
```

Where clause — add filter:
```typescript
if (input.leagueGroupId) where.leagueGroupId = input.leagueGroupId;
```

Include — extend with leagueGroup:
```typescript
include: { region: true, leagueGroup: { include: { leagueLevel: true } } },
```

- [ ] **Step 2: Enhance search.global clubs include**

In `src/server/trpc/routers/search.ts`, update the clubs query include from:
```typescript
include: { region: { select: { name: true } } },
```
to:
```typescript
include: {
  region: { select: { name: true, slug: true } },
  leagueGroup: {
    include: { leagueLevel: { select: { id: true, name: true } } },
  },
},
```

- [ ] **Step 3: Verify — TypeScript check**

Run: `npx tsc --noEmit`
Expected: No new errors

- [ ] **Step 4: Commit**

```bash
git add src/server/trpc/routers/club.ts src/server/trpc/routers/search.ts
git commit -m "feat: extend club.list with leagueGroupId filter, enrich search results"
```

---

### Task 4: Frontend — `/leagues` regions page

**Files:**
- Create: `src/app/(public)/leagues/page.tsx`

- [ ] **Step 1: Create regions list page**

```tsx
import Link from "next/link";
import { Metadata } from "next";
import { db } from "@/server/db/client";
import { ArrowLeft, Globe, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Struktura ligowa",
  description: "Przeglądaj drużyny według struktury ligowej — województwa, szczeble, grupy.",
};

export default async function LeaguesPage() {
  const regions = await db.region.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { clubs: true } } },
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          PilkaSport
        </Link>

        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight">Struktura ligowa</h1>
          <p className="mt-1 text-muted-foreground">
            Wybierz województwo, aby przeglądać szczeble i grupy ligowe.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {regions.map((region) => (
            <Link
              key={region.id}
              href={`/leagues/${region.slug}`}
              className="group flex items-center justify-between rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/30 hover:shadow-sm"
            >
              <div className="flex items-center gap-3">
                <Globe className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                <span className="font-medium">{region.name}</span>
              </div>
              <Badge variant="secondary" className="gap-1">
                <Users className="h-3 w-3" />
                {region._count.clubs}
              </Badge>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify — dev server renders page**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/app/(public)/leagues/page.tsx
git commit -m "feat: add /leagues page — regions list with club counts"
```

---

### Task 5: Frontend — `/leagues/[regionSlug]` levels page

**Files:**
- Create: `src/app/(public)/leagues/[regionSlug]/page.tsx`

- [ ] **Step 1: Create league levels page**

```tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { db } from "@/server/db/client";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Badge } from "@/components/ui/badge";
import { Trophy, Users } from "lucide-react";

type Props = { params: Promise<{ regionSlug: string }> };

async function getRegionBySlug(slug: string) {
  return db.region.findUnique({ where: { slug } });
}

async function getLevelsWithStats(regionId: number) {
  const levels = await db.leagueLevel.findMany({
    where: { regionId },
    orderBy: { tier: "asc" },
    include: {
      groups: {
        include: { _count: { select: { clubs: true } } },
      },
    },
  });

  return levels.map((level) => ({
    ...level,
    clubCount: level.groups.reduce((sum, g) => sum + g._count.clubs, 0),
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { regionSlug } = await params;
  const region = await getRegionBySlug(regionSlug);
  if (!region) return { title: "Region nie znaleziony" };
  return {
    title: `${region.name} — Struktura ligowa`,
    description: `Szczeble ligowe w regionie ${region.name}.`,
  };
}

export default async function RegionLevelsPage({ params }: Props) {
  const { regionSlug } = await params;
  const region = await getRegionBySlug(regionSlug);
  if (!region) notFound();

  const levels = await getLevelsWithStats(region.id);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <Breadcrumbs
          items={[
            { label: "Polska", href: "/leagues" },
            { label: region.name },
          ]}
        />

        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight">{region.name}</h1>
          <p className="mt-1 text-muted-foreground">
            Wybierz szczebel ligowy, aby zobaczyć grupy i drużyny.
          </p>
        </div>

        {levels.length === 0 ? (
          <p className="text-muted-foreground">Brak szczebli ligowych w tym regionie.</p>
        ) : (
          <div className="space-y-2">
            {levels.map((level) => {
              // If level has exactly 1 group, link directly to club list
              const href =
                level.groups.length === 1
                  ? `/leagues/${regionSlug}/${level.id}/${level.groups[0].id}`
                  : `/leagues/${regionSlug}/${level.id}`;

              return (
                <Link
                  key={level.id}
                  href={href}
                  className="group flex items-center justify-between rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/30 hover:shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <Trophy className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                    <div>
                      <span className="font-medium">{level.name}</span>
                      {level.groups.length > 1 && (
                        <p className="text-xs text-muted-foreground">
                          {level.groups.length} {level.groups.length < 5 ? "grupy" : "grup"}
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge variant="secondary" className="gap-1">
                    <Users className="h-3 w-3" />
                    {level.clubCount}
                  </Badge>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify — TypeScript check**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add "src/app/(public)/leagues/[regionSlug]/page.tsx"
git commit -m "feat: add /leagues/[regionSlug] page — league levels with stats"
```

---

### Task 6: Frontend — `/leagues/[regionSlug]/[levelId]` groups page

**Files:**
- Create: `src/app/(public)/leagues/[regionSlug]/[levelId]/page.tsx`

- [ ] **Step 1: Create groups page**

```tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { db } from "@/server/db/client";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";

type Props = { params: Promise<{ regionSlug: string; levelId: string }> };

async function getData(regionSlug: string, levelId: number) {
  const region = await db.region.findUnique({ where: { slug: regionSlug } });
  if (!region) return null;

  const level = await db.leagueLevel.findFirst({
    where: { id: levelId, regionId: region.id },
  });
  if (!level) return null;

  const groups = await db.leagueGroup.findMany({
    where: { leagueLevelId: levelId },
    orderBy: { name: "asc" },
    include: { _count: { select: { clubs: true } } },
  });

  return { region, level, groups };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { regionSlug, levelId } = await params;
  const data = await getData(regionSlug, Number(levelId));
  if (!data) return { title: "Nie znaleziono" };
  return {
    title: `${data.level.name} — ${data.region.name}`,
    description: `Grupy ligowe: ${data.level.name} w regionie ${data.region.name}.`,
  };
}

export default async function GroupsPage({ params }: Props) {
  const { regionSlug, levelId } = await params;
  const data = await getData(regionSlug, Number(levelId));
  if (!data) notFound();

  const { region, level, groups } = data;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <Breadcrumbs
          items={[
            { label: "Polska", href: "/leagues" },
            { label: region.name, href: `/leagues/${regionSlug}` },
            { label: level.name },
          ]}
        />

        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight">{level.name}</h1>
          <p className="mt-1 text-muted-foreground">
            {region.name} &middot; Wybierz grupę, aby zobaczyć drużyny.
          </p>
        </div>

        {groups.length === 0 ? (
          <p className="text-muted-foreground">Brak grup w tym szczeblu.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {groups.map((group) => (
              <Link
                key={group.id}
                href={`/leagues/${regionSlug}/${levelId}/${group.id}`}
                className="group flex items-center justify-between rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/30 hover:shadow-sm"
              >
                <span className="font-medium">{group.name}</span>
                <Badge variant="secondary" className="gap-1">
                  <Users className="h-3 w-3" />
                  {group._count.clubs}
                </Badge>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify — TypeScript check**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add "src/app/(public)/leagues/[regionSlug]/[levelId]/page.tsx"
git commit -m "feat: add /leagues/.../[levelId] page — groups with club counts"
```

---

### Task 7: Frontend — `/leagues/[regionSlug]/[levelId]/[groupId]` clubs page

**Files:**
- Create: `src/app/(public)/leagues/[regionSlug]/[levelId]/[groupId]/page.tsx`

- [ ] **Step 1: Create clubs list page**

```tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { db } from "@/server/db/client";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Badge } from "@/components/ui/badge";
import { MapPin } from "lucide-react";

type Props = { params: Promise<{ regionSlug: string; levelId: string; groupId: string }> };

async function getData(regionSlug: string, levelId: number, groupId: number) {
  const region = await db.region.findUnique({ where: { slug: regionSlug } });
  if (!region) return null;

  const level = await db.leagueLevel.findFirst({
    where: { id: levelId, regionId: region.id },
  });
  if (!level) return null;

  const group = await db.leagueGroup.findFirst({
    where: { id: groupId, leagueLevelId: levelId },
  });
  if (!group) return null;

  const clubs = await db.club.findMany({
    where: { leagueGroupId: groupId },
    orderBy: { name: "asc" },
    include: { region: true },
  });

  return { region, level, group, clubs };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { regionSlug, levelId, groupId } = await params;
  const data = await getData(regionSlug, Number(levelId), Number(groupId));
  if (!data) return { title: "Nie znaleziono" };
  return {
    title: `${data.level.name} — ${data.group.name} — ${data.region.name}`,
    description: `Drużyny w ${data.level.name}, ${data.group.name} (${data.region.name}).`,
  };
}

export default async function ClubsInGroupPage({ params }: Props) {
  const { regionSlug, levelId, groupId } = await params;
  const data = await getData(regionSlug, Number(levelId), Number(groupId));
  if (!data) notFound();

  const { region, level, group, clubs } = data;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <Breadcrumbs
          items={[
            { label: "Polska", href: "/leagues" },
            { label: region.name, href: `/leagues/${regionSlug}` },
            { label: level.name, href: `/leagues/${regionSlug}/${levelId}` },
            { label: group.name },
          ]}
        />

        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight">
            {level.name} &mdash; {group.name}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {region.name} &middot; {clubs.length}{" "}
            {clubs.length === 1 ? "drużyna" : clubs.length < 5 ? "drużyny" : "drużyn"}
          </p>
        </div>

        {clubs.length === 0 ? (
          <p className="text-muted-foreground">
            Brak drużyn przypisanych do tej grupy.
          </p>
        ) : (
          <div className="space-y-2">
            {clubs.map((club) => (
              <Link
                key={club.id}
                href={`/clubs/${club.id}`}
                className="group flex items-center gap-4 rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/30 hover:shadow-sm"
              >
                {club.logoUrl ? (
                  <img
                    src={club.logoUrl}
                    alt={club.name}
                    className="h-8 w-8 rounded-md object-cover"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-xs font-bold text-primary">
                    {club.name.charAt(0)}
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-medium group-hover:text-primary">{club.name}</p>
                  {club.city && (
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {club.city}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify — TypeScript check**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add "src/app/(public)/leagues/[regionSlug]/[levelId]/[groupId]/page.tsx"
git commit -m "feat: add /leagues/.../[groupId] page — clubs list in league group"
```

---

### Task 8: Club profile — clickable league links

**Files:**
- Modify: `src/app/(public)/clubs/[id]/page.tsx:139-150`

- [ ] **Step 1: Make region badge link to `/leagues/[regionSlug]`**

Replace the region badge (line ~139-144) from:
```tsx
{club.region && (
  <Badge className="border-white/20 bg-white/10 text-white hover:bg-white/20">
    <Globe className="mr-1 h-3 w-3" />
    {club.region.name}
  </Badge>
)}
```
to:
```tsx
{club.region && (
  <Link href={`/leagues/${club.region.slug}`}>
    <Badge className="border-white/20 bg-white/10 text-white hover:bg-white/20 cursor-pointer">
      <Globe className="mr-1 h-3 w-3" />
      {club.region.name}
    </Badge>
  </Link>
)}
```

- [ ] **Step 2: Make league badge link to group page**

Replace the league badge (line ~145-150) from:
```tsx
{club.leagueGroup && (
  <Badge className="border-white/20 bg-white/10 text-white hover:bg-white/20">
    <Trophy className="mr-1 h-3 w-3" />
    {club.leagueGroup.leagueLevel.name}
  </Badge>
)}
```
to:
```tsx
{club.leagueGroup && club.region && (
  <Link
    href={`/leagues/${club.region.slug}/${club.leagueGroup.leagueLevel.id}/${club.leagueGroup.id}`}
  >
    <Badge className="border-white/20 bg-white/10 text-white hover:bg-white/20 cursor-pointer">
      <Trophy className="mr-1 h-3 w-3" />
      {club.leagueGroup.leagueLevel.name} &mdash; {club.leagueGroup.name}
    </Badge>
  </Link>
)}
```

- [ ] **Step 3: Also make the "Liga" info in "O klubie" section clickable**

Replace the league info (line ~177-183) from:
```tsx
{club.leagueGroup && (
  <div>
    <p className="text-xs font-medium text-muted-foreground">Liga</p>
    <p className="font-medium">
      {club.leagueGroup.leagueLevel.name} &mdash; {club.leagueGroup.name}
    </p>
  </div>
)}
```
to:
```tsx
{club.leagueGroup && club.region && (
  <div>
    <p className="text-xs font-medium text-muted-foreground">Liga</p>
    <Link
      href={`/leagues/${club.region.slug}/${club.leagueGroup.leagueLevel.id}/${club.leagueGroup.id}`}
      className="font-medium text-primary hover:underline"
    >
      {club.leagueGroup.leagueLevel.name} &mdash; {club.leagueGroup.name}
    </Link>
  </div>
)}
```

- [ ] **Step 4: Verify — TypeScript check**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add "src/app/(public)/clubs/[id]/page.tsx"
git commit -m "feat: make league/region badges clickable to /leagues hierarchy"
```

---

### Task 9: Search results — show league info

**Files:**
- Modify: `src/app/(dashboard)/search/page.tsx` (club results rendering)

- [ ] **Step 1: Read current search page to find club rendering**

Read `src/app/(dashboard)/search/page.tsx` and locate where club results are rendered.

- [ ] **Step 2: Add league info under club name**

In the club result card, after the club name, add:
```tsx
{club.leagueGroup && (
  <span className="text-xs text-muted-foreground">
    {club.leagueGroup.leagueLevel.name} &middot; {club.leagueGroup.name}
  </span>
)}
```

If club has no leagueGroup but has region, show region only (already exists).

- [ ] **Step 3: Verify — TypeScript check**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add "src/app/(dashboard)/search/page.tsx"
git commit -m "feat: show league info in search results for clubs"
```

---

### Task 10: Final verification + build

- [ ] **Step 1: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 2: Run linter**

Run: `npm run lint`
Expected: No new warnings

- [ ] **Step 3: Run build**

Run: `npm run build`
Expected: Successful build

- [ ] **Step 4: Manual spot-check**

Verify in dev server:
1. `/leagues` — 16 regions with counts
2. Click a region → levels shown
3. Click a level with 1 group → goes directly to clubs
4. Click a level with >1 group → shows groups
5. Click a group → shows clubs with logos/cities
6. Click a club → `/clubs/[id]` with clickable league badge
7. Search a club → shows league info

- [ ] **Step 5: Final commit if any fixes needed**
