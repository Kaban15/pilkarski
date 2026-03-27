# Club Invite Members Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow clubs to search and invite players/coaches to their squad, with accept/reject flow from the invited user's side.

**Architecture:** New INVITED status in MembershipStatus enum. 4 new tRPC procedures (invite, respondToInvite, searchUsers, myInvitations). Invite dialog on /squad, invite button on public profiles, invitations widget on dashboard.

**Tech Stack:** Next.js 16 (App Router), tRPC v11, Prisma 7, Tailwind 4, shadcn/ui, lucide-react

---

### File Map

**Create:**
- `prisma/migrations/20260327180000_add_invited_status/migration.sql`
- `src/components/squad/invite-member-dialog.tsx` — search + invite dialog
- `src/components/club-invite-button.tsx` — invite button for public profiles
- `src/components/dashboard/club-invitations.tsx` — invitations widget for player/coach dashboard

**Modify:**
- `prisma/schema.prisma` — INVITED in MembershipStatus, CLUB_INVITATION in NotificationType
- `src/server/trpc/routers/club-membership.ts` — invite, respondToInvite, searchUsers, myInvitations
- `src/lib/labels.ts` — CLUB_INVITATION label
- `src/app/(dashboard)/squad/page.tsx` — invite button + sent invitations in requests tab
- `src/app/(public)/players/[id]/page.tsx` — InviteButton
- `src/app/(public)/coaches/[id]/page.tsx` — InviteButton (if exists)
- `src/app/(dashboard)/feed/page.tsx` — ClubInvitations widget

---

### Task 1: Schema + migration

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/20260327180000_add_invited_status/migration.sql`

- [ ] **Step 1: Add INVITED to MembershipStatus enum**

In `prisma/schema.prisma`, find `enum MembershipStatus` and add `INVITED` after `PENDING`:

```prisma
enum MembershipStatus {
  PENDING
  INVITED
  ACCEPTED
  REJECTED
  LEFT
  REMOVED
}
```

- [ ] **Step 2: Add CLUB_INVITATION to NotificationType**

In `enum NotificationType`, append:
```prisma
  CLUB_INVITATION        // zaproszenie do kadry klubu
```

- [ ] **Step 3: Generate Prisma client**

Run: `npx prisma generate`

- [ ] **Step 4: Create and apply migration**

Create `prisma/migrations/20260327180000_add_invited_status/migration.sql`:
```sql
-- Add INVITED to MembershipStatus enum
ALTER TYPE "MembershipStatus" ADD VALUE 'INVITED' BEFORE 'ACCEPTED';
```

Apply via node pg client.

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add INVITED status and CLUB_INVITATION notification type"
```

---

### Task 2: Backend — 4 new procedures + label

**Files:**
- Modify: `src/server/trpc/routers/club-membership.ts`
- Modify: `src/lib/labels.ts`

- [ ] **Step 1: Add notification label**

In `src/lib/labels.ts`, add to `NOTIFICATION_TYPE_LABELS`:
```typescript
  CLUB_INVITATION: "Zaproszenie do klubu",
```

Add to `NOTIFICATION_TYPE_COLORS`:
```typescript
  CLUB_INVITATION: "text-emerald-800 dark:text-emerald-200 bg-emerald-50 dark:bg-emerald-950",
```

- [ ] **Step 2: Add `searchUsers` procedure**

In `src/server/trpc/routers/club-membership.ts`, add:

```typescript
  searchUsers: protectedProcedure
    .input(z.object({
      query: z.string().min(2).max(100),
      limit: z.number().int().min(1).max(20).default(10),
    }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const club = await ctx.db.club.findUnique({
        where: { userId },
        select: { id: true },
      });
      if (!club) throw new TRPCError({ code: "FORBIDDEN", message: "Tylko kluby mogą wyszukiwać" });

      // Get existing memberships to exclude
      const existing = await ctx.db.clubMembership.findMany({
        where: {
          clubId: club.id,
          status: { in: ["ACCEPTED", "INVITED", "PENDING"] },
        },
        select: { memberUserId: true },
      });
      const excludeIds = [userId, ...existing.map((m) => m.memberUserId)];

      const [players, coaches] = await Promise.all([
        ctx.db.player.findMany({
          where: {
            userId: { notIn: excludeIds },
            OR: [
              { firstName: { contains: input.query, mode: "insensitive" } },
              { lastName: { contains: input.query, mode: "insensitive" } },
            ],
          },
          select: {
            userId: true,
            firstName: true,
            lastName: true,
            photoUrl: true,
            city: true,
            primaryPosition: true,
          },
          take: input.limit,
        }),
        ctx.db.coach.findMany({
          where: {
            userId: { notIn: excludeIds },
            OR: [
              { firstName: { contains: input.query, mode: "insensitive" } },
              { lastName: { contains: input.query, mode: "insensitive" } },
            ],
          },
          select: {
            userId: true,
            firstName: true,
            lastName: true,
            photoUrl: true,
            city: true,
            specialization: true,
          },
          take: input.limit,
        }),
      ]);

      return {
        players: players.map((p) => ({ ...p, role: "PLAYER" as const })),
        coaches: coaches.map((c) => ({ ...c, role: "COACH" as const })),
      };
    }),
```

- [ ] **Step 3: Add `invite` procedure**

```typescript
  invite: protectedProcedure
    .input(z.object({
      userId: z.string().uuid(),
      message: z.string().max(500).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const callerId = ctx.session.user.id;
      const club = await ctx.db.club.findUnique({
        where: { userId: callerId },
        select: { id: true, name: true },
      });
      if (!club) throw new TRPCError({ code: "FORBIDDEN", message: "Tylko kluby mogą zapraszać" });

      // Check target user role
      const targetUser = await ctx.db.user.findUnique({
        where: { id: input.userId },
        select: { role: true },
      });
      if (!targetUser || (targetUser.role !== "PLAYER" && targetUser.role !== "COACH")) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Można zapraszać tylko zawodników i trenerów" });
      }

      // Check no existing active membership
      const existing = await ctx.db.clubMembership.findUnique({
        where: { clubId_memberUserId: { clubId: club.id, memberUserId: input.userId } },
      });
      if (existing && ["ACCEPTED", "INVITED", "PENDING"].includes(existing.status)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Ten użytkownik jest już członkiem lub zaproszony" });
      }

      const memberType = targetUser.role === "PLAYER" ? "PLAYER" : "COACH";

      const membership = existing
        ? await ctx.db.clubMembership.update({
            where: { id: existing.id },
            data: { status: "INVITED", memberType, message: input.message },
          })
        : await ctx.db.clubMembership.create({
            data: {
              clubId: club.id,
              memberUserId: input.userId,
              memberType,
              status: "INVITED",
              message: input.message,
            },
          });

      // Notification + push
      ctx.db.notification.create({
        data: {
          userId: input.userId,
          type: "CLUB_INVITATION",
          title: "Zaproszenie do klubu",
          message: `Klub ${club.name} zaprasza Cię do kadry`,
          link: "/feed",
        },
      }).catch(() => {});

      return membership;
    }),
```

Note: Import `sendPushToUser` if not already imported and add push. Check the file — if `sendPushToUser` is already imported, use it:
```typescript
      sendPushToUser(input.userId, {
        title: "Zaproszenie do klubu",
        body: `Klub ${club.name} zaprasza Cię do kadry`,
        url: "/feed",
      }).catch(() => {});
```

- [ ] **Step 4: Add `respondToInvite` procedure**

```typescript
  respondToInvite: protectedProcedure
    .input(z.object({
      membershipId: z.string().uuid(),
      decision: z.enum(["ACCEPT", "REJECT"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const membership = await ctx.db.clubMembership.findUnique({
        where: { id: input.membershipId },
        include: { club: { select: { userId: true, name: true } } },
      });
      if (!membership) throw new TRPCError({ code: "NOT_FOUND" });
      if (membership.memberUserId !== userId) throw new TRPCError({ code: "FORBIDDEN" });
      if (membership.status !== "INVITED") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "To zaproszenie nie jest już aktywne" });
      }

      if (input.decision === "ACCEPT") {
        const updated = await ctx.db.clubMembership.update({
          where: { id: input.membershipId },
          data: { status: "ACCEPTED", acceptedAt: new Date() },
        });

        ctx.db.notification.create({
          data: {
            userId: membership.club.userId,
            type: "MEMBERSHIP_ACCEPTED",
            title: "Zaproszenie zaakceptowane",
            message: "Użytkownik dołączył do Twojego klubu",
            link: "/squad",
          },
        }).catch(() => {});

        return updated;
      } else {
        return ctx.db.clubMembership.update({
          where: { id: input.membershipId },
          data: { status: "REJECTED" },
        });
      }
    }),
```

- [ ] **Step 5: Add `myInvitations` procedure**

```typescript
  myInvitations: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.clubMembership.findMany({
      where: {
        memberUserId: ctx.session.user.id,
        status: "INVITED",
      },
      include: {
        club: { select: { id: true, name: true, logoUrl: true, city: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }),
```

- [ ] **Step 6: Verify TypeScript**

Run: `npx tsc --noEmit`

- [ ] **Step 7: Commit**

```bash
git add src/server/trpc/routers/club-membership.ts src/lib/labels.ts
git commit -m "feat: add invite, respondToInvite, searchUsers, myInvitations procedures"
```

---

### Task 3: Invite dialog on /squad

**Files:**
- Create: `src/components/squad/invite-member-dialog.tsx`
- Modify: `src/app/(dashboard)/squad/page.tsx`

- [ ] **Step 1: Create InviteMemberDialog component**

Create `src/components/squad/invite-member-dialog.tsx`:

```tsx
"use client";

import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/trpc-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { UserPlus, Search, MapPin } from "lucide-react";
import { POSITION_LABELS } from "@/lib/labels";

export function InviteMemberDialog({ onInvited }: { onInvited: () => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  const { data } = api.clubMembership.searchUsers.useQuery(
    { query: debouncedQuery },
    { enabled: debouncedQuery.length >= 2 }
  );

  const inviteMut = api.clubMembership.invite.useMutation({
    onSuccess: () => {
      toast.success("Zaproszenie wysłane");
      onInvited();
    },
    onError: (e) => toast.error(e.message),
  });

  // Debounce
  const handleSearch = (value: string) => {
    setQuery(value);
    clearTimeout((globalThis as Record<string, ReturnType<typeof setTimeout>>).__searchTimeout);
    (globalThis as Record<string, ReturnType<typeof setTimeout>>).__searchTimeout = setTimeout(() => {
      setDebouncedQuery(value);
    }, 400);
  };

  const allResults = [
    ...(data?.players ?? []).map((p) => ({
      userId: p.userId,
      name: `${p.firstName} ${p.lastName}`,
      detail: p.primaryPosition ? POSITION_LABELS[p.primaryPosition] ?? p.primaryPosition : null,
      city: p.city,
      photoUrl: p.photoUrl,
      role: "PLAYER" as const,
    })),
    ...(data?.coaches ?? []).map((c) => ({
      userId: c.userId,
      name: `${c.firstName} ${c.lastName}`,
      detail: c.specialization,
      city: c.city,
      photoUrl: c.photoUrl,
      role: "COACH" as const,
    })),
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <UserPlus className="mr-1 h-4 w-4" />
          Zaproś
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Zaproś do kadry</DialogTitle>
        </DialogHeader>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Szukaj po imieniu lub nazwisku..."
            className="pl-9"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
        {allResults.length > 0 ? (
          <ul className="space-y-2">
            {allResults.map((user) => (
              <li
                key={user.userId}
                className="flex items-center gap-3 rounded-lg border border-border p-3"
              >
                {user.photoUrl ? (
                  <img src={user.photoUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {user.name.charAt(0)}
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium">{user.name}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="secondary" className="text-[10px]">
                      {user.role === "PLAYER" ? "Zawodnik" : "Trener"}
                    </Badge>
                    {user.detail && <span>{user.detail}</span>}
                    {user.city && (
                      <span className="flex items-center gap-0.5">
                        <MapPin className="h-3 w-3" />
                        {user.city}
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => inviteMut.mutate({ userId: user.userId })}
                  disabled={inviteMut.isPending}
                >
                  Zaproś
                </Button>
              </li>
            ))}
          </ul>
        ) : debouncedQuery.length >= 2 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">Brak wyników</p>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Integrate in /squad page**

In `src/app/(dashboard)/squad/page.tsx`:

Add import:
```tsx
import { InviteMemberDialog } from "@/components/squad/invite-member-dialog";
```

Find the header area where the page title is. Add the dialog button next to it (owner-only):
```tsx
{isOwner && (
  <InviteMemberDialog onInvited={() => {
    utils.clubMembership.listMembers.invalidate();
    utils.clubMembership.listRequestsForClub.invalidate();
  }} />
)}
```

In the "Prośby" (requests) tab, also show INVITED memberships. Find where `listRequestsForClub` data is rendered. Add a section for sent invitations. Query them:
```tsx
const { data: sentInvitations = [] } = api.clubMembership.listRequestsForClub.useQuery(undefined, { enabled: isOwner });
```

Actually, `listRequestsForClub` only returns PENDING status. We need to show INVITED too. The simplest approach: filter the members list or add a separate query. Since the plan should be simple, just note that INVITED members should show in the requests tab with a "Zaproszony" badge.

To show sent invitations, add a query in the squad page:
```tsx
const sentInvitations = members?.filter((m: { status: string }) => m.status === "INVITED") ?? [];
```

Wait — `listMembers` returns ACCEPTED only. We need INVITED from somewhere. The simplest: modify `listRequestsForClub` to also include INVITED, OR add a separate small query.

Recommend: modify `listRequestsForClub` in the router to include both PENDING and INVITED:
Change `where: { clubId: club.id, status: "PENDING" }` to `where: { clubId: club.id, status: { in: ["PENDING", "INVITED"] } }`.

Then in the UI, show PENDING and INVITED with different badges.

- [ ] **Step 3: Verify TypeScript**

Run: `npx tsc --noEmit`

- [ ] **Step 4: Commit**

```bash
git add src/components/squad/invite-member-dialog.tsx "src/app/(dashboard)/squad/page.tsx" src/server/trpc/routers/club-membership.ts
git commit -m "feat: add invite dialog on /squad with search and sent invitations"
```

---

### Task 4: Invite button on public profiles

**Files:**
- Create: `src/components/club-invite-button.tsx`
- Modify: `src/app/(public)/players/[id]/page.tsx`
- Modify: `src/app/(public)/coaches/[id]/page.tsx` (if exists)

- [ ] **Step 1: Create ClubInviteButton component**

Create `src/components/club-invite-button.tsx`:

```tsx
"use client";

import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { api } from "@/lib/trpc-react";
import { Button } from "@/components/ui/button";
import { UserPlus, Check } from "lucide-react";

interface ClubInviteButtonProps {
  targetUserId: string;
}

export function ClubInviteButton({ targetUserId }: ClubInviteButtonProps) {
  const { data: session } = useSession();

  const { data: club } = api.club.me.useQuery(undefined, {
    enabled: session?.user?.role === "CLUB",
  });

  const { data: membership } = api.clubMembership.myMembership.useQuery(
    { clubId: club?.id ?? "" },
    { enabled: false } // We check differently — see below
  );

  // Check if target is already a member/invited
  const { data: existingMembership } = api.clubMembership.listMembers.useQuery(
    { clubId: club?.id ?? "" },
    { enabled: !!club?.id }
  );

  const inviteMut = api.clubMembership.invite.useMutation({
    onSuccess: () => toast.success("Zaproszenie wysłane"),
    onError: (e) => toast.error(e.message),
  });

  if (!session || session.user.role !== "CLUB" || !club) return null;
  if (session.user.id === targetUserId) return null;

  // Check if already member
  const isAlready = existingMembership?.some(
    (m: { memberUserId: string }) => m.memberUserId === targetUserId
  );
  if (isAlready) return null;

  if (inviteMut.isSuccess) {
    return (
      <Button size="sm" variant="outline" disabled className="border-white/20 bg-white/10 text-white">
        <Check className="mr-1 h-4 w-4" />
        Zaproszono
      </Button>
    );
  }

  return (
    <Button
      size="sm"
      variant="outline"
      className="border-white/20 bg-white/10 text-white hover:bg-white/20"
      onClick={() => inviteMut.mutate({ userId: targetUserId })}
      disabled={inviteMut.isPending}
    >
      <UserPlus className="mr-1 h-4 w-4" />
      Zaproś do klubu
    </Button>
  );
}
```

- [ ] **Step 2: Add to player public profile**

In `src/app/(public)/players/[id]/page.tsx`, find the hero action buttons area (where FollowClubButton, ProfileMessageButton etc. are). Add:

```tsx
<ClubInviteButton targetUserId={player.userId} />
```

Import:
```tsx
import { ClubInviteButton } from "@/components/club-invite-button";
```

- [ ] **Step 3: Add to coach public profile**

In `src/app/(public)/coaches/[id]/page.tsx` (if exists), same pattern — add `<ClubInviteButton targetUserId={coach.userId} />` in the hero area.

- [ ] **Step 4: Verify TypeScript**

Run: `npx tsc --noEmit`

- [ ] **Step 5: Commit**

```bash
git add src/components/club-invite-button.tsx "src/app/(public)/players/[id]/page.tsx" "src/app/(public)/coaches/[id]/page.tsx"
git commit -m "feat: add invite button on player and coach public profiles"
```

---

### Task 5: Invitations widget on dashboard

**Files:**
- Create: `src/components/dashboard/club-invitations.tsx`
- Modify: `src/app/(dashboard)/feed/page.tsx`

- [ ] **Step 1: Create ClubInvitations component**

Create `src/components/dashboard/club-invitations.tsx`:

```tsx
"use client";

import { toast } from "sonner";
import { api } from "@/lib/trpc-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, X, Mail } from "lucide-react";

export function ClubInvitations() {
  const { data: invitations = [], refetch } = api.clubMembership.myInvitations.useQuery();

  const respondMut = api.clubMembership.respondToInvite.useMutation({
    onSuccess: (_, vars) => {
      toast.success(vars.decision === "ACCEPT" ? "Dołączyłeś do klubu" : "Zaproszenie odrzucone");
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  if (invitations.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Mail className="h-4 w-4 text-emerald-500" />
          Zaproszenia do klubów
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {invitations.map((inv) => (
            <li key={inv.id} className="flex items-center gap-3">
              {inv.club.logoUrl ? (
                <img src={inv.club.logoUrl} alt="" className="h-8 w-8 rounded-md object-cover" />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-xs font-bold text-primary">
                  {inv.club.name.charAt(0)}
                </div>
              )}
              <div className="flex-1">
                <p className="text-sm font-medium">{inv.club.name}</p>
                {inv.club.city && (
                  <p className="text-xs text-muted-foreground">{inv.club.city}</p>
                )}
              </div>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  onClick={() => respondMut.mutate({ membershipId: inv.id, decision: "ACCEPT" })}
                  disabled={respondMut.isPending}
                >
                  <Check className="mr-1 h-3.5 w-3.5" />
                  Akceptuj
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => respondMut.mutate({ membershipId: inv.id, decision: "REJECT" })}
                  disabled={respondMut.isPending}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Add to dashboard feed page**

In `src/app/(dashboard)/feed/page.tsx`, import and render for PLAYER/COACH roles:

```tsx
import { ClubInvitations } from "@/components/dashboard/club-invitations";
```

Find where role-specific sections are rendered (e.g., PlayerRecruitments, ClubRecruitment). Add `<ClubInvitations />` for PLAYER and COACH roles, before other sections.

- [ ] **Step 3: Verify TypeScript**

Run: `npx tsc --noEmit`

- [ ] **Step 4: Commit**

```bash
git add src/components/dashboard/club-invitations.tsx "src/app/(dashboard)/feed/page.tsx"
git commit -m "feat: add club invitations widget on player/coach dashboard"
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
