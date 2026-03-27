# Internal Events, Attendance & Permissions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add event visibility (PUBLIC/INTERNAL), attendance tracking (YES/NO/MAYBE), and canManageEvents permission delegation.

**Architecture:** 2 new Prisma enums, 1 new model (EventAttendance), 1 new field on ClubMembership, 1 new field on Event. Helper checkEventPermission. 3 new tRPC procedures. UI: attendance widget on event detail, visibility selector on event form, permissions toggle on squad page.

**Tech Stack:** Next.js 16 (App Router), tRPC v11, Prisma 7, Tailwind 4, shadcn/ui, lucide-react

---

### File Map

**Create:**
- `prisma/migrations/YYYYMMDD_add_event_visibility_attendance/migration.sql`
- `src/server/check-event-permission.ts` — permission helper
- `src/app/(dashboard)/events/[id]/_components/attendance-section.tsx` — attendance widget

**Modify:**
- `prisma/schema.prisma` — enums, EventAttendance model, Event.visibility, ClubMembership.canManageEvents
- `src/server/trpc/routers/event.ts` — visibility filter in list/getById, setAttendance, getAttendance
- `src/server/trpc/routers/club-membership.ts` — setPermissions procedure
- `src/lib/validators/event.ts` — add visibility to create/update schemas
- `src/lib/labels.ts` — visibility + attendance labels
- `src/app/(dashboard)/events/[id]/page.tsx` — integrate AttendanceSection + badge
- `src/app/(dashboard)/events/new/page.tsx` — visibility selector
- `src/app/(dashboard)/events/[id]/edit/page.tsx` — visibility selector
- `src/app/(dashboard)/squad/page.tsx` — permissions toggle

---

### Task 1: Prisma schema + migration

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/20260327160000_add_event_visibility_attendance/migration.sql`

- [ ] **Step 1: Add enums to schema.prisma**

Add before `model Event`:
```prisma
enum EventVisibility {
  PUBLIC
  INTERNAL
}

enum AttendanceStatus {
  YES
  NO
  MAYBE
}
```

- [ ] **Step 2: Add visibility field to Event model**

Inside `model Event`, after `priceInfo` and before `createdAt`:
```prisma
  visibility    EventVisibility @default(PUBLIC) @map("visibility")
```

Add relation for attendance:
```prisma
  attendance    EventAttendance[]
```

- [ ] **Step 3: Add EventAttendance model**

After `model Event`:
```prisma
model EventAttendance {
  id        String           @id @default(uuid()) @db.Uuid
  eventId   String           @map("event_id") @db.Uuid
  userId    String           @map("user_id") @db.Uuid
  status    AttendanceStatus
  updatedAt DateTime         @updatedAt @map("updated_at") @db.Timestamptz

  event Event @relation(fields: [eventId], references: [id], onDelete: Cascade)
  user  User  @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([eventId, userId])
  @@index([eventId])
  @@map("event_attendance")
}
```

Also add `eventAttendance EventAttendance[]` to the User model relations.

- [ ] **Step 4: Add canManageEvents to ClubMembership**

Inside `model ClubMembership`, after `acceptedAt`:
```prisma
  canManageEvents Boolean @default(false) @map("can_manage_events")
```

- [ ] **Step 5: Generate Prisma client**

Run: `npx prisma generate`

- [ ] **Step 6: Create and apply migration**

Create `prisma/migrations/20260327160000_add_event_visibility_attendance/migration.sql`:
```sql
-- CreateEnum
CREATE TYPE "EventVisibility" AS ENUM ('PUBLIC', 'INTERNAL');
CREATE TYPE "AttendanceStatus" AS ENUM ('YES', 'NO', 'MAYBE');

-- Add visibility to events
ALTER TABLE "events" ADD COLUMN "visibility" "EventVisibility" NOT NULL DEFAULT 'PUBLIC';

-- Create event_attendance table
CREATE TABLE "event_attendance" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "event_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "status" "AttendanceStatus" NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "event_attendance_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "event_attendance_event_id_user_id_key" ON "event_attendance"("event_id", "user_id");
CREATE INDEX "event_attendance_event_id_idx" ON "event_attendance"("event_id");
ALTER TABLE "event_attendance" ADD CONSTRAINT "event_attendance_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE;
ALTER TABLE "event_attendance" ADD CONSTRAINT "event_attendance_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;

-- Add canManageEvents to club_memberships
ALTER TABLE "club_memberships" ADD COLUMN "can_manage_events" BOOLEAN NOT NULL DEFAULT false;
```

Apply via node pg client (same pattern as previous migrations).

- [ ] **Step 7: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add event visibility, attendance model, canManageEvents field"
```

---

### Task 2: Permission helper + labels

**Files:**
- Create: `src/server/check-event-permission.ts`
- Modify: `src/lib/labels.ts`
- Modify: `src/lib/validators/event.ts`

- [ ] **Step 1: Create checkEventPermission helper**

Create `src/server/check-event-permission.ts`:

```typescript
import { db } from "@/server/db/client";

/**
 * Returns true if user can manage events for this club:
 * - Is the club owner (club.userId === userId), OR
 * - Is an ACCEPTED member with canManageEvents flag
 */
export async function checkEventPermission(userId: string, clubId: string): Promise<boolean> {
  const club = await db.club.findUnique({
    where: { id: clubId },
    select: { userId: true },
  });

  if (club?.userId === userId) return true;

  const membership = await db.clubMembership.findUnique({
    where: { clubId_memberUserId: { clubId, memberUserId: userId } },
    select: { status: true, canManageEvents: true },
  });

  return membership?.status === "ACCEPTED" && membership.canManageEvents === true;
}
```

- [ ] **Step 2: Add labels**

In `src/lib/labels.ts`, add:

```typescript
export const EVENT_VISIBILITY_LABELS: Record<string, string> = {
  PUBLIC: "Publiczne",
  INTERNAL: "Tylko dla klubu",
};

export const ATTENDANCE_STATUS_LABELS: Record<string, string> = {
  YES: "Tak",
  NO: "Nie",
  MAYBE: "Nie wiem",
};
```

- [ ] **Step 3: Add visibility to event validators**

In `src/lib/validators/event.ts`, add to `createEventSchema`:
```typescript
visibility: z.enum(["PUBLIC", "INTERNAL"]).default("PUBLIC"),
```

This field should be added alongside the other optional fields (after `priceInfo`).

- [ ] **Step 4: Verify TypeScript**

Run: `npx tsc --noEmit`

- [ ] **Step 5: Commit**

```bash
git add src/server/check-event-permission.ts src/lib/labels.ts src/lib/validators/event.ts
git commit -m "feat: add checkEventPermission helper, visibility/attendance labels"
```

---

### Task 3: Backend — event router modifications + new procedures

**Files:**
- Modify: `src/server/trpc/routers/event.ts`

- [ ] **Step 1: Import helper and add visibility to create**

Add import at top:
```typescript
import { checkEventPermission } from "@/server/check-event-permission";
import { isClubMember } from "@/server/is-club-member";
```

In the `create` procedure, after the club/coach check, add visibility handling:
- Store `input.visibility` in the create data (it comes from createEventSchema now)
- If visibility is INTERNAL and user is not the club owner, check `checkEventPermission`

In the `data` object of `ctx.db.event.create`, add:
```typescript
visibility: input.visibility,
```

- [ ] **Step 2: Filter INTERNAL events in list**

In the `list` procedure, modify the where clause. Currently it builds `where` conditions. Add:

After building the existing where object, if the event is INTERNAL it should only be visible to club members. The simplest approach: add a filter that excludes INTERNAL events unless the user is a member. Since `list` is a `publicProcedure` and may not have a session, handle both cases:

```typescript
// Filter out INTERNAL events for non-members
const sessionUserId = ctx.session?.user?.id;
if (sessionUserId) {
  // Get clubs where user is accepted member
  const memberships = await ctx.db.clubMembership.findMany({
    where: { memberUserId: sessionUserId, status: "ACCEPTED" },
    select: { clubId: true },
  });
  const memberClubIds = memberships.map((m) => m.clubId);

  // Also include clubs the user owns
  const ownClub = await ctx.db.club.findUnique({
    where: { userId: sessionUserId },
    select: { id: true },
  });
  if (ownClub) memberClubIds.push(ownClub.id);

  where.OR = [
    { visibility: "PUBLIC" },
    { visibility: "INTERNAL", clubId: { in: memberClubIds } },
  ];
} else {
  where.visibility = "PUBLIC";
}
```

**Important:** This must be integrated with existing where logic. If there are already OR conditions, they need to be combined with AND. Read the current code carefully.

- [ ] **Step 3: Filter INTERNAL events in getById**

In the `getById` procedure, after fetching the event, add a visibility check:

```typescript
if (event.visibility === "INTERNAL") {
  const userId = ctx.session?.user?.id;
  if (!userId) throw new TRPCError({ code: "NOT_FOUND" });

  const isOwner = event.club?.userId === userId || event.coach?.userId === userId;
  if (!isOwner) {
    const isMember = event.clubId ? await isClubMember(userId, event.clubId) : false;
    if (!isMember) throw new TRPCError({ code: "NOT_FOUND" });
  }
}
```

- [ ] **Step 4: Add setAttendance procedure**

```typescript
  setAttendance: protectedProcedure
    .input(z.object({
      eventId: z.string().uuid(),
      status: z.enum(["YES", "NO", "MAYBE"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const event = await ctx.db.event.findUnique({
        where: { id: input.eventId },
        select: { visibility: true, clubId: true },
      });
      if (!event) throw new TRPCError({ code: "NOT_FOUND" });
      if (event.visibility !== "INTERNAL") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Obecność dostępna tylko dla wydarzeń wewnętrznych" });
      }
      if (!event.clubId) throw new TRPCError({ code: "BAD_REQUEST" });

      const isMember = await isClubMember(userId, event.clubId);
      if (!isMember) throw new TRPCError({ code: "FORBIDDEN" });

      return ctx.db.eventAttendance.upsert({
        where: { eventId_userId: { eventId: input.eventId, userId } },
        create: { eventId: input.eventId, userId, status: input.status },
        update: { status: input.status },
      });
    }),
```

- [ ] **Step 5: Add getAttendance procedure**

```typescript
  getAttendance: protectedProcedure
    .input(z.object({ eventId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const event = await ctx.db.event.findUnique({
        where: { id: input.eventId },
        select: { visibility: true, clubId: true },
      });
      if (!event || event.visibility !== "INTERNAL" || !event.clubId) {
        return { items: [], stats: { yes: 0, no: 0, maybe: 0 }, myStatus: null };
      }

      const isMember = await isClubMember(userId, event.clubId);
      if (!isMember) return { items: [], stats: { yes: 0, no: 0, maybe: 0 }, myStatus: null };

      const items = await ctx.db.eventAttendance.findMany({
        where: { eventId: input.eventId },
        include: {
          user: {
            select: {
              id: true,
              player: { select: { firstName: true, lastName: true, photoUrl: true } },
              coach: { select: { firstName: true, lastName: true, photoUrl: true } },
            },
          },
        },
        orderBy: { updatedAt: "desc" },
      });

      const stats = { yes: 0, no: 0, maybe: 0 };
      let myStatus: string | null = null;
      for (const item of items) {
        if (item.status === "YES") stats.yes++;
        else if (item.status === "NO") stats.no++;
        else stats.maybe++;
        if (item.userId === userId) myStatus = item.status;
      }

      return { items, stats, myStatus };
    }),
```

- [ ] **Step 6: Verify TypeScript**

Run: `npx tsc --noEmit`

- [ ] **Step 7: Commit**

```bash
git add src/server/trpc/routers/event.ts
git commit -m "feat: add visibility filter, setAttendance, getAttendance procedures"
```

---

### Task 4: Backend — clubMembership.setPermissions

**Files:**
- Modify: `src/server/trpc/routers/club-membership.ts`

- [ ] **Step 1: Add setPermissions procedure**

Add to the clubMembershipRouter:

```typescript
  setPermissions: protectedProcedure
    .input(z.object({
      membershipId: z.string().uuid(),
      canManageEvents: z.boolean(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const membership = await ctx.db.clubMembership.findUnique({
        where: { id: input.membershipId },
        include: { club: { select: { userId: true } } },
      });
      if (!membership) throw new TRPCError({ code: "NOT_FOUND" });
      if (membership.club.userId !== userId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Tylko właściciel klubu może zmieniać uprawnienia" });
      }
      if (membership.status !== "ACCEPTED") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Można zmieniać uprawnienia tylko aktywnych członków" });
      }

      return ctx.db.clubMembership.update({
        where: { id: input.membershipId },
        data: { canManageEvents: input.canManageEvents },
      });
    }),
```

- [ ] **Step 2: Verify TypeScript**

Run: `npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add src/server/trpc/routers/club-membership.ts
git commit -m "feat: add setPermissions procedure for canManageEvents"
```

---

### Task 5: Frontend — AttendanceSection component

**Files:**
- Create: `src/app/(dashboard)/events/[id]/_components/attendance-section.tsx`

- [ ] **Step 1: Create the component**

Note: The events detail page does NOT have a `_components` directory yet — create it.

```tsx
"use client";

import { toast } from "sonner";
import { api } from "@/lib/trpc-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, X, HelpCircle, Users } from "lucide-react";
import { ATTENDANCE_STATUS_LABELS } from "@/lib/labels";

interface AttendanceSectionProps {
  eventId: string;
  isClubMember: boolean;
  isAdmin: boolean;
}

export function AttendanceSection({ eventId, isClubMember, isAdmin }: AttendanceSectionProps) {
  const { data, refetch } = api.event.getAttendance.useQuery(
    { eventId },
    { enabled: isClubMember }
  );

  const setAttendance = api.event.setAttendance.useMutation({
    onSuccess: () => {
      toast.success("Obecność zapisana");
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  if (!isClubMember || !data) return null;

  const { stats, myStatus, items } = data;

  const buttons = [
    { status: "YES" as const, icon: Check, label: "Tak", color: "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20" },
    { status: "NO" as const, icon: X, label: "Nie", color: "bg-red-500/10 text-red-500 hover:bg-red-500/20" },
    { status: "MAYBE" as const, icon: HelpCircle, label: "Nie wiem", color: "bg-amber-500/10 text-amber-600 hover:bg-amber-500/20" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Users className="h-4 w-4" />
          Obecność
          <div className="ml-auto flex gap-2 text-sm font-normal">
            <Badge className="bg-emerald-500/10 text-emerald-600">{stats.yes} tak</Badge>
            <Badge className="bg-red-500/10 text-red-500">{stats.no} nie</Badge>
            <Badge className="bg-amber-500/10 text-amber-600">{stats.maybe} ?</Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* My attendance */}
        <div>
          <p className="mb-2 text-sm text-muted-foreground">Twoja obecność:</p>
          <div className="flex gap-2">
            {buttons.map((btn) => (
              <Button
                key={btn.status}
                size="sm"
                variant={myStatus === btn.status ? "default" : "outline"}
                className={myStatus === btn.status ? btn.color : ""}
                onClick={() => setAttendance.mutate({ eventId, status: btn.status })}
                disabled={setAttendance.isPending}
              >
                <btn.icon className="mr-1 h-3.5 w-3.5" />
                {btn.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Attendance list (for admins/owner) */}
        {isAdmin && items.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-medium">Lista obecności:</p>
            <ul className="divide-y divide-border">
              {items.map((item) => {
                const name = item.user.player
                  ? `${item.user.player.firstName} ${item.user.player.lastName}`
                  : item.user.coach
                    ? `${item.user.coach.firstName} ${item.user.coach.lastName}`
                    : "Nieznany";
                const statusLabel = ATTENDANCE_STATUS_LABELS[item.status] ?? item.status;
                const statusColor =
                  item.status === "YES" ? "text-emerald-600" :
                  item.status === "NO" ? "text-red-500" : "text-amber-600";

                return (
                  <li key={item.id} className="flex items-center justify-between py-2">
                    <span className="text-sm">{name}</span>
                    <span className={`text-xs font-medium ${statusColor}`}>{statusLabel}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Verify TypeScript**

Run: `npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add "src/app/(dashboard)/events/[id]/_components/attendance-section.tsx"
git commit -m "feat: add AttendanceSection component for event attendance tracking"
```

---

### Task 6: Frontend — integrate in event detail + event forms

**Files:**
- Modify: `src/app/(dashboard)/events/[id]/page.tsx`
- Modify: `src/app/(dashboard)/events/new/page.tsx`
- Modify: `src/app/(dashboard)/events/[id]/edit/page.tsx`

- [ ] **Step 1: Add badge + AttendanceSection to event detail**

In `src/app/(dashboard)/events/[id]/page.tsx`:

Add imports:
```tsx
import { AttendanceSection } from "./_components/attendance-section";
import { EVENT_VISIBILITY_LABELS } from "@/lib/labels";
```

Near the top of the rendered JSX, where the event type badge is shown, add a visibility badge:
```tsx
{event.visibility === "INTERNAL" && (
  <Badge className="bg-amber-500/10 text-amber-600">Tylko dla klubu</Badge>
)}
```

Below the event info section and before the applications section, add:
```tsx
{event.visibility === "INTERNAL" && session?.user && (
  <AttendanceSection
    eventId={id}
    isClubMember={/* need to determine */}
    isAdmin={event.club?.userId === session.user.id}
  />
)}
```

To determine `isClubMember`, add a query:
```tsx
const { data: myMembership } = api.clubMembership.myMembership.useQuery(
  { clubId: event?.club?.id ?? "" },
  { enabled: !!event?.club?.id && event?.visibility === "INTERNAL" && !!session?.user }
);
const isMember = myMembership?.status === "ACCEPTED" || event?.club?.userId === session?.user?.id;
```

Then pass `isClubMember={!!isMember}`.

- [ ] **Step 2: Add visibility selector to event new/edit forms**

Read the event new page and edit page first. They use event form components. Find where event type is selected and add a visibility dropdown below it.

Add a Select component for visibility:
```tsx
<div>
  <label className="text-sm font-medium">Widoczność</label>
  <Select value={visibility} onValueChange={setVisibility}>
    <SelectTrigger><SelectValue /></SelectTrigger>
    <SelectContent>
      <SelectItem value="PUBLIC">Publiczne</SelectItem>
      <SelectItem value="INTERNAL">Tylko dla klubu</SelectItem>
    </SelectContent>
  </Select>
</div>
```

Include `visibility` in the mutation data.

- [ ] **Step 3: Verify TypeScript**

Run: `npx tsc --noEmit`

- [ ] **Step 4: Commit**

```bash
git add "src/app/(dashboard)/events/[id]/page.tsx" "src/app/(dashboard)/events/new/page.tsx" "src/app/(dashboard)/events/[id]/edit/page.tsx"
git commit -m "feat: integrate visibility badge, attendance widget, form selector"
```

---

### Task 7: Frontend — permissions toggle on /squad

**Files:**
- Modify: `src/app/(dashboard)/squad/page.tsx`

- [ ] **Step 1: Add permissions toggle**

In the squad page, find where ACCEPTED members are rendered (players and coaches tabs). For each member row, add a toggle for `canManageEvents`.

Add mutation:
```tsx
const permMut = api.clubMembership.setPermissions.useMutation({
  onSuccess: () => {
    toast.success("Uprawnienia zaktualizowane");
    utils.clubMembership.listMembers.invalidate();
  },
  onError: (e) => toast.error(e.message),
});
```

The `listMembers` query needs to include `canManageEvents` in the response. Check if `clubMembership.listMembers` already returns it — if not, update the select in the router.

For each member card/row, add (visible only to club owner):
```tsx
{isOwner && (
  <Button
    size="sm"
    variant={member.canManageEvents ? "default" : "outline"}
    className="text-xs"
    onClick={() => permMut.mutate({
      membershipId: member.id,
      canManageEvents: !member.canManageEvents,
    })}
    disabled={permMut.isPending}
  >
    {member.canManageEvents ? "✓ Zarządza wydarzeniami" : "Nadaj uprawnienia"}
  </Button>
)}
```

- [ ] **Step 2: Ensure listMembers returns canManageEvents**

In `src/server/trpc/routers/club-membership.ts`, in the `listMembers` procedure, check if the query selects/includes `canManageEvents`. If not, add it to the select or ensure the full model is returned.

- [ ] **Step 3: Verify TypeScript**

Run: `npx tsc --noEmit`

- [ ] **Step 4: Commit**

```bash
git add "src/app/(dashboard)/squad/page.tsx" src/server/trpc/routers/club-membership.ts
git commit -m "feat: add permissions toggle for canManageEvents on squad page"
```

---

### Task 8: Final verification + build

- [ ] **Step 1: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 2: Run build**

Run: `npm run build`
Expected: Successful build

- [ ] **Step 3: Commit if any fixes needed**
