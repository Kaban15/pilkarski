# Admin Panel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an admin/moderation panel with report moderation, user management, platform metrics, and content management.

**Architecture:** New `isAdmin`/`isBanned` fields on User, new `ClubPostReport` model, new `admin` tRPC router with 11 procedures, single `/admin` page with 4 tabs. Soft delete for content (status CANCELLED), hidden flag for reported posts.

**Tech Stack:** Prisma 7, tRPC v11, Next.js 16, shadcn/ui Tabs, Auth.js v5 JWT

**Spec:** `docs/superpowers/specs/2026-03-30-admin-panel.md`

---

## File Structure

### New files
| File | Responsibility |
|------|---------------|
| `src/server/trpc/routers/admin.ts` | Admin tRPC router (11 procedures) |
| `src/app/(dashboard)/admin/page.tsx` | Admin page with 4 tabs |
| `src/lib/validators/admin.ts` | Zod schemas for admin procedures |
| `prisma/migrations/xxx_admin_panel/migration.sql` | DB migration |

### Modified files
| File | Change |
|------|--------|
| `prisma/schema.prisma` | Add ClubPostReport model, isAdmin/isBanned on User, hidden/reportCount on ClubPost |
| `src/server/trpc/router.ts` | Import + register admin router |
| `src/server/trpc/routers/club-post.ts` | Rewrite `report` procedure, add `hidden: false` filter to `list` |
| `src/server/trpc/routers/feed.ts` | Add `hidden: false` filter on ClubPost query |
| `src/server/trpc/routers/favorite.ts` | Filter out hidden ClubPosts in list (JS-side post-fetch) |
| `src/server/auth/config.ts` | Add isAdmin to JWT/session, isBanned check in authorize + jwt callback |
| `src/types/next-auth.d.ts` | Add isAdmin to Session/JWT types |
| `src/middleware.ts` | Block non-admin access to `/admin` |
| `src/components/layout/sidebar.tsx` | Add Admin link (conditional on isAdmin) |

---

## Task 1: Schema — Add fields and ClubPostReport model

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add isAdmin and isBanned to User model**

In `prisma/schema.prisma`, in the `User` model (after `isVerified` field, around line 103), add:

```prisma
  isAdmin    Boolean  @default(false) @map("is_admin")
  isBanned   Boolean  @default(false) @map("is_banned")
```

Also add relation at the bottom of User model relations:

```prisma
  clubPostReports          ClubPostReport[]
```

- [ ] **Step 2: Add hidden fields and reportCount to ClubPost model**

In `prisma/schema.prisma`, in the `ClubPost` model (after `updatedAt` field, around line 770), add:

```prisma
  hidden      Boolean   @default(false)
  hiddenAt    DateTime? @map("hidden_at") @db.Timestamptz
  hiddenBy    String?   @map("hidden_by") @db.Uuid
  reportCount Int       @default(0) @map("report_count")
```

Also add relation at the bottom of ClubPost model relations:

```prisma
  reports   ClubPostReport[]
```

- [ ] **Step 3: Add ClubPostReport model**

After the `ClubPost` model in `prisma/schema.prisma`, add:

```prisma
model ClubPostReport {
  id        String   @id @default(uuid()) @db.Uuid
  postId    String   @map("post_id") @db.Uuid
  userId    String   @map("user_id") @db.Uuid
  reason    String?  @db.VarChar(500)
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz

  post ClubPost @relation(fields: [postId], references: [id], onDelete: Cascade)
  user User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, postId])
  @@index([postId])
  @@map("club_post_reports")
}
```

- [ ] **Step 4: Generate Prisma client to verify schema**

Run: `cd /c/Users/piotr/CascadeProjects/pilkarski && npx prisma generate`
Expected: `✔ Generated Prisma Client`

- [ ] **Step 5: Create migration**

Run: `cd /c/Users/piotr/CascadeProjects/pilkarski && npx prisma migrate dev --url "<DATABASE_URL>" --name admin_panel`
Expected: migration created in `prisma/migrations/`

- [ ] **Step 6: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat(admin): add isAdmin, isBanned, ClubPostReport model, hidden fields on ClubPost"
```

---

## Task 2: Auth — isAdmin in JWT/session + isBanned check

**Files:**
- Modify: `src/types/next-auth.d.ts`
- Modify: `src/server/auth/config.ts`

- [ ] **Step 1: Update next-auth types**

Replace contents of `src/types/next-auth.d.ts`:

```typescript
import { type DefaultSession } from "next-auth";
import { type JWT as DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "CLUB" | "PLAYER" | "COACH";
      isAdmin: boolean;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    role: "CLUB" | "PLAYER" | "COACH";
    isAdmin: boolean;
    bannedCheckedAt?: number;
  }
}
```

- [ ] **Step 2: Update authorize() to check isBanned**

In `src/server/auth/config.ts`, in the `authorize` function, after the `const user = await db.user.findUnique(...)` block and after the `if (!user) return null;` check (~line 34), add:

```typescript
        if (user.isBanned) return null;
```

Also add `isAdmin` to the return object (after `role`):

```typescript
        return {
          id: user.id,
          email: user.email,
          role: user.role,
          isAdmin: user.isAdmin,
          name:
            user.role === "CLUB"
              ? user.club?.name
              : user.role === "COACH"
                ? `${user.coach?.firstName} ${user.coach?.lastName}`
                : `${user.player?.firstName} ${user.player?.lastName}`,
        };
```

- [ ] **Step 3: Update jwt callback — persist isAdmin + ban check with 5-min cache**

Replace the `jwt` callback in `src/server/auth/config.ts`:

```typescript
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = (user as { role: "CLUB" | "PLAYER" | "COACH" }).role;
        token.isAdmin = (user as { isAdmin?: boolean }).isAdmin ?? false;
        token.bannedCheckedAt = Date.now();
      }

      // Re-check isBanned every 5 minutes
      const FIVE_MINUTES = 5 * 60 * 1000;
      if (!token.bannedCheckedAt || Date.now() - token.bannedCheckedAt > FIVE_MINUTES) {
        const dbUser = await db.user.findUnique({
          where: { id: token.id },
          select: { isBanned: true, isAdmin: true },
        });
        if (dbUser?.isBanned) {
          // Return empty token to force sign-out
          return { ...token, id: "", role: "" as "CLUB" };
        }
        token.isAdmin = dbUser?.isAdmin ?? false;
        token.bannedCheckedAt = Date.now();
      }

      return token;
    },
```

- [ ] **Step 4: Update session callback — expose isAdmin**

Replace the `session` callback in `src/server/auth/config.ts`:

```typescript
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.isAdmin = token.isAdmin ?? false;
      }
      return session;
    },
```

- [ ] **Step 5: Verify build**

Run: `cd /c/Users/piotr/CascadeProjects/pilkarski && npx tsc --noEmit 2>&1 | head -20`
Expected: no errors (or only pre-existing ones)

- [ ] **Step 6: Commit**

```bash
git add src/types/next-auth.d.ts src/server/auth/config.ts
git commit -m "feat(admin): add isAdmin to JWT/session, isBanned login block + 5-min ban check"
```

---

## Task 3: Middleware — Block non-admin access to /admin

**Files:**
- Modify: `src/middleware.ts`

- [ ] **Step 1: Add /admin route protection**

In `src/middleware.ts`, after the existing token check block (after `if (!token)` redirect, ~line 30), add before the final `return NextResponse.next()`:

```typescript
  // Admin-only routes
  if (pathname.startsWith("/admin")) {
    if (!token.isAdmin) {
      return NextResponse.redirect(new URL("/feed", req.nextUrl.origin));
    }
  }
```

- [ ] **Step 2: Commit**

```bash
git add src/middleware.ts
git commit -m "feat(admin): block non-admin access to /admin in Edge middleware"
```

---

## Task 4: Validators — Zod schemas for admin procedures

**Files:**
- Create: `src/lib/validators/admin.ts`

- [ ] **Step 1: Create admin validators**

Create `src/lib/validators/admin.ts`:

```typescript
import { z } from "zod/v4";

// --- Reports ---

export const adminReportsListSchema = z.object({
  cursor: z.string().uuid().optional(),
  limit: z.number().int().min(1).max(50).default(20),
});

export const adminDismissReportSchema = z.object({
  postId: z.string().uuid(),
});

export const adminHidePostSchema = z.object({
  postId: z.string().uuid(),
});

// --- Users ---

export const adminUsersListSchema = z.object({
  cursor: z.string().uuid().optional(),
  limit: z.number().int().min(1).max(50).default(20),
  search: z.string().max(100).optional(),
});

export const adminBanSchema = z.object({
  userId: z.string().uuid(),
});

export const adminSetAdminSchema = z.object({
  userId: z.string().uuid(),
  isAdmin: z.boolean(),
});

// --- Content ---

export const adminContentListSchema = z.object({
  cursor: z.string().uuid().optional(),
  limit: z.number().int().min(1).max(50).default(20),
  search: z.string().max(100).optional(),
});

export const adminDeleteContentSchema = z.object({
  type: z.enum(["sparing", "event", "tournament"]),
  id: z.string().uuid(),
});
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/validators/admin.ts
git commit -m "feat(admin): add Zod validators for admin procedures"
```

---

## Task 5: Admin router — reports + users procedures

**Files:**
- Create: `src/server/trpc/routers/admin.ts`

- [ ] **Step 1: Create admin router with reports and users procedures**

Create `src/server/trpc/routers/admin.ts`:

```typescript
import { router, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import {
  adminReportsListSchema,
  adminDismissReportSchema,
  adminHidePostSchema,
  adminUsersListSchema,
  adminBanSchema,
  adminSetAdminSchema,
  adminContentListSchema,
  adminDeleteContentSchema,
} from "@/lib/validators/admin";

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!ctx.session.user.isAdmin) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Brak uprawnień admina" });
  }
  return next();
});

export const adminRouter = router({
  // ── Reports ──

  reportsList: adminProcedure
    .input(adminReportsListSchema)
    .query(async ({ ctx, input }) => {
      const items = await ctx.db.clubPost.findMany({
        where: { reportCount: { gt: 0 }, hidden: false },
        include: {
          club: { select: { id: true, name: true, logoUrl: true } },
          reports: {
            include: { user: { select: { id: true, email: true } } },
            orderBy: { createdAt: "desc" },
          },
        },
        take: input.limit + 1,
        ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
        orderBy: { reportCount: "desc" },
      });

      let nextCursor: string | undefined;
      if (items.length > input.limit) {
        nextCursor = items.pop()!.id;
      }

      return { items, nextCursor };
    }),

  dismissReport: adminProcedure
    .input(adminDismissReportSchema)
    .mutation(async ({ ctx, input }) => {
      await ctx.db.$transaction([
        ctx.db.clubPostReport.deleteMany({ where: { postId: input.postId } }),
        ctx.db.clubPost.update({
          where: { id: input.postId },
          data: { reportCount: 0 },
        }),
      ]);
      return { success: true };
    }),

  hidePost: adminProcedure
    .input(adminHidePostSchema)
    .mutation(async ({ ctx, input }) => {
      await ctx.db.clubPost.update({
        where: { id: input.postId },
        data: {
          hidden: true,
          hiddenAt: new Date(),
          hiddenBy: ctx.session.user.id,
          reportCount: 0,
        },
      });
      await ctx.db.clubPostReport.deleteMany({ where: { postId: input.postId } });
      return { success: true };
    }),

  // ── Users ──

  usersList: adminProcedure
    .input(adminUsersListSchema)
    .query(async ({ ctx, input }) => {
      const where: Record<string, unknown> = {};

      if (input.search) {
        where.OR = [
          { email: { contains: input.search, mode: "insensitive" } },
          { club: { name: { contains: input.search, mode: "insensitive" } } },
          { player: { firstName: { contains: input.search, mode: "insensitive" } } },
          { player: { lastName: { contains: input.search, mode: "insensitive" } } },
          { coach: { firstName: { contains: input.search, mode: "insensitive" } } },
          { coach: { lastName: { contains: input.search, mode: "insensitive" } } },
        ];
      }

      const items = await ctx.db.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          role: true,
          isAdmin: true,
          isBanned: true,
          createdAt: true,
          club: { select: { name: true } },
          player: { select: { firstName: true, lastName: true } },
          coach: { select: { firstName: true, lastName: true } },
        },
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

  ban: adminProcedure
    .input(adminBanSchema)
    .mutation(async ({ ctx, input }) => {
      if (input.userId === ctx.session.user.id) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Nie możesz zbanować siebie" });
      }
      await ctx.db.user.update({
        where: { id: input.userId },
        data: { isBanned: true },
      });
      return { success: true };
    }),

  unban: adminProcedure
    .input(adminBanSchema)
    .mutation(async ({ ctx, input }) => {
      await ctx.db.user.update({
        where: { id: input.userId },
        data: { isBanned: false },
      });
      return { success: true };
    }),

  setAdmin: adminProcedure
    .input(adminSetAdminSchema)
    .mutation(async ({ ctx, input }) => {
      // Cannot remove admin from yourself
      if (input.userId === ctx.session.user.id && !input.isAdmin) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Nie możesz odebrać sobie roli admina" });
      }
      // Cannot remove the last admin
      if (!input.isAdmin) {
        const adminCount = await ctx.db.user.count({ where: { isAdmin: true } });
        if (adminCount <= 1) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Musi istnieć co najmniej jeden admin" });
        }
      }
      await ctx.db.user.update({
        where: { id: input.userId },
        data: { isAdmin: input.isAdmin },
      });
      return { success: true };
    }),

  // ── Metrics ──

  dashboard: adminProcedure.query(async ({ ctx }) => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [
      totalUsers,
      clubCount,
      playerCount,
      coachCount,
      newUsers7d,
      totalSparings,
      newSparings7d,
      totalEvents,
      newEvents7d,
      totalTournaments,
      pendingReports,
    ] = await Promise.all([
      ctx.db.user.count(),
      ctx.db.user.count({ where: { role: "CLUB" } }),
      ctx.db.user.count({ where: { role: "PLAYER" } }),
      ctx.db.user.count({ where: { role: "COACH" } }),
      ctx.db.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      ctx.db.sparingOffer.count(),
      ctx.db.sparingOffer.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      ctx.db.event.count(),
      ctx.db.event.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      ctx.db.tournament.count(),
      ctx.db.clubPost.count({ where: { reportCount: { gt: 0 }, hidden: false } }),
    ]);

    return {
      totalUsers,
      clubCount,
      playerCount,
      coachCount,
      newUsers7d,
      totalSparings,
      newSparings7d,
      totalEvents,
      newEvents7d,
      totalTournaments,
      pendingReports,
    };
  }),

  // ── Content ──

  contentList: adminProcedure
    .input(adminContentListSchema.extend({
      type: adminDeleteContentSchema.shape.type,
    }))
    .query(async ({ ctx, input }) => {
      const searchFilter = input.search
        ? { title: { contains: input.search, mode: "insensitive" as const } }
        : {};

      if (input.type === "sparing") {
        const items = await ctx.db.sparingOffer.findMany({
          where: searchFilter,
          include: { club: { select: { id: true, name: true } } },
          take: input.limit + 1,
          ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
          orderBy: { createdAt: "desc" },
        });
        let nextCursor: string | undefined;
        if (items.length > input.limit) nextCursor = items.pop()!.id;
        return { items, nextCursor };
      }

      if (input.type === "event") {
        const items = await ctx.db.event.findMany({
          where: searchFilter,
          include: { club: { select: { id: true, name: true } } },
          take: input.limit + 1,
          ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
          orderBy: { createdAt: "desc" },
        });
        let nextCursor: string | undefined;
        if (items.length > input.limit) nextCursor = items.pop()!.id;
        return { items, nextCursor };
      }

      // tournament
      const items = await ctx.db.tournament.findMany({
        where: input.search
          ? { title: { contains: input.search, mode: "insensitive" } }
          : {},
        select: {
          id: true,
          title: true,
          status: true,
          startDate: true,
          createdAt: true,
          organizer: { select: { id: true, email: true } },
        },
        take: input.limit + 1,
        ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
        orderBy: { createdAt: "desc" },
      });
      let nextCursor: string | undefined;
      if (items.length > input.limit) nextCursor = items.pop()!.id;
      return { items, nextCursor };
    }),

  deleteContent: adminProcedure
    .input(adminDeleteContentSchema)
    .mutation(async ({ ctx, input }) => {
      if (input.type === "sparing") {
        await ctx.db.sparingOffer.update({
          where: { id: input.id },
          data: { status: "CANCELLED" },
        });
      } else if (input.type === "event") {
        // Event has no status field — hard delete is the only option
        await ctx.db.event.delete({ where: { id: input.id } });
      } else {
        await ctx.db.tournament.update({
          where: { id: input.id },
          data: { status: "CANCELLED" },
        });
      }
      return { success: true };
    }),
});
```

- [ ] **Step 2: Register admin router in root**

In `src/server/trpc/router.ts`, add import at the top:

```typescript
import { adminRouter } from "./routers/admin";
```

And add to the router object (after `tournament`):

```typescript
  admin: adminRouter,
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `cd /c/Users/piotr/CascadeProjects/pilkarski && npx tsc --noEmit 2>&1 | head -20`
Expected: no new errors

- [ ] **Step 4: Commit**

```bash
git add src/server/trpc/routers/admin.ts src/server/trpc/router.ts
git commit -m "feat(admin): add admin router with 11 procedures (reports, users, metrics, content)"
```

---

## Task 6: Update club-post router — report persistence + hidden filter

**Files:**
- Modify: `src/server/trpc/routers/club-post.ts`

- [ ] **Step 1: Rewrite report procedure**

In `src/server/trpc/routers/club-post.ts`, replace the `report` procedure (~lines 127-137) with:

```typescript
  report: protectedProcedure
    .input(z.object({
      postId: z.string().uuid(),
      reason: z.string().max(500).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const post = await ctx.db.clubPost.findUnique({ where: { id: input.postId } });
      if (!post) throw new TRPCError({ code: "NOT_FOUND" });

      const existing = await ctx.db.clubPostReport.findUnique({
        where: {
          userId_postId: {
            userId: ctx.session.user.id,
            postId: input.postId,
          },
        },
      });

      if (existing) {
        // Already reported — update reason only
        await ctx.db.clubPostReport.update({
          where: { id: existing.id },
          data: { reason: input.reason },
        });
      } else {
        // New report — create + increment counter
        await ctx.db.$transaction([
          ctx.db.clubPostReport.create({
            data: {
              userId: ctx.session.user.id,
              postId: input.postId,
              reason: input.reason,
            },
          }),
          ctx.db.clubPost.update({
            where: { id: input.postId },
            data: { reportCount: { increment: 1 } },
          }),
        ]);
      }

      return { success: true };
    }),
```

- [ ] **Step 2: Add hidden filter to list procedure**

In the `list` procedure of `club-post.ts` (~line 109), add to the `where` object right after initialization:

```typescript
      where.hidden = false;
```

- [ ] **Step 3: Verify build**

Run: `cd /c/Users/piotr/CascadeProjects/pilkarski && npx tsc --noEmit 2>&1 | head -20`

- [ ] **Step 4: Commit**

```bash
git add src/server/trpc/routers/club-post.ts
git commit -m "feat(admin): persist reports in ClubPostReport + filter hidden posts from list"
```

---

## Task 7: Hidden filter — feed + favorites

**Files:**
- Modify: `src/server/trpc/routers/feed.ts`
- Modify: `src/server/trpc/routers/favorite.ts`

- [ ] **Step 1: Add hidden filter to feed**

In `src/server/trpc/routers/feed.ts`, find the `clubPost.findMany` query (~line 76-86). Add `hidden: false` to the `where` clause:

```typescript
      const clubPosts = await ctx.db.clubPost.findMany({
        where: {
          hidden: false,
          // ...existing filters (expiration, region, etc.)
        },
```

- [ ] **Step 2: Add hidden filter to favorites**

In `src/server/trpc/routers/favorite.ts`, in the `list` procedure, the query uses `include` with clubPost relation. Since Prisma `include` does not support `where` on included relations in `findMany`, add a JS-side filter **after** fetching, **before** slicing for pagination:

Find the line where `items` is returned and add filtering:

```typescript
      // After fetching and before returning, filter out hidden club posts
      const filtered = items.filter((item) => {
        if (item.clubPost && item.clubPost.hidden) return false;
        return true;
      });
```

Use `filtered` instead of `items` for the return value and nextCursor calculation. Note: this may return fewer items than `limit` in rare cases (hidden post was favorited). This is acceptable for MVP.

- [ ] **Step 3: Verify build**

Run: `cd /c/Users/piotr/CascadeProjects/pilkarski && npx tsc --noEmit 2>&1 | head -20`

- [ ] **Step 4: Commit**

```bash
git add src/server/trpc/routers/feed.ts src/server/trpc/routers/favorite.ts
git commit -m "feat(admin): filter hidden ClubPosts from feed and favorites"
```

---

**Note:** `src/server/trpc/routers/search.ts` does NOT query ClubPosts — it only searches clubs, players, sparings, and events. No changes needed there despite the spec mentioning it.

---

## Task 8: Sidebar — Admin link

**Files:**
- Modify: `src/components/layout/sidebar.tsx`

- [ ] **Step 1: Add Shield import**

In `src/components/layout/sidebar.tsx`, add `Shield` to the lucide-react imports:

```typescript
import {
  Home,
  Search,
  // ...existing imports...
  Shield,
} from "lucide-react";
```

- [ ] **Step 2: Update SidebarProps to include isAdmin**

Update the `SidebarProps` interface:

```typescript
interface SidebarProps {
  user: {
    name?: string | null;
    email?: string | null;
    role: string;
    isAdmin?: boolean;
  };
}
```

- [ ] **Step 3: Add Admin item to NAV_SECTIONS**

In the "Więcej" section of `NAV_SECTIONS`, add as the last item:

```typescript
      { href: "/admin", icon: Shield, label: "Admin" },
```

- [ ] **Step 4: Filter Admin link by isAdmin**

In the nav rendering section, update the filter that currently checks roles. Find the `.filter()` on items (~line 97):

```typescript
{section.items
  .filter((item) => {
    if (item.href === "/admin") return user.isAdmin;
    return !item.roles || item.roles.includes(user.role);
  })
  .map((item) => {
```

- [ ] **Step 5: Verify isAdmin flows from layout**

No change needed — `src/app/(dashboard)/layout.tsx` passes `session.user` to `<Sidebar>`, and the type augmentation in Task 2 adds `isAdmin` to session.user automatically. Just verify the prop types match after build.

- [ ] **Step 6: Commit**

```bash
git add src/components/layout/sidebar.tsx
git commit -m "feat(admin): add Admin link in sidebar (visible only for admins)"
```

---

## Task 9: Admin page — UI with 4 tabs

**Files:**
- Create: `src/app/(dashboard)/admin/page.tsx`

- [ ] **Step 1: Create the admin page**

Create `src/app/(dashboard)/admin/page.tsx`:

```tsx
"use client";

import { useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { api } from "@/lib/trpc-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/empty-state";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { StatsCell } from "@/components/stats-cell";
import { formatDate } from "@/lib/format";
import { ROLE_LABELS, CLUB_POST_CATEGORY_LABELS } from "@/lib/labels";
import { Shield, Flag, Users, BarChart3, FileText, Ban, ShieldCheck, ShieldOff, Eye, EyeOff, Trash2, Search } from "lucide-react";
import { toast } from "sonner";

export default function AdminPage() {
  const { data: session } = useSession();
  if (!session?.user?.isAdmin) redirect("/feed");

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-6">
      <div className="flex items-center gap-3">
        <Shield className="h-6 w-6 text-red-500" />
        <h1 className="text-2xl font-bold">Panel Admina</h1>
      </div>

      <ReportsBadgedTabs />
    </div>
  );
}

function ReportsBadgedTabs() {
  const { data: metrics } = api.admin.dashboard.useQuery();
  const pendingReports = metrics?.pendingReports ?? 0;

  return (
      <Tabs defaultValue="reports">
        <TabsList>
          <TabsTrigger value="reports" className="gap-2">
            <Flag className="h-4 w-4" /> Raporty
            {pendingReports > 0 && (
              <span className="ml-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                {pendingReports}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2">
            <Users className="h-4 w-4" /> Użytkownicy
          </TabsTrigger>
          <TabsTrigger value="metrics" className="gap-2">
            <BarChart3 className="h-4 w-4" /> Metryki
          </TabsTrigger>
          <TabsTrigger value="content" className="gap-2">
            <FileText className="h-4 w-4" /> Treści
          </TabsTrigger>
        </TabsList>

        <TabsContent value="reports"><ReportsTab /></TabsContent>
        <TabsContent value="users"><UsersTab /></TabsContent>
        <TabsContent value="metrics"><MetricsTab /></TabsContent>
        <TabsContent value="content"><ContentTab /></TabsContent>
      </Tabs>
    </div>
  );
}

// ── Reports Tab ──

function ReportsTab() {
  const utils = api.useUtils();
  const { data, isLoading } = api.admin.reportsList.useQuery({ limit: 50 });
  const dismiss = api.admin.dismissReport.useMutation({
    onSuccess: () => { utils.admin.reportsList.invalidate(); toast.success("Zgłoszenie odrzucone"); },
  });
  const hide = api.admin.hidePost.useMutation({
    onSuccess: () => { utils.admin.reportsList.invalidate(); toast.success("Post ukryty"); },
  });

  if (isLoading) return <p className="py-8 text-center text-muted-foreground">Ładowanie...</p>;
  if (!data?.items.length) return <EmptyState title="Brak zgłoszeń" description="Żadne posty nie zostały zgłoszone." />;

  return (
    <div className="space-y-3 pt-4">
      {data.items.map((post) => (
        <div key={post.id} className="rounded-lg border p-4 space-y-2">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{post.title}</p>
              <p className="text-sm text-muted-foreground">
                {post.club.name} · {CLUB_POST_CATEGORY_LABELS?.[post.category] ?? post.category} · {post.reportCount} zgłoszeń
              </p>
              {post.content && (
                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{post.content}</p>
              )}
            </div>
            <div className="flex gap-2 shrink-0">
              <ConfirmDialog
                title="Odrzuć zgłoszenia?"
                description="Zgłoszenia zostaną usunięte. Post pozostanie widoczny."
                onConfirm={() => dismiss.mutate({ postId: post.id })}
              >
                <button className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted transition-colors">
                  <Eye className="h-4 w-4" />
                </button>
              </ConfirmDialog>
              <ConfirmDialog
                title="Ukryj post?"
                description="Post zostanie ukryty dla wszystkich użytkowników."
                onConfirm={() => hide.mutate({ postId: post.id })}
              >
                <button className="rounded-md border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950 transition-colors">
                  <EyeOff className="h-4 w-4" />
                </button>
              </ConfirmDialog>
            </div>
          </div>
          {post.reports.length > 0 && (
            <details className="text-sm">
              <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                Szczegóły zgłoszeń ({post.reports.length})
              </summary>
              <ul className="mt-2 space-y-1 pl-4">
                {post.reports.map((r) => (
                  <li key={r.id} className="text-muted-foreground">
                    {r.user.email}: {r.reason || "—"} <span className="text-xs">({formatDate(r.createdAt)})</span>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Users Tab ──

function UsersTab() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const utils = api.useUtils();

  // Debounce search
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const handleSearch = (value: string) => {
    setSearch(value);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setDebouncedSearch(value), 300);
  };

  const { data, isLoading } = api.admin.usersList.useQuery({ limit: 50, search: debouncedSearch || undefined });
  const ban = api.admin.ban.useMutation({
    onSuccess: () => { utils.admin.usersList.invalidate(); toast.success("Użytkownik zbanowany"); },
  });
  const unban = api.admin.unban.useMutation({
    onSuccess: () => { utils.admin.usersList.invalidate(); toast.success("Ban usunięty"); },
  });
  const setAdmin = api.admin.setAdmin.useMutation({
    onSuccess: () => { utils.admin.usersList.invalidate(); toast.success("Uprawnienia zmienione"); },
    onError: (err) => toast.error(err.message),
  });

  const getUserName = (user: { email: string; club?: { name: string } | null; player?: { firstName: string; lastName: string } | null; coach?: { firstName: string; lastName: string } | null }) => {
    if (user.club) return user.club.name;
    if (user.player) return `${user.player.firstName} ${user.player.lastName}`;
    if (user.coach) return `${user.coach.firstName} ${user.coach.lastName}`;
    return user.email;
  };

  return (
    <div className="space-y-4 pt-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Szukaj po nazwie lub emailu..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full rounded-lg border bg-background py-2 pl-10 pr-4 text-sm"
        />
      </div>

      {isLoading && <p className="py-8 text-center text-muted-foreground">Ładowanie...</p>}

      {data?.items.map((user) => (
        <div key={user.id} className="flex items-center gap-4 rounded-lg border p-3">
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{getUserName(user)}</p>
            <p className="text-sm text-muted-foreground truncate">{user.email}</p>
          </div>
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            user.role === "CLUB" ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" :
            user.role === "PLAYER" ? "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300" :
            "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300"
          }`}>
            {ROLE_LABELS[user.role] ?? user.role}
          </span>
          {user.isAdmin && (
            <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700 dark:bg-violet-900 dark:text-violet-300">
              Admin
            </span>
          )}
          {user.isBanned && (
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900 dark:text-red-300">
              Zbanowany
            </span>
          )}
          <div className="flex gap-1.5 shrink-0">
            {user.isBanned ? (
              <ConfirmDialog title="Odbanuj użytkownika?" description="Użytkownik będzie mógł się ponownie zalogować." onConfirm={() => unban.mutate({ userId: user.id })}>
                <button className="rounded-md border px-2.5 py-1.5 text-xs hover:bg-muted transition-colors">Odbanuj</button>
              </ConfirmDialog>
            ) : (
              <ConfirmDialog title="Zbanuj użytkownika?" description="Użytkownik nie będzie mógł się zalogować." onConfirm={() => ban.mutate({ userId: user.id })}>
                <button className="rounded-md border border-red-200 px-2.5 py-1.5 text-xs text-red-600 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950 transition-colors">
                  <Ban className="h-3.5 w-3.5" />
                </button>
              </ConfirmDialog>
            )}
            <ConfirmDialog
              title={user.isAdmin ? "Odbierz uprawnienia admina?" : "Nadaj uprawnienia admina?"}
              description={user.isAdmin ? "Użytkownik straci dostęp do panelu admina." : "Użytkownik uzyska pełny dostęp do panelu admina."}
              onConfirm={() => setAdmin.mutate({ userId: user.id, isAdmin: !user.isAdmin })}
            >
              <button className="rounded-md border px-2.5 py-1.5 text-xs hover:bg-muted transition-colors">
                {user.isAdmin ? <ShieldOff className="h-3.5 w-3.5" /> : <ShieldCheck className="h-3.5 w-3.5" />}
              </button>
            </ConfirmDialog>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Metrics Tab ──

function MetricsTab() {
  const { data, isLoading } = api.admin.dashboard.useQuery();

  if (isLoading) return <p className="py-8 text-center text-muted-foreground">Ładowanie...</p>;
  if (!data) return null;

  return (
    <div className="space-y-6 pt-4">
      <div>
        <h3 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Łącznie</h3>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatsCell label="Użytkownicy" value={data.totalUsers} />
          <StatsCell label="Kluby" value={data.clubCount} />
          <StatsCell label="Zawodnicy" value={data.playerCount} />
          <StatsCell label="Trenerzy" value={data.coachCount} />
          <StatsCell label="Sparingi" value={data.totalSparings} />
          <StatsCell label="Wydarzenia" value={data.totalEvents} />
          <StatsCell label="Turnieje" value={data.totalTournaments} />
          <StatsCell label="Zgłoszenia" value={data.pendingReports} />
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Ostatnie 7 dni</h3>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          <StatsCell label="Nowi użytkownicy" value={data.newUsers7d} />
          <StatsCell label="Nowe sparingi" value={data.newSparings7d} />
          <StatsCell label="Nowe wydarzenia" value={data.newEvents7d} />
        </div>
      </div>
    </div>
  );
}

// ── Content Tab ──

function ContentTab() {
  const [contentType, setContentType] = useState<"sparing" | "event" | "tournament">("sparing");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const utils = api.useUtils();

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const handleSearch = (value: string) => {
    setSearch(value);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setDebouncedSearch(value), 300);
  };

  const { data, isLoading } = api.admin.contentList.useQuery({
    type: contentType,
    limit: 50,
    search: debouncedSearch || undefined,
  });
  const deleteContent = api.admin.deleteContent.useMutation({
    onSuccess: () => { utils.admin.contentList.invalidate(); toast.success("Treść anulowana"); },
  });

  const typeLabels = { sparing: "Sparingi", event: "Wydarzenia", tournament: "Turnieje" };

  return (
    <div className="space-y-4 pt-4">
      <div className="flex gap-2">
        {(["sparing", "event", "tournament"] as const).map((t) => (
          <button
            key={t}
            onClick={() => { setContentType(t); setSearch(""); setDebouncedSearch(""); }}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              contentType === t
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {typeLabels[t]}
          </button>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Szukaj po tytule..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full rounded-lg border bg-background py-2 pl-10 pr-4 text-sm"
        />
      </div>

      {isLoading && <p className="py-8 text-center text-muted-foreground">Ładowanie...</p>}

      {data?.items.map((item: Record<string, unknown>) => (
        <div key={item.id as string} className="flex items-center gap-4 rounded-lg border p-3">
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{item.title as string}</p>
            <p className="text-sm text-muted-foreground">
              {(item.club as { name: string } | undefined)?.name ??
                (item.organizer as { email: string } | undefined)?.email ?? "—"}{" "}
              · {formatDate(item.createdAt as Date)}
            </p>
          </div>
          {item.status && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{item.status as string}</span>
          )}
          <ConfirmDialog
            title="Anuluj treść?"
            description="Treść zostanie oznaczona jako anulowana."
            onConfirm={() => deleteContent.mutate({ type: contentType, id: item.id as string })}
          >
            <button className="rounded-md border border-red-200 px-2.5 py-1.5 text-xs text-red-600 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950 transition-colors">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </ConfirmDialog>
        </div>
      ))}

      {!isLoading && !data?.items.length && (
        <EmptyState title="Brak treści" description={`Nie znaleziono ${typeLabels[contentType].toLowerCase()}.`} />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `cd /c/Users/piotr/CascadeProjects/pilkarski && npx tsc --noEmit 2>&1 | head -30`

- [ ] **Step 3: Commit**

```bash
git add src/app/\(dashboard\)/admin/page.tsx
git commit -m "feat(admin): add /admin page with 4 tabs (reports, users, metrics, content)"
```

---

## Task 10: Smoke test + final verification

- [ ] **Step 1: Run dev server and verify**

Run: `cd /c/Users/piotr/CascadeProjects/pilkarski && npm run build 2>&1 | tail -20`
Expected: Build succeeds

- [ ] **Step 2: Run existing tests**

Run: `cd /c/Users/piotr/CascadeProjects/pilkarski && npm run test 2>&1`
Expected: All existing tests pass

- [ ] **Step 3: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix(admin): address build/test issues"
```
