# Digest Card Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dodaj kartę "Twój status" na górze feedu, która agreguje per-rola liczniki rzeczy wymagających akcji (aplikacje, zaproszenia, attendance 48h, upcoming 7d, stale pipeline) i linkuje do odpowiednich widoków.

**Architecture:** Jeden tRPC endpoint `digest.get` agreguje wszystkie liczniki server-side w `Promise.all` (zero waterfall). Komponent `DigestCard` renderuje się warunkowo (`totalCount > 0`). Cache staleTime 2min + invalidation poprzez helper `invalidateDigest()` wywoływany z 8 mutacji zmieniających liczniki.

**Tech Stack:** Next.js 16 (App Router, RSC prefetch) + tRPC v11 + Prisma 7 + shadcn/ui Card + Vitest + Playwright.

**Spec source:** `docs/superpowers/specs/2026-04-17-digest-card-design.md`

---

## Pre-flight checks

- [ ] **P0: Verify project boots locally**

Run: `npm run dev`
Expected: Next.js startuje na `http://localhost:3000`, brak błędów TS.
Zatrzymaj dev server (Ctrl+C) — nie jest potrzebny do testów.

- [ ] **P1: Verify baseline tests pass**

Run: `npm test`
Expected: wszystkie istniejące testy vitest pass (baseline).

Run: `npm run test:e2e -- --list`
Expected: Playwright listuje istniejące specs bez błędów konfiguracji.

- [ ] **P2: Verify exact mutation procedure names (spec §5 note)**

Run tymi komendami do weryfikacji nazw procedur (spec notes: `apply` reserved word → `applyFor`):
```bash
grep -rn "applyFor\|respondToApplication\|respondToInvitation\|setAttendance\|updateStage" src/server/trpc/routers/ | head -30
```
Zapisz realne nazwy procedur do notatki — będą użyte w Task 8 (invalidateDigest wiring). Jeśli któraś nazwa różni się od spec §5 listy, użyj realnej.

Expected: lista procedur potwierdzająca nazwy takie jak `sparing.applyFor`, `sparing.respondToApplication`, `event.applyFor`, `event.respondToInvitation`, `event.setAttendance`, `recruitment.updateStage`.

---

## Phase 1 — Backend: Digest helpers + router

### Task 1: Digest types + thresholds

**Files:**
- Create: `src/lib/digest.ts`
- Test: `src/__tests__/digest.test.ts`

- [ ] **Step 1.1: Write failing test — DigestRow + threshold constants exist**

Create `src/__tests__/digest.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { DIGEST_THRESHOLDS, type DigestRow, type DigestResponse } from "@/lib/digest";

describe("digest constants", () => {
  it("exposes DIGEST_THRESHOLDS with documented values", () => {
    expect(DIGEST_THRESHOLDS.attendanceWarnHours).toBe(48);
    expect(DIGEST_THRESHOLDS.upcomingDays).toBe(7);
    expect(DIGEST_THRESHOLDS.stalePipelineDays).toBe(14);
    expect(DIGEST_THRESHOLDS.recommendedEventHours).toBe(72);
  });

  it("DigestRow type shape is exported", () => {
    const row: DigestRow = {
      key: "test",
      count: 1,
      label: "Test",
      href: "/test",
      iconKey: "sparing",
    };
    expect(row.key).toBe("test");
  });
});
```

- [ ] **Step 1.2: Run test — expect FAIL (module not found)**

Run: `npx vitest run src/__tests__/digest.test.ts`
Expected: FAIL — `Cannot find module '@/lib/digest'`

- [ ] **Step 1.3: Implement `src/lib/digest.ts` skeleton**

```ts
export const DIGEST_THRESHOLDS = {
  attendanceWarnHours: 48,
  upcomingDays: 7,
  stalePipelineDays: 14,
  recommendedEventHours: 72,
} as const;

export type DigestIconKey =
  | "sparing"
  | "event"
  | "message"
  | "transfer"
  | "calendar"
  | "pipeline"
  | "attendance"
  | "invitation"
  | "recommendation";

export type DigestRow = {
  key: string;
  count: number;
  label: string;
  href: string;
  iconKey: DigestIconKey;
};

export type DigestRole = "CLUB" | "PLAYER" | "COACH";

export type DigestResponse = {
  role: DigestRole;
  rows: DigestRow[];
  totalCount: number;
  generatedAt: string;
};
```

- [ ] **Step 1.4: Run test — expect PASS**

Run: `npx vitest run src/__tests__/digest.test.ts`
Expected: PASS (2 tests)

- [ ] **Step 1.5: Commit**

```bash
git add src/lib/digest.ts src/__tests__/digest.test.ts
git commit -m "feat(digest): add types and threshold constants"
```

---

### Task 2: CLUB digest helper (with tests)

**Files:**
- Modify: `src/lib/digest.ts` (add `getClubDigest`)
- Modify: `src/__tests__/digest.test.ts`

**Design note:** Helper przyjmuje `{ db, userId }` (DI — łatwe testowanie, niezależne od tRPC context). Wszystkie counts w `Promise.all`. Zwraca `DigestRow[]` przefiltrowany do `count > 0`.

- [ ] **Step 2.1: Append failing tests for getClubDigest**

Dodaj do `src/__tests__/digest.test.ts` (na końcu pliku):

```ts
import { getClubDigest } from "@/lib/digest";

describe("getClubDigest", () => {
  // Mock db — each call returns the count we want
  function makeMockDb(counts: {
    attendance48h?: number;
    pendingApps?: number;
    pendingInvitations?: number;
    upcoming7d?: number;
    stalePipeline?: number;
  }, clubId: string | null = "club-1") {
    const c = {
      attendance48h: 0,
      pendingApps: 0,
      pendingInvitations: 0,
      upcoming7d: 0,
      stalePipeline: 0,
      ...counts,
    };
    return {
      club: { findUnique: async () => clubId ? { id: clubId } : null },
      eventApplication: { count: async () => c.attendance48h },
      sparingApplication: { count: async () => c.pendingApps },
      sparingInvitation: { count: async () => c.pendingInvitations },
      $transaction: async (fns: any[]) => Promise.all(fns),
      sparingOffer: { count: async () => c.upcoming7d },
      event: { count: async () => 0 },
      recruitmentTarget: { count: async () => c.stalePipeline },
    } as any;
  }

  it("returns empty rows + totalCount=0 when nothing pending", async () => {
    const db = makeMockDb({});
    const res = await getClubDigest({ db, userId: "u1" });
    expect(res.rows).toEqual([]);
    expect(res.totalCount).toBe(0);
  });

  it("includes only rows with count > 0", async () => {
    const db = makeMockDb({ pendingApps: 3, upcoming7d: 5 });
    const res = await getClubDigest({ db, userId: "u1" });
    const keys = res.rows.map((r) => r.key);
    expect(keys).toContain("club.pendingSparingApplications");
    expect(keys).toContain("club.upcomingWeek");
    expect(keys).not.toContain("club.attendance48h");
    expect(res.totalCount).toBe(8);
  });

  it("returns empty when user has no club", async () => {
    const db = makeMockDb({ pendingApps: 3 }, null);
    const res = await getClubDigest({ db, userId: "u1" });
    expect(res.rows).toEqual([]);
    expect(res.totalCount).toBe(0);
  });

  it("rows ordered: attendance48h, pendingApps, invitations, upcoming, stale", async () => {
    const db = makeMockDb({
      attendance48h: 1, pendingApps: 2, pendingInvitations: 3,
      upcoming7d: 4, stalePipeline: 5,
    });
    const res = await getClubDigest({ db, userId: "u1" });
    expect(res.rows.map((r) => r.key)).toEqual([
      "club.attendance48h",
      "club.pendingSparingApplications",
      "club.pendingSparingInvitations",
      "club.upcomingWeek",
      "club.stalePipeline",
    ]);
  });
});
```

- [ ] **Step 2.2: Run test — expect FAIL (function not exported)**

Run: `npx vitest run src/__tests__/digest.test.ts`
Expected: FAIL — `getClubDigest is not a function`

- [ ] **Step 2.3: Implement `getClubDigest`**

Dodaj do `src/lib/digest.ts`:

```ts
import type { PrismaClient } from "@prisma/client";

type DbLike = Pick<PrismaClient, "club" | "eventApplication" | "sparingApplication" | "sparingInvitation" | "sparingOffer" | "event" | "recruitmentTarget">;

export async function getClubDigest(args: {
  db: DbLike;
  userId: string;
}): Promise<{ rows: DigestRow[]; totalCount: number }> {
  const club = await args.db.club.findUnique({ where: { userId: args.userId }, select: { id: true } });
  if (!club) return { rows: [], totalCount: 0 };

  const now = new Date();
  const attendanceCutoff = new Date(now.getTime() + DIGEST_THRESHOLDS.attendanceWarnHours * 60 * 60 * 1000);
  const upcomingCutoff = new Date(now.getTime() + DIGEST_THRESHOLDS.upcomingDays * 24 * 60 * 60 * 1000);
  const staleCutoff = new Date(now.getTime() - DIGEST_THRESHOLDS.stalePipelineDays * 24 * 60 * 60 * 1000);

  const [attendance48h, pendingApps, pendingInvitations, upcomingSparings, upcomingEvents, stalePipeline] = await Promise.all([
    // Attendance 48h: player applications ACCEPTED to TRYOUT/RECRUITMENT events by this club, bez response
    args.db.eventApplication.count({
      where: {
        status: "ACCEPTED",
        response: null,
        event: {
          clubId: club.id,
          type: { in: ["TRYOUT", "RECRUITMENT"] },
          eventDate: { gte: now, lte: attendanceCutoff },
        },
      },
    }),
    // Pending sparing applications: PENDING apps na ogłoszenia mojego klubu + moje aplikacje (out) PENDING
    args.db.sparingApplication.count({
      where: {
        OR: [
          { sparingOffer: { clubId: club.id }, status: "PENDING" },
          { applicantClubId: club.id, status: "PENDING" },
        ],
      },
    }),
    // Pending sparing invitations: OTRZYMANE przez mój klub, bez response, expiresAt > now
    args.db.sparingInvitation.count({
      where: {
        invitedClubId: club.id,
        response: null,
        expiresAt: { gte: now },
      },
    }),
    // Upcoming 7d — sparingi
    args.db.sparingOffer.count({
      where: {
        matchDate: { gte: now, lte: upcomingCutoff },
        status: "MATCHED",
        OR: [
          { clubId: club.id },
          { applications: { some: { status: "ACCEPTED", applicantClubId: club.id } } },
        ],
      },
    }),
    // Upcoming 7d — eventy mojego klubu
    args.db.event.count({
      where: {
        clubId: club.id,
        eventDate: { gte: now, lte: upcomingCutoff },
      },
    }),
    // Stale pipeline
    args.db.recruitmentTarget.count({
      where: {
        clubId: club.id,
        stage: { notIn: ["SIGNED", "ARCHIVED"] },
        updatedAt: { lt: staleCutoff },
      },
    }),
  ]);

  const upcomingWeek = upcomingSparings + upcomingEvents;

  const candidates: DigestRow[] = [
    {
      key: "club.attendance48h",
      count: attendance48h,
      label: "Zgłoszenia bez potwierdzenia (<48h)",
      href: "/events?filter=pending-attendance",
      iconKey: "attendance",
    },
    {
      key: "club.pendingSparingApplications",
      count: pendingApps,
      label: "Aplikacje sparingowe czekają",
      href: "/sparings?tab=applications",
      iconKey: "sparing",
    },
    {
      key: "club.pendingSparingInvitations",
      count: pendingInvitations,
      label: "Nieodebrane zaproszenia",
      href: "/sparings?tab=invitations",
      iconKey: "invitation",
    },
    {
      key: "club.upcomingWeek",
      count: upcomingWeek,
      label: "Wydarzenia w tym tygodniu",
      href: "/calendar?range=week",
      iconKey: "calendar",
    },
    {
      key: "club.stalePipeline",
      count: stalePipeline,
      label: "Kandydaci bez ruchu >14 dni",
      href: "/recruitment?filter=stale",
      iconKey: "pipeline",
    },
  ];

  const rows = candidates.filter((r) => r.count > 0);
  const totalCount = rows.reduce((s, r) => s + r.count, 0);
  return { rows, totalCount };
}
```

**UWAGA:** nazwy relacji Prisma (np. `applicantClubId` vs `applicantClub: { id }`, `recruitmentTarget` vs `recruitmentCandidate`, `response` field) **muszą być zweryfikowane z `prisma/schema.prisma` przed implementacją**. Jeśli nie zgadzają się — popraw `where` zgodnie z realnym schematem.

Przed step 2.4 odpal:
```bash
grep -E "model (SparingApplication|SparingInvitation|RecruitmentTarget|EventApplication)" prisma/schema.prisma -A 30
```

- [ ] **Step 2.4: Run test — expect PASS**

Run: `npx vitest run src/__tests__/digest.test.ts`
Expected: PASS (6 tests: 2 z task 1 + 4 nowe z task 2)

Jeśli FAIL z powodu niezgodności mock z implementacją (np. Promise.all kolejność) — dopasuj mock w teście (test podąża za kodem, ale rows mają być w tej samej kolejności co `candidates` array).

- [ ] **Step 2.5: Commit**

```bash
git add src/lib/digest.ts src/__tests__/digest.test.ts
git commit -m "feat(digest): add CLUB digest helper with tests"
```

---

### Task 3: PLAYER digest helper

**Files:**
- Modify: `src/lib/digest.ts`
- Modify: `src/__tests__/digest.test.ts`

**Content matrix (spec §4.3 PLAYER):**

| key | query | href |
|-----|-------|------|
| `player.myApplicationsInProgress` | `EventApplication.count` where `playerId=me, status in (PENDING, INVITED, REVIEWING)` | `/events?tab=my-applications` |
| `player.eventInvitations` | `EventApplication.count` where `playerId=me, status="INVITED"` (używamy INVITED jako proxy dla invite, weryfikuj schema — jeśli jest osobny `EventInvitation` model, użyj go) | `/events?filter=invited` |
| `player.attendance48h` | `EventApplication.count` where `playerId=me, status=ACCEPTED, response=null, event.eventDate w [now, now+48h]` | `/events?filter=pending-attendance` |
| `player.upcomingWeek` | `EventApplication.count` where `playerId=me, status=ACCEPTED, event.eventDate w [now, now+7d]` | `/calendar?range=week` |
| `player.recommendedEvents` | `Event.count` where `createdAt > now - 72h, regionId=player.regionId, targetPosition=player.primaryPosition` | `/events?filter=recommended` |

- [ ] **Step 3.1: Write failing tests for getPlayerDigest**

Dodaj w tym samym pliku testowym (pattern jak w Task 2):

```ts
import { getPlayerDigest } from "@/lib/digest";

describe("getPlayerDigest", () => {
  function makeMockDb(counts: {
    myApps?: number;
    invitations?: number;
    attendance48h?: number;
    upcoming7d?: number;
    recommended?: number;
  }, player: { id: string; regionId: number | null; primaryPosition: string | null } | null = { id: "p1", regionId: 1, primaryPosition: "ST" }) {
    const c = { myApps: 0, invitations: 0, attendance48h: 0, upcoming7d: 0, recommended: 0, ...counts };
    // Every call returns next value from queue (order of Promise.all calls)
    const callCounts = [c.myApps, c.invitations, c.attendance48h, c.upcoming7d];
    let i = 0;
    return {
      player: { findUnique: async () => player },
      eventApplication: {
        count: async () => callCounts[i++] ?? 0,
      },
      event: { count: async () => c.recommended },
    } as any;
  }

  it("returns empty when player profile missing", async () => {
    const db = makeMockDb({ myApps: 3 }, null);
    const res = await getPlayerDigest({ db, userId: "u1" });
    expect(res.rows).toEqual([]);
  });

  it("includes non-zero rows only, correct order", async () => {
    const db = makeMockDb({ myApps: 2, attendance48h: 1, recommended: 4 });
    const res = await getPlayerDigest({ db, userId: "u1" });
    expect(res.rows.map((r) => r.key)).toEqual([
      "player.myApplicationsInProgress",
      "player.attendance48h",
      "player.recommendedEvents",
    ]);
    expect(res.totalCount).toBe(7);
  });
});
```

- [ ] **Step 3.2: Run test — expect FAIL**

Run: `npx vitest run src/__tests__/digest.test.ts`
Expected: FAIL — `getPlayerDigest is not a function`

- [ ] **Step 3.3: Implement `getPlayerDigest`**

Dodaj do `src/lib/digest.ts` (po `getClubDigest`):

```ts
export async function getPlayerDigest(args: {
  db: any; // patrz weryfikacja typów niżej
  userId: string;
}): Promise<{ rows: DigestRow[]; totalCount: number }> {
  const player = await args.db.player.findUnique({
    where: { userId: args.userId },
    select: { id: true, regionId: true, primaryPosition: true },
  });
  if (!player) return { rows: [], totalCount: 0 };

  const now = new Date();
  const attendanceCutoff = new Date(now.getTime() + DIGEST_THRESHOLDS.attendanceWarnHours * 60 * 60 * 1000);
  const upcomingCutoff = new Date(now.getTime() + DIGEST_THRESHOLDS.upcomingDays * 24 * 60 * 60 * 1000);
  const recommendedCutoff = new Date(now.getTime() - DIGEST_THRESHOLDS.recommendedEventHours * 60 * 60 * 1000);

  const [myApps, invitations, attendance48h, upcoming7d, recommended] = await Promise.all([
    args.db.eventApplication.count({
      where: {
        playerId: player.id,
        status: { in: ["PENDING", "REVIEWING"] }, // INVITED rozdzielone poniżej
      },
    }),
    args.db.eventApplication.count({
      where: {
        playerId: player.id,
        status: "INVITED",
      },
    }),
    args.db.eventApplication.count({
      where: {
        playerId: player.id,
        status: "ACCEPTED",
        response: null,
        event: {
          eventDate: { gte: now, lte: attendanceCutoff },
          type: { in: ["TRYOUT", "RECRUITMENT"] },
        },
      },
    }),
    args.db.eventApplication.count({
      where: {
        playerId: player.id,
        status: "ACCEPTED",
        event: { eventDate: { gte: now, lte: upcomingCutoff } },
      },
    }),
    args.db.event.count({
      where: {
        createdAt: { gte: recommendedCutoff },
        type: { in: ["RECRUITMENT", "TRYOUT", "CONTINUOUS_RECRUITMENT"] },
        ...(player.regionId ? { regionId: player.regionId } : {}),
        ...(player.primaryPosition ? { OR: [{ targetPosition: null }, { targetPosition: player.primaryPosition }] } : {}),
      },
    }),
  ]);

  const candidates: DigestRow[] = [
    { key: "player.myApplicationsInProgress", count: myApps, label: "Twoje aplikacje w toku", href: "/events?tab=my-applications", iconKey: "event" },
    { key: "player.eventInvitations", count: invitations, label: "Zaproszenia na wydarzenia", href: "/events?filter=invited", iconKey: "invitation" },
    { key: "player.attendance48h", count: attendance48h, label: "Potwierdź obecność (<48h)", href: "/events?filter=pending-attendance", iconKey: "attendance" },
    { key: "player.upcomingWeek", count: upcoming7d, label: "Wydarzenia w tym tygodniu", href: "/calendar?range=week", iconKey: "calendar" },
    { key: "player.recommendedEvents", count: recommended, label: "Nowe nabory dla Ciebie", href: "/events?filter=recommended", iconKey: "recommendation" },
  ];

  const rows = candidates.filter((r) => r.count > 0);
  const totalCount = rows.reduce((s, r) => s + r.count, 0);
  return { rows, totalCount };
}
```

**Schema validation przed implementacją:**
- `EventApplication` ma `playerId`, `status` (z enum zawierającym `INVITED`?), `response`. Zweryfikuj:
  ```bash
  grep -A 20 "model EventApplication" prisma/schema.prisma
  ```
- Jeśli `INVITED` nie jest statusem (bo zaproszenia są osobnym modelem) — dostosuj query: użyj realnego modelu/relacji zgodnie z schematem.

- [ ] **Step 3.4: Run test — expect PASS**

Run: `npx vitest run src/__tests__/digest.test.ts`
Expected: PASS (wszystkie testy)

- [ ] **Step 3.5: Commit**

```bash
git add src/lib/digest.ts src/__tests__/digest.test.ts
git commit -m "feat(digest): add PLAYER digest helper with tests"
```

---

### Task 4: COACH digest helper

**Files:**
- Modify: `src/lib/digest.ts`
- Modify: `src/__tests__/digest.test.ts`

**Content matrix (spec §4.3 COACH):**

| key | query | href |
|-----|-------|------|
| `coach.trainingApplications` | `EventApplication.count` where `event.coachId=me, status=PENDING` | `/trainings?tab=applications` |
| `coach.clubInvitations` | `ClubMembership.count` where `memberUserId=me, status="INVITED"` | `/notifications?filter=invitations` |
| `coach.attendance48h` | analogicznie jak PLAYER attendance ale przez ClubMembership → clubId → event.clubId | `/events?filter=pending-attendance` |
| `coach.upcomingWeek` | `Event.count` where `coachId=me, eventDate w [now, now+7d]` | `/calendar?range=week` |
| `coach.unreadMessages` | reuse `message.unreadCount` logic | `/messages` |

- [ ] **Step 4.1: Write failing tests for getCoachDigest**

Dodaj do `src/__tests__/digest.test.ts`. Wzorzec taki sam jak w Task 3. Pokryj: (a) empty → empty rows, (b) mixed counts → correct order, (c) no coach profile → empty.

- [ ] **Step 4.2: Run — FAIL**

Run: `npx vitest run src/__tests__/digest.test.ts`

- [ ] **Step 4.3: Implement `getCoachDigest`**

```ts
export async function getCoachDigest(args: {
  db: any;
  userId: string;
}): Promise<{ rows: DigestRow[]; totalCount: number }> {
  const coach = await args.db.coach.findUnique({
    where: { userId: args.userId },
    select: { id: true },
  });
  if (!coach) return { rows: [], totalCount: 0 };

  const now = new Date();
  const attendanceCutoff = new Date(now.getTime() + DIGEST_THRESHOLDS.attendanceWarnHours * 60 * 60 * 1000);
  const upcomingCutoff = new Date(now.getTime() + DIGEST_THRESHOLDS.upcomingDays * 24 * 60 * 60 * 1000);

  const [trainingApps, clubInvitations, attendance48h, upcoming7d, unreadMessages] = await Promise.all([
    args.db.eventApplication.count({
      where: {
        status: "PENDING",
        event: { coachId: coach.id, type: { in: ["INDIVIDUAL_TRAINING", "GROUP_TRAINING"] } },
      },
    }),
    args.db.clubMembership.count({
      where: { memberUserId: args.userId, status: "INVITED" },
    }),
    args.db.eventApplication.count({
      where: {
        status: "ACCEPTED",
        response: null,
        event: {
          coachId: coach.id,
          eventDate: { gte: now, lte: attendanceCutoff },
        },
      },
    }),
    args.db.event.count({
      where: {
        coachId: coach.id,
        eventDate: { gte: now, lte: upcomingCutoff },
      },
    }),
    args.db.message.count({
      where: {
        conversation: { participants: { some: { userId: args.userId } } },
        readAt: null,
        senderId: { not: args.userId },
      },
    }),
  ]);

  const candidates: DigestRow[] = [
    { key: "coach.trainingApplications", count: trainingApps, label: "Zgłoszenia na treningi", href: "/trainings?tab=applications", iconKey: "event" },
    { key: "coach.clubInvitations", count: clubInvitations, label: "Zaproszenia od klubów", href: "/notifications?filter=invitations", iconKey: "invitation" },
    { key: "coach.attendance48h", count: attendance48h, label: "Potwierdź obecność (<48h)", href: "/events?filter=pending-attendance", iconKey: "attendance" },
    { key: "coach.upcomingWeek", count: upcoming7d, label: "Treningi w tym tygodniu", href: "/calendar?range=week", iconKey: "calendar" },
    { key: "coach.unreadMessages", count: unreadMessages, label: "Nowe wiadomości", href: "/messages", iconKey: "message" },
  ];

  const rows = candidates.filter((r) => r.count > 0);
  const totalCount = rows.reduce((s, r) => s + r.count, 0);
  return { rows, totalCount };
}
```

- [ ] **Step 4.4: Run — expect PASS**

- [ ] **Step 4.5: Commit**

```bash
git commit -am "feat(digest): add COACH digest helper with tests"
```

---

### Task 5: tRPC router `digest.get`

**Files:**
- Create: `src/server/trpc/routers/digest.ts`
- Modify: `src/server/trpc/router.ts`

- [ ] **Step 5.1: Implement router**

```ts
// src/server/trpc/routers/digest.ts
import { router, protectedProcedure } from "../trpc";
import { getClubDigest, getPlayerDigest, getCoachDigest, type DigestResponse, type DigestRole } from "@/lib/digest";

export const digestRouter = router({
  get: protectedProcedure.query(async ({ ctx }): Promise<DigestResponse> => {
    const userId = ctx.session.user.id;
    const role = ctx.session.user.role as DigestRole;

    const result =
      role === "CLUB"
        ? await getClubDigest({ db: ctx.db, userId })
        : role === "PLAYER"
          ? await getPlayerDigest({ db: ctx.db, userId })
          : await getCoachDigest({ db: ctx.db, userId });

    return {
      role,
      rows: result.rows,
      totalCount: result.totalCount,
      generatedAt: new Date().toISOString(),
    };
  }),
});
```

- [ ] **Step 5.2: Register router in `router.ts`**

Dodaj w `src/server/trpc/router.ts`:
- import: `import { digestRouter } from "./routers/digest";` (alfabetycznie między `club-post` a `coach`? nie — zachowaj istniejącą kolejność domenową, dodaj przed `admin`).
- property: `digest: digestRouter,` — dodaj w router object przed `admin`.

- [ ] **Step 5.3: Type-check**

Run: `npx tsc --noEmit`
Expected: zero błędów.

Jeśli błąd w `ctx.db` typing na helperach — wewnątrz `digest.ts` rzutuj przez `as any` tymczasowo i popraw w follow-up, lub zaktualizuj typ `DbLike` w `src/lib/digest.ts` żeby pokrywał wszystkie używane delegaty.

- [ ] **Step 5.4: Commit**

```bash
git add src/server/trpc/routers/digest.ts src/server/trpc/router.ts
git commit -m "feat(digest): add digest.get tRPC procedure"
```

---

### Task 6: Integration test dla routera

**Files:**
- Create: `src/__tests__/routers/digest.test.ts`

Pattern: zobacz `src/__tests__/routers/auth.test.ts`.

- [ ] **Step 6.1: Napisz test**

Mock db + sesja + wywołaj `digestRouter.createCaller({ db, session }).get()`.

Minimalnie jeden test per rola:

```ts
import { describe, it, expect } from "vitest";
import { digestRouter } from "@/server/trpc/routers/digest";

function makeCtx(role: "CLUB" | "PLAYER" | "COACH", dbOverrides: any = {}) {
  return {
    session: { user: { id: "u1", role } },
    db: {
      club: { findUnique: async () => ({ id: "c1" }) },
      player: { findUnique: async () => ({ id: "p1", regionId: null, primaryPosition: null }) },
      coach: { findUnique: async () => ({ id: "co1" }) },
      eventApplication: { count: async () => 0 },
      sparingApplication: { count: async () => 0 },
      sparingInvitation: { count: async () => 0 },
      sparingOffer: { count: async () => 0 },
      event: { count: async () => 0 },
      recruitmentTarget: { count: async () => 0 },
      clubMembership: { count: async () => 0 },
      message: { count: async () => 0 },
      ...dbOverrides,
    },
  } as any;
}

describe("digest router", () => {
  it("CLUB with zero activity returns totalCount 0", async () => {
    const caller = digestRouter.createCaller(makeCtx("CLUB"));
    const res = await caller.get();
    expect(res.role).toBe("CLUB");
    expect(res.totalCount).toBe(0);
    expect(res.rows).toEqual([]);
    expect(res.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("PLAYER returns PLAYER role digest", async () => {
    const caller = digestRouter.createCaller(makeCtx("PLAYER"));
    const res = await caller.get();
    expect(res.role).toBe("PLAYER");
  });

  it("COACH returns COACH role digest", async () => {
    const caller = digestRouter.createCaller(makeCtx("COACH"));
    const res = await caller.get();
    expect(res.role).toBe("COACH");
  });
});
```

- [ ] **Step 6.2: Run test — expect PASS**

Run: `npx vitest run src/__tests__/routers/digest.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 6.3: Commit**

```bash
git add src/__tests__/routers/digest.test.ts
git commit -m "test(digest): add router integration tests"
```

---

## Phase 2 — Client: DigestCard component

### Task 7: Komponent DigestCard

**Files:**
- Create: `src/components/dashboard/digest-card.tsx`
- Modify: `src/lib/translations.ts` (dodać nowe klucze PL→EN)

**Contract:**
- `"use client"` component
- Używa `api.digest.get.useQuery()` z `staleTime: 120_000, refetchInterval: 120_000, refetchOnWindowFocus: true`
- Guards:
  - `isLoading` → `h-[168px] w-full rounded-xl bg-card border animate-pulse` placeholder (dokładnie jedna karta, żeby uniknąć CLS)
  - `error` → render null + `console.error("[digest] fetch failed", error)`
  - `data.totalCount === 0` → render null
- Layout: `<Card>` → header (label + "zaktualizowano teraz" timestamp) → rows (flex z ikoną/liczbą/label/chevron)
- Kliknięcie wiersza = Next.js `<Link href={row.href}>`
- Każdy wiersz ma `data-testid={row.key}` (do E2E)
- Count: jeśli `row.count >= 100` wyświetl `"99+"`, else `row.count`
- Mapowanie `iconKey` → ikona lucide:
  - `sparing` → `Swords` (orange)
  - `event` → `Trophy` (violet)
  - `message` → `MessageSquare` (amber)
  - `transfer` → `ArrowLeftRight` (cyan)
  - `calendar` → `CalendarDays` (sky)
  - `pipeline` → `Users` (slate)
  - `attendance` → `Clock` (red-500)
  - `invitation` → `Mail` (violet)
  - `recommendation` → `Sparkles` (emerald)

- [ ] **Step 7.1: Implementuj komponent**

```tsx
"use client";

import Link from "next/link";
import { api } from "@/lib/trpc-react";
import { useI18n } from "@/lib/i18n";
import { Card, CardContent } from "@/components/ui/card";
import {
  Swords, Trophy, MessageSquare, ArrowLeftRight, CalendarDays,
  Users, Clock, Mail, Sparkles, ChevronRight,
} from "lucide-react";

const ICON_MAP = {
  sparing: { Icon: Swords, className: "text-sport-orange" },
  event: { Icon: Trophy, className: "text-violet-500" },
  message: { Icon: MessageSquare, className: "text-amber-500" },
  transfer: { Icon: ArrowLeftRight, className: "text-cyan-500" },
  calendar: { Icon: CalendarDays, className: "text-sky-500" },
  pipeline: { Icon: Users, className: "text-slate-500" },
  attendance: { Icon: Clock, className: "text-red-500" },
  invitation: { Icon: Mail, className: "text-violet-500" },
  recommendation: { Icon: Sparkles, className: "text-emerald-500" },
} as const;

function formatCount(n: number) {
  return n >= 100 ? "99+" : String(n);
}

export function DigestCard() {
  const { t } = useI18n();
  const { data, isLoading, error } = api.digest.get.useQuery(undefined, {
    staleTime: 120_000,
    refetchInterval: 120_000,
    refetchOnWindowFocus: true,
  });

  if (isLoading) {
    return <div className="mb-6 h-[168px] w-full rounded-xl border border-border bg-card animate-pulse" aria-hidden />;
  }

  if (error) {
    console.error("[digest] fetch failed", error);
    return null;
  }

  if (!data || data.totalCount === 0) return null;

  return (
    <Card className="mb-6" data-testid="digest-card">
      <CardContent className="py-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {t("Twój status")}
          </p>
          <span className="text-[11px] text-muted-foreground/60">
            {t("zaktualizowano teraz")}
          </span>
        </div>
        <ul className="divide-y divide-border/40">
          {data.rows.map((row) => {
            const { Icon, className } = ICON_MAP[row.iconKey];
            return (
              <li key={row.key}>
                <Link
                  href={row.href}
                  data-testid={row.key}
                  className="group flex items-center gap-3 rounded-md px-1 py-2.5 transition-colors hover:bg-accent"
                >
                  <Icon className={`h-5 w-5 shrink-0 ${className}`} />
                  <span className="min-w-[28px] text-right font-bold tabular-nums text-[18px] font-display">
                    {formatCount(row.count)}
                  </span>
                  <span className="flex-1 truncate text-[14px] text-foreground/90">
                    {t(row.label)}
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50 transition-colors group-hover:text-foreground" />
                </Link>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 7.2: Dodaj klucze PL→EN do `src/lib/translations.ts`**

Znajdź odpowiednią sekcję (np. koniec pliku przed closing brace) i dodaj:

```ts
// ---- Digest ----
"Twój status": "Your status",
"zaktualizowano teraz": "updated now",
"Zgłoszenia bez potwierdzenia (<48h)": "Unconfirmed RSVPs (<48h)",
"Aplikacje sparingowe czekają": "Sparring applications waiting",
"Nieodebrane zaproszenia": "Unopened invitations",
"Wydarzenia w tym tygodniu": "Events this week",
"Kandydaci bez ruchu >14 dni": "Stale candidates >14d",
"Twoje aplikacje w toku": "Your pending applications",
"Zaproszenia na wydarzenia": "Event invitations",
"Potwierdź obecność (<48h)": "Confirm attendance (<48h)",
"Nowe nabory dla Ciebie": "New recruitments for you",
"Zgłoszenia na treningi": "Training signups",
"Zaproszenia od klubów": "Club invitations",
"Treningi w tym tygodniu": "Trainings this week",
"Nowe wiadomości": "New messages",
```

- [ ] **Step 7.3: Type-check + lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: zero errors, zero warnings.

- [ ] **Step 7.4: Commit**

```bash
git add src/components/dashboard/digest-card.tsx src/lib/translations.ts
git commit -m "feat(digest): add DigestCard component"
```

---

### Task 8: Integracja w feed-client + prefetch

**Files:**
- Modify: `src/app/(dashboard)/feed/page.tsx`
- Modify: `src/app/(dashboard)/feed/feed-client.tsx`

- [ ] **Step 8.1: Dodaj server-side prefetch**

W `src/app/(dashboard)/feed/page.tsx`, w body funkcji `FeedPage` obok istniejących `void trpc.xxx.prefetch(...)`:

```ts
void trpc.digest.get.prefetch();
```

Umieść po `void trpc.stats.dashboard.prefetch();`.

- [ ] **Step 8.2: Import DigestCard i render w feed-client**

W `src/app/(dashboard)/feed/feed-client.tsx`:

1. Dodaj import w sekcji importów:
   ```tsx
   import { DigestCard } from "@/components/dashboard/digest-card";
   ```
2. W JSX, w głównej kolumnie (`<div className="min-w-0 flex-1 lg:max-w-2xl">`), zaraz po `<div className="mb-6"> … <h1>…</h1> … </div>`, **przed** pierwszym `{showOnboarding && ...}`, wstaw:
   ```tsx
   {!showOnboarding && !showPlayerOnboarding && !showCoachOnboarding && <DigestCard />}
   ```

Uzasadnienie: digest znika gdy aktywny jest onboarding (spec §4.1).

- [ ] **Step 8.3: Manual smoke test**

Run: `npm run dev`
Otwórz: `http://localhost:3000/login`
Zaloguj jako istniejący CLUB z aktywnymi aplikacjami sparingowymi (lub tworzymy seed: patrz Task 10).

Expected:
- Karta „Twój status" widoczna nad statystykami
- Liczba aplikacji zgodna z bazą
- Klik w wiersz przekierowuje na `/sparings?tab=applications` (lub `/sparings` gdy tab nieistnieje — patrz Phase 3 Task 9 routing audit)

Jeśli karta nie pojawia się gdy powinna — sprawdź konsolę + `/api/trpc/digest.get` response.

- [ ] **Step 8.4: Commit**

```bash
git add src/app/\(dashboard\)/feed/page.tsx src/app/\(dashboard\)/feed/feed-client.tsx
git commit -m "feat(digest): integrate DigestCard into feed with RSC prefetch"
```

---

## Phase 3 — Routing & cache invalidation

### Task 9: Routing fallback audit

**Cel:** zweryfikować czy href-y z digestu prowadzą do działających widoków. Jeśli filtr/tab nie istnieje, zapisać do backlogu i zmienić href na fallback.

**Hrefy do sprawdzenia:**

| href | Plik widoku | Realny support filtra? |
|------|-------------|-------------------------|
| `/sparings?tab=applications` | `src/app/(dashboard)/sparings/sparings-client.tsx` | ? |
| `/sparings?tab=invitations` | j.w. | ? |
| `/events?filter=pending-attendance` | `src/app/(dashboard)/events/page.tsx` | ? |
| `/events?filter=invited` | j.w. | ? |
| `/events?filter=recommended` | j.w. | ? |
| `/events?tab=my-applications` | j.w. | ? |
| `/calendar?range=week` | `src/app/(dashboard)/calendar/page.tsx` | ? |
| `/recruitment?filter=stale` | `src/app/(dashboard)/recruitment/` | ? |
| `/trainings?tab=applications` | `src/app/(dashboard)/trainings/` | ? |
| `/notifications?filter=invitations` | `src/app/(dashboard)/notifications/` | ? |
| `/messages` | — (bazowy) | ✅ |

- [ ] **Step 9.1: Zbadaj każdą stronę — szukaj `searchParams` / `useSearchParams`**

Run: `grep -rn "searchParams\|useSearchParams" src/app/\(dashboard\)/{sparings,events,calendar,recruitment,trainings,notifications}/ 2>/dev/null`

Dla każdej strony sprawdź: czy handluje query param z tabeli powyżej?

- [ ] **Step 9.2: Podejmij decyzje per href**

Dla każdego href z tabeli:
- **jeśli filtr istnieje** → zostaw href w `src/lib/digest.ts`.
- **jeśli nie istnieje i dodanie to <15 min pracy** (np. nowy `tab` state w istniejącym kliencie z istniejącymi listami) → **dodaj filtr**. Commit osobno: `feat(<widok>): support ?tab=... query param`.
- **jeśli filtr wymagałby nowego widoku** (np. PLAYER „my-applications") → **zmień href w `digest.ts` na rodzica** (`/events`) i dodaj TODO do backlogu.

- [ ] **Step 9.3: Zaktualizuj hrefy w `src/lib/digest.ts` zgodnie z decyzjami**

Punkty zmiany: 3 helpery × rows z `href`. Użyj dokładnie tych samych wartości co w `src/__tests__/digest.test.ts` — jeśli zmienisz href, zaktualizuj też testy (ale testy porównują tylko `key`, nie `href` → prawdopodobnie bez zmian).

- [ ] **Step 9.4: Dopisz backlog**

Plik: `STATE.md` sekcja „Znane Problemy", dodaj wiersze dla każdego brakującego filtra jako new bug z Priorytetem Low (np. „Filtr `?filter=pending-attendance` na `/events`").

- [ ] **Step 9.5: Commit**

```bash
git add src/lib/digest.ts STATE.md
git commit -m "feat(digest): audit routing targets, fallback unsupported filters"
```

---

### Task 10: Cache invalidation — `invalidateDigest` helper + mutation wiring

**Cel:** każda mutacja zmieniająca liczniki zeruje cache digestu po stronie klienta.

**Files:**
- Modify: wszystkie client-side pliki które wywołują mutacje z listy z pre-flight P2. Skeleton:
  - `src/components/sparings/` — sparing-form, sparing-card, apply/respond UI
  - `src/components/events/` — apply dialogs, attendance toggle
  - `src/components/squad/` — invite-member accept/reject
  - `src/components/recruitment/` — stage update (drag-drop Kanban)
  - `src/app/(dashboard)/messages/[conversationId]/` — message.send

**Pattern:** dodać `await utils.digest.get.invalidate()` w `onSuccess` callbacku każdej mutacji z listy. Używamy `utils` z `api.useUtils()`.

- [ ] **Step 10.1: Zlokalizuj wszystkie `useMutation` wywołania z mutacjami z listy**

Run:
```bash
grep -rn "api\.sparing\.applyFor\|api\.sparing\.respondToApplication\|api\.event\.applyFor\|api\.event\.respondToInvitation\|api\.event\.setAttendance\|api\.sparing\.invite\.respond\|api\.recruitment\.updateStage\|api\.message\.send" src/ --include="*.tsx" --include="*.ts"
```

Zanotuj listę plików + linii. To będzie twój changelog.

- [ ] **Step 10.2: Per plik — dodaj invalidate**

W każdym zlokalizowanym `useMutation`:

Przed zmianą (typowo):
```tsx
const mut = api.sparing.applyFor.useMutation({
  onSuccess: () => {
    utils.sparing.listOpen.invalidate();
    toast.success("Zgłoszenie wysłane");
  },
});
```

Po zmianie:
```tsx
const mut = api.sparing.applyFor.useMutation({
  onSuccess: () => {
    utils.sparing.listOpen.invalidate();
    utils.digest.get.invalidate(); // ← DODANE
    toast.success("Zgłoszenie wysłane");
  },
});
```

Jeśli komponent **nie ma** `utils` — dodaj `const utils = api.useUtils();` u góry komponentu.

- [ ] **Step 10.3: Type-check**

Run: `npx tsc --noEmit`
Expected: zero błędów.

- [ ] **Step 10.4: Manual smoke test**

Zaloguj jako CLUB w `npm run dev`. Mając aktywne sparing applications → wyklikaj `respondToApplication` → po akcji karta digest powinna natychmiast pokazać zaktualizowaną liczbę (nie czekać na 2min polling).

- [ ] **Step 10.5: Commit**

```bash
git add src/
git commit -m "feat(digest): invalidate digest cache after relevant mutations"
```

---

## Phase 4 — E2E

### Task 11: E2E spec dla digestu

**Files:**
- Create: `e2e/digest.spec.ts`

**Cel:** jeden happy path + jeden empty-state case.

- [ ] **Step 11.1: Zbadaj e2e/helpers.ts — jaki mamy support dla seed data**

Run: `head -200 e2e/helpers.ts`

Zanotuj:
- jak utworzyć klub z danymi (`registerClub` + login)
- czy jest helper do tworzenia sparing application

- [ ] **Step 11.2: Napisz test**

```ts
// e2e/digest.spec.ts
import { test, expect } from "@playwright/test";
import { registerClub, login, uniqueEmail } from "./helpers";

test.describe("Digest card", () => {
  test("new CLUB with zero activity does NOT see digest card", async ({ page }) => {
    const email = uniqueEmail("digest-empty");
    const password = "test1234";
    await registerClub(page, email, password, `Digest Empty ${Date.now()}`);
    await login(page, email, password);
    await page.goto("/feed");
    // Digest card nie powinna być widoczna (totalCount = 0)
    await expect(page.getByTestId("digest-card")).not.toBeVisible();
  });

  test("CLUB with pending application sees digest row (happy path)", async ({ page, browser }) => {
    // TODO: wymaga seed pending application — szczegóły w kroku 11.3.
    // Skip dopóki seed helper nie istnieje.
    test.fixme(true, "seed helper pending — dopisz gdy pojawi się potrzeba");
  });
});
```

Uzasadnienie `test.fixme`: seed-owanie pending application z UI wymaga rejestracji 2 klubów + stworzenia ogłoszenia + aplikacji (3+ kroki). Spec §7 E2E mówi „seed-owanej pending application" — przyjmijmy że start od minimum (empty case) i zostawmy happy path jako `fixme` do dopisania w osobnym stage (Etap +1), gdy pojawi się wspólny seed helper dla sparingowych flow.

- [ ] **Step 11.3: Run E2E test — expect PASS (1 test + 1 fixme)**

Upewnij się że dev server nie chodzi, Playwright startuje własny (patrz `playwright.config.ts`).

Run: `npx playwright test e2e/digest.spec.ts`
Expected: 1 pass, 1 fixme (pomarańczowy).

- [ ] **Step 11.4: Commit**

```bash
git add e2e/digest.spec.ts
git commit -m "test(digest): e2e — empty state + happy path fixme"
```

---

## Phase 5 — Quality gate + docs

### Task 12: Pełna bateria testów + typy + lint

- [ ] **Step 12.1: Vitest**

Run: `npm test`
Expected: wszystko pass (nowe testy + 67 istniejących z STATE.md).

- [ ] **Step 12.2: Playwright**

Run: `npm run test:e2e`
Expected: zielony (albo ten sam stan „43/47 + 2 fixme" + nowe `digest.spec.ts` 1/1 pass + 1 fixme).

- [ ] **Step 12.3: TypeScript**

Run: `npx tsc --noEmit`
Expected: zero errors.

- [ ] **Step 12.4: ESLint**

Run: `npm run lint`
Expected: zero errors/warnings.

- [ ] **Step 12.5: Dev build**

Run: `npm run build`
Expected: build success.

Jeśli którykolwiek krok fail — napraw i wróć do 12.1.

---

### Task 13: Update STATE.md + CHANGELOG.md

**Files:**
- Modify: `STATE.md`
- Modify: `CHANGELOG.md`

- [ ] **Step 13.1: Dodaj wiersz do „Ostatnie zmiany" w STATE.md (góra tabeli)**

```md
| 54 | 2026-04-17 | Digest Card: karta „Twój status" na feedzie per rola (CLUB/PLAYER/COACH) z agregatem liczników (aplikacje, zaproszenia, attendance 48h, upcoming 7d, stale pipeline, recommendations). Nowy `digest.get` tRPC endpoint, staleTime 2min + invalidation z 8 mutacji. |
```

Usuń najstarszy wiersz (FIFO, gdy tabela > 5 wierszy).

- [ ] **Step 13.2: Dopisz do „Co jest zbudowane" (sekcja UI/Design)**

Dodaj bullet:
```md
- **Digest Card:** karta „Twój status" na górze feedu, per rola, agregat liczników + linki do pre-filtered list, skip gdy 0, RSC prefetch, staleTime 2min
```

- [ ] **Step 13.3: Dopisz etap do CHANGELOG.md (append-only)**

Format jak istniejące etapy (data, opis, zmienione pliki).

- [ ] **Step 13.4: Commit**

```bash
git add STATE.md CHANGELOG.md
git commit -m "docs: update STATE and CHANGELOG with digest card (Etap 54)"
```

---

## Phase 6 — Wrap up

### Task 14: Simplify review

Przejrzyj zmiany jeszcze raz:
- [ ] Czy `src/lib/digest.ts` ma duplikację między 3 helperami? Jeśli >20 linii powtórzonego kodu → rozważ `filterRows(candidates)` helper. Ale tylko jeśli rzeczywiście jest DRY violation — nie wymuszać abstrakcji.
- [ ] Czy komentarze opisują "co", czy "dlaczego"? Usuń komentarze typu „// Attendance 48h" jeśli nazwa zmiennej już o tym mówi.
- [ ] Czy nie ma martwego kodu (unused imports, unused state)?

- [ ] **Step 14.1: Final commit (jeśli są poprawki)**

```bash
git commit -am "refactor(digest): simplify duplication / dead code per review"
```

### Task 15: Handoff notes

- [ ] **Step 15.1: Push branch, open PR** (jeśli projekt działa na PR flow) lub push do main.

Run: `git log --oneline main~15..HEAD` — sprawdź czy ~15 commitów jest spójnych.

Run: `git push origin main` (lub `git push origin HEAD:digest-card` + otwórz PR).

- [ ] **Step 15.2: Deploy + post-deploy smoke**

Po deploy na Vercel: wejdź na `https://pilkarski.vercel.app/feed` jako test CLUB z pending application → sprawdź że karta widoczna + klik działa.

---

## Rollback plan

Feature jest enhancement, można safe rollback w 3 krokach:
1. `git revert` commitów digest (6-15 commits w łańcuchu).
2. Re-deploy.
3. Issue do backloga z hipotezą dlaczego trzeba było cofnąć.

Nie ma feature flag — jeśli chcemy bezpieczniejszy rollout w przyszłości, dodać `NEXT_PUBLIC_DIGEST_ENABLED` env var + guard w `DigestCard` (osobny spec).

---

## Open items pozostawione do przyszłych sesji

- Happy-path E2E z seed-owaną pending application (Task 11 fixme).
- Faktyczne filtry `?filter=...` dla endpointów które nie mają (Task 9.4 backlog).
- PLAYER view „Twoje aplikacje" (finding D2 z auditu — osobny spec).
- Telemetria click-through na wierszach digestu (v2).
- Inline actions (wariant B/C z auditu — osobny spec jeśli dane pokażą low CTR).
