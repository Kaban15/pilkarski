# Sparing Invite Sorting + "Looking for Club" Toggle

## Overview

Two independent features that improve matchmaking on PilkaSport:

**Feature A:** When inviting clubs to a sparing, suggest clubs from the same league level and region first.

**Feature B:** Players and coaches can privately flag "looking for club" on their profile. When a club in their region posts a recruitment event or transfer, they receive a notification. The flag is invisible to other platform users.

---

## Feature A: Smart Club Sorting in Sparing Invites

### Current Behavior

The `club.list` TRPC endpoint (`src/server/trpc/routers/club.ts:45-83`) returns clubs sorted by `createdAt: "desc"`. The invite dialog (`src/components/sparings/invite-club-dialog.tsx`) passes region and league filters but does no priority sorting.

### New Behavior

Add an optional `prioritizeForClubId` parameter to `club.list`. When provided:

1. Fetch the requesting club's `regionId` and `leagueGroup.leagueLevelId`
2. Sort results by match quality:
   - **Tier 1:** Same LeagueLevel + same Region (best match)
   - **Tier 2:** Same LeagueLevel, different Region
   - **Tier 3:** Different LeagueLevel, same Region
   - **Tier 4:** Everything else
3. Within each tier, sort by `createdAt desc` (existing behavior)

### Files to Modify

- `src/server/trpc/routers/club.ts` — add `prioritizeForClubId` input, implement sorting logic, exclude self from results
- `src/components/sparings/invite-club-dialog.tsx` — pass the current club's ID to the query via `api.club.me` (component needs to call `api.club.me.useQuery()` internally to get `currentClubId`)

### Implementation Notes

- Sorting happens in application code (post-query), not SQL, since Prisma doesn't support conditional ORDER BY easily
- The club's league info is already included in the query response (`leagueGroup.leagueLevel`)
- Exclude the requesting club from results at the `club.list` level (add `id: { not: prioritizeForClubId }` to WHERE clause) — self-invite prevention downstream exists but list-level exclusion is cleaner UX
- When `prioritizeForClubId` is provided but the club has no leagueGroup, fall back to region-only sorting (tier 1 = same region, tier 2 = rest)

---

## Feature B: "Looking for Club" Toggle

### Data Model Changes

**Prisma schema (`prisma/schema.prisma`):**

Add to `Player` model (after `instagramUrl`):
```prisma
lookingForClub Boolean @default(false)
```

Add to `Coach` model (after `instagramUrl`):
```prisma
lookingForClub Boolean @default(false)
```

Migration: `npx prisma migrate dev --name add-looking-for-club`

### Profile UI

**Player profile form (`src/components/forms/player-profile-form.tsx`):**
- Add checkbox below social links section
- Label: "Szukam klubu"
- Description: "Otrzymasz powiadomienie gdy klub w Twoim regionie ogłosi nabór. Nie jest widoczne dla innych."
- Disabled state when `regionId` is not set, with helper text: "Ustaw region aby włączyć"
- When unchecked and `lookingForClub` was true, set to false on save

**Coach profile form (`src/components/forms/coach-profile-form.tsx`):**
- Same checkbox, same behavior

### Server Changes

**Player router (`src/server/trpc/routers/player.ts`):**
- `player.me` — `lookingForClub` is a scalar field, automatically included by `findUnique` after migration. No code change needed.
- `player.update` — accept `lookingForClub` boolean in input schema. Update validator in `src/lib/validators/profile.ts` (`updatePlayerSchema`).
- `player.getById` (public) — add explicit `select` to exclude `lookingForClub` from response
- `player.list` (public) — add explicit `select` to exclude `lookingForClub` from response

**Coach router (`src/server/trpc/routers/coach.ts`):**
- `coach.me` — same as player.me, auto-included after migration. No code change.
- `coach.update` — accept `lookingForClub` in inline input schema (coach uses inline schema, not shared validator)
- `coach.getById` (public) — add explicit `select` to exclude `lookingForClub`
- `coach.list` (public) — add explicit `select` to exclude `lookingForClub`

**Search router (`src/server/trpc/routers/search.ts`):**
- `search.global` — exclude `lookingForClub` from player/coach results

### Files to Modify (Feature B)

- `prisma/schema.prisma` — add `lookingForClub` to Player and Coach models
- `src/lib/validators/profile.ts` — add `lookingForClub` to `updatePlayerSchema`
- `src/server/trpc/routers/player.ts` — update `player.update`, exclude field from public endpoints
- `src/server/trpc/routers/coach.ts` — update `coach.update`, exclude field from public endpoints
- `src/server/trpc/routers/search.ts` — exclude field from search results
- `src/server/trpc/routers/event.ts` — modify existing notification block to add `lookingForClub: true` filter
- `src/server/trpc/routers/transfer.ts` — add new notification block for `LOOKING_FOR_PLAYER` type
- `src/components/forms/player-profile-form.tsx` — add checkbox UI
- `src/components/forms/coach-profile-form.tsx` — add checkbox UI

### Notification Triggers

**When a club creates an Event (`src/server/trpc/routers/event.ts`):**

NOTE: An existing notification block already exists in `event.ts` (around lines 148-171) that notifies players in the region. **Modify this existing block** — do NOT create a duplicate. Add `lookingForClub: true` to the existing `playerWhere` filter. Update the notification title from the existing generic format to:
- Title: `"{clubName} ogłosił nabór w Twoim regionie"`
- Link: `/events/{eventId}`

**When a club creates a Transfer with type `LOOKING_FOR_PLAYER` (`src/server/trpc/routers/transfer.ts`):**

NOTE: The existing `transfer.ts` has a notification block (lines 39-58) that fires for `LOOKING_FOR_CLUB`/`FREE_AGENT` types and notifies **clubs**. This is separate logic. **Add a NEW block** for `LOOKING_FOR_PLAYER` type that notifies **players/coaches**:

```
WHERE lookingForClub = true
AND regionId = transfer.regionId
AND (transfer.position IS NULL OR primaryPosition = transfer.position)
LIMIT 50
```

Use notification type `RECRUITMENT_MATCH` (same type is already used for player→club notifications; reuse is acceptable since the notification title and link make the context clear):
- Title: `"{clubName} szuka zawodnika w Twoim regionie"`
- Link: `/transfers/{transferId}`
- Also send push notification

### Privacy

- `lookingForClub` is NEVER returned in:
  - Public player profiles (`/players/[id]`)
  - Search results
  - Squad/team views
  - Any endpoint accessible by other users
- Only returned in `player.me` and `coach.me` (authenticated, own profile only)

---

## Out of Scope

- Email notifications for recruitment matches (only in-app + push)
- AI-based recommendation ("players similar to you")
- Notification preferences (frequency, digest mode)
- "Looking for club" visibility to clubs (explicitly private per user request)
