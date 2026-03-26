# Privacy + Coach Role Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** (1) Hide application counts/lists from non-owners and non-applicants. (2) Add COACH role with basic profile and auth support.

**Architecture:** Privacy changes filter data server-side in tRPC routers and remove `_count` from public queries. Coach role extends `UserRole` enum, adds `Coach` model, and updates auth/registration/profile flows.

**Tech Stack:** Next.js 16, tRPC v11, Prisma 7, Zod v4, shadcn/ui, Tailwind 4

---

## Iteration 1 — Application Privacy

### Task 1.1: `event.getById` — filter applications by auth

**Files:** `src/server/trpc/routers/event.ts`

- [ ] In `getById` (line ~199), after fetching the event, add session-based filtering of `applications[]` before returning. The endpoint stays as `publicProcedure`.

**Current code (lines 199-219):**
```ts
  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const event = await ctx.db.event.findUnique({
        where: { id: input.id },
        include: {
          club: { select: { id: true, name: true, city: true, logoUrl: true, userId: true } },
          region: true,
          applications: {
            include: {
              player: {
                select: { id: true, firstName: true, lastName: true, primaryPosition: true, photoUrl: true },
              },
            },
            orderBy: { createdAt: "desc" },
          },
        },
      });
      if (!event) throw new TRPCError({ code: "NOT_FOUND" });
      return event;
    }),
```

**Replace with:**
```ts
  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const event = await ctx.db.event.findUnique({
        where: { id: input.id },
        include: {
          club: { select: { id: true, name: true, city: true, logoUrl: true, userId: true } },
          region: true,
          applications: {
            include: {
              player: {
                select: { id: true, firstName: true, lastName: true, primaryPosition: true, photoUrl: true, userId: true },
              },
            },
            orderBy: { createdAt: "desc" },
          },
        },
      });
      if (!event) throw new TRPCError({ code: "NOT_FOUND" });

      // Filter applications: owner sees all, logged-in player sees only own, others see none
      const userId = ctx.session?.user?.id;
      const isOwner = userId === event.club.userId;
      if (!isOwner) {
        event.applications = event.applications.filter(
          (a) => a.player.userId === userId
        );
      }

      return event;
    }),
```

- [ ] Note: added `userId: true` to player select so we can compare against session user.

**Commit:** `Privacy: filter event applications by auth in getById`

---

### Task 1.2: `event.list` — remove `_count.applications`

**Files:** `src/server/trpc/routers/event.ts`

- [ ] In `list` query (line ~183), remove `_count: { select: { applications: true } }` from the include.

**Current code (lines 178-188):**
```ts
      const items = await ctx.db.event.findMany({
        where,
        include: {
          club: { select: { id: true, name: true, city: true, logoUrl: true } },
          region: true,
          _count: { select: { applications: true } },
        },
        take: input.limit + 1,
        ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
        orderBy: { [input.sortBy]: input.sortOrder },
      });
```

**Replace with:**
```ts
      const items = await ctx.db.event.findMany({
        where,
        include: {
          club: { select: { id: true, name: true, city: true, logoUrl: true } },
          region: true,
        },
        take: input.limit + 1,
        ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
        orderBy: { [input.sortBy]: input.sortOrder },
      });
```

**Commit:** `Privacy: remove _count.applications from event.list`

---

### Task 1.3: `sparing.list` — remove `_count.applications`

**Files:** `src/server/trpc/routers/sparing.ts`

- [ ] In `list` query (line ~151), remove `_count: { select: { applications: true } }` from the include.

**Current code (lines 146-156):**
```ts
      const items = await ctx.db.sparingOffer.findMany({
        where,
        include: {
          club: { select: { id: true, name: true, city: true, logoUrl: true } },
          region: true,
          _count: { select: { applications: true } },
        },
        take: input.limit + 1,
        ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
        orderBy: { [input.sortBy]: input.sortOrder },
      });
```

**Replace with:**
```ts
      const items = await ctx.db.sparingOffer.findMany({
        where,
        include: {
          club: { select: { id: true, name: true, city: true, logoUrl: true } },
          region: true,
        },
        take: input.limit + 1,
        ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
        orderBy: { [input.sortBy]: input.sortOrder },
      });
```

**Commit:** `Privacy: remove _count.applications from sparing.list`

---

### Task 1.4: `feed.recruitments` — remove `_count.applications`

**Files:** `src/server/trpc/routers/feed.ts`

- [ ] In `recruitments` query (line ~155), remove `_count: { select: { applications: true } }` from the include.

**Current code (lines 150-159):**
```ts
      const items = await ctx.db.event.findMany({
        where,
        include: {
          club: { select: { id: true, name: true, city: true, logoUrl: true } },
          region: { select: { name: true } },
          _count: { select: { applications: true } },
        },
        orderBy: { eventDate: "asc" },
        take: input.limit,
      });
```

**Replace with:**
```ts
      const items = await ctx.db.event.findMany({
        where,
        include: {
          club: { select: { id: true, name: true, city: true, logoUrl: true } },
          region: { select: { name: true } },
        },
        orderBy: { eventDate: "asc" },
        take: input.limit,
      });
```

**Commit:** `Privacy: remove _count.applications from feed.recruitments`

---

### Task 1.5: UI `events/page.tsx` — remove application count display

**Files:** `src/app/(dashboard)/events/page.tsx`

- [ ] Remove `_count` from the `EventItem` type (line 46).
- [ ] Remove the `_count.applications` display from the event card (lines 323-327). Replace with `maxParticipants`-only display.

**Step 1 — Remove `_count` from type (lines 37-47):**
```ts
// BEFORE
type EventItem = {
  id: string;
  type: string;
  title: string;
  eventDate: string | Date;
  location: string | null;
  maxParticipants: number | null;
  club: { id: string; name: string; city: string | null };
  region: { name: string } | null;
  _count: { applications: number };
};

// AFTER
type EventItem = {
  id: string;
  type: string;
  title: string;
  eventDate: string | Date;
  location: string | null;
  maxParticipants: number | null;
  club: { id: string; name: string; city: string | null };
  region: { name: string } | null;
};
```

- [ ] **Step 2 — Replace application count display (lines 323-327):**

```tsx
// BEFORE
                    <span className="ml-auto flex items-center gap-1 shrink-0">
                      <Users className="h-3 w-3" />
                      {ev._count.applications}
                      {ev.maxParticipants && ` / ${ev.maxParticipants}`}
                    </span>

// AFTER
                    {ev.maxParticipants && (
                      <span className="ml-auto flex items-center gap-1 shrink-0">
                        <Users className="h-3 w-3" />
                        Limit: {ev.maxParticipants} miejsc
                      </span>
                    )}
```

- [ ] **Step 3 — In `MyEventsTab`, update the count display (lines 425-429).** Note: `event.my` is a protected endpoint used by the owner, so `_count` is fine to keep there. No changes needed for MyEventsTab.

**Commit:** `Privacy: remove application count from public events list UI`

---

### Task 1.6: UI `events/[id]/page.tsx` — conditional applications section

**Files:** `src/app/(dashboard)/events/[id]/page.tsx`

- [ ] **Step 1 — Replace the "Miejsca" info card (lines 183-194).** Remove `acceptedCount` display for non-owners. Show `maxParticipants` only.

```tsx
// BEFORE (lines 183-194)
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
                <Users className="h-4 w-4 text-emerald-500" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Miejsca</p>
                <p className="font-medium">
                  {acceptedCount} zaakceptowanych
                  {event.maxParticipants && ` / ${event.maxParticipants} miejsc`}
                </p>
              </div>
            </div>

// AFTER
            {(isOwner || event.maxParticipants) && (
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
                  <Users className="h-4 w-4 text-emerald-500" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Miejsca</p>
                  <p className="font-medium">
                    {isOwner && `${acceptedCount} zaakceptowanych`}
                    {isOwner && event.maxParticipants && " / "}
                    {event.maxParticipants && `${event.maxParticipants} miejsc`}
                  </p>
                </div>
              </div>
            )}
```

- [ ] **Step 2 — Applications section (lines 267-326).** Only render if `event.applications.length > 0`. The API already filters applications, so:
  - Owner sees full list with accept/reject controls (existing behavior)
  - Player sees their own application (single card, header says "Twoje zgłoszenie")
  - Unauthenticated sees nothing (empty array from API)

```tsx
// BEFORE (line 268-274)
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5 text-muted-foreground" />
            Zgłoszenia ({event.applications.length})
          </CardTitle>
        </CardHeader>

// AFTER
      {event.applications.length > 0 && (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5 text-muted-foreground" />
            {isOwner ? `Zgłoszenia (${event.applications.length})` : "Twoje zgłoszenie"}
          </CardTitle>
        </CardHeader>
```

- [ ] Close the conditional: add `)}` after the closing `</Card>` tag (after line 326).

**Commit:** `Privacy: hide application counts and filter applications in event detail UI`

---

### Task 1.7: UI `sparing-card.tsx` — remove application badge

**Files:** `src/components/sparings/sparing-card.tsx`, `src/app/(dashboard)/sparings/page.tsx`

- [ ] **Step 1 — Remove `_count` from `SparingCardItem` type (line 35):**

```ts
// BEFORE
export type SparingCardItem = {
  // ...
  _count: { applications: number };
};

// AFTER
export type SparingCardItem = {
  // ...
  // _count removed
};
```

- [ ] **Step 2 — Remove the applications count display (lines 137-142):**

```tsx
// BEFORE
              {sparing._count.applications > 0 && (
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {sparing._count.applications}
                </span>
              )}

// AFTER (remove entire block)
```

- [ ] **Step 3 — Remove `Users` icon import if no longer used.** Check if `Users` is still referenced elsewhere in the file. It is not used elsewhere, so remove it from the import.

```ts
// BEFORE
import { Calendar, MapPin, Users } from "lucide-react";

// AFTER
import { Calendar, MapPin } from "lucide-react";
```

- [ ] **Step 4 — In `src/app/(dashboard)/sparings/page.tsx`:** verify `SparingCard` usage does not pass `_count`. The `sparing.list` no longer returns `_count`, so this should just work after the type change.

**Commit:** `Privacy: remove application count from sparing cards`

---

### Task 1.8: UI `club-recruitment.tsx` — remove `_count`

**Files:** `src/components/dashboard/club-recruitment.tsx`

- [ ] Remove the application count badge from recruitment cards (lines 76-79). Note: `event.my` is owner-only so `_count` is available, but we should be consistent.

```tsx
// BEFORE (lines 69-80)
                      <div className="flex shrink-0 items-center gap-1">
                        <Badge
                          variant="secondary"
                          className="text-[10px]"
                        >
                          {EVENT_TYPE_LABELS[event.type]}
                        </Badge>
                        <Badge variant="outline" className="text-[10px]">
                          <Users className="mr-0.5 h-3 w-3" />
                          {event._count.applications}
                        </Badge>
                      </div>

// AFTER
                      <Badge
                        variant="secondary"
                        className="text-[10px]"
                      >
                        {EVENT_TYPE_LABELS[event.type]}
                      </Badge>
```

- [ ] Remove `Users` from lucide import if no longer used elsewhere in this file. Check: `Users` is only used in the removed badge. Remove it.

```ts
// BEFORE
import { Target, ArrowRight, Calendar, Users } from "lucide-react";

// AFTER
import { Target, ArrowRight, Calendar } from "lucide-react";
```

**Commit:** `Privacy: remove application count badge from club recruitment dashboard`

---

### Task 1.9: `stats` router — verify privacy

**Files:** `src/server/trpc/routers/stats.ts`

- [ ] Review `clubDashboard` (line ~173): It already checks `ctx.session.user.role !== "CLUB"` and fetches only `clubId: club.id` data. **No changes needed** — already scoped to own club.
- [ ] Review `dashboard` (line ~124): Already scoped per-user. **No changes needed.**
- [ ] Review `detailed` (line ~5): Already behind `protectedProcedure` and scoped per-user. **No changes needed.**
- [ ] Note: `clubDashboard` returns `_count.applications` for the owner's own sparings/events. This is fine — the owner should see their own counts.

**Commit:** No commit needed (verification only).

---

## Iteration 2 — Coach Role

### Task 2.1: Schema — add Coach model + extend UserRole enum

**Files:** `prisma/schema.prisma`

- [ ] **Step 1 — Add `COACH` to `UserRole` enum (line ~59):**

```prisma
// BEFORE
enum UserRole {
  CLUB
  PLAYER
}

// AFTER
enum UserRole {
  CLUB
  PLAYER
  COACH
}
```

- [ ] **Step 2 — Add `coach` relation to User model (after line 73):**

```prisma
  club                     Club?
  player                   Player?
  coach                    Coach?
```

- [ ] **Step 3 — Add `coaches` relation to Region model (after line 23):**

```prisma
  players      Player[]
  coaches      Coach[]
```

- [ ] **Step 4 — Add Coach model (after Player model, after line 166):**

```prisma
model Coach {
  id             String   @id @default(uuid()) @db.Uuid
  userId         String   @unique @map("user_id") @db.Uuid
  firstName      String   @map("first_name") @db.VarChar(100)
  lastName       String   @map("last_name") @db.VarChar(100)
  specialization String?  @db.VarChar(100) // e.g. "YOUTH", "GOALKEEPER", "FITNESS", "TACTICAL"
  level          String?  @db.VarChar(50)  // e.g. "UEFA_B", "UEFA_A", "UEFA_PRO"
  city           String?  @db.VarChar(100)
  regionId       Int?     @map("region_id")
  bio            String?
  photoUrl       String?  @map("photo_url") @db.VarChar(500)
  createdAt      DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt      DateTime @updatedAt @map("updated_at") @db.Timestamptz

  user   User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  region Region? @relation(fields: [regionId], references: [id])

  @@map("coaches")
}
```

**Commit:** `Schema: add Coach model and COACH role to UserRole enum`

---

### Task 2.2: Prisma migration

- [ ] Run `npx prisma generate` to regenerate the Prisma client.
- [ ] Run `npx prisma migrate dev --name add_coach_role` to create and apply the migration.
- [ ] Verify the migration SQL adds the `coaches` table and alters the `UserRole` enum.

**Commit:** `Migration: add_coach_role`

---

### Task 2.3: Auth register — support COACH role

**Files:** `src/lib/validators/auth.ts`, `src/server/trpc/routers/auth.ts`

- [ ] **Step 1 — Extend register schema in `src/lib/validators/auth.ts`:**

```ts
// BEFORE
  role: z.enum(["CLUB", "PLAYER"]),

// AFTER
  role: z.enum(["CLUB", "PLAYER", "COACH"]),
```

- [ ] **Step 2 — Add COACH refinement (after existing refinement for PLAYER):**

```ts
// Add after the PLAYER refinement
.refine(
  (data) => {
    if (data.role === "COACH") return !!data.firstName && !!data.lastName;
    return true;
  },
  { message: "Imię i nazwisko są wymagane", path: ["firstName"] }
)
```

- [ ] **Step 3 — Update register mutation in `src/server/trpc/routers/auth.ts` (lines 31-51):**

```ts
// BEFORE
      const user = await ctx.db.user.create({
        data: {
          email: input.email,
          passwordHash,
          role: input.role,
          ...(input.role === "CLUB"
            ? {
                club: {
                  create: { name: input.clubName! },
                },
              }
            : {
                player: {
                  create: {
                    firstName: input.firstName!,
                    lastName: input.lastName!,
                  },
                },
              }),
        },
      });

// AFTER
      const profileData =
        input.role === "CLUB"
          ? { club: { create: { name: input.clubName! } } }
          : input.role === "COACH"
            ? { coach: { create: { firstName: input.firstName!, lastName: input.lastName! } } }
            : { player: { create: { firstName: input.firstName!, lastName: input.lastName! } } };

      const user = await ctx.db.user.create({
        data: {
          email: input.email,
          passwordHash,
          role: input.role,
          ...profileData,
        },
      });
```

**Commit:** `Auth: support COACH role in registration`

---

### Task 2.4: Registration UI — third card

**Files:** `src/app/(auth)/register/page.tsx`

- [ ] **Step 1 — Update role state type (line 27):**

```ts
// BEFORE
  const [role, setRole] = useState<"CLUB" | "PLAYER">("CLUB");

// AFTER
  const [role, setRole] = useState<"CLUB" | "PLAYER" | "COACH">("CLUB");
```

- [ ] **Step 2 — Add `GraduationCap` to lucide imports (line 21):**

```ts
// BEFORE
import { Shield, Users, UserPlus } from "lucide-react";

// AFTER
import { Shield, Users, UserPlus, GraduationCap } from "lucide-react";
```

- [ ] **Step 3 — Change role selector from 2-column to 3-column grid and add COACH card (lines 98-123):**

```tsx
// BEFORE
            <div className="mb-6 grid grid-cols-2 gap-3">

// AFTER
            <div className="mb-6 grid grid-cols-3 gap-3">
```

- [ ] Add COACH card after the PLAYER card button (after line 122):

```tsx
              <button
                type="button"
                onClick={() => setRole("COACH")}
                className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition ${
                  role === "COACH"
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border hover:border-primary/30 hover:bg-muted"
                }`}
              >
                <GraduationCap className={`h-6 w-6 ${role === "COACH" ? "text-primary" : "text-muted-foreground"}`} />
                <span className="text-sm font-semibold">Trener</span>
              </button>
```

- [ ] **Step 4 — Show firstName/lastName fields for COACH too (line 173):**

```tsx
// BEFORE
              {role === "PLAYER" && (

// AFTER
              {(role === "PLAYER" || role === "COACH") && (
```

**Commit:** `UI: add Coach role option to registration page`

---

### Task 2.5: Coach tRPC router

**Files:** Create `src/server/trpc/routers/coach.ts`, modify `src/server/trpc/router.ts`

- [ ] **Step 1 — Create `src/server/trpc/routers/coach.ts`:**

```ts
import { z } from "zod/v4";
import { router, protectedProcedure, publicProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

export const coachRouter = router({
  me: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.session.user.role !== "COACH") return null;
    return ctx.db.coach.findUnique({
      where: { userId: ctx.session.user.id },
      include: { region: true },
    });
  }),

  update: protectedProcedure
    .input(
      z.object({
        firstName: z.string().min(2).max(100),
        lastName: z.string().min(2).max(100),
        specialization: z.string().max(100).optional(),
        level: z.string().max(50).optional(),
        city: z.string().max(100).optional(),
        regionId: z.number().int().optional(),
        bio: z.string().max(2000).optional(),
        photoUrl: z.string().url().max(500).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const coach = await ctx.db.coach.findUnique({
        where: { userId: ctx.session.user.id },
      });
      if (!coach) throw new TRPCError({ code: "FORBIDDEN" });

      return ctx.db.coach.update({
        where: { id: coach.id },
        data: input,
      });
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const coach = await ctx.db.coach.findUnique({
        where: { id: input.id },
        include: { region: true },
      });
      if (!coach) throw new TRPCError({ code: "NOT_FOUND" });
      return coach;
    }),

  list: publicProcedure
    .input(
      z.object({
        regionId: z.number().int().optional(),
        specialization: z.string().optional(),
        city: z.string().max(100).optional(),
        cursor: z.string().uuid().optional(),
        limit: z.number().int().min(1).max(50).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: any = {};
      if (input.regionId) where.regionId = input.regionId;
      if (input.specialization) where.specialization = input.specialization;
      if (input.city) {
        where.city = { contains: input.city, mode: "insensitive" };
      }

      const items = await ctx.db.coach.findMany({
        where,
        include: { region: true },
        take: input.limit + 1,
        ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
        orderBy: { createdAt: "desc" },
      });

      let nextCursor: string | undefined;
      if (items.length > input.limit) {
        nextCursor = items.pop()!.id;
      }

      return { items, nextCursor };
    }),
});
```

- [ ] **Step 2 — Register in `src/server/trpc/router.ts`:**

```ts
// Add import
import { coachRouter } from "./routers/coach";

// Add to appRouter
export const appRouter = router({
  // ... existing routers
  coach: coachRouter,
});
```

**Commit:** `Feature: add Coach tRPC router with me/update/getById/list endpoints`

---

### Task 2.6: Coach profile form

**Files:** Create `src/components/dashboard/coach-profile-form.tsx`, modify `src/app/(dashboard)/profile/page.tsx`

- [ ] **Step 1 — Create `src/components/dashboard/coach-profile-form.tsx`:**
  - Client component with form fields: firstName, lastName, specialization (Select), level (Select), city, regionId (Select), bio (Textarea), photoUrl
  - Uses `api.coach.update.useMutation`
  - Pattern matches `PlayerProfileForm` structure

- [ ] **Step 2 — Update `src/app/(dashboard)/profile/page.tsx` to handle COACH role:**

```ts
// BEFORE
  const user = session.user as { id: string; role: "CLUB" | "PLAYER" };

// AFTER
  const user = session.user as { id: string; role: "CLUB" | "PLAYER" | "COACH" };
```

- [ ] Add COACH branch before the PLAYER fallback:

```ts
  if (user.role === "COACH") {
    const coach = await db.coach.findUnique({
      where: { userId: user.id },
      include: { region: true },
    });
    const regions = await db.region.findMany({ orderBy: { name: "asc" } });
    return <CoachProfileForm coach={coach!} regions={regions} />;
  }
```

- [ ] Add import: `import { CoachProfileForm } from "@/components/dashboard/coach-profile-form";`

**Commit:** `Feature: add Coach profile form and integrate into profile page`

---

### Task 2.7: Sidebar + layout updates

**Files:** `src/components/layout/sidebar.tsx`, `src/components/layout/bottom-nav.tsx`

- [ ] **Step 1 — In `sidebar.tsx`, update role label (line 145):**

```ts
// BEFORE
              {user.role === "CLUB" ? "Klub" : "Zawodnik"}

// AFTER
              {user.role === "CLUB" ? "Klub" : user.role === "COACH" ? "Trener" : "Zawodnik"}
```

- [ ] **Step 2 — Optionally hide "Rekrutacja" for COACH role.** This requires making `NAV_SECTIONS` dynamic or filtering items. Simplest approach: no change needed now since the recruitment page is still useful for coaches to browse. Mark as future enhancement.

**Commit:** `UI: add Coach role label to sidebar`

---

### Task 2.8: tRPC guard review

**Files:** `src/server/trpc/routers/feed.ts`, `src/server/trpc/routers/stats.ts`

- [ ] **Step 1 — `feed.recruitments` (line 130):** Currently returns empty for non-PLAYER. COACH should also see recruitments (as a viewer). Update:

```ts
// BEFORE
      if (ctx.session.user.role !== "PLAYER") return { items: [], matched: false };

// AFTER
      if (ctx.session.user.role === "CLUB") return { items: [], matched: false };
```

- [ ] For COACH, fetch without player-specific matching (no position filter):

```ts
      // After the existing player lookup, add coach fallback
      const player = ctx.session.user.role === "PLAYER"
        ? await ctx.db.player.findUnique({
            where: { userId },
            select: { regionId: true, primaryPosition: true },
          })
        : null;

      const coach = ctx.session.user.role === "COACH"
        ? await ctx.db.coach.findUnique({
            where: { userId },
            select: { regionId: true },
          })
        : null;

      const regionId = player?.regionId ?? coach?.regionId ?? null;
```

- [ ] **Step 2 — `feed.suggestedPlayers` (line 172):** Keep CLUB only. **No changes needed.**

- [ ] **Step 3 — `stats.dashboard` (line 124):** Add COACH branch:

```ts
      // After the PLAYER block (line ~169), handle COACH
      if (role === "COACH") {
        const [unreadMessages] = await Promise.all([
          ctx.db.message.count({
            where: {
              conversation: { participants: { some: { userId } } },
              readAt: null,
              senderId: { not: userId },
            },
          }),
        ]);
        return { role: "COACH" as const, unreadMessages };
      }
```

- [ ] **Step 4 — `stats.detailed` (line ~83):** Add COACH branch in the `else` block:

```ts
// BEFORE (line 83)
    } else {
      const player = await ctx.db.player.findUnique({ where: { userId } });

// AFTER
    } else if (role === "COACH") {
      userStats = {};
    } else {
      const player = await ctx.db.player.findUnique({ where: { userId } });
```

**Commit:** `Guards: handle COACH role in feed and stats routers`

---

### Task 2.9: Coach labels

**Files:** `src/lib/labels.ts`

- [ ] Add coach-specific label maps at the end of the file:

```ts
export const COACH_SPECIALIZATION_LABELS: Record<string, string> = {
  YOUTH: "Trener młodzieży",
  GOALKEEPER: "Trener bramkarzy",
  FITNESS: "Trener przygotowania fizycznego",
  TACTICAL: "Trener taktyki",
  INDIVIDUAL: "Trener indywidualny",
  GENERAL: "Trener ogólny",
};

export const COACH_LEVEL_LABELS: Record<string, string> = {
  GRASSROOTS_C: "UEFA Grassroots C",
  UEFA_B: "UEFA B",
  UEFA_A: "UEFA A",
  UEFA_PRO: "UEFA Pro",
  OTHER: "Inne",
};
```

- [ ] Update `getUserDisplayName` to handle coach:

```ts
// BEFORE
export function getUserDisplayName(user: {
  email?: string;
  club?: { name: string } | null;
  player?: { firstName: string; lastName: string } | null;
} | null): string {
  if (!user) return "Nieznany użytkownik";
  if (user.club) return user.club.name;
  if (user.player) return `${user.player.firstName} ${user.player.lastName}`;
  return user.email ?? "Nieznany użytkownik";
}

// AFTER
export function getUserDisplayName(user: {
  email?: string;
  club?: { name: string } | null;
  player?: { firstName: string; lastName: string } | null;
  coach?: { firstName: string; lastName: string } | null;
} | null): string {
  if (!user) return "Nieznany użytkownik";
  if (user.club) return user.club.name;
  if (user.player) return `${user.player.firstName} ${user.player.lastName}`;
  if (user.coach) return `${user.coach.firstName} ${user.coach.lastName}`;
  return user.email ?? "Nieznany użytkownik";
}
```

**Commit:** `Labels: add coach specialization and level labels`

---

### Task 2.10: Public coach profile (future)

**Files:** Create `src/app/(public)/coaches/[id]/page.tsx`

- [ ] Lower priority — can be implemented in a future iteration.
- [ ] Will use `coach.getById` endpoint.
- [ ] Layout: photo, name, specialization badge, level badge, region, bio.
- [ ] Pattern matches existing public player/club profiles.

**No commit — future task.**

---

## Summary of commits

| # | Commit message |
|---|---|
| 1 | `Privacy: filter event applications by auth in getById` |
| 2 | `Privacy: remove _count.applications from event.list` |
| 3 | `Privacy: remove _count.applications from sparing.list` |
| 4 | `Privacy: remove _count.applications from feed.recruitments` |
| 5 | `Privacy: remove application count from public events list UI` |
| 6 | `Privacy: hide application counts and filter applications in event detail UI` |
| 7 | `Privacy: remove application count from sparing cards` |
| 8 | `Privacy: remove application count badge from club recruitment dashboard` |
| 9 | `Schema: add Coach model and COACH role to UserRole enum` |
| 10 | `Migration: add_coach_role` |
| 11 | `Auth: support COACH role in registration` |
| 12 | `UI: add Coach role option to registration page` |
| 13 | `Feature: add Coach tRPC router with me/update/getById/list endpoints` |
| 14 | `Feature: add Coach profile form and integrate into profile page` |
| 15 | `UI: add Coach role label to sidebar` |
| 16 | `Guards: handle COACH role in feed and stats routers` |
| 17 | `Labels: add coach specialization and level labels` |
