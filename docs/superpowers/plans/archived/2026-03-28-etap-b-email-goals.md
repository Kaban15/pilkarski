# Etap B: Email Transakcyjne + Protokół Meczowy — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add transactional emails (Resend) for 6 key actions and a match protocol system (goal scorers with notifications and gamification).

**Architecture:** Two independent features. Email system: helper + template + throttle, integrated into existing routers via fire-and-forget calls alongside push. Match goals: new Prisma model + 3 tRPC procedures + UI in score section and club profile.

**Tech Stack:** Resend (email), Prisma (schema), tRPC, React, Vitest (tests)

**Spec:** `docs/superpowers/specs/2026-03-28-etap-b-email-goals.md`

---

## Part 1: Email Transakcyjne

### Task 1: Install Resend + Email Template + Tests

**Files:**
- Modify: `package.json`
- Create: `src/lib/email-template.ts`
- Create: `src/__tests__/email-template.test.ts`

- [ ] **Step 1: Install resend**

Run: `npm install resend`

- [ ] **Step 2: Create email template**

Create `src/lib/email-template.ts`:

```typescript
export function renderEmailHtml(
  title: string,
  message: string,
  ctaLabel: string,
  ctaUrl: string
): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;max-width:600px;">
        <tr><td style="background:linear-gradient(135deg,#7c3aed,#0ea5e9);padding:24px;text-align:center;">
          <div style="width:48px;height:48px;border-radius:12px;background:rgba(255,255,255,0.2);display:inline-flex;align-items:center;justify-content:center;font-weight:800;font-size:20px;color:#fff;line-height:48px;">PS</div>
        </td></tr>
        <tr><td style="padding:32px 24px;">
          <h1 style="margin:0 0 16px;font-size:22px;color:#111827;">${escapeHtml(title)}</h1>
          <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#4b5563;">${escapeHtml(message)}</p>
          <a href="${escapeHtml(ctaUrl)}" style="display:inline-block;background:#7c3aed;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;font-size:14px;">${escapeHtml(ctaLabel)}</a>
        </td></tr>
        <tr><td style="padding:16px 24px;border-top:1px solid #e5e7eb;text-align:center;">
          <p style="margin:0;font-size:12px;color:#9ca3af;">PilkaSport — Platforma dla polskiego futbolu</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
```

- [ ] **Step 3: Write template tests**

Create `src/__tests__/email-template.test.ts`:

```typescript
import { renderEmailHtml } from "@/lib/email-template";

describe("renderEmailHtml", () => {
  it("renders complete HTML with all params", () => {
    const html = renderEmailHtml("Tytuł", "Treść wiadomości", "Kliknij", "https://example.com");
    expect(html).toContain("Tytuł");
    expect(html).toContain("Treść wiadomości");
    expect(html).toContain("Kliknij");
    expect(html).toContain("https://example.com");
    expect(html).toContain("PilkaSport");
    expect(html).toContain("<!DOCTYPE html>");
  });

  it("escapes HTML in params", () => {
    const html = renderEmailHtml("<script>alert(1)</script>", "a&b", "ok", "https://x.com");
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("a&amp;b");
  });

  it("includes PS logo and violet gradient", () => {
    const html = renderEmailHtml("T", "M", "C", "https://x.com");
    expect(html).toContain("#7c3aed");
    expect(html).toContain("PS");
  });
});
```

- [ ] **Step 4: Run tests**

Run: `npm test -- src/__tests__/email-template.test.ts`
Expected: 3 tests pass

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json src/lib/email-template.ts src/__tests__/email-template.test.ts
git commit -m "feat: add Resend dependency + email HTML template with tests"
```

---

### Task 2: Email Throttle + Tests

**Files:**
- Create: `src/lib/email-throttle.ts`
- Create: `src/__tests__/email-throttle.test.ts`

- [ ] **Step 1: Create throttle**

Create `src/lib/email-throttle.ts`:

```typescript
const THROTTLE_MS = 15 * 60 * 1000; // 15 minutes
const CLEANUP_MS = 60 * 60 * 1000; // 1 hour

const lastSent = new Map<string, number>();

let cleanupTimer: ReturnType<typeof setInterval> | null = null;

function ensureCleanup() {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, ts] of lastSent) {
      if (now - ts > CLEANUP_MS) lastSent.delete(key);
    }
    if (lastSent.size === 0 && cleanupTimer) {
      clearInterval(cleanupTimer);
      cleanupTimer = null;
    }
  }, CLEANUP_MS);
}

export function shouldSendEmail(userId: string, type: string): boolean {
  const key = `${userId}-${type}`;
  const now = Date.now();
  const last = lastSent.get(key);
  if (last && now - last < THROTTLE_MS) return false;
  lastSent.set(key, now);
  ensureCleanup();
  return true;
}

// For testing
export function _resetThrottle() {
  lastSent.clear();
  if (cleanupTimer) {
    clearInterval(cleanupTimer);
    cleanupTimer = null;
  }
}
```

- [ ] **Step 2: Write throttle tests**

Create `src/__tests__/email-throttle.test.ts`:

```typescript
import { shouldSendEmail, _resetThrottle } from "@/lib/email-throttle";
import { beforeEach, describe, it, expect } from "vitest";

beforeEach(() => {
  _resetThrottle();
});

describe("shouldSendEmail", () => {
  it("allows first send", () => {
    expect(shouldSendEmail("user-1", "message")).toBe(true);
  });

  it("blocks rapid second send for same user+type", () => {
    shouldSendEmail("user-1", "message");
    expect(shouldSendEmail("user-1", "message")).toBe(false);
  });

  it("allows different users", () => {
    shouldSendEmail("user-1", "message");
    expect(shouldSendEmail("user-2", "message")).toBe(true);
  });

  it("allows different types for same user", () => {
    shouldSendEmail("user-1", "message");
    expect(shouldSendEmail("user-1", "sparing")).toBe(true);
  });
});
```

- [ ] **Step 3: Run tests**

Run: `npm test -- src/__tests__/email-throttle.test.ts`
Expected: 4 tests pass

- [ ] **Step 4: Commit**

```bash
git add src/lib/email-throttle.ts src/__tests__/email-throttle.test.ts
git commit -m "feat: add email throttle with 15min debounce + tests"
```

---

### Task 3: Send Email Helper

**Files:**
- Create: `src/server/send-email.ts`

- [ ] **Step 1: Create helper**

Create `src/server/send-email.ts`:

```typescript
import { Resend } from "resend";
import { renderEmailHtml } from "@/lib/email-template";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM = process.env.NODE_ENV === "production"
  ? "PilkaSport <noreply@pilkasport.pl>"
  : "PilkaSport <onboarding@resend.dev>";

interface EmailBody {
  title: string;
  message: string;
  ctaLabel: string;
  ctaUrl: string;
}

export async function sendEmailToUser(
  db: { user: { findUnique: (args: any) => Promise<any> } },
  userId: string,
  subject: string,
  body: EmailBody
): Promise<void> {
  if (!resend) return;

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });

  if (!user?.email) return;

  const html = renderEmailHtml(body.title, body.message, body.ctaLabel, body.ctaUrl);

  await resend.emails.send({
    from: FROM,
    to: user.email,
    subject,
    html,
  });
}
```

- [ ] **Step 2: Verify TypeScript**

Run: `npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add src/server/send-email.ts
git commit -m "feat: add sendEmailToUser helper (Resend)"
```

---

### Task 4: Integrate Emails into Routers

**Files:**
- Modify: `src/server/trpc/routers/sparing.ts`
- Modify: `src/server/trpc/routers/message.ts`
- Modify: `src/server/trpc/routers/club-membership.ts`

- [ ] **Step 1: Add emails to sparing router**

In `src/server/trpc/routers/sparing.ts`:

1. Add import at top:
```typescript
import { sendEmailToUser } from "@/server/send-email";
```

2. Add `const baseUrl = process.env.NEXTAUTH_URL || "https://pilkarski.vercel.app";` near top of file (after imports).

3. In `applyFor` — after the existing `sendPushToUser(offer.club.userId, ...)` call, add:
```typescript
      sendEmailToUser(ctx.db, offer.club.userId, "Nowe zgłoszenie na sparing", {
        title: "Nowe zgłoszenie na sparing",
        message: `${club.name} chce zagrać sparing: ${offer.title}`,
        ctaLabel: "Zobacz zgłoszenie",
        ctaUrl: `${baseUrl}/sparings/${offer.id}`,
      }).catch(() => {});
```

4. In `respond` — after the existing `sendPushToUser(updated.applicantClub.userId, ...)` call, add:
```typescript
      sendEmailToUser(ctx.db, updated.applicantClub.userId, notifTitle, {
        title: notifTitle,
        message: notifMessage,
        ctaLabel: "Zobacz szczegóły",
        ctaUrl: `${baseUrl}/sparings/${application.sparingOfferId}`,
      }).catch(() => {});
```

5. In `submitScore` — after the existing `sendPushToUser(otherUserId, ...)` call, add:
```typescript
        sendEmailToUser(ctx.db, otherUserId, "Wynik meczu do potwierdzenia", {
          title: "Wynik meczu do potwierdzenia",
          message: `Wynik ${input.homeScore}:${input.awayScore} czeka na potwierdzenie`,
          ctaLabel: "Potwierdź wynik",
          ctaUrl: `${baseUrl}/sparings/${input.sparingId}`,
        }).catch(() => {});
```

6. In `invite` — after the existing `sendPushToUser(toClub.userId, ...)` call, add:
```typescript
      sendEmailToUser(ctx.db, toClub.userId, "Zaproszenie na sparing", {
        title: "Zaproszenie na sparing",
        message: `${club.name} zaprasza na: ${sparing.title}`,
        ctaLabel: "Zobacz zaproszenie",
        ctaUrl: `${baseUrl}/sparings/${sparing.id}`,
      }).catch(() => {});
```

- [ ] **Step 2: Add email to message router**

In `src/server/trpc/routers/message.ts`:

1. Add imports:
```typescript
import { sendEmailToUser } from "@/server/send-email";
import { shouldSendEmail } from "@/lib/email-throttle";
```

2. In `send` — after the existing `ctx.db.notification.create(...)` block, add:
```typescript
      const baseUrl = process.env.NEXTAUTH_URL || "https://pilkarski.vercel.app";
      if (shouldSendEmail(input.recipientUserId, "message")) {
        sendEmailToUser(ctx.db, input.recipientUserId, "Nowa wiadomość na PilkaSport", {
          title: "Nowa wiadomość",
          message: `${senderName}: ${input.content.substring(0, 100)}`,
          ctaLabel: "Odpowiedz",
          ctaUrl: `${baseUrl}/messages/${conversationId}`,
        }).catch(() => {});
      }
```

- [ ] **Step 3: Add email to club-membership router**

In `src/server/trpc/routers/club-membership.ts`:

1. Add import:
```typescript
import { sendEmailToUser } from "@/server/send-email";
```

2. In `invite` — after the existing `sendPushToUser(input.userId, ...)` call, add:
```typescript
      const baseUrl = process.env.NEXTAUTH_URL || "https://pilkarski.vercel.app";
      sendEmailToUser(ctx.db, input.userId, "Zaproszenie do klubu", {
        title: "Zaproszenie do klubu",
        message: `Klub ${club.name} zaprasza Cię do kadry`,
        ctaLabel: "Zobacz zaproszenie",
        ctaUrl: `${baseUrl}/feed`,
      }).catch(() => {});
```

- [ ] **Step 4: Verify TypeScript**

Run: `npx tsc --noEmit`

- [ ] **Step 5: Commit**

```bash
git add src/server/trpc/routers/sparing.ts src/server/trpc/routers/message.ts src/server/trpc/routers/club-membership.ts
git commit -m "feat: integrate transactional emails into 3 routers (6 triggers)"
```

---

## Part 2: Protokół Meczowy (Strzelcy)

### Task 5: Schema + Migration + Labels

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `src/lib/gamification.ts`
- Modify: `src/lib/labels.ts`
- Modify: `src/__tests__/gamification.test.ts`

- [ ] **Step 1: Add MatchGoal model to schema**

In `prisma/schema.prisma`:

1. Add `GOAL_ADDED` to `NotificationType` enum (after `SCORE_REJECTED`).

2. Add `goals MatchGoal[]` to `SparingOffer` model (after the existing `goals` or at end of fields before closing brace).

3. Add `goals MatchGoal[]` to `User` model.

4. Add the new model at the end of the file:

```prisma
model MatchGoal {
  id              String        @id @default(uuid()) @db.Uuid
  sparingOfferId  String        @map("sparing_offer_id") @db.Uuid
  scorerUserId    String        @map("scorer_user_id") @db.Uuid
  minute          Int?
  ownGoal         Boolean       @default(false) @map("own_goal")
  createdAt       DateTime      @default(now()) @map("created_at") @db.Timestamptz

  sparingOffer    SparingOffer  @relation(fields: [sparingOfferId], references: [id], onDelete: Cascade)
  scorerUser      User          @relation(fields: [scorerUserId], references: [id], onDelete: Cascade)

  @@index([sparingOfferId])
  @@map("match_goals")
}
```

- [ ] **Step 2: Add gamification action**

In `src/lib/gamification.ts`, add to `POINTS_MAP`:
```typescript
  goal_scored: 5,
```

Add to `POINTS_LABELS`:
```typescript
  goal_scored: "Bramka w meczu",
```

- [ ] **Step 3: Add notification label**

In `src/lib/labels.ts`, add to `NOTIFICATION_TYPE_LABELS`:
```typescript
  GOAL_ADDED: "Bramka",
```

Add to `NOTIFICATION_TYPE_COLORS`:
```typescript
  GOAL_ADDED: "emerald",
```

- [ ] **Step 4: Update gamification test**

In `src/__tests__/gamification.test.ts`, update the POINTS_MAP count:
```typescript
  it("has 17 actions", () => {   // was 16
    expect(Object.keys(POINTS_MAP)).toHaveLength(17);
  });
```

- [ ] **Step 5: Run tests**

Run: `npm test`
Expected: All pass

- [ ] **Step 6: Create migration**

Run: `npx prisma generate`
Then create migration (user will provide DB URL):
```bash
npm run db:migrate -- --url "DATABASE_URL_HERE" --name add_match_goals
```

- [ ] **Step 7: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/ src/lib/gamification.ts src/lib/labels.ts src/__tests__/gamification.test.ts
git commit -m "feat: add MatchGoal schema + GOAL_ADDED notification + goal_scored points"
```

---

### Task 6: Match Goal Validator + Backend Procedures

**Files:**
- Create: `src/lib/validators/match-goal.ts`
- Modify: `src/server/trpc/routers/sparing.ts`

- [ ] **Step 1: Create validator**

Create `src/lib/validators/match-goal.ts`:

```typescript
import { z } from "zod/v4";

export const addGoalSchema = z.object({
  sparingOfferId: z.string().uuid(),
  scorerUserId: z.string().uuid(),
  minute: z.number().int().min(0).max(120).optional(),
  ownGoal: z.boolean().default(false),
});

export const removeGoalSchema = z.object({
  goalId: z.string().uuid(),
});

export const getGoalsSchema = z.object({
  sparingOfferId: z.string().uuid(),
});
```

- [ ] **Step 2: Add 3 procedures to sparing router**

In `src/server/trpc/routers/sparing.ts`, add imports:

```typescript
import { addGoalSchema, removeGoalSchema, getGoalsSchema } from "@/lib/validators/match-goal";
import { sendEmailToUser } from "@/server/send-email"; // already imported from Task 4
```

Add 3 new procedures to the router:

**`getGoals`:**
```typescript
  getGoals: publicProcedure
    .input(getGoalsSchema)
    .query(async ({ ctx, input }) => {
      return ctx.db.matchGoal.findMany({
        where: { sparingOfferId: input.sparingOfferId },
        include: {
          scorerUser: {
            select: {
              id: true,
              player: { select: { id: true, firstName: true, lastName: true, photoUrl: true } },
              coach: { select: { id: true, firstName: true, lastName: true, photoUrl: true } },
            },
          },
        },
        orderBy: [{ minute: { sort: "asc", nulls: "last" } }, { createdAt: "asc" }],
      });
    }),
```

**`addGoal`:**
```typescript
  addGoal: protectedProcedure
    .input(addGoalSchema)
    .mutation(async ({ ctx, input }) => {
      const sparing = await ctx.db.sparingOffer.findUnique({
        where: { id: input.sparingOfferId },
        include: {
          club: { select: { id: true, userId: true, name: true } },
          applications: {
            where: { status: "ACCEPTED" },
            include: { applicantClub: { select: { id: true, userId: true, name: true } } },
          },
        },
      });

      if (!sparing || sparing.status !== "COMPLETED" || !sparing.scoreConfirmed) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Sparing musi być zakończony z potwierdzonym wynikiem" });
      }

      const matchedApp = sparing.applications[0];
      if (!matchedApp) throw new TRPCError({ code: "BAD_REQUEST", message: "Brak dopasowanego klubu" });

      const isHomeOwner = sparing.club.userId === ctx.session.user.id;
      const isAwayOwner = matchedApp.applicantClub.userId === ctx.session.user.id;
      if (!isHomeOwner && !isAwayOwner) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Tylko właściciele klubów mogą dodawać bramki" });
      }

      // Check scorer is member of one of the clubs
      const membership = await ctx.db.clubMembership.findFirst({
        where: {
          memberUserId: input.scorerUserId,
          status: "ACCEPTED",
          clubId: { in: [sparing.club.id, matchedApp.applicantClub.id] },
        },
        select: { clubId: true },
      });

      if (!membership) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Strzelec musi być członkiem jednego z klubów" });
      }

      // Check goal count doesn't exceed score
      const isHomeTeam = membership.clubId === sparing.club.id;
      const sideScore = isHomeTeam ? sparing.homeScore! : sparing.awayScore!;
      const existingGoals = await ctx.db.matchGoal.count({
        where: {
          sparingOfferId: input.sparingOfferId,
          scorerUser: {
            clubMemberships: { some: { clubId: membership.clubId, status: "ACCEPTED" } },
          },
          ownGoal: false,
        },
      });
      // Own goals count for the OTHER side, regular goals for this side
      if (!input.ownGoal && existingGoals >= sideScore) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Liczba bramek nie może przekroczyć wyniku" });
      }

      const goal = await ctx.db.matchGoal.create({
        data: {
          sparingOfferId: input.sparingOfferId,
          scorerUserId: input.scorerUserId,
          minute: input.minute,
          ownGoal: input.ownGoal,
        },
      });

      // Notification + email + points to scorer
      const opponent = isHomeTeam ? matchedApp.applicantClub.name : sparing.club.name;
      ctx.db.notification.create({
        data: {
          userId: input.scorerUserId,
          type: "GOAL_ADDED",
          title: "Bramka dodana!",
          message: `Twoja bramka w meczu z ${opponent} została zapisana`,
          link: `/sparings/${input.sparingOfferId}`,
        },
      }).catch(() => {});

      sendPushToUser(input.scorerUserId, {
        title: "Bramka dodana!",
        body: `Twoja bramka w meczu z ${opponent}`,
        url: `/sparings/${input.sparingOfferId}`,
      }).catch(() => {});

      sendEmailToUser(ctx.db, input.scorerUserId, "Bramka dodana!", {
        title: "Bramka dodana!",
        message: `Twoja bramka w meczu z ${opponent} została zapisana`,
        ctaLabel: "Zobacz mecz",
        ctaUrl: `${baseUrl}/sparings/${input.sparingOfferId}`,
      }).catch(() => {});

      awardPoints(ctx.db, input.scorerUserId, "goal_scored", input.sparingOfferId).catch(() => {});

      return goal;
    }),
```

**`removeGoal`:**
```typescript
  removeGoal: protectedProcedure
    .input(removeGoalSchema)
    .mutation(async ({ ctx, input }) => {
      const goal = await ctx.db.matchGoal.findUnique({
        where: { id: input.goalId },
        include: {
          sparingOffer: { select: { club: { select: { userId: true } }, applications: { where: { status: "ACCEPTED" }, select: { applicantClub: { select: { userId: true } } } } } },
        },
      });

      if (!goal) throw new TRPCError({ code: "NOT_FOUND" });

      const isHomeOwner = goal.sparingOffer.club.userId === ctx.session.user.id;
      const isAwayOwner = goal.sparingOffer.applications[0]?.applicantClub.userId === ctx.session.user.id;
      if (!isHomeOwner && !isAwayOwner) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      await ctx.db.matchGoal.delete({ where: { id: input.goalId } });
      return { success: true };
    }),
```

- [ ] **Step 3: Verify TypeScript**

Run: `npx tsc --noEmit`

- [ ] **Step 4: Commit**

```bash
git add src/lib/validators/match-goal.ts src/server/trpc/routers/sparing.ts
git commit -m "feat: add addGoal/removeGoal/getGoals procedures to sparing router"
```

---

### Task 7: Goals UI in Score Section

**Files:**
- Modify: `src/app/(dashboard)/sparings/[id]/_components/score-section.tsx`

- [ ] **Step 1: Read the current score-section.tsx**

Read the file to understand its current structure, props, and how it renders.

- [ ] **Step 2: Add goals display and management**

After the confirmed score display section, add:

1. **Goals query:** `api.sparing.getGoals.useQuery({ sparingOfferId })` — fetch goals when score is confirmed.

2. **Goals list:** Below the score, render a "Strzelcy" section:
   - Section label: `text-[11px] font-bold uppercase tracking-wider text-muted-foreground`
   - Each goal row: `⚽` icon + scorer name (Link to profile) + minute if present (`45'`) + "(SB)" badge if ownGoal
   - Delete button (Trash2 icon) visible for authorized users (isOwner or isAwayOwner)

3. **Add goal form:** Visible for club owners when score confirmed:
   - "Dodaj strzelca" button that toggles form
   - Select scorer: query both clubs' ACCEPTED members, grouped by club name
   - Minute input (number, optional, 0-120)
   - Own goal checkbox
   - Submit button
   - Uses `api.sparing.addGoal.useMutation` with `onSuccess: () => goalsQuery.refetch()`

4. **Members query for scorer selector:**
   - Two queries: members of home club + members of away club
   - Only fetch when add form is open
   - Combine into grouped options for Select

- [ ] **Step 3: Verify TypeScript**

Run: `npx tsc --noEmit`

- [ ] **Step 4: Commit**

```bash
git add src/app/(dashboard)/sparings/[id]/_components/score-section.tsx
git commit -m "feat: add goals display and management UI in score section"
```

---

### Task 8: Goals in Club Profile

**Files:**
- Modify: `src/app/(public)/clubs/[id]/club-profile-tabs.tsx`

- [ ] **Step 1: Read club-profile-tabs.tsx**

Read the file to understand how match rows are rendered in the Mecze tab.

- [ ] **Step 2: Add goals under match results**

In the Mecze tab, for each match with confirmed score:
- Query goals via a prop passed from the server component (add goals to the existing match data query)
- Under the MatchCard row, if goals exist, show a compact line: `⚽ Kowalski 23', Nowak 67'`
- Style: `text-[11px] text-muted-foreground ml-14` (indented under the match)
- Own goals shown with "(s)" suffix

This requires the server component (`clubs/[id]/page.tsx`) to include goals in the match data it passes to the client component.

- [ ] **Step 3: Update server component to include goals**

In `src/app/(public)/clubs/[id]/page.tsx`, update the completedMatches query to include:
```typescript
goals: {
  include: {
    scorerUser: {
      select: {
        player: { select: { firstName: true, lastName: true } },
        coach: { select: { firstName: true, lastName: true } },
      },
    },
  },
  orderBy: [{ minute: { sort: "asc", nulls: "last" } }],
},
```

Pass goals data through to `ClubProfileTabs`.

- [ ] **Step 4: Verify TypeScript**

Run: `npx tsc --noEmit`

- [ ] **Step 5: Commit**

```bash
git add src/app/(public)/clubs/[id]/page.tsx src/app/(public)/clubs/[id]/club-profile-tabs.tsx
git commit -m "feat: show goal scorers in club profile match history"
```

---

### Task 9: Final Verification

- [ ] **Step 1: Run all unit tests**

Run: `npm test`
Expected: All pass (~40 tests)

- [ ] **Step 2: TypeScript check**

Run: `npx tsc --noEmit`

- [ ] **Step 3: Build**

Run: `npm run build`

- [ ] **Step 4: Commit if any fixes**

```bash
git add -A
git commit -m "fix: final adjustments after Etap B"
```

---

## File Summary

| # | File | Action | Task |
|---|------|--------|------|
| 1 | `package.json` | Modify (+resend) | T1 |
| 2 | `src/lib/email-template.ts` | Create | T1 |
| 3 | `src/__tests__/email-template.test.ts` | Create | T1 |
| 4 | `src/lib/email-throttle.ts` | Create | T2 |
| 5 | `src/__tests__/email-throttle.test.ts` | Create | T2 |
| 6 | `src/server/send-email.ts` | Create | T3 |
| 7 | `src/server/trpc/routers/sparing.ts` | Modify (emails + goals) | T4, T6 |
| 8 | `src/server/trpc/routers/message.ts` | Modify (email) | T4 |
| 9 | `src/server/trpc/routers/club-membership.ts` | Modify (email) | T4 |
| 10 | `prisma/schema.prisma` | Modify (+MatchGoal) | T5 |
| 11 | `src/lib/gamification.ts` | Modify (+goal_scored) | T5 |
| 12 | `src/lib/labels.ts` | Modify (+GOAL_ADDED) | T5 |
| 13 | `src/__tests__/gamification.test.ts` | Modify (count 17) | T5 |
| 14 | `src/lib/validators/match-goal.ts` | Create | T6 |
| 15 | `src/app/(dashboard)/sparings/[id]/_components/score-section.tsx` | Modify | T7 |
| 16 | `src/app/(public)/clubs/[id]/page.tsx` | Modify | T8 |
| 17 | `src/app/(public)/clubs/[id]/club-profile-tabs.tsx` | Modify | T8 |
