# Club Group Chat — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a group chat for club members (players + coaches with ACCEPTED membership) accessible from the sidebar.

**Architecture:** Extend existing Conversation model with optional `clubId` field. Club group chat is a single Conversation linked to a club. Members auto-join when membership is ACCEPTED. Reuse existing chat UI with minor adaptations for group mode (multiple sender names, member list). No new DB models needed — just a nullable `clubId` on Conversation.

**Tech Stack:** Prisma (Conversation.clubId), tRPC (new procedures), React (chat page adaptation), Supabase realtime (existing pattern).

---

## File Structure

| File | Responsibility |
|------|---------------|
| `prisma/schema.prisma` | Add `clubId` to Conversation |
| `src/server/trpc/routers/message.ts` | Add `getClubChat`, `sendToClubChat` procedures |
| `src/app/(dashboard)/club-chat/page.tsx` | **NEW** — Club group chat page |
| `src/components/layout/sidebar.tsx` | Add "Czat klubu" nav item for CLUB/members |
| `prisma/migrations/20260327220000_add_club_chat/migration.sql` | **NEW** — Migration |

---

### Task 1: Schema — Add clubId to Conversation

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/20260327220000_add_club_chat/migration.sql`

- [ ] **Step 1: Add clubId field to Conversation model**

In `prisma/schema.prisma`, add to the Conversation model:
```prisma
  clubId    String?  @unique @map("club_id") @db.Uuid
  club      Club?    @relation(fields: [clubId], references: [id], onDelete: Cascade)
```

Add to the Club model:
```prisma
  groupChat Conversation?
```

Note: `@unique` ensures one group chat per club.

- [ ] **Step 2: Create migration SQL**

Create `prisma/migrations/20260327220000_add_club_chat/migration.sql`:
```sql
ALTER TABLE "conversations" ADD COLUMN "club_id" UUID;
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_club_id_key" UNIQUE ("club_id");
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "clubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
```

- [ ] **Step 3: Apply migration**

```javascript
// Run via node with dotenv (Prisma 7 Windows workaround)
node -e "require('dotenv').config(); const { Client } = require('pg'); const fs = require('fs'); const sql = fs.readFileSync('prisma/migrations/20260327220000_add_club_chat/migration.sql','utf8'); const c = new Client({connectionString:process.env.DATABASE_URL}); c.connect().then(()=>c.query(sql)).then(()=>{console.log('OK');c.end()}).catch(e=>{console.error(e.message);c.end()})"
// Then record in _prisma_migrations
node -e "require('dotenv').config(); const { Client } = require('pg'); const c = new Client({connectionString:process.env.DATABASE_URL}); c.connect().then(()=>c.query(\"INSERT INTO _prisma_migrations (id,checksum,migration_name,finished_at,applied_steps_count) VALUES (gen_random_uuid(),'manual','20260327220000_add_club_chat',NOW(),1)\")).then(()=>{console.log('OK');c.end()}).catch(e=>{console.error(e.message);c.end()})"
```

- [ ] **Step 4: Regenerate Prisma client**

```bash
npx prisma generate
```

- [ ] **Step 5: Verify and commit**

```bash
npx tsc --noEmit
git add prisma/schema.prisma prisma/migrations/20260327220000_add_club_chat/
git commit -m "feat: add clubId to Conversation for group chat"
```

---

### Task 2: Backend — Club Chat Procedures

**Files:**
- Modify: `src/server/trpc/routers/message.ts`

- [ ] **Step 1: Add `getClubChat` procedure**

After existing procedures, add:
```typescript
getClubChat: protectedProcedure.query(async ({ ctx }) => {
  // Find user's club membership
  const membership = await ctx.db.clubMembership.findFirst({
    where: { memberUserId: ctx.session.user.id, status: "ACCEPTED" },
    select: { clubId: true },
  });

  // Also check if user owns a club
  const ownedClub = await ctx.db.club.findUnique({
    where: { userId: ctx.session.user.id },
    select: { id: true, name: true },
  });

  const clubId = ownedClub?.id ?? membership?.clubId;
  if (!clubId) return null;

  // Find or create the club group conversation
  let conversation = await ctx.db.conversation.findUnique({
    where: { clubId },
    select: { id: true },
  });

  if (!conversation) {
    conversation = await ctx.db.conversation.create({
      data: {
        clubId,
        participants: {
          create: { userId: ctx.session.user.id },
        },
      },
    });
  }

  // Ensure current user is a participant
  await ctx.db.conversationParticipant.upsert({
    where: {
      conversationId_userId: {
        conversationId: conversation.id,
        userId: ctx.session.user.id,
      },
    },
    update: {},
    create: {
      conversationId: conversation.id,
      userId: ctx.session.user.id,
    },
  });

  // Get club info + recent messages
  const club = await ctx.db.club.findUnique({
    where: { id: clubId },
    select: { id: true, name: true, logoUrl: true },
  });

  const messages = await ctx.db.message.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      sender: {
        select: {
          id: true,
          email: true,
          role: true,
          club: { select: { name: true } },
          player: { select: { firstName: true, lastName: true, photoUrl: true } },
          coach: { select: { firstName: true, lastName: true, photoUrl: true } },
        },
      },
    },
  });

  // Get member count
  const memberCount = await ctx.db.clubMembership.count({
    where: { clubId, status: "ACCEPTED" },
  });

  return {
    conversationId: conversation.id,
    club,
    messages: messages.reverse(),
    memberCount: memberCount + 1, // +1 for owner
  };
}),

sendToClubChat: rateLimitedProcedure({ maxAttempts: 30 })
  .input(z.object({
    conversationId: z.string().uuid(),
    content: z.string().min(1).max(2000),
  }))
  .mutation(async ({ ctx, input }) => {
    // Verify conversation is a club chat and user is member
    const conversation = await ctx.db.conversation.findUnique({
      where: { id: input.conversationId },
      select: { clubId: true },
    });
    if (!conversation?.clubId) {
      throw new TRPCError({ code: "FORBIDDEN" });
    }

    // Check membership or ownership
    const club = await ctx.db.club.findUnique({
      where: { id: conversation.clubId },
      select: { userId: true },
    });
    const isOwner = club?.userId === ctx.session.user.id;

    if (!isOwner) {
      const membership = await ctx.db.clubMembership.findFirst({
        where: {
          clubId: conversation.clubId,
          memberUserId: ctx.session.user.id,
          status: "ACCEPTED",
        },
      });
      if (!membership) throw new TRPCError({ code: "FORBIDDEN" });
    }

    const message = await ctx.db.message.create({
      data: {
        conversationId: input.conversationId,
        senderId: ctx.session.user.id,
        content: input.content,
      },
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            role: true,
            club: { select: { name: true } },
            player: { select: { firstName: true, lastName: true, photoUrl: true } },
            coach: { select: { firstName: true, lastName: true, photoUrl: true } },
          },
        },
      },
    });

    return message;
  }),
```

- [ ] **Step 2: Verify and commit**

```bash
npx tsc --noEmit
git add src/server/trpc/routers/message.ts
git commit -m "feat: add getClubChat and sendToClubChat procedures"
```

---

### Task 3: Frontend — Club Chat Page

**Files:**
- Create: `src/app/(dashboard)/club-chat/page.tsx`

- [ ] **Step 1: Create club chat page**

Create `src/app/(dashboard)/club-chat/page.tsx` — a client component that:
- Calls `api.message.getClubChat.useQuery()` to get chat data
- Displays club name + member count in header
- Renders messages with sender name (using `getUserDisplayName`) and avatar initial
- Different bubble colors: own messages (violet) vs others (card bg)
- Input field + send button using `api.message.sendToClubChat.useMutation()`
- Auto-scroll to bottom on new messages
- Poll every 10s for new messages (`refetchInterval: 10_000`)
- Empty state when no club membership
- Loading skeleton

Key differences from 1:1 chat:
- Header shows club name + member count instead of single user
- Each message shows sender name (since multiple people)
- No "mark as read" (group chat — too complex for MVP)

- [ ] **Step 2: Verify and commit**

```bash
npx tsc --noEmit
git add src/app/(dashboard)/club-chat/page.tsx
git commit -m "feat: add club group chat page"
```

---

### Task 4: Sidebar — Add Club Chat Link

**Files:**
- Modify: `src/components/layout/sidebar.tsx`

- [ ] **Step 1: Add "Czat klubu" nav item**

In the NAV_SECTIONS array, add to "Główne" section (after "Wiadomości"):
```typescript
{ href: "/club-chat", icon: UsersRound, label: "Czat klubu" },
```

Import `UsersRound` from lucide-react.

Note: This link is visible to all roles. The page itself handles the "no club" case with an empty state.

- [ ] **Step 2: Verify and commit**

```bash
npx tsc --noEmit
git add src/components/layout/sidebar.tsx
git commit -m "feat: add Czat klubu link in sidebar"
```

---

### Task 5: Final Verification & Push

- [ ] **Step 1: TypeScript check**

```bash
npx tsc --noEmit
```

- [ ] **Step 2: Push**

```bash
git push
```
