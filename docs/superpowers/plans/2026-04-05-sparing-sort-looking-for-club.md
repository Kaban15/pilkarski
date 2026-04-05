# Sparing Invite Sorting + Looking for Club — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Smart club sorting in sparing invites (same league level first) + private "looking for club" toggle on player/coach profiles with recruitment notifications.

**Architecture:** Two independent features sharing one Prisma migration. Feature A modifies `club.list` endpoint sorting + invite dialog. Feature B adds a boolean field to Player/Coach, modifies profile forms, and hooks into existing notification logic in event/transfer routers.

**Tech Stack:** Prisma 7, TRPC 11, React 19, Next.js 16, Zod 4, Tailwind CSS 4

---

### Task 1: Prisma migration — add lookingForClub to Player and Coach

**Files:**
- Modify: `prisma/schema.prisma:211` (Player model, after `instagramUrl`)
- Modify: `prisma/schema.prisma:235` (Coach model, after `instagramUrl`)

- [ ] **Step 1: Add lookingForClub field to Player model**

After the `instagramUrl` line (line 211) in the Player model, add:

```prisma
lookingForClub  Boolean         @default(false) @map("looking_for_club")
```

- [ ] **Step 2: Add lookingForClub field to Coach model**

After the `instagramUrl` line (line 235) in the Coach model, add:

```prisma
lookingForClub  Boolean         @default(false) @map("looking_for_club")
```

- [ ] **Step 3: Run migration**

Run: `cd /c/Users/piotr/CascadeProjects/pilkarski && npx prisma migrate dev --name add-looking-for-club`
Expected: Migration created and applied successfully.

- [ ] **Step 4: Verify generated client**

Run: `npx prisma generate`
Expected: Prisma Client generated.

- [ ] **Step 5: Commit**

```bash
git add prisma/
git commit -m "feat: add lookingForClub field to Player and Coach models"
```

---

### Task 2: Update validators and player/coach update endpoints

**Files:**
- Modify: `src/lib/validators/profile.ts:17-36` (updatePlayerSchema)
- Modify: `src/server/trpc/routers/player.ts:31-46` (player.update)
- Modify: `src/server/trpc/routers/coach.ts:19-43` (coach.update)

- [ ] **Step 1: Add lookingForClub to updatePlayerSchema**

In `src/lib/validators/profile.ts`, after the `instagramUrl` line (line 35), add:

```typescript
lookingForClub: z.boolean().optional(),
```

- [ ] **Step 2: Add lookingForClub to coach.update inline schema**

In `src/server/trpc/routers/coach.ts`, in the `update` input schema (after `instagramUrl` on line 31), add:

```typescript
lookingForClub: z.boolean().optional(),
```

- [ ] **Step 3: Verify build**

Run: `cd /c/Users/piotr/CascadeProjects/pilkarski && npx next build 2>&1 | tail -5`

- [ ] **Step 4: Commit**

```bash
git add src/lib/validators/profile.ts src/server/trpc/routers/coach.ts
git commit -m "feat: accept lookingForClub in player and coach update schemas"
```

---

### Task 3: Exclude lookingForClub from public endpoints

**Files:**
- Modify: `src/server/trpc/routers/player.ts:19-28` (player.getById)
- Modify: `src/server/trpc/routers/player.ts:82-113` (player.list)
- Modify: `src/server/trpc/routers/coach.ts:45-56` (coach.getById)
- Modify: `src/server/trpc/routers/coach.ts:58-90` (coach.list)
- Modify: `src/server/trpc/routers/search.ts:30-41` (search.global player query)

- [ ] **Step 1: Exclude from player.getById**

In `src/server/trpc/routers/player.ts`, change the `player.getById` query. Replace:

```typescript
const player = await ctx.db.player.findUnique({
  where: { id: input.id },
  include: { region: true, careerEntries: { orderBy: { season: "desc" } } },
});
if (!player) throw new TRPCError({ code: "NOT_FOUND" });
return player;
```

with:

```typescript
const player = await ctx.db.player.findUnique({
  where: { id: input.id },
  include: { region: true, careerEntries: { orderBy: { season: "desc" } } },
});
if (!player) throw new TRPCError({ code: "NOT_FOUND" });
const { lookingForClub: _, ...publicPlayer } = player;
return publicPlayer;
```

- [ ] **Step 2: Exclude from player.list**

In `src/server/trpc/routers/player.ts`, in the `player.list` query, change the `findMany` call. After getting the players array (line 98), before the cursor logic, add destructuring. Replace:

```typescript
const players = await ctx.db.player.findMany({
  where,
  include: { region: true },
  take: input.limit + 1,
  ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
  orderBy: { createdAt: "desc" },
});
```

with:

```typescript
const rawPlayers = await ctx.db.player.findMany({
  where,
  include: { region: true },
  take: input.limit + 1,
  ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
  orderBy: { createdAt: "desc" },
});
const players = rawPlayers.map(({ lookingForClub: _, ...p }) => p);
```

- [ ] **Step 3: Exclude from coach.getById**

In `src/server/trpc/routers/coach.ts`, in `getById` (around line 48-55), change:

```typescript
return { ...coach, careerEntries };
```

to:

```typescript
const { lookingForClub: _, ...publicCoach } = coach;
return { ...publicCoach, careerEntries };
```

- [ ] **Step 4: Exclude from coach.list**

In `src/server/trpc/routers/coach.ts`, in `list` (around line 76), change:

```typescript
const items = await ctx.db.coach.findMany({
```

to:

```typescript
const rawItems = await ctx.db.coach.findMany({
```

And after the `findMany` call, before the cursor logic, add:

```typescript
const items = rawItems.map(({ lookingForClub: _, ...c }) => c);
```

- [ ] **Step 5: Exclude from search.global**

In `src/server/trpc/routers/search.ts`, the player `findMany` (around line 30) returns full player objects. After the parallel queries resolve, map players to exclude the field. Find where players are returned in the response and add:

```typescript
.map(({ lookingForClub: _, ...p }) => p)
```

to the player results.

- [ ] **Step 6: Verify build**

Run: `cd /c/Users/piotr/CascadeProjects/pilkarski && npx next build 2>&1 | tail -5`

- [ ] **Step 7: Commit**

```bash
git add src/server/trpc/routers/player.ts src/server/trpc/routers/coach.ts src/server/trpc/routers/search.ts
git commit -m "feat: exclude lookingForClub from all public endpoints"
```

---

### Task 4: Profile form UI — "Szukam klubu" checkbox

**Files:**
- Modify: `src/components/forms/player-profile-form.tsx:86-104` (handleSubmit) and `270-271` (after social links, before submit button)
- Modify: `src/components/forms/coach-profile-form.tsx` (same pattern)

- [ ] **Step 1: Add checkbox to player profile form**

In `src/components/forms/player-profile-form.tsx`, after the Instagram grid section (after line 270, before the submit `<Button>`), add:

```tsx
<div className="flex items-start gap-3 rounded-lg border border-border p-4">
  <input
    type="checkbox"
    id="lookingForClub"
    name="lookingForClub"
    defaultChecked={player.lookingForClub}
    disabled={!player.regionId}
    className="mt-1 rounded border-input"
  />
  <div>
    <Label htmlFor="lookingForClub" className="cursor-pointer">Szukam klubu</Label>
    <p className="text-xs text-muted-foreground mt-0.5">
      {player.regionId
        ? "Otrzymasz powiadomienie gdy klub w Twoim regionie ogłosi nabór. Nie jest widoczne dla innych."
        : "Ustaw region aby włączyć tę opcję."}
    </p>
  </div>
</div>
```

- [ ] **Step 2: Include lookingForClub in player form handleSubmit**

In the `handleSubmit` function (around line 89-104), add after `instagramUrl`:

```typescript
lookingForClub: fd.get("lookingForClub") === "on",
```

- [ ] **Step 3: Add checkbox to coach profile form**

In `src/components/forms/coach-profile-form.tsx`, add the same checkbox pattern after the social links section, before the submit button. The coach form uses the same `FormData` pattern. Add the checkbox HTML (same as player but with `coach.lookingForClub` and `coach.regionId`).

Also add `lookingForClub: fd.get("lookingForClub") === "on"` to the coach form's handleSubmit.

- [ ] **Step 4: Verify build**

Run: `cd /c/Users/piotr/CascadeProjects/pilkarski && npx next build 2>&1 | tail -5`

- [ ] **Step 5: Commit**

```bash
git add src/components/forms/player-profile-form.tsx src/components/forms/coach-profile-form.tsx
git commit -m "feat: add 'Szukam klubu' checkbox to player and coach profile forms"
```

---

### Task 5: Notification trigger — event creation

**Files:**
- Modify: `src/server/trpc/routers/event.ts:148-171` (existing recruitment notification block)

- [ ] **Step 1: Add lookingForClub filter to existing player notification query**

In `src/server/trpc/routers/event.ts`, the existing block (lines 148-171) queries players in region for recruitment events. Modify the `playerWhere` to include `lookingForClub: true`. Change:

```typescript
const playerWhere: Record<string, unknown> = { regionId };
if (input.targetPosition) {
  playerWhere.primaryPosition = input.targetPosition;
}
```

to:

```typescript
const playerWhere: Record<string, unknown> = { regionId, lookingForClub: true };
if (input.targetPosition) {
  playerWhere.primaryPosition = input.targetPosition;
}
```

- [ ] **Step 2: Update notification title to include club name**

In the same block, change:

```typescript
title: "Nabór w Twoim regionie",
message: `${clubData.name} szuka zawodników: ${input.title}`,
```

to:

```typescript
title: `${clubData.name} ogłosił nabór w Twoim regionie`,
message: input.title,
```

- [ ] **Step 3: Also notify coaches with lookingForClub in the same region**

After the existing player notification block (after line 171, before `return event;`), add a similar block for coaches:

```typescript
// Notify matching coaches in region (fire-and-forget)
ctx.db.coach.findMany({
  where: { regionId, lookingForClub: true },
  select: { userId: true },
  take: 50,
}).then((coaches: { userId: string }[]) => {
  if (coaches.length === 0) return;
  ctx.db.notification.createMany({
    data: coaches.map((c: { userId: string }) => ({
      userId: c.userId,
      type: "RECRUITMENT_MATCH" as const,
      title: `${clubData.name} ogłosił nabór w Twoim regionie`,
      message: input.title,
      link: `/events/${event.id}`,
    })),
  }).catch(() => {});
}).catch(() => {});
```

- [ ] **Step 4: Verify build**

Run: `cd /c/Users/piotr/CascadeProjects/pilkarski && npx next build 2>&1 | tail -5`

- [ ] **Step 5: Commit**

```bash
git add src/server/trpc/routers/event.ts
git commit -m "feat: notify lookingForClub players and coaches on recruitment events"
```

---

### Task 6: Notification trigger — transfer creation (LOOKING_FOR_PLAYER)

**Files:**
- Modify: `src/server/trpc/routers/transfer.ts:57-59` (after existing notification block, before `return transfer;`)

- [ ] **Step 1: Add notification block for LOOKING_FOR_PLAYER**

In `src/server/trpc/routers/transfer.ts`, after the existing notification block (line 57, before `return transfer;` on line 59), add:

```typescript
// Notify players/coaches looking for club when club seeks players (fire-and-forget)
if (input.type === "LOOKING_FOR_PLAYER" && input.regionId) {
  const clubName = user?.club?.name ?? input.title;
  const playerWhere: Record<string, unknown> = { regionId: input.regionId, lookingForClub: true };
  if (input.position) {
    playerWhere.primaryPosition = input.position;
  }

  ctx.db.player.findMany({
    where: playerWhere,
    select: { userId: true },
    take: 50,
  }).then((players: { userId: string }[]) => {
    if (players.length === 0) return;
    ctx.db.notification.createMany({
      data: players.map((p: { userId: string }) => ({
        userId: p.userId,
        type: "RECRUITMENT_MATCH" as const,
        title: `${clubName} szuka zawodnika w Twoim regionie`,
        message: input.title,
        link: `/transfers/${transfer.id}`,
      })),
    }).catch(() => {});
  }).catch(() => {});

  ctx.db.coach.findMany({
    where: { regionId: input.regionId, lookingForClub: true },
    select: { userId: true },
    take: 50,
  }).then((coaches: { userId: string }[]) => {
    if (coaches.length === 0) return;
    ctx.db.notification.createMany({
      data: coaches.map((c: { userId: string }) => ({
        userId: c.userId,
        type: "RECRUITMENT_MATCH" as const,
        title: `${clubName} szuka zawodnika w Twoim regionie`,
        message: input.title,
        link: `/transfers/${transfer.id}`,
      })),
    }).catch(() => {});
  }).catch(() => {});

  // Send push to all notified users (fire-and-forget)
  const { sendPush } = await import("@/server/send-push");
  const allNotified = await Promise.all([
    ctx.db.player.findMany({ where: playerWhere, select: { userId: true }, take: 50 }),
    ctx.db.coach.findMany({ where: { regionId: input.regionId, lookingForClub: true }, select: { userId: true }, take: 50 }),
  ]);
  for (const u of [...allNotified[0], ...allNotified[1]]) {
    sendPush(u.userId, { title: `${clubName} szuka zawodnika w Twoim regionie`, body: input.title, url: `/transfers/${transfer.id}` }).catch(() => {});
  }
}
```

- [ ] **Step 2: Verify build**

Run: `cd /c/Users/piotr/CascadeProjects/pilkarski && npx next build 2>&1 | tail -5`

- [ ] **Step 3: Commit**

```bash
git add src/server/trpc/routers/transfer.ts
git commit -m "feat: notify lookingForClub users when club posts LOOKING_FOR_PLAYER transfer"
```

---

### Task 7: Smart club sorting in sparing invites — backend

**Files:**
- Modify: `src/server/trpc/routers/club.ts:45-83` (club.list endpoint)

- [ ] **Step 1: Add prioritizeForClubId input parameter**

In `src/server/trpc/routers/club.ts`, add to the input schema (after `limit` on line 53):

```typescript
prioritizeForClubId: z.string().uuid().optional(),
```

- [ ] **Step 2: Implement sorting logic**

After the existing `findMany` query (line 68-74), but before the cursor pagination logic (line 76), add priority sorting when `prioritizeForClubId` is provided. Replace the entire query section:

```typescript
const where: Record<string, unknown> = {};
if (input.regionId) where.regionId = input.regionId;
if (input.leagueGroupId) {
  where.leagueGroupId = input.leagueGroupId;
} else if (input.leagueLevelId) {
  where.leagueGroup = { leagueLevelId: input.leagueLevelId };
}
if (input.search) {
  where.name = { contains: input.search, mode: "insensitive" };
}

const clubs = await ctx.db.club.findMany({
  where: Object.keys(where).length > 0 ? where : undefined,
  include: { region: true, leagueGroup: { include: { leagueLevel: true } } },
  take: input.limit + 1,
  ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
  orderBy: { createdAt: "desc" },
});
```

with:

```typescript
const where: Record<string, unknown> = {};
if (input.regionId) where.regionId = input.regionId;
if (input.leagueGroupId) {
  where.leagueGroupId = input.leagueGroupId;
} else if (input.leagueLevelId) {
  where.leagueGroup = { leagueLevelId: input.leagueLevelId };
}
if (input.search) {
  where.name = { contains: input.search, mode: "insensitive" };
}
if (input.prioritizeForClubId) {
  where.id = { not: input.prioritizeForClubId };
}

let clubs = await ctx.db.club.findMany({
  where: Object.keys(where).length > 0 ? where : undefined,
  include: { region: true, leagueGroup: { include: { leagueLevel: true } } },
  take: input.limit + 1,
  ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
  orderBy: { createdAt: "desc" },
});

// Priority sorting: same league level + region first
if (input.prioritizeForClubId && !input.cursor) {
  const myClub = await ctx.db.club.findUnique({
    where: { id: input.prioritizeForClubId },
    include: { leagueGroup: { include: { leagueLevel: true } } },
  });
  if (myClub) {
    const myLevelId = myClub.leagueGroup?.leagueLevelId;
    const myRegionId = myClub.regionId;

    clubs.sort((a, b) => {
      const aTier = getMatchTier(a, myLevelId, myRegionId);
      const bTier = getMatchTier(b, myLevelId, myRegionId);
      if (aTier !== bTier) return aTier - bTier;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }
}
```

- [ ] **Step 3: Add getMatchTier helper function**

Before the `clubRouter` definition (before line 5 or wherever it starts), add:

```typescript
function getMatchTier(
  club: { regionId: number | null; leagueGroup: { leagueLevelId: number } | null },
  targetLevelId: number | undefined | null,
  targetRegionId: number | undefined | null,
): number {
  const sameLevel = targetLevelId != null && club.leagueGroup?.leagueLevelId === targetLevelId;
  const sameRegion = targetRegionId != null && club.regionId === targetRegionId;
  if (sameLevel && sameRegion) return 1;
  if (sameLevel) return 2;
  if (sameRegion) return 3;
  return 4;
}
```

- [ ] **Step 4: Verify build**

Run: `cd /c/Users/piotr/CascadeProjects/pilkarski && npx next build 2>&1 | tail -5`

- [ ] **Step 5: Commit**

```bash
git add src/server/trpc/routers/club.ts
git commit -m "feat: smart club sorting in club.list — same league level and region first"
```

---

### Task 8: Smart club sorting — frontend (invite dialog)

**Files:**
- Modify: `src/components/sparings/invite-club-dialog.tsx:30-74` (queries)

- [ ] **Step 1: Add club.me query to get current club ID**

In `src/components/sparings/invite-club-dialog.tsx`, after the `utils` line (line 42), add:

```typescript
const { data: myClub } = api.club.me.useQuery(undefined, {
  staleTime: Infinity,
  retry: false,
});
```

Note: This dialog is only rendered for CLUB users (sparing owners), so `club.me` will always resolve. `retry: false` avoids unnecessary retries if session is stale.

- [ ] **Step 2: Pass prioritizeForClubId to browse query**

Change the `browseByFilter` query (lines 66-74). Add `prioritizeForClubId` to the input:

```typescript
const browseByFilter = api.club.list.useQuery(
  {
    regionId: regionId ?? undefined,
    leagueLevelId: leagueLevelId ?? undefined,
    leagueGroupId: leagueGroupId ?? undefined,
    limit: 10,
    prioritizeForClubId: myClub?.id,
  },
  { enabled: open && search.length < 2 && !!regionId },
);
```

- [ ] **Step 3: Also pass prioritizeForClubId to search query**

Change the `searchByName` query (lines 60-63):

```typescript
const searchByName = api.club.list.useQuery(
  { search, limit: 8, prioritizeForClubId: myClub?.id },
  { enabled: open && search.length >= 2 },
);
```

- [ ] **Step 4: Verify build**

Run: `cd /c/Users/piotr/CascadeProjects/pilkarski && npx next build 2>&1 | tail -5`

- [ ] **Step 5: Commit**

```bash
git add src/components/sparings/invite-club-dialog.tsx
git commit -m "feat: pass club ID to invite dialog for smart sorting"
```

---

### Task 9: Final verification

- [ ] **Step 1: Full build check**

Run: `cd /c/Users/piotr/CascadeProjects/pilkarski && npx next build 2>&1 | tail -30`
Expected: Build succeeds with no errors.

- [ ] **Step 2: Manual verification checklist**

With `npm run dev`:
- Player profile form: "Szukam klubu" checkbox appears after social links, disabled when no region set
- Coach profile form: same checkbox
- Saving profile with checkbox checked: value persists on reload
- Public player profile (`/players/[id]`): `lookingForClub` field is NOT in response (check network tab)
- Search results: `lookingForClub` NOT visible
- Sparing invite dialog: clubs from same league level appear first when browsing
- Sparing invite dialog: own club does NOT appear in results
