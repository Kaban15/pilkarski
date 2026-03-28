# Moduł Turniejowy — PilkaSport

**Date:** 2026-03-28
**Scope:** Full tournament system — group stage + knockout bracket, registration, scoring, standings, goals, gamification, UI

---

## Design Decisions

- **Format:** Group stage, Knockout, or Group + Knockout (configurable per tournament)
- **Teams:** 4–16, clubs or ad-hoc teams (any logged-in user can create/join)
- **Matches:** Own model `TournamentMatch` (not reusing SparingOffer) — cleaner separation
- **Navigation:** Hybrid — own `/tournaments` page + visible in feed and calendar
- **Score confirmation:** Two-sided (same pattern as sparings)

---

## 1. Schema

### Enums

```prisma
enum TournamentFormat {
  GROUP_STAGE
  KNOCKOUT
  GROUP_AND_KNOCKOUT
}

enum TournamentStatus {
  REGISTRATION
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

enum TournamentTeamStatus {
  PENDING
  ACCEPTED
  REJECTED
}

enum TournamentMatchPhase {
  GROUP
  ROUND_OF_16
  QUARTER_FINAL
  SEMI_FINAL
  THIRD_PLACE
  FINAL
}
```

### Models

**Tournament:**
```prisma
model Tournament {
  id               String           @id @default(uuid()) @db.Uuid
  creatorUserId    String           @map("creator_user_id") @db.Uuid
  title            String           @db.VarChar(300)
  description      String?
  startDate        DateTime         @map("start_date") @db.Timestamptz
  endDate          DateTime?        @map("end_date") @db.Timestamptz
  location         String?          @db.VarChar(300)
  lat              Decimal?         @db.Decimal(9, 6)
  lng              Decimal?         @db.Decimal(9, 6)
  regionId         Int?             @map("region_id")
  format           TournamentFormat
  maxTeams         Int              @map("max_teams")
  groupCount       Int              @default(1) @map("group_count")
  advancingPerGroup Int             @default(2) @map("advancing_per_group")
  status           TournamentStatus @default(REGISTRATION)
  createdAt        DateTime         @default(now()) @map("created_at") @db.Timestamptz
  updatedAt        DateTime         @updatedAt @map("updated_at") @db.Timestamptz

  creator    User               @relation(fields: [creatorUserId], references: [id])
  region     Region?            @relation(fields: [regionId], references: [id])
  teams      TournamentTeam[]
  matches    TournamentMatch[]
  standings  TournamentStanding[]

  @@index([status])
  @@index([regionId])
  @@map("tournaments")
}
```

**TournamentTeam:**
```prisma
model TournamentTeam {
  id           String               @id @default(uuid()) @db.Uuid
  tournamentId String               @map("tournament_id") @db.Uuid
  clubId       String?              @map("club_id") @db.Uuid
  userId       String               @map("user_id") @db.Uuid
  teamName     String               @map("team_name") @db.VarChar(200)
  status       TournamentTeamStatus @default(PENDING)
  groupLabel   String?              @map("group_label") @db.VarChar(2)
  seed         Int?
  message      String?
  createdAt    DateTime             @default(now()) @map("created_at") @db.Timestamptz

  tournament    Tournament          @relation(fields: [tournamentId], references: [id], onDelete: Cascade)
  club          Club?               @relation(fields: [clubId], references: [id])
  user          User                @relation(fields: [userId], references: [id])
  homeMatches   TournamentMatch[]   @relation("HomeTeam")
  awayMatches   TournamentMatch[]   @relation("AwayTeam")
  standings     TournamentStanding[]

  @@unique([tournamentId, userId])
  @@index([tournamentId])
  @@map("tournament_teams")
}
```

**TournamentMatch:**
```prisma
model TournamentMatch {
  id           String               @id @default(uuid()) @db.Uuid
  tournamentId String               @map("tournament_id") @db.Uuid
  homeTeamId   String               @map("home_team_id") @db.Uuid
  awayTeamId   String               @map("away_team_id") @db.Uuid
  phase        TournamentMatchPhase
  groupLabel   String?              @map("group_label") @db.VarChar(2)
  round        Int?
  matchOrder   Int                  @default(0) @map("match_order")
  matchDate    DateTime?            @map("match_date") @db.Timestamptz
  location     String?              @db.VarChar(300)
  homeScore    Int?                 @map("home_score")
  awayScore    Int?                 @map("away_score")
  penaltyHome  Int?                 @map("penalty_home")
  penaltyAway  Int?                 @map("penalty_away")
  scoreSubmittedBy String?          @map("score_submitted_by") @db.Uuid
  scoreConfirmed   Boolean          @default(false) @map("score_confirmed")
  createdAt    DateTime             @default(now()) @map("created_at") @db.Timestamptz

  tournament   Tournament          @relation(fields: [tournamentId], references: [id], onDelete: Cascade)
  homeTeam     TournamentTeam      @relation("HomeTeam", fields: [homeTeamId], references: [id])
  awayTeam     TournamentTeam      @relation("AwayTeam", fields: [awayTeamId], references: [id])
  goals        TournamentGoal[]

  @@index([tournamentId])
  @@map("tournament_matches")
}
```

**TournamentGoal:**
```prisma
model TournamentGoal {
  id           String          @id @default(uuid()) @db.Uuid
  matchId      String          @map("match_id") @db.Uuid
  scorerUserId String          @map("scorer_user_id") @db.Uuid
  minute       Int?
  ownGoal      Boolean         @default(false) @map("own_goal")
  createdAt    DateTime        @default(now()) @map("created_at") @db.Timestamptz

  match        TournamentMatch @relation(fields: [matchId], references: [id], onDelete: Cascade)
  scorerUser   User            @relation(fields: [scorerUserId], references: [id])

  @@index([matchId])
  @@map("tournament_goals")
}
```

**TournamentStanding:**
```prisma
model TournamentStanding {
  id           String         @id @default(uuid()) @db.Uuid
  tournamentId String         @map("tournament_id") @db.Uuid
  teamId       String         @map("team_id") @db.Uuid
  groupLabel   String         @map("group_label") @db.VarChar(2)
  played       Int            @default(0)
  won          Int            @default(0)
  drawn        Int            @default(0)
  lost         Int            @default(0)
  goalsFor     Int            @default(0) @map("goals_for")
  goalsAgainst Int            @default(0) @map("goals_against")
  points       Int            @default(0)

  tournament   Tournament     @relation(fields: [tournamentId], references: [id], onDelete: Cascade)
  team         TournamentTeam @relation(fields: [teamId], references: [id], onDelete: Cascade)

  @@unique([tournamentId, teamId])
  @@index([tournamentId, groupLabel])
  @@map("tournament_standings")
}
```

### Relations to add

- `User.tournaments Tournament[]` (creator)
- `User.tournamentTeams TournamentTeam[]`
- `User.tournamentGoals TournamentGoal[]`
- `Club.tournamentTeams TournamentTeam[]`
- `Region.tournaments Tournament[]`

### NotificationType additions

```
TOURNAMENT_APPLICATION
TOURNAMENT_ACCEPTED
TOURNAMENT_REJECTED
TOURNAMENT_STARTED
TOURNAMENT_SCORE_SUBMITTED
```

---

## 2. Backend — tRPC Router `tournament`

### CRUD

**`create`** (protectedProcedure):
- Input: title, description, startDate, endDate?, location, lat/lng, regionId, format, maxTeams (4-16), groupCount, advancingPerGroup
- Validation:
  - maxTeams: 4-16, even number
  - GROUP_STAGE / GROUP_AND_KNOCKOUT: groupCount >= 1, maxTeams divisible by groupCount, teamsPerGroup >= 3
  - KNOCKOUT: groupCount ignored, maxTeams must be power of 2 (4, 8, 16)
  - GROUP_AND_KNOCKOUT: advancingPerGroup * groupCount must be power of 2
- Creator auto-registered as first team (if has club — use club name, else user display name)
- Award `tournament_created` points

**`update`** (protectedProcedure):
- Only creator, status REGISTRATION
- Can update title, description, dates, location, maxTeams (if no accepted teams exceed new limit)

**`delete`** (protectedProcedure):
- Only creator, status REGISTRATION

**`list`** (publicProcedure):
- Filters: regionId, status, format
- Cursor pagination, ordered by startDate desc
- Include: team count, creator name

**`getById`** (publicProcedure):
- Full tournament with: teams (with club/user info), matches (with teams + goals), standings
- Grouped by phase for knockout, by group for group stage

### Registration

**`applyTeam`** (protectedProcedure):
- Input: tournamentId, clubId? (optional — if null, ad-hoc team), teamName, message?
- Validation: tournament in REGISTRATION, not full (accepted < maxTeams), user not already registered
- If clubId provided: user must be club owner or ACCEPTED member
- teamName defaults to club name if clubId provided
- Creates TournamentTeam with PENDING status
- Notification + push + email to creator

**`respondToApplication`** (protectedProcedure):
- Only creator
- ACCEPTED or REJECTED
- Notification + push + email to applicant

**`withdraw`** (protectedProcedure):
- User can withdraw own team (status PENDING or ACCEPTED, tournament in REGISTRATION)

### Tournament Flow

**`startTournament`** (protectedProcedure):
- Only creator, status REGISTRATION
- Validation: enough ACCEPTED teams (min 4 for GROUP, power of 2 for KNOCKOUT)
- Rejects remaining PENDING teams
- Assigns groupLabels randomly (A, B, C, D...) — even distribution
- Creates TournamentStanding rows (all zeroes)
- Generates group stage matches (round-robin per group) OR knockout bracket
- For GROUP_AND_KNOCKOUT: generates group matches first, knockout later
- Status → IN_PROGRESS
- Notification to all accepted teams: "Turniej rozpoczęty!"

**Round-robin generation logic:**
- For N teams in group: N*(N-1)/2 matches, each team plays every other once
- Algorithm: fix team[0], rotate rest (circle method)

**Knockout bracket generation logic:**
- Seed teams by group position (1A vs 2B, 1B vs 2A, etc.)
- For pure KNOCKOUT: random seeding
- Generate matches for first round, leave later rounds with placeholder teams (filled after results)

**`submitMatchScore`** (protectedProcedure):
- Input: matchId, homeScore, awayScore, penaltyHome?, penaltyAway?
- Validation: user is member of home or away team, match has no confirmed score
- Penalties only allowed in knockout phase when scores are tied
- Sets scoreSubmittedBy = userId

**`confirmMatchScore`** (protectedProcedure):
- Input: matchId, confirmed (boolean)
- Validation: other team confirms/rejects
- If confirmed:
  - Update scoreConfirmed = true
  - Recalculate TournamentStanding for group matches (3W/1D/0L)
  - For knockout: advance winner to next round match
- If rejected: reset scores to null

**`generateKnockoutBracket`** (protectedProcedure):
- Only creator, format GROUP_AND_KNOCKOUT
- Validation: all group matches confirmed
- Takes top N (advancingPerGroup) from each group by standing
- Generates knockout matches: QF → SF → 3rd place → Final
- Cross-seeding: 1A vs 2B, 1B vs 2A (for 2 groups)

**`completeTournament`** (protectedProcedure):
- Only creator, all matches confirmed
- Status → COMPLETED
- Award `tournament_win` points to winner's team members
- Notification to all teams

### Goals

**`addGoal`** / **`removeGoal`** / **`getMatchGoals`**:
- Same pattern as `sparing.addGoal` but for TournamentMatch
- Scorer must be known user (member of one of the teams' clubs, or any user for ad-hoc)

### Standings & Stats

**`getStandings`** (publicProcedure):
- Returns standings per group, sorted: points → goal difference → goals for
- Calculated from TournamentStanding model (materialized, updated on score confirm)

**`getTopScorers`** (publicProcedure):
- Aggregate TournamentGoal grouped by scorerUserId, ordered by count desc
- Top 10

### Helper: `src/server/tournament-logic.ts`

Pure functions (testable without DB):
- `generateRoundRobin(teamIds: string[]): Array<[string, string]>`
- `generateKnockoutBracket(teams: Array<{id, seed}>): Array<{homeId, awayId, phase}>`
- `recalculateStandings(matches: ConfirmedMatch[]): StandingRow[]`
- `advanceWinner(match, bracket): nextMatchUpdate`

---

## 3. Validators

`src/lib/validators/tournament.ts`:
- `createTournamentSchema` — title, description?, startDate, endDate?, location?, regionId?, format, maxTeams, groupCount, advancingPerGroup
- `applyTeamSchema` — tournamentId, clubId?, teamName, message?
- `respondApplicationSchema` — teamId, status (ACCEPTED/REJECTED)
- `submitScoreSchema` — matchId, homeScore, awayScore, penaltyHome?, penaltyAway?
- `confirmScoreSchema` — matchId, confirmed (boolean)
- `addGoalSchema` — matchId, scorerUserId, minute?, ownGoal?

---

## 4. Frontend

### `/tournaments` — Lista turniejów

- Header: "Turnieje" + "Stwórz turniej" button (zalogowany)
- Cards: nazwa, data, format badge (GROUP/KNOCKOUT/GROUP+KNOCKOUT), lokalizacja, `X/Y drużyn`, status badge (Rejestracja=emerald, W trakcie=amber, Zakończony=muted)
- Filtry: region, status
- Infinite scroll (usePaginatedList)
- FotMob style: dark cards, bold typography

### `/tournaments/new` — Formularz tworzenia

- Title, description
- Dates (start + opcjonalnie end)
- Location
- Format select (3 opcje z opisem)
- Max drużyn (select: 4/6/8/10/12/14/16)
- Grupy (auto-calculated, editable): "2 grupy po 4"
- Advancing per group (select: 1/2/3/4)
- Region

### `/tournaments/[id]` — Strona turnieju (FotMob style)

**Hero:** gradient card (amber→orange), nazwa, data, lokalizacja, format badge, status, creator name

**5 tabów:**

**Tab: Drużyny**
- Lista drużyn z: logo/initials, nazwa, status badge, wiadomość
- "Dołącz" button (jeśli registration + zalogowany + nie jest uczestnikiem)
- Creator widzi: accept/reject na PENDING
- Grouped by group label when assigned (A, B, etc.)

**Tab: Grupy** (widoczny gdy format ma GROUP)
- Per grupa: tabela — pozycja, drużyna, M, W, R, P, B+, B-, +/-, Pkt
- Pod tabelą: lista meczów grupy z wynikami (MatchCard pattern)
- Highlighted: drużyny przechodzące dalej (top N)

**Tab: Drabinka** (widoczny gdy format ma KNOCKOUT)
- Bracket view: kolumny per runda (QF → SF → 3rd place → Final)
- Każdy mecz: team A vs team B + wynik (+ karne jeśli były)
- Połączenia linią między rundami
- TBD placeholder gdy drużyna jeszcze nieznana

**Tab: Strzelcy**
- Ranking: pozycja, imię (link), drużyna, bramki (count)
- Top 10

**Tab: Info**
- Opis, lokalizacja (z mapą?), daty, organizator, format details, region

### Sidebar
- "Turnieje" (Trophy icon) w sekcji "Więcej"

### Feed integration
- Nowe turnieje widoczne w feedzie (typ "tournament", kolor orange)
- Filtr po regionie usera

### Calendar integration
- Turniej z datą start/end widoczny w kalendarzu (orange)

---

## 5. Gamification

| Action | Points |
|--------|--------|
| `tournament_created` | 15 |
| `tournament_win` | 20 |
| `tournament_goal` | 5 |

### New badge
- `tournament_champion`: "Mistrz turniejów" — wygraj 3 turnieje — icon 🏆

---

## 6. Notifications + Email

| Trigger | Recipient | Type |
|---------|-----------|------|
| Team applies | Creator | TOURNAMENT_APPLICATION |
| Application accepted | Team user | TOURNAMENT_ACCEPTED |
| Application rejected | Team user | TOURNAMENT_REJECTED |
| Tournament started | All teams | TOURNAMENT_STARTED |
| Score submitted | Other team | TOURNAMENT_SCORE_SUBMITTED |

All triggers: in-app notification + push + email (same fire-and-forget pattern).

---

## 7. Files Summary

### New files (~15)

| File | Purpose |
|------|---------|
| `src/server/trpc/routers/tournament.ts` | Tournament tRPC router (~15 procedures) |
| `src/server/tournament-logic.ts` | Pure logic: round-robin, bracket, standings |
| `src/lib/validators/tournament.ts` | Zod schemas |
| `src/app/(dashboard)/tournaments/page.tsx` | Tournament list |
| `src/app/(dashboard)/tournaments/new/page.tsx` | Create form |
| `src/app/(dashboard)/tournaments/[id]/page.tsx` | Tournament detail with tabs |
| `src/components/tournament/tournament-card.tsx` | List card |
| `src/components/tournament/group-table.tsx` | Standings table |
| `src/components/tournament/bracket-view.tsx` | Knockout bracket |
| `src/components/tournament/match-row.tsx` | Match score display |
| `src/components/tournament/top-scorers.tsx` | Scorer ranking |
| `src/__tests__/tournament-logic.test.ts` | Unit tests for pure logic |

### Modified files (~8)

| File | Change |
|------|--------|
| `prisma/schema.prisma` | +5 models, +6 enums, +5 NotificationTypes, +relations |
| `src/server/trpc/router.ts` | +tournamentRouter |
| `src/lib/gamification.ts` | +3 actions, +1 badge |
| `src/lib/labels.ts` | +tournament notification labels/colors, +format labels, +status labels |
| `src/components/layout/sidebar.tsx` | +Trophy "Turnieje" link |
| `src/server/trpc/routers/feed.ts` | +tournaments in feed |
| `src/components/calendar-view.tsx` | +tournaments in calendar (orange) |
| `src/app/(dashboard)/feed/page.tsx` | +tournament in FeedCard |

### New dependency

None — all built with existing stack.

### Migration

`add_tournaments` — 5 tables, 6 enums, 5 NotificationTypes

---

## 8. What's NOT changing

- Existing sparing/event/message systems
- Auth
- Other pages
- Database structure of existing models
