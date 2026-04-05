# Invite Players to Events — Design Spec

## Overview

Clubs can invite specific players to events (recruitment/camps) and trainings from the event detail page. A search dialog allows filtering by name, club, region, league level, group, and position. Players with `lookingForClub: true` in the same region are ranked higher without revealing the flag.

## Scope

- **In scope:** Events and trainings only (not sparings — they have their own club-invite flow)
- **Out of scope:** Invite tracking/dedup, coach invitations, bulk invitations

## Flow

1. Club opens event/training detail page
2. Clicks "Zaproś zawodników" button (visible only to event owner)
3. Dialog opens with player search (pattern matches `InviteClubDialog`)
4. Club filters by criteria, selects a player
5. Optionally adds a message
6. Sends — player receives a `RECRUITMENT_MATCH` notification with link to the event

## Backend

### New endpoint: `event.invitePlayer`

**File:** `src/server/trpc/routers/event.ts`

**Procedure:** `rateLimitedProcedure({ maxAttempts: 20 })`

**Input:**
```
eventId: string (uuid)
toUserId: string (uuid) — the player's userId
message: string? (max 500)
```

**Logic:**
1. Fetch event, verify it exists
2. Verify caller owns the event (club owner or coach creator)
3. Create notification for the player:
   - Type: `RECRUITMENT_MATCH`
   - Title: `"{clubOrCoachName} zaprasza Cię na {event.title}"`
   - Message: user-provided message or event title
   - Link: `/events/{eventId}`
4. Send push notification (fire-and-forget)
5. Return `{ success: true }`

### New endpoint: `player.search`

**File:** `src/server/trpc/routers/player.ts`

**Procedure:** `protectedProcedure`

**Input:**
```
search: string? (max 100) — matches firstName, lastName
regionId: number? — filter by region
leagueLevelId: number? — filter players whose club is in this league level
leagueGroupId: number? — filter players whose club is in this league group
position: PlayerPosition? — filter by primaryPosition
prioritizeForRegionId: number? — region ID for smart sorting (lookingForClub boost)
limit: number (1-30, default 20)
```

**Logic:**
1. Build WHERE clause from filters
2. For club/league filtering: join through `user.clubMemberships` → `club.leagueGroup.leagueLevel`
3. Query `player.findMany` with includes: `region`, `user.clubMemberships.club`
4. Post-query sort: players with `lookingForClub: true` AND `regionId === prioritizeForRegionId` come first
5. Strip `lookingForClub` from response before returning (privacy)
6. Return array of players with: id, firstName, lastName, primaryPosition, region, club name (from accepted membership if exists)

**Club membership join:** The Player model has no direct club relation. The path is `Player → user → clubMemberships → club → leagueGroup → leagueLevel`. In Prisma this requires nested where/include:
```
where: {
  user: {
    clubMemberships: {
      some: { status: "ACCEPTED", club: { leagueGroup: { leagueLevelId: ... } } }
    }
  }
}
```
Include chain for displaying club name in results:
```
include: {
  region: true,
  user: {
    include: {
      clubMemberships: {
        where: { status: "ACCEPTED" },
        take: 1,
        include: { club: { select: { name: true, city: true } } }
      }
    }
  }
}
```

## Frontend

### New component: `InvitePlayerDialog`

**File:** `src/components/events/invite-player-dialog.tsx`

**Props:** `eventId: string`

**UI structure (mirrors `InviteClubDialog`):**
1. Button "Zaproś zawodników" — toggles dialog open
2. Search by name input (min 2 chars)
3. Filter section: region select, league level select, league group select, position select
4. Results list showing: player name, position badge, club name (if has one), region
5. Click player → shows message input + "Zaproś" button
6. On success: toast "Zaproszenie wysłane", reset selection

**Queries:**
- `api.player.search` with filters from UI
- `api.region.list` for region dropdown
- `api.region.hierarchy` for league level/group dropdowns (when region selected)

### Integration points

**File:** `src/app/(dashboard)/events/[id]/page.tsx`
- Add `<InvitePlayerDialog eventId={id} />` visible only when user is the event owner
- **Fix `isOwner` check:** Current code only checks `session?.user?.id === event.club?.userId` (club owners). Coach-created events set `event.coachId` but `isOwner` doesn't account for this. Fix to also check `session?.user?.id === event.coach?.userId` so coach-created trainings show the invite button.
- Place after existing action buttons
- No separate training detail page exists — trainings are events with type `INDIVIDUAL_TRAINING` / `GROUP_TRAINING` and live at `/events/[id]`, so this single integration point covers both

## Data Flow

```
Club clicks "Zaproś" → player.search query → select player →
event.invitePlayer mutation → notification created → push sent →
Player sees notification → clicks link → opens event page → applies via existing flow
```

## Privacy

- `lookingForClub` is used server-side for sorting only
- Never returned to the client in search results
- Club cannot tell which players are "looking for club"
