# Etap B: Email Transakcyjne + Protokół Meczowy (Strzelcy)

**Date:** 2026-03-28
**Scope:** 2 independent features increasing user retention and engagement

---

## 1. Email Transakcyjne (Resend)

### Goal

Send transactional emails for key user actions to bring users back to the app. Complements existing Web Push + in-app notifications as a third delivery channel.

### New dependency

`resend` — npm package, Resend API client.

### Environment variable

`RESEND_API_KEY` — Resend API key. Add to `.env` and Vercel env vars.

### Sender

- Development: `PilkaSport <onboarding@resend.dev>` (Resend sandbox, no domain verification needed)
- Production: `PilkaSport <noreply@pilkasport.pl>` (requires domain verification in Resend dashboard)

### Helper: `src/server/send-email.ts`

```typescript
export async function sendEmailToUser(
  db: PrismaClient,
  userId: string,
  subject: string,
  body: { title: string; message: string; ctaLabel: string; ctaUrl: string }
): Promise<void>
```

**Logic:**
1. Query user email from DB: `db.user.findUnique({ where: { id: userId }, select: { email: true } })`
2. If no email → return silently
3. Render HTML template with `body` params
4. Send via `resend.emails.send({ from, to, subject, html })`
5. Fire-and-forget — called with `.catch(() => {})` in routers (same pattern as push)

### HTML Template

Single reusable template (`src/lib/email-template.ts`):
- Logo "PS" header (inline CSS, violet gradient)
- Title (h1)
- Message paragraph
- CTA button (violet, links to app)
- Footer: "PilkaSport — Platforma dla polskiego futbolu"
- Inline CSS only (no external stylesheets — email compatibility)
- Function: `renderEmailHtml(title, message, ctaLabel, ctaUrl): string`

### Email triggers (6 events)

| Trigger | Router | Recipient | Subject | CTA |
|---------|--------|-----------|---------|-----|
| Sparing application | `sparing.applyFor` | Sparing owner | "Nowe zgłoszenie na sparing" | "Zobacz zgłoszenie" → `/sparings/[id]` |
| Application response | `sparing.respond` | Applicant | "Odpowiedź na zgłoszenie" | "Zobacz szczegóły" → `/sparings/[id]` |
| Sparing invitation | `sparing.invite` | Invited club | "Zaproszenie na sparing" | "Zobacz zaproszenie" → `/sparings/[id]` |
| Score submitted | `sparing.submitScore` | Other team | "Wynik meczu do potwierdzenia" | "Potwierdź wynik" → `/sparings/[id]` |
| New message | `message.send` | Recipient | "Nowa wiadomość" | "Odpowiedz" → `/messages/[id]` |
| Club invitation | `clubMembership.invite` | Invited user | "Zaproszenie do klubu" | "Zobacz zaproszenie" → `/feed` |

### Message debounce (new messages only)

To avoid spamming users with emails per every chat message:
- In-memory Map: `Map<string, number>` keyed by `${userId}-message`, value = last sent timestamp
- Skip email if last sent < 15 minutes ago
- Auto-cleanup entries older than 1 hour (same pattern as rate-limit.ts)
- Only applies to `message.send` trigger — other triggers always send

### Integration pattern

In each router, after existing `sendPushToUser()` call, add:

```typescript
sendEmailToUser(ctx.db, recipientUserId, "Subject", {
  title: "Title",
  message: "Description of what happened",
  ctaLabel: "Button text",
  ctaUrl: `${baseUrl}/path`,
}).catch(() => {});
```

`baseUrl` from `process.env.NEXTAUTH_URL || "https://pilkarski.vercel.app"`.

### Files

| File | Action | Purpose |
|------|--------|---------|
| `src/server/send-email.ts` | Create | Email sender helper |
| `src/lib/email-template.ts` | Create | HTML template renderer |
| `src/lib/email-throttle.ts` | Create | Message debounce |
| `src/__tests__/email-template.test.ts` | Create | Template renders correctly |
| `src/__tests__/email-throttle.test.ts` | Create | Throttle logic tests |
| `src/server/trpc/routers/sparing.ts` | Modify | Add email on apply, respond, invite, submitScore |
| `src/server/trpc/routers/message.ts` | Modify | Add email on send (with throttle) |
| `src/server/trpc/routers/club-membership.ts` | Modify | Add email on invite |
| `package.json` | Modify | +resend devDep |

---

## 2. Protokół Meczowy — Strzelcy Bramek

### Goal

After a sparing score is confirmed, either club can record goal scorers from their squad. Scorers get notifications + points, and goals display on match and club profile pages.

### Schema

**New model `MatchGoal`:**

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

**Relations to add:**
- `SparingOffer.goals MatchGoal[]`
- `User.goals MatchGoal[]`

**New NotificationType:** `GOAL_ADDED`

**New gamification action:** `goal_scored: 5` in POINTS_MAP

### Backend (sparing router)

**`sparing.addGoal`** (protectedProcedure):
- Input: `{ sparingOfferId, scorerUserId, minute?, ownGoal? }`
- Validation:
  - Sparing must be COMPLETED with scoreConfirmed = true
  - Caller must be owner of sparing OR owner of the matched club
  - Scorer must be ACCEPTED member of one of the two clubs
  - Total goals for a side cannot exceed that side's score
- Creates `MatchGoal` record
- Fire-and-forget: notification + push + email to scorer: "Klub dodał Twoją bramkę w meczu z [opponent]"
- Fire-and-forget: `awardPoints(db, scorerUserId, "goal_scored", sparingOfferId)`

**`sparing.removeGoal`** (protectedProcedure):
- Input: `{ goalId }`
- Validation: caller is sparing owner or owner of scorer's club
- Deletes `MatchGoal` record

**`sparing.getGoals`** (publicProcedure):
- Input: `{ sparingOfferId }`
- Returns goals with scorer info (name, photoUrl, club name), ordered by minute (nulls last)

### Validator

`src/lib/validators/match-goal.ts`:
- `addGoalSchema`: sparingOfferId (uuid), scorerUserId (uuid), minute (int 0-120, optional), ownGoal (boolean, default false)

### Frontend

**ScoreSection enhancement** (`sparings/[id]/_components/score-section.tsx`):
- After confirmed score display, new "Strzelcy" subsection
- "Dodaj strzelca" button (visible for both club owners when score confirmed)
- Form: Select scorer (populated from both clubs' ACCEPTED members), minute input (optional), own goal checkbox
- Goal list: football icon + name (link to profile) + minute' + "(SB)" badge if own goal
- Delete button per goal (visible for authorized users)

**Club profile tab Mecze** (`clubs/[id]/club-profile-tabs.tsx`):
- Under each match result with confirmed score, show goal scorers if any
- Compact: "⚽ Kowalski 23', Nowak 67'" inline

### Squad members query

For the scorer selector, need members of both clubs. Use:
- Home club: sparing owner's club → `clubMembership` where clubId + status ACCEPTED, include player/coach name
- Away club: matched applicant's club → same query
- Combine into one Select with group labels ("KS Orzelek", "LKS Krakovia")

### Files

| File | Action | Purpose |
|------|--------|---------|
| `prisma/schema.prisma` | Modify | +MatchGoal model, +GOAL_ADDED, +relations |
| `src/lib/validators/match-goal.ts` | Create | Zod schema for addGoal |
| `src/server/trpc/routers/sparing.ts` | Modify | +addGoal, +removeGoal, +getGoals |
| `src/server/trpc/router.ts` | No change | Goals are in sparing router, not separate |
| `src/lib/gamification.ts` | Modify | +goal_scored: 5 |
| `src/lib/labels.ts` | Modify | +GOAL_ADDED label/color |
| `src/app/(dashboard)/sparings/[id]/_components/score-section.tsx` | Modify | +goals list, +add/remove UI |
| `src/app/(public)/clubs/[id]/club-profile-tabs.tsx` | Modify | +goals in match rows |
| `src/__tests__/gamification.test.ts` | Modify | +goal_scored in POINTS_MAP count |

### Migration

`npm run db:migrate -- --url "..." --name add_match_goals`

---

## What's NOT changing

- Existing notification system (in-app + push) — untouched, email added alongside
- Score submission/confirmation flow — untouched, goals added after confirmation
- Other pages (events, transfers, community, etc.)
- Auth system
- Sidebar/navigation

## New dependency

| Package | Type | Reason |
|---------|------|--------|
| `resend` | dependency | Transactional email API |

## Execution order

1. Email system first (no schema changes, no migration needed)
2. Match goals second (schema change + migration + UI)
