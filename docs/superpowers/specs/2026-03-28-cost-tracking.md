# Rozliczenia Kosztów — PilkaSport

**Date:** 2026-03-28
**Scope:** Cost info + payment tracking on sparings, events, tournaments. No payment integration — info only.

---

## Design Decisions

- Cost amount is **public** (helps users decide whether to join)
- Payment status is **private** (visible only to participants/organizer)
- No payment gateway — just manual toggle "opłacone/nieopłacone"
- Reuses existing models (new fields, no new tables except TournamentTeam.costPaid)

---

## 1. Schema Changes

### SparingOffer — add 3 fields

```prisma
costPerTeam   Int?     @map("cost_per_team")     // PLN per team, null = free
costPaidHome  Boolean  @default(false) @map("cost_paid_home")
costPaidAway  Boolean  @default(false) @map("cost_paid_away")
```

### Event — add 1 field

```prisma
costPerPerson Int?     @map("cost_per_person")    // PLN per person, null = free
```

### Tournament — add 1 field

```prisma
costPerTeam   Int?     @map("cost_per_team")      // PLN entry fee per team, null = free
```

### TournamentTeam — add 1 field

```prisma
costPaid      Boolean  @default(false) @map("cost_paid")
```

---

## 2. Backend

### Sparing router

**Modify `create` + `update`:** Add `costPerTeam` to input schema. Pass through to Prisma.

**New procedure `markCostPaid`** (protectedProcedure):
- Input: `{ sparingId: uuid, side: "home" | "away", paid: boolean }`
- Validation:
  - Sparing must be MATCHED or COMPLETED
  - If side = "home": caller must be sparing owner (club.userId)
  - If side = "away": caller must be matched applicant club owner
- Update: `costPaidHome` or `costPaidAway`

### Event router

**Modify `create` + `update`:** Add `costPerPerson` to input schema.

No payment tracking for events — just the info field. Events have many individual applicants, tracking per-person payments is out of scope.

### Tournament router

**Modify `create` + `update`:** Add `costPerTeam` to input schema.

**New procedure `markTeamPaid`** (protectedProcedure):
- Input: `{ teamId: uuid, paid: boolean }`
- Validation: caller is tournament creator
- Update: `TournamentTeam.costPaid`

---

## 3. Validators

### `src/lib/validators/sparing.ts`

Add to `createSparingSchema` and `updateSparingSchema`:
```typescript
costPerTeam: z.number().int().min(0).max(10000).optional(),
```

Add new schema:
```typescript
export const markCostPaidSchema = z.object({
  sparingId: z.string().uuid(),
  side: z.enum(["home", "away"]),
  paid: z.boolean(),
});
```

### `src/lib/validators/event.ts`

Add to `createEventSchema`:
```typescript
costPerPerson: z.number().int().min(0).max(10000).optional(),
```

### `src/lib/validators/tournament.ts`

Add to `createTournamentSchema`:
```typescript
costPerTeam: z.number().int().min(0).max(10000).optional(),
```

Add new schema:
```typescript
export const markTeamPaidSchema = z.object({
  teamId: z.string().uuid(),
  paid: z.boolean(),
});
```

---

## 4. Frontend

### Sparings

**Form** (`sparing-form.tsx`):
- New field: "Koszt na drużynę (PLN)" — Input type=number, optional, placeholder "0 = darmowy"

**Card** (`sparing-card.tsx`):
- If costPerTeam > 0: badge `"${costPerTeam} PLN"` in amber near location/date row

**Detail** (`sparing-info.tsx` or `sparings/[id]/page.tsx`):
- Cost shown publicly if set: `"Koszt: ${costPerTeam} PLN na drużynę"`
- "Rozliczenie" section — visible only when MATCHED/COMPLETED and user is participant:
  - Two rows: "Gospodarze: Opłacone/Nieopłacone" + "Goście: Opłacone/Nieopłacone"
  - Toggle button (only for own side's club owner)
  - Badge colors: emerald = paid, amber = unpaid

### Events

**Form** (`events/new` + `events/[id]/edit`):
- New field: "Koszt na osobę (PLN)" — Input, optional

**List** (`events/page.tsx`):
- If costPerPerson > 0: badge `"${costPerPerson} PLN"` in amber on event cards

**Detail** (`events/[id]/page.tsx`):
- Cost shown in info section if set

### Tournaments

**Form** (`tournaments/new`):
- New field: "Wpisowe (PLN)" — Input, optional

**List** (`tournaments/page.tsx`):
- If costPerTeam > 0: badge in TournamentCard

**Detail** (`tournaments/[id]/page.tsx`):
- Cost shown in hero/info
- Tab Drużyny: organizer sees per-team paid status badge + toggle button
  - Badge "Opłacone" (emerald) / "Nieopłacone" (amber)
  - Toggle: `api.tournament.markTeamPaid.useMutation`

---

## 5. Files Summary

### Modified (13 files)

| File | Change |
|------|--------|
| `prisma/schema.prisma` | +3 SparingOffer fields, +1 Event field, +1 Tournament field, +1 TournamentTeam field |
| `src/lib/validators/sparing.ts` | +costPerTeam, +markCostPaidSchema |
| `src/lib/validators/event.ts` | +costPerPerson |
| `src/lib/validators/tournament.ts` | +costPerTeam, +markTeamPaidSchema |
| `src/server/trpc/routers/sparing.ts` | +markCostPaid procedure, cost in create/update |
| `src/server/trpc/routers/event.ts` | cost in create/update |
| `src/server/trpc/routers/tournament.ts` | +markTeamPaid procedure, cost in create/update |
| `src/components/sparings/sparing-form.tsx` | +cost field |
| `src/components/sparings/sparing-card.tsx` | +PLN badge |
| `src/app/(dashboard)/sparings/[id]/page.tsx` or `_components/sparing-info.tsx` | +cost display + rozliczenie section |
| `src/app/(dashboard)/events/page.tsx` | +PLN badge on cards |
| `src/app/(dashboard)/events/[id]/page.tsx` | +cost in info |
| `src/app/(dashboard)/tournaments/[id]/page.tsx` | +PLN badge, +paid toggle in teams tab |

### Migration

`add_cost_fields` — 6 ALTER TABLE ADD COLUMN statements

### No new dependencies
