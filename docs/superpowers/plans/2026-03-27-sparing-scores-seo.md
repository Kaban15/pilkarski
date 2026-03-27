# Sparing Scores + League SEO Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow clubs to submit and confirm sparing match scores, display results on sparing detail and club profiles, and add all league pages to sitemap.xml.

**Architecture:** 4 new nullable fields on SparingOffer (no new model), 2 new tRPC procedures (submitScore, confirmScore), 1 new UI component (ScoreSection), club profile extended with match history. Sitemap converted from static to async with DB queries.

**Tech Stack:** Next.js 16 (App Router), tRPC v11, Prisma 7, Tailwind 4, shadcn/ui, lucide-react

---

### File Map

**Create:**
- `prisma/migrations/YYYYMMDD_add_sparing_scores/migration.sql` — via `prisma migrate`
- `src/app/(dashboard)/sparings/[id]/_components/score-section.tsx` — score submit/confirm UI

**Modify:**
- `prisma/schema.prisma` — 4 new fields on SparingOffer, 3 new NotificationType values
- `src/server/trpc/routers/sparing.ts` — submitScore + confirmScore procedures
- `src/app/(dashboard)/sparings/[id]/page.tsx` — import + render ScoreSection
- `src/app/(public)/clubs/[id]/page.tsx` — match history section
- `src/lib/labels.ts` — notification labels for SCORE_*
- `src/app/sitemap.ts` — dynamic league URLs

---

### Task 1: Prisma schema + migration

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add fields to SparingOffer model**

In `prisma/schema.prisma`, inside `model SparingOffer`, before `club Club @relation(...)` line, add:

```prisma
  homeScore       Int?     @map("home_score")
  awayScore       Int?     @map("away_score")
  scoreSubmittedBy String? @map("score_submitted_by") @db.Uuid
  scoreConfirmed  Boolean  @default(false) @map("score_confirmed")
```

- [ ] **Step 2: Add NotificationType values**

In `enum NotificationType`, append:

```prisma
  SCORE_SUBMITTED        // wynik wpisany — czeka na potwierdzenie
  SCORE_CONFIRMED        // wynik potwierdzony
  SCORE_REJECTED         // wynik odrzucony
```

- [ ] **Step 3: Generate migration**

Run: `npx prisma migrate dev --name add_sparing_scores`
If dev DB not available, create migration manually:

```sql
ALTER TABLE "sparing_offers" ADD COLUMN "home_score" INTEGER;
ALTER TABLE "sparing_offers" ADD COLUMN "away_score" INTEGER;
ALTER TABLE "sparing_offers" ADD COLUMN "score_submitted_by" UUID;
ALTER TABLE "sparing_offers" ADD COLUMN "score_confirmed" BOOLEAN NOT NULL DEFAULT false;
```

- [ ] **Step 4: Generate Prisma client**

Run: `npx prisma generate`

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add sparing score fields and notification types"
```

---

### Task 2: Backend — submitScore + confirmScore

**Files:**
- Modify: `src/server/trpc/routers/sparing.ts`
- Modify: `src/lib/labels.ts`

- [ ] **Step 1: Add notification labels**

In `src/lib/labels.ts`, add to `NOTIFICATION_TYPE_LABELS`:

```typescript
  SCORE_SUBMITTED: "Wynik do potwierdzenia",
  SCORE_CONFIRMED: "Wynik potwierdzony",
  SCORE_REJECTED: "Wynik odrzucony",
```

Add to `NOTIFICATION_TYPE_COLORS`:

```typescript
  SCORE_SUBMITTED: "text-blue-800 dark:text-blue-200 bg-blue-50 dark:bg-blue-950",
  SCORE_CONFIRMED: "text-green-800 dark:text-green-200 bg-green-50 dark:bg-green-950",
  SCORE_REJECTED: "text-red-800 dark:text-red-200 bg-red-50 dark:bg-red-950",
```

- [ ] **Step 2: Add `submitScore` procedure**

In `src/server/trpc/routers/sparing.ts`, add after the `complete` procedure:

```typescript
  // Submit match score (either club)
  submitScore: protectedProcedure
    .input(z.object({
      sparingId: z.string().uuid(),
      homeScore: z.number().int().min(0).max(99),
      awayScore: z.number().int().min(0).max(99),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const offer = await ctx.db.sparingOffer.findUnique({
        where: { id: input.sparingId },
        include: {
          club: { select: { userId: true, name: true } },
          applications: {
            where: { status: "ACCEPTED" },
            include: { applicantClub: { select: { userId: true, name: true } } },
          },
        },
      });

      if (!offer) throw new TRPCError({ code: "NOT_FOUND" });
      if (offer.status !== "COMPLETED") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Wynik można wpisać tylko po zakończeniu sparingu" });
      }
      if (offer.homeScore !== null) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Wynik już został wpisany" });
      }

      const acceptedApp = offer.applications[0];
      const isOwner = offer.club.userId === userId;
      const isRival = acceptedApp?.applicantClub.userId === userId;
      if (!isOwner && !isRival) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Tylko uczestnicy sparingu mogą wpisać wynik" });
      }

      const updated = await ctx.db.sparingOffer.update({
        where: { id: input.sparingId },
        data: {
          homeScore: input.homeScore,
          awayScore: input.awayScore,
          scoreSubmittedBy: userId,
        },
      });

      // Notify the other club
      const otherUserId = isOwner ? acceptedApp?.applicantClub.userId : offer.club.userId;
      if (otherUserId) {
        ctx.db.notification.create({
          data: {
            userId: otherUserId,
            type: "SCORE_SUBMITTED",
            title: "Wynik do potwierdzenia",
            message: `Wynik ${input.homeScore}:${input.awayScore} — potwierdź lub odrzuć`,
            link: `/sparings/${input.sparingId}`,
          },
        }).catch(() => {});
        sendPushToUser(ctx.db, otherUserId, {
          title: "Wynik do potwierdzenia",
          body: `Wynik ${input.homeScore}:${input.awayScore}`,
          url: `/sparings/${input.sparingId}`,
        }).catch(() => {});
      }

      return updated;
    }),
```

- [ ] **Step 3: Add `confirmScore` procedure**

```typescript
  // Confirm or reject submitted score
  confirmScore: protectedProcedure
    .input(z.object({
      sparingId: z.string().uuid(),
      confirm: z.boolean(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const offer = await ctx.db.sparingOffer.findUnique({
        where: { id: input.sparingId },
        include: {
          club: { select: { userId: true } },
          applications: {
            where: { status: "ACCEPTED" },
            include: { applicantClub: { select: { userId: true } } },
          },
        },
      });

      if (!offer) throw new TRPCError({ code: "NOT_FOUND" });
      if (offer.homeScore === null) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Brak wyniku do potwierdzenia" });
      }
      if (offer.scoreConfirmed) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Wynik już potwierdzony" });
      }
      if (offer.scoreSubmittedBy === userId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Nie możesz potwierdzić własnego wyniku" });
      }

      const isOwner = offer.club.userId === userId;
      const isRival = offer.applications[0]?.applicantClub.userId === userId;
      if (!isOwner && !isRival) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      if (input.confirm) {
        const updated = await ctx.db.sparingOffer.update({
          where: { id: input.sparingId },
          data: { scoreConfirmed: true },
        });

        ctx.db.notification.create({
          data: {
            userId: offer.scoreSubmittedBy!,
            type: "SCORE_CONFIRMED",
            title: "Wynik potwierdzony",
            message: `Wynik ${offer.homeScore}:${offer.awayScore} został potwierdzony`,
            link: `/sparings/${input.sparingId}`,
          },
        }).catch(() => {});

        return updated;
      } else {
        const updated = await ctx.db.sparingOffer.update({
          where: { id: input.sparingId },
          data: {
            homeScore: null,
            awayScore: null,
            scoreSubmittedBy: null,
            scoreConfirmed: false,
          },
        });

        if (offer.scoreSubmittedBy) {
          ctx.db.notification.create({
            data: {
              userId: offer.scoreSubmittedBy,
              type: "SCORE_REJECTED",
              title: "Wynik odrzucony",
              message: "Twój wynik został odrzucony. Możesz wpisać go ponownie.",
              link: `/sparings/${input.sparingId}`,
            },
          }).catch(() => {});
        }

        return updated;
      }
    }),
```

- [ ] **Step 4: Verify TypeScript**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add src/server/trpc/routers/sparing.ts src/lib/labels.ts
git commit -m "feat: add submitScore and confirmScore tRPC procedures"
```

---

### Task 3: Frontend — ScoreSection component

**Files:**
- Create: `src/app/(dashboard)/sparings/[id]/_components/score-section.tsx`
- Modify: `src/app/(dashboard)/sparings/[id]/page.tsx`

- [ ] **Step 1: Create ScoreSection component**

Create `src/app/(dashboard)/sparings/[id]/_components/score-section.tsx`:

```tsx
"use client";

import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/trpc-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Check, X, Trophy } from "lucide-react";

interface ScoreSectionProps {
  sparingId: string;
  homeScore: number | null;
  awayScore: number | null;
  scoreSubmittedBy: string | null;
  scoreConfirmed: boolean;
  status: string;
  isOwner: boolean;
  isRival: boolean;
  userId: string;
  ownerClubName: string;
  rivalClubName: string;
  onUpdate: () => void;
}

export function ScoreSection({
  sparingId,
  homeScore,
  awayScore,
  scoreSubmittedBy,
  scoreConfirmed,
  status,
  isOwner,
  isRival,
  userId,
  ownerClubName,
  rivalClubName,
  onUpdate,
}: ScoreSectionProps) {
  const [home, setHome] = useState("");
  const [away, setAway] = useState("");

  const submitScore = api.sparing.submitScore.useMutation({
    onSuccess: () => {
      toast.success("Wynik wysłany — czeka na potwierdzenie");
      onUpdate();
    },
    onError: (e) => toast.error(e.message),
  });

  const confirmScore = api.sparing.confirmScore.useMutation({
    onSuccess: (_, vars) => {
      toast.success(vars.confirm ? "Wynik potwierdzony" : "Wynik odrzucony");
      onUpdate();
    },
    onError: (e) => toast.error(e.message),
  });

  if (status !== "COMPLETED") return null;
  if (!isOwner && !isRival) {
    // Show confirmed score for non-participants
    if (homeScore !== null && scoreConfirmed) {
      return (
        <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-4">
          <Trophy className="h-5 w-5 text-emerald-500" />
          <span className="font-semibold">
            {ownerClubName} {homeScore}:{awayScore} {rivalClubName}
          </span>
          <Badge className="bg-emerald-500/10 text-emerald-600">Potwierdzony</Badge>
        </div>
      );
    }
    return null;
  }

  // Confirmed score
  if (homeScore !== null && scoreConfirmed) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-4">
        <Trophy className="h-5 w-5 text-emerald-500" />
        <span className="font-semibold">
          {ownerClubName} {homeScore}:{awayScore} {rivalClubName}
        </span>
        <Badge className="bg-emerald-500/10 text-emerald-600">Potwierdzony</Badge>
      </div>
    );
  }

  // Pending confirmation
  if (homeScore !== null && !scoreConfirmed) {
    const isSubmitter = scoreSubmittedBy === userId;

    return (
      <div className="space-y-3 rounded-lg border border-border bg-card p-4">
        <div className="flex items-center gap-3">
          <Trophy className="h-5 w-5 text-amber-500" />
          <span className="font-semibold">
            {ownerClubName} {homeScore}:{awayScore} {rivalClubName}
          </span>
          <Badge className="bg-amber-500/10 text-amber-600">Oczekuje potwierdzenia</Badge>
        </div>
        {!isSubmitter && (
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => confirmScore.mutate({ sparingId, confirm: true })}
              disabled={confirmScore.isPending}
            >
              <Check className="mr-1 h-4 w-4" />
              Potwierdź
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => confirmScore.mutate({ sparingId, confirm: false })}
              disabled={confirmScore.isPending}
            >
              <X className="mr-1 h-4 w-4" />
              Odrzuć
            </Button>
          </div>
        )}
        {isSubmitter && (
          <p className="text-sm text-muted-foreground">Czekasz na potwierdzenie drugiego klubu.</p>
        )}
      </div>
    );
  }

  // No score yet — submit form
  return (
    <div className="space-y-3 rounded-lg border border-border bg-card p-4">
      <p className="text-sm font-medium">Wpisz wynik sparingu</p>
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">{ownerClubName}</span>
        <Input
          type="number"
          min="0"
          max="99"
          className="w-16 text-center"
          value={home}
          onChange={(e) => setHome(e.target.value)}
          placeholder="0"
        />
        <span className="font-bold">:</span>
        <Input
          type="number"
          min="0"
          max="99"
          className="w-16 text-center"
          value={away}
          onChange={(e) => setAway(e.target.value)}
          placeholder="0"
        />
        <span className="text-sm text-muted-foreground">{rivalClubName}</span>
      </div>
      <Button
        size="sm"
        onClick={() => {
          const h = parseInt(home, 10);
          const a = parseInt(away, 10);
          if (isNaN(h) || isNaN(a) || h < 0 || a < 0) {
            toast.error("Wpisz poprawny wynik");
            return;
          }
          submitScore.mutate({ sparingId, homeScore: h, awayScore: a });
        }}
        disabled={submitScore.isPending}
      >
        Wyślij wynik
      </Button>
    </div>
  );
}
```

- [ ] **Step 2: Import and render ScoreSection in sparing detail page**

In `src/app/(dashboard)/sparings/[id]/page.tsx`:

Add import:
```tsx
import { ScoreSection } from "./_components/score-section";
```

Find the JSX where SparingInfo, SparingTimeline, etc. are rendered. After the SparingTimeline section and before SparingApplications, add:

```tsx
{sparing && session?.user && (
  <ScoreSection
    sparingId={id}
    homeScore={sparing.homeScore}
    awayScore={sparing.awayScore}
    scoreSubmittedBy={sparing.scoreSubmittedBy}
    scoreConfirmed={sparing.scoreConfirmed}
    status={sparing.status}
    isOwner={sparing.club.userId === session.user.id}
    isRival={sparing.applications?.some(
      (a: SparingApplication) => a.status === "ACCEPTED" && a.applicantClub.userId === session.user.id
    ) ?? false}
    userId={session.user.id}
    ownerClubName={sparing.club.name}
    rivalClubName={
      sparing.applications?.find((a: SparingApplication) => a.status === "ACCEPTED")
        ?.applicantClub.name ?? "Rywal"
    }
    onUpdate={reload}
  />
)}
```

- [ ] **Step 3: Verify TypeScript**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add "src/app/(dashboard)/sparings/[id]/_components/score-section.tsx" "src/app/(dashboard)/sparings/[id]/page.tsx"
git commit -m "feat: add ScoreSection component for sparing score submission"
```

---

### Task 4: Club profile — match history

**Files:**
- Modify: `src/app/(public)/clubs/[id]/page.tsx`

- [ ] **Step 1: Add match history query**

In the `Promise.all` inside `ClubPublicProfilePage`, add a 5th query:

```typescript
    db.sparingOffer.findMany({
      where: {
        status: "COMPLETED",
        scoreConfirmed: true,
        OR: [
          { clubId: id },
          { applications: { some: { status: "ACCEPTED", applicantClub: { id } } } },
        ],
      },
      include: {
        club: { select: { id: true, name: true, logoUrl: true } },
        applications: {
          where: { status: "ACCEPTED" },
          include: { applicantClub: { select: { id: true, name: true, logoUrl: true } } },
        },
      },
      take: 10,
      orderBy: { matchDate: "desc" },
    }),
```

Destructure as `matchHistory` in the results.

- [ ] **Step 2: Compute W/D/L record**

After the Promise.all, add:

```typescript
  const record = { wins: 0, draws: 0, losses: 0 };
  for (const match of matchHistory) {
    const isHome = match.clubId === id;
    const myScore = isHome ? match.homeScore! : match.awayScore!;
    const theirScore = isHome ? match.awayScore! : match.homeScore!;
    if (myScore > theirScore) record.wins++;
    else if (myScore === theirScore) record.draws++;
    else record.losses++;
  }
```

- [ ] **Step 3: Render match history section**

After the "Aktywne sparingi" Card and before the "Nadchodzące wydarzenia" Card, add:

```tsx
            {matchHistory.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-emerald-500" />
                    Historia sparingów
                    <span className="text-sm font-normal text-muted-foreground">
                      {record.wins}W {record.draws}R {record.losses}P
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="divide-y divide-border">
                    {matchHistory.map((match) => {
                      const rival = match.clubId === id
                        ? match.applications[0]?.applicantClub
                        : match.club;
                      const isHome = match.clubId === id;
                      const myScore = isHome ? match.homeScore! : match.awayScore!;
                      const theirScore = isHome ? match.awayScore! : match.homeScore!;
                      const result = myScore > theirScore ? "W" : myScore === theirScore ? "R" : "P";
                      const resultColor =
                        result === "W" ? "text-emerald-600" : result === "P" ? "text-red-500" : "text-muted-foreground";

                      return (
                        <li key={match.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                          <div className="flex items-center gap-2">
                            <span className={`w-5 text-center text-xs font-bold ${resultColor}`}>{result}</span>
                            <span className="text-sm">
                              vs {rival?.name ?? "Nieznany"}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-semibold tabular-nums">
                              {match.homeScore}:{match.awayScore}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatShortDate(match.matchDate)}
                            </span>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </CardContent>
              </Card>
            )}
```

- [ ] **Step 4: Verify TypeScript**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add "src/app/(public)/clubs/[id]/page.tsx"
git commit -m "feat: add match history section to club public profile"
```

---

### Task 5: Sitemap — dynamic league URLs

**Files:**
- Modify: `src/app/sitemap.ts`

- [ ] **Step 1: Rewrite sitemap.ts**

Replace the entire file with:

```typescript
import type { MetadataRoute } from "next";
import { db } from "@/server/db/client";

const BASE_URL = "https://pilkasport.pl";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${BASE_URL}/login`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/register`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/leagues`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
  ];

  try {
    const regions = await db.region.findMany({
      select: { slug: true },
    });

    for (const region of regions) {
      entries.push({
        url: `${BASE_URL}/leagues/${region.slug}`,
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }

    const levels = await db.leagueLevel.findMany({
      select: { id: true, region: { select: { slug: true } } },
    });

    for (const level of levels) {
      entries.push({
        url: `${BASE_URL}/leagues/${level.region.slug}/${level.id}`,
        changeFrequency: "weekly",
        priority: 0.6,
      });
    }

    const groups = await db.leagueGroup.findMany({
      select: {
        id: true,
        leagueLevel: {
          select: { id: true, region: { select: { slug: true } } },
        },
      },
    });

    for (const group of groups) {
      entries.push({
        url: `${BASE_URL}/leagues/${group.leagueLevel.region.slug}/${group.leagueLevel.id}/${group.id}`,
        changeFrequency: "weekly",
        priority: 0.5,
      });
    }
  } catch {
    // DB unavailable at build time — return static entries only
  }

  return entries;
}
```

- [ ] **Step 2: Verify TypeScript**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/app/sitemap.ts
git commit -m "feat: add dynamic league URLs to sitemap (~480 entries)"
```

---

### Task 6: Final verification + build

- [ ] **Step 1: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 2: Run build**

Run: `npm run build`
Expected: Successful build

- [ ] **Step 3: Commit if any fixes needed**
