# Cost Tracking — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add cost info (PLN) and payment status tracking to sparings, events, and tournaments.

**Architecture:** New nullable fields on existing models. 2 new procedures (markCostPaid, markTeamPaid). UI: cost field in forms, PLN badge on cards, payment status toggles for participants. No new tables or dependencies.

**Tech Stack:** Prisma (schema), tRPC, React, Tailwind

**Spec:** `docs/superpowers/specs/2026-03-28-cost-tracking.md`

---

### Task 1: Schema + Validators

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `src/lib/validators/sparing.ts`
- Modify: `src/lib/validators/event.ts`
- Modify: `src/lib/validators/tournament.ts`

- [ ] **Step 1: Add fields to schema**

In `SparingOffer` model, add after existing fields (before relations):
```prisma
  costPerTeam   Int?     @map("cost_per_team")
  costPaidHome  Boolean  @default(false) @map("cost_paid_home")
  costPaidAway  Boolean  @default(false) @map("cost_paid_away")
```

In `Event` model, add:
```prisma
  costPerPerson Int?     @map("cost_per_person")
```

In `Tournament` model, add:
```prisma
  costPerTeam   Int?     @map("cost_per_team")
```

In `TournamentTeam` model, add:
```prisma
  costPaid      Boolean  @default(false) @map("cost_paid")
```

- [ ] **Step 2: Update validators**

In `src/lib/validators/sparing.ts`, add to `createSparingSchema`:
```typescript
  costPerTeam: z.number().int().min(0).max(10000).optional(),
```

Add new export:
```typescript
export const markCostPaidSchema = z.object({
  sparingId: z.string().uuid(),
  side: z.enum(["home", "away"]),
  paid: z.boolean(),
});
```

In `src/lib/validators/event.ts`, add to `createEventSchema`:
```typescript
  costPerPerson: z.number().int().min(0).max(10000).optional(),
```

In `src/lib/validators/tournament.ts`, add to `createTournamentSchema`:
```typescript
  costPerTeam: z.number().int().min(0).max(10000).optional(),
```

Add new export:
```typescript
export const markTeamPaidSchema = z.object({
  teamId: z.string().uuid(),
  paid: z.boolean(),
});
```

- [ ] **Step 3: Generate Prisma client**

Run: `npx prisma generate`

- [ ] **Step 4: Verify TypeScript**

Run: `npx tsc --noEmit`

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma src/lib/validators/
git commit -m "feat: add cost fields to schema + validators (sparings, events, tournaments)"
```

---

### Task 2: Backend — markCostPaid + markTeamPaid + cost in create/update

**Files:**
- Modify: `src/server/trpc/routers/sparing.ts`
- Modify: `src/server/trpc/routers/event.ts`
- Modify: `src/server/trpc/routers/tournament.ts`

- [ ] **Step 1: Sparing router — add costPerTeam to create/update + markCostPaid**

Read `sparing.ts`. In `create` and `update` procedures, add `costPerTeam` to the data passed to Prisma (it's already in the input schema via validator).

Add new procedure `markCostPaid`:
```typescript
  markCostPaid: protectedProcedure
    .input(markCostPaidSchema)
    .mutation(async ({ ctx, input }) => {
      const sparing = await ctx.db.sparingOffer.findUnique({
        where: { id: input.sparingId },
        include: {
          club: { select: { userId: true } },
          applications: { where: { status: "ACCEPTED" }, select: { applicantClub: { select: { userId: true } } } },
        },
      });
      if (!sparing || (sparing.status !== "MATCHED" && sparing.status !== "COMPLETED")) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Sparing musi być dopasowany lub zakończony" });
      }
      if (input.side === "home" && sparing.club.userId !== ctx.session.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      if (input.side === "away" && sparing.applications[0]?.applicantClub.userId !== ctx.session.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return ctx.db.sparingOffer.update({
        where: { id: input.sparingId },
        data: input.side === "home" ? { costPaidHome: input.paid } : { costPaidAway: input.paid },
      });
    }),
```

Import `markCostPaidSchema` from validators.

- [ ] **Step 2: Event router — add costPerPerson to create/update**

Read `event.ts`. Add `costPerPerson` to the data in create and update procedures.

- [ ] **Step 3: Tournament router — add costPerTeam to create/update + markTeamPaid**

Read `tournament.ts`. Add `costPerTeam` to create/update.

Add procedure `markTeamPaid`:
```typescript
  markTeamPaid: protectedProcedure
    .input(markTeamPaidSchema)
    .mutation(async ({ ctx, input }) => {
      const team = await ctx.db.tournamentTeam.findUnique({
        where: { id: input.teamId },
        include: { tournament: { select: { creatorUserId: true } } },
      });
      if (!team) throw new TRPCError({ code: "NOT_FOUND" });
      if (team.tournament.creatorUserId !== ctx.session.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Tylko organizator może oznaczać opłaty" });
      }
      return ctx.db.tournamentTeam.update({
        where: { id: input.teamId },
        data: { costPaid: input.paid },
      });
    }),
```

Import `markTeamPaidSchema` from validators.

- [ ] **Step 4: Verify TypeScript**

Run: `npx tsc --noEmit`

- [ ] **Step 5: Commit**

```bash
git add src/server/trpc/routers/sparing.ts src/server/trpc/routers/event.ts src/server/trpc/routers/tournament.ts
git commit -m "feat: add cost tracking procedures (markCostPaid, markTeamPaid)"
```

---

### Task 3: Frontend — Cost in Forms + Badges on Cards + Payment Toggles

**Files:**
- Modify: `src/components/sparings/sparing-form.tsx`
- Modify: `src/components/sparings/sparing-card.tsx`
- Modify: `src/app/(dashboard)/sparings/[id]/page.tsx` or `_components/sparing-info.tsx`
- Modify: `src/app/(dashboard)/events/page.tsx`
- Modify: `src/app/(dashboard)/events/[id]/page.tsx`
- Modify: `src/app/(dashboard)/tournaments/[id]/page.tsx`

- [ ] **Step 1: Sparing form — add cost field**

In `sparing-form.tsx`, add a field "Koszt na drużynę (PLN)":
- Input type="number" min=0 placeholder="0 = darmowy"
- Optional, integrates with existing form state
- Add to both quick and full form modes

- [ ] **Step 2: Sparing card — add PLN badge**

In `sparing-card.tsx`, if `costPerTeam > 0`, show amber badge `"${costPerTeam} PLN"` near date/location row.

- [ ] **Step 3: Sparing detail — cost display + payment section**

In the sparing info/detail component:
- Show cost publicly if set: "Koszt: X PLN na drużynę"
- "Rozliczenie" section — visible only for participants when MATCHED/COMPLETED:
  - Row per side: club name + badge "Opłacone" (emerald) or "Nieopłacone" (amber)
  - Toggle button for own side only (api.sparing.markCostPaid mutation)

- [ ] **Step 4: Event forms — add cost field**

In events/new and events/[id]/edit, add "Koszt na osobę (PLN)" Input field.

- [ ] **Step 5: Event list + detail — PLN badge**

In events/page.tsx: if costPerPerson > 0, amber badge on event cards.
In events/[id]/page.tsx: show cost in info section.

- [ ] **Step 6: Tournament detail — cost + paid toggles**

In tournaments/[id]/page.tsx:
- Show costPerTeam in hero/info if set
- In Drużyny tab: per team, show "Opłacone"/"Nieopłacone" badge + toggle (organizer only, api.tournament.markTeamPaid mutation)

- [ ] **Step 7: Verify TypeScript + build**

Run: `npx tsc --noEmit && npm run build`

- [ ] **Step 8: Commit**

```bash
git add src/components/sparings/ src/app/(dashboard)/sparings/ src/app/(dashboard)/events/ src/app/(dashboard)/tournaments/
git commit -m "feat: add cost display + payment tracking UI (sparings, events, tournaments)"
```

---

### Task 4: Migration + Final Verification

- [ ] **Step 1: Create and apply migration**

Create migration file and apply to DB (6 ALTER TABLE ADD COLUMN).

- [ ] **Step 2: Run tests**

Run: `npm test`

- [ ] **Step 3: Build**

Run: `npm run build`

- [ ] **Step 4: Commit**

```bash
git add prisma/migrations/ scripts/
git commit -m "feat: add cost fields migration"
```

---

## File Summary

| # | File | Action | Task |
|---|------|--------|------|
| 1 | `prisma/schema.prisma` | Modify (+6 fields) | T1 |
| 2 | `src/lib/validators/sparing.ts` | Modify (+cost, +markCostPaid) | T1 |
| 3 | `src/lib/validators/event.ts` | Modify (+cost) | T1 |
| 4 | `src/lib/validators/tournament.ts` | Modify (+cost, +markTeamPaid) | T1 |
| 5 | `src/server/trpc/routers/sparing.ts` | Modify (+markCostPaid, cost in create/update) | T2 |
| 6 | `src/server/trpc/routers/event.ts` | Modify (cost in create/update) | T2 |
| 7 | `src/server/trpc/routers/tournament.ts` | Modify (+markTeamPaid, cost in create/update) | T2 |
| 8 | `src/components/sparings/sparing-form.tsx` | Modify (+cost field) | T3 |
| 9 | `src/components/sparings/sparing-card.tsx` | Modify (+PLN badge) | T3 |
| 10 | `src/app/(dashboard)/sparings/[id]/*.tsx` | Modify (+cost + rozliczenie) | T3 |
| 11 | `src/app/(dashboard)/events/page.tsx` | Modify (+PLN badge) | T3 |
| 12 | `src/app/(dashboard)/events/[id]/page.tsx` | Modify (+cost info) | T3 |
| 13 | `src/app/(dashboard)/tournaments/[id]/page.tsx` | Modify (+cost + paid toggle) | T3 |
