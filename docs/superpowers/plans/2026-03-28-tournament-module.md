# Tournament Module — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full tournament system — group stage + knockout bracket, team registration, score confirmation, standings, goals, gamification, and UI with FotMob-style tabs.

**Architecture:** New `tournament` tRPC router with ~15 procedures. Pure logic helpers for round-robin/bracket generation (unit-testable). 5 new Prisma models. UI: list page, create form, detail page with 5 tabs. Integrated into feed + calendar. Uses existing patterns: fire-and-forget notifications + push + email, cursor pagination, usePaginatedList hook.

**Tech Stack:** Prisma, tRPC, React, Tailwind, Vitest (for pure logic tests)

**Spec:** `docs/superpowers/specs/2026-03-28-tournament-module.md`

---

### Task 1: Schema + Migration + Labels + Gamification

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `src/lib/gamification.ts`
- Modify: `src/lib/labels.ts`
- Modify: `src/__tests__/gamification.test.ts`

- [ ] **Step 1: Add enums to schema.prisma**

Add before the models section (after existing enums):

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

- [ ] **Step 2: Add 5 NotificationTypes to enum**

Add to `NotificationType` enum (after GOAL_ADDED):
```
TOURNAMENT_APPLICATION
TOURNAMENT_ACCEPTED
TOURNAMENT_REJECTED
TOURNAMENT_STARTED
TOURNAMENT_SCORE_SUBMITTED
```

- [ ] **Step 3: Add 5 models to schema**

Add all 5 models exactly as defined in the spec: Tournament, TournamentTeam, TournamentMatch, TournamentGoal, TournamentStanding.

- [ ] **Step 4: Add relations to existing models**

Add to `User` model:
```prisma
  tournaments       Tournament[]
  tournamentTeams   TournamentTeam[]
  tournamentGoals   TournamentGoal[]
```

Add to `Club` model:
```prisma
  tournamentTeams   TournamentTeam[]
```

Add to `Region` model:
```prisma
  tournaments       Tournament[]
```

- [ ] **Step 5: Add gamification entries**

In `src/lib/gamification.ts`, add to POINTS_MAP:
```typescript
  tournament_created: 15,
  tournament_win: 20,
  tournament_goal: 5,
```

Add to POINTS_LABELS:
```typescript
  tournament_created: "Utworzenie turnieju",
  tournament_win: "Zwycięstwo w turnieju",
  tournament_goal: "Bramka w turnieju",
```

Add to BADGES array:
```typescript
  { key: "tournament_champion", name: "Mistrz turniejów", description: "Wygraj 3 turnieje", icon: "🏆", check: (s) => (s as any).tournamentsWon >= 3 },
```

Note: BadgeCheckStats interface needs a new optional field `tournamentsWon?: number`. Add it.

- [ ] **Step 6: Add labels**

In `src/lib/labels.ts`, add to NOTIFICATION_TYPE_LABELS:
```typescript
  TOURNAMENT_APPLICATION: "Zgłoszenie do turnieju",
  TOURNAMENT_ACCEPTED: "Przyjęty do turnieju",
  TOURNAMENT_REJECTED: "Odrzucony z turnieju",
  TOURNAMENT_STARTED: "Turniej rozpoczęty",
  TOURNAMENT_SCORE_SUBMITTED: "Wynik turnieju do potwierdzenia",
```

Add to NOTIFICATION_TYPE_COLORS:
```typescript
  TOURNAMENT_APPLICATION: "bg-orange-50 dark:bg-orange-950 text-orange-700 dark:text-orange-300",
  TOURNAMENT_ACCEPTED: "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300",
  TOURNAMENT_REJECTED: "bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300",
  TOURNAMENT_STARTED: "bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300",
  TOURNAMENT_SCORE_SUBMITTED: "bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300",
```

Add new label maps:
```typescript
export const TOURNAMENT_FORMAT_LABELS: Record<string, string> = {
  GROUP_STAGE: "Faza grupowa",
  KNOCKOUT: "Puchar",
  GROUP_AND_KNOCKOUT: "Grupa + Puchar",
};

export const TOURNAMENT_STATUS_LABELS: Record<string, string> = {
  REGISTRATION: "Rejestracja",
  IN_PROGRESS: "W trakcie",
  COMPLETED: "Zakończony",
  CANCELLED: "Anulowany",
};

export const TOURNAMENT_STATUS_COLORS: Record<string, string> = {
  REGISTRATION: "bg-emerald-500/10 text-emerald-500",
  IN_PROGRESS: "bg-amber-500/10 text-amber-500",
  COMPLETED: "bg-muted text-muted-foreground",
  CANCELLED: "bg-red-500/10 text-red-500",
};

export const TOURNAMENT_PHASE_LABELS: Record<string, string> = {
  GROUP: "Faza grupowa",
  ROUND_OF_16: "1/8 finału",
  QUARTER_FINAL: "Ćwierćfinał",
  SEMI_FINAL: "Półfinał",
  THIRD_PLACE: "O 3. miejsce",
  FINAL: "Finał",
};
```

- [ ] **Step 7: Update gamification test**

In `src/__tests__/gamification.test.ts`, update POINTS_MAP count from 17 to 20, and add BADGES count from 9 to 10.

- [ ] **Step 8: Generate Prisma client + run tests**

Run: `npx prisma generate && npm test`

- [ ] **Step 9: Create migration SQL manually**

Create `prisma/migrations/20260328140000_add_tournaments/migration.sql` with the SQL for all 5 tables, 4 enums, 5 notification types. (Same pattern as add_match_goals — manual SQL file + mark as applied.)

- [ ] **Step 10: Commit**

```bash
git add prisma/ src/lib/gamification.ts src/lib/labels.ts src/__tests__/gamification.test.ts
git commit -m "feat: add tournament schema (5 models, 4 enums) + labels + gamification"
```

---

### Task 2: Tournament Logic — Pure Functions + Tests (TDD)

**Files:**
- Create: `src/server/tournament-logic.ts`
- Create: `src/__tests__/tournament-logic.test.ts`

- [ ] **Step 1: Write tests first**

Create `src/__tests__/tournament-logic.test.ts`:

```typescript
import {
  generateRoundRobin,
  generateKnockoutBracket,
  recalculateStandings,
  getNextPhase,
} from "@/server/tournament-logic";

describe("generateRoundRobin", () => {
  it("generates correct number of matches for 4 teams", () => {
    const matches = generateRoundRobin(["A", "B", "C", "D"]);
    expect(matches).toHaveLength(6); // 4*3/2
  });

  it("generates correct number of matches for 3 teams", () => {
    const matches = generateRoundRobin(["A", "B", "C"]);
    expect(matches).toHaveLength(3); // 3*2/2
  });

  it("every team plays every other team exactly once", () => {
    const teams = ["A", "B", "C", "D"];
    const matches = generateRoundRobin(teams);
    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        const found = matches.some(
          ([h, a]) => (h === teams[i] && a === teams[j]) || (h === teams[j] && a === teams[i])
        );
        expect(found, `${teams[i]} vs ${teams[j]} should exist`).toBe(true);
      }
    }
  });

  it("handles 6 teams", () => {
    const matches = generateRoundRobin(["A", "B", "C", "D", "E", "F"]);
    expect(matches).toHaveLength(15); // 6*5/2
  });
});

describe("generateKnockoutBracket", () => {
  it("generates semifinal + final for 4 teams", () => {
    const teams = [
      { id: "A", seed: 1 },
      { id: "B", seed: 2 },
      { id: "C", seed: 3 },
      { id: "D", seed: 4 },
    ];
    const matches = generateKnockoutBracket(teams);
    const semis = matches.filter((m) => m.phase === "SEMI_FINAL");
    const final_ = matches.filter((m) => m.phase === "FINAL");
    const third = matches.filter((m) => m.phase === "THIRD_PLACE");
    expect(semis).toHaveLength(2);
    expect(final_).toHaveLength(1);
    expect(third).toHaveLength(1);
  });

  it("generates QF + SF + final for 8 teams", () => {
    const teams = Array.from({ length: 8 }, (_, i) => ({ id: String(i), seed: i + 1 }));
    const matches = generateKnockoutBracket(teams);
    const qf = matches.filter((m) => m.phase === "QUARTER_FINAL");
    const sf = matches.filter((m) => m.phase === "SEMI_FINAL");
    expect(qf).toHaveLength(4);
    expect(sf).toHaveLength(2);
  });

  it("seeds 1 vs 4, 2 vs 3 in semis for 4 teams", () => {
    const teams = [
      { id: "A", seed: 1 },
      { id: "B", seed: 2 },
      { id: "C", seed: 3 },
      { id: "D", seed: 4 },
    ];
    const matches = generateKnockoutBracket(teams);
    const semis = matches.filter((m) => m.phase === "SEMI_FINAL");
    // Seed 1 vs Seed 4, Seed 2 vs Seed 3
    expect(semis[0].homeId).toBe("A");
    expect(semis[0].awayId).toBe("D");
    expect(semis[1].homeId).toBe("B");
    expect(semis[1].awayId).toBe("C");
  });
});

describe("recalculateStandings", () => {
  it("calculates 3 points for win", () => {
    const matches = [
      { homeTeamId: "A", awayTeamId: "B", homeScore: 2, awayScore: 1 },
    ];
    const standings = recalculateStandings(matches, ["A", "B"]);
    const teamA = standings.find((s) => s.teamId === "A")!;
    const teamB = standings.find((s) => s.teamId === "B")!;
    expect(teamA.points).toBe(3);
    expect(teamA.won).toBe(1);
    expect(teamB.points).toBe(0);
    expect(teamB.lost).toBe(1);
  });

  it("calculates 1 point each for draw", () => {
    const matches = [
      { homeTeamId: "A", awayTeamId: "B", homeScore: 1, awayScore: 1 },
    ];
    const standings = recalculateStandings(matches, ["A", "B"]);
    expect(standings.find((s) => s.teamId === "A")!.points).toBe(1);
    expect(standings.find((s) => s.teamId === "B")!.points).toBe(1);
  });

  it("calculates goal difference correctly", () => {
    const matches = [
      { homeTeamId: "A", awayTeamId: "B", homeScore: 3, awayScore: 1 },
    ];
    const standings = recalculateStandings(matches, ["A", "B"]);
    const teamA = standings.find((s) => s.teamId === "A")!;
    expect(teamA.goalsFor).toBe(3);
    expect(teamA.goalsAgainst).toBe(1);
  });

  it("sorts by points, then goal difference, then goals for", () => {
    const matches = [
      { homeTeamId: "A", awayTeamId: "B", homeScore: 2, awayScore: 0 },
      { homeTeamId: "A", awayTeamId: "C", homeScore: 1, awayScore: 1 },
      { homeTeamId: "B", awayTeamId: "C", homeScore: 1, awayScore: 0 },
    ];
    const standings = recalculateStandings(matches, ["A", "B", "C"]);
    expect(standings[0].teamId).toBe("A"); // 4pts, +2 GD
    expect(standings[1].teamId).toBe("B"); // 3pts, -1 GD
    expect(standings[2].teamId).toBe("C"); // 1pt, -1 GD
  });
});

describe("getNextPhase", () => {
  it("QUARTER_FINAL → SEMI_FINAL", () => {
    expect(getNextPhase("QUARTER_FINAL")).toBe("SEMI_FINAL");
  });
  it("SEMI_FINAL → FINAL", () => {
    expect(getNextPhase("SEMI_FINAL")).toBe("FINAL");
  });
  it("FINAL → null", () => {
    expect(getNextPhase("FINAL")).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests — should fail**

Run: `npm test -- src/__tests__/tournament-logic.test.ts`
Expected: FAIL (module not found)

- [ ] **Step 3: Implement tournament-logic.ts**

Create `src/server/tournament-logic.ts`:

```typescript
/**
 * Generate round-robin matches for a group of teams.
 * Returns array of [homeId, awayId] pairs.
 */
export function generateRoundRobin(teamIds: string[]): Array<[string, string]> {
  const matches: Array<[string, string]> = [];
  const n = teamIds.length;

  // Use circle method: fix first team, rotate the rest
  const teams = [...teamIds];
  const rounds = n % 2 === 0 ? n - 1 : n;
  const half = Math.floor(n / 2);

  // If odd number of teams, add a dummy
  if (n % 2 !== 0) teams.push("__BYE__");

  for (let round = 0; round < rounds; round++) {
    for (let i = 0; i < teams.length / 2; i++) {
      const home = teams[i];
      const away = teams[teams.length - 1 - i];
      if (home !== "__BYE__" && away !== "__BYE__") {
        matches.push([home, away]);
      }
    }
    // Rotate: keep first element fixed, rotate rest
    const last = teams.pop()!;
    teams.splice(1, 0, last);
  }

  return matches;
}

interface SeedTeam {
  id: string;
  seed: number;
}

interface BracketMatch {
  homeId: string;
  awayId: string;
  phase: string;
  matchOrder: number;
}

/**
 * Generate knockout bracket from seeded teams.
 * Teams sorted by seed (1 = best). 1 vs N, 2 vs N-1, etc.
 */
export function generateKnockoutBracket(teams: SeedTeam[]): BracketMatch[] {
  const sorted = [...teams].sort((a, b) => a.seed - b.seed);
  const n = sorted.length;
  const matches: BracketMatch[] = [];

  // Determine first round phase
  let firstPhase: string;
  if (n <= 4) firstPhase = "SEMI_FINAL";
  else if (n <= 8) firstPhase = "QUARTER_FINAL";
  else firstPhase = "ROUND_OF_16";

  // Generate first round: 1 vs N, 2 vs N-1, etc.
  const firstRoundMatches: BracketMatch[] = [];
  for (let i = 0; i < n / 2; i++) {
    firstRoundMatches.push({
      homeId: sorted[i].id,
      awayId: sorted[n - 1 - i].id,
      phase: firstPhase,
      matchOrder: i,
    });
  }
  matches.push(...firstRoundMatches);

  // Generate placeholder matches for subsequent rounds
  let currentRoundSize = firstRoundMatches.length;
  let currentPhase = firstPhase;
  let orderOffset = firstRoundMatches.length;

  while (currentRoundSize > 1) {
    const nextPhase = getNextPhase(currentPhase);
    if (!nextPhase) break;

    const nextRoundSize = currentRoundSize / 2;
    for (let i = 0; i < nextRoundSize; i++) {
      matches.push({
        homeId: "__TBD__",
        awayId: "__TBD__",
        phase: nextPhase,
        matchOrder: orderOffset + i,
      });
    }

    // Add third place match before final
    if (nextPhase === "FINAL") {
      matches.push({
        homeId: "__TBD__",
        awayId: "__TBD__",
        phase: "THIRD_PLACE",
        matchOrder: orderOffset + nextRoundSize,
      });
    }

    orderOffset += nextRoundSize + (nextPhase === "FINAL" ? 1 : 0);
    currentRoundSize = nextRoundSize;
    currentPhase = nextPhase;
  }

  return matches;
}

interface ConfirmedMatch {
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number;
  awayScore: number;
}

interface StandingRow {
  teamId: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
}

/**
 * Recalculate standings from confirmed group matches.
 * Returns sorted array: points → goal diff → goals for.
 */
export function recalculateStandings(matches: ConfirmedMatch[], teamIds: string[]): StandingRow[] {
  const map = new Map<string, StandingRow>();
  for (const id of teamIds) {
    map.set(id, { teamId: id, played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0 });
  }

  for (const m of matches) {
    const home = map.get(m.homeTeamId)!;
    const away = map.get(m.awayTeamId)!;

    home.played++;
    away.played++;
    home.goalsFor += m.homeScore;
    home.goalsAgainst += m.awayScore;
    away.goalsFor += m.awayScore;
    away.goalsAgainst += m.homeScore;

    if (m.homeScore > m.awayScore) {
      home.won++;
      home.points += 3;
      away.lost++;
    } else if (m.homeScore < m.awayScore) {
      away.won++;
      away.points += 3;
      home.lost++;
    } else {
      home.drawn++;
      away.drawn++;
      home.points += 1;
      away.points += 1;
    }
  }

  return Array.from(map.values()).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    const gdA = a.goalsFor - a.goalsAgainst;
    const gdB = b.goalsFor - b.goalsAgainst;
    if (gdB !== gdA) return gdB - gdA;
    return b.goalsFor - a.goalsFor;
  });
}

/**
 * Get the next knockout phase.
 */
export function getNextPhase(phase: string): string | null {
  const order: Record<string, string> = {
    ROUND_OF_16: "QUARTER_FINAL",
    QUARTER_FINAL: "SEMI_FINAL",
    SEMI_FINAL: "FINAL",
  };
  return order[phase] ?? null;
}
```

- [ ] **Step 4: Run tests — should pass**

Run: `npm test -- src/__tests__/tournament-logic.test.ts`
Expected: All ~12 tests pass

- [ ] **Step 5: Commit**

```bash
git add src/server/tournament-logic.ts src/__tests__/tournament-logic.test.ts
git commit -m "feat: add tournament logic helpers with tests (round-robin, bracket, standings)"
```

---

### Task 3: Validators + Tournament Router — CRUD + Registration

**Files:**
- Create: `src/lib/validators/tournament.ts`
- Create: `src/server/trpc/routers/tournament.ts`
- Modify: `src/server/trpc/router.ts`

- [ ] **Step 1: Create validators**

Create `src/lib/validators/tournament.ts` with all 6 schemas from the spec: createTournamentSchema, applyTeamSchema, respondApplicationSchema, submitScoreSchema, confirmScoreSchema, addGoalSchema.

Key validations in createTournamentSchema:
- title: string min 3, max 300
- startDate: date (future)
- maxTeams: int 4-16, even
- format: enum
- groupCount: int 1-8, default 1
- advancingPerGroup: int 1-4, default 2

- [ ] **Step 2: Create tournament router — CRUD procedures**

Create `src/server/trpc/routers/tournament.ts` with:
- `create` — creates tournament + auto-registers creator as first team
- `update` — only creator, REGISTRATION status
- `delete` — only creator, REGISTRATION status
- `list` — public, cursor pagination, filters (regionId, status, format)
- `getById` — full tournament with teams, matches (grouped), standings

Use existing patterns from sparing/event routers: protectedProcedure, publicProcedure, TRPCError, awardPoints, sendPushToUser, sendEmailToUser.

- [ ] **Step 3: Add registration procedures to the same router**

- `applyTeam` — creates TournamentTeam, notifies creator
- `respondToApplication` — creator accepts/rejects, notifies applicant
- `withdraw` — user withdraws own team

- [ ] **Step 4: Register router in root**

In `src/server/trpc/router.ts`, add:
```typescript
import { tournamentRouter } from "./routers/tournament";
```
And add to appRouter: `tournament: tournamentRouter,`

- [ ] **Step 5: Verify TypeScript**

Run: `npx tsc --noEmit`

- [ ] **Step 6: Commit**

```bash
git add src/lib/validators/tournament.ts src/server/trpc/routers/tournament.ts src/server/trpc/router.ts
git commit -m "feat: add tournament router — CRUD + team registration"
```

---

### Task 4: Tournament Router — Game Flow (start, score, bracket, complete)

**Files:**
- Modify: `src/server/trpc/routers/tournament.ts`

- [ ] **Step 1: Add startTournament procedure**

- Only creator, status REGISTRATION
- Validates minimum teams (4 for GROUP, power of 2 for KNOCKOUT)
- Rejects remaining PENDING teams
- Assigns random group labels (A, B, C, D...)
- Creates TournamentStanding rows
- Calls `generateRoundRobin` for group matches OR `generateKnockoutBracket` for knockout
- Creates TournamentMatch rows
- Updates status → IN_PROGRESS
- Notifies all accepted teams

- [ ] **Step 2: Add submitMatchScore + confirmMatchScore**

submitMatchScore:
- User must be member of home or away team (check TournamentTeam.userId)
- Match must not be confirmed
- Penalties only in knockout phase when tied

confirmMatchScore:
- Other team confirms
- If confirmed in GROUP phase: recalculate standings using `recalculateStandings`
- If confirmed in knockout: advance winner to next round match (find match with __TBD__ placeholder, fill in)
- If rejected: reset scores

- [ ] **Step 3: Add generateKnockoutBracket procedure**

- Only for GROUP_AND_KNOCKOUT format
- Validates all group matches confirmed
- Takes top N from each group standings
- Creates knockout matches using `generateKnockoutBracket`

- [ ] **Step 4: Add completeTournament**

- Only creator, all matches confirmed
- Status → COMPLETED
- Award tournament_win points to winning team members
- Notification to all teams

- [ ] **Step 5: Add goals procedures**

- `addGoal`, `removeGoal`, `getMatchGoals` — same pattern as sparing goals but using TournamentMatch/TournamentGoal

- [ ] **Step 6: Add getStandings + getTopScorers**

- `getStandings` — query TournamentStanding, sorted
- `getTopScorers` — aggregate TournamentGoal by scorerUserId, top 10

- [ ] **Step 7: Verify TypeScript**

Run: `npx tsc --noEmit`

- [ ] **Step 8: Commit**

```bash
git add src/server/trpc/routers/tournament.ts
git commit -m "feat: add tournament game flow — start, score, bracket, complete, goals"
```

---

### Task 5: UI — Tournament List + Create Form

**Files:**
- Create: `src/app/(dashboard)/tournaments/page.tsx`
- Create: `src/app/(dashboard)/tournaments/new/page.tsx`
- Create: `src/components/tournament/tournament-card.tsx`

- [ ] **Step 1: Create TournamentCard component**

FotMob style card:
- Title (bold), date, location
- Format badge (GROUP/KNOCKOUT/GROUP+KNOCKOUT) — orange accent
- Status badge (Rejestracja=emerald, W trakcie=amber, Zakończony=muted)
- Team count: "6/8 drużyn"
- Creator name
- `bg-card rounded-xl p-4 hover:border-primary/30 transition-colors`

- [ ] **Step 2: Create tournament list page**

`/tournaments` — standard list pattern:
- Header "Turnieje" + "Stwórz turniej" button (if logged in)
- Filters: region (Select), status (Select)
- `usePaginatedList` with `api.tournament.list.useInfiniteQuery`
- Grid of TournamentCards
- Skeleton + EmptyState
- FotMob dark style

- [ ] **Step 3: Create tournament create form**

`/tournaments/new`:
- Title, description (textarea)
- Start date (datetime-local), end date (optional)
- Location
- Format (select with 3 options + descriptions)
- Max teams (select: 4/6/8/10/12/14/16)
- Group count (auto-calculated, editable) — visible only for GROUP formats
- Advancing per group (select: 1/2/3/4) — visible only for GROUP_AND_KNOCKOUT
- Region (select)
- Submit → `api.tournament.create.useMutation` → redirect to `/tournaments/[id]`

- [ ] **Step 4: Verify TypeScript + build**

Run: `npx tsc --noEmit && npm run build`

- [ ] **Step 5: Commit**

```bash
git add src/app/(dashboard)/tournaments/ src/components/tournament/tournament-card.tsx
git commit -m "feat: add tournament list page + create form"
```

---

### Task 6: UI — Tournament Detail Page (5 tabs)

**Files:**
- Create: `src/app/(dashboard)/tournaments/[id]/page.tsx`
- Create: `src/components/tournament/group-table.tsx`
- Create: `src/components/tournament/bracket-view.tsx`
- Create: `src/components/tournament/match-row.tsx`
- Create: `src/components/tournament/top-scorers.tsx`

- [ ] **Step 1: Create match-row component**

Simple match display row (reusable in groups tab and bracket):
- Home team name + score + ":" + score + away team name
- Penalty display if applicable: "(pk. X:Y)"
- Score color: confirmed=foreground, unconfirmed=muted
- Date if set, location if set
- Submit/confirm score buttons for participants

- [ ] **Step 2: Create group-table component**

Table showing group standings:
- Headers: #, Drużyna, M, W, R, P, B+, B-, +/-, Pkt
- Rows with team name (link if club), all stats
- Highlighted rows (top N advancing) with emerald accent
- `bg-card rounded-xl overflow-hidden`
- Below table: group matches using match-row

- [ ] **Step 3: Create bracket-view component**

Knockout bracket visualization:
- Columns per round (QF → SF → 3rd → Final)
- Each cell: match-row (compact)
- Lines connecting matches between rounds (CSS borders)
- TBD placeholder for unknown teams
- Responsive: horizontal scroll on mobile

- [ ] **Step 4: Create top-scorers component**

Ranking table:
- #, Imię (link), Drużyna, Bramki
- Top 10
- Football emoji before name

- [ ] **Step 5: Create tournament detail page**

`/tournaments/[id]`:
- Hero: gradient (amber→orange), title, date, location, format badge, status badge, creator
- Action buttons: "Dołącz" (registration), "Rozpocznij" (creator), "Zakończ" (creator)
- 5 tabs (same pattern as club profile):
  - **Drużyny**: team list with status, accept/reject for creator
  - **Grupy**: group-table per group (hidden for pure KNOCKOUT)
  - **Drabinka**: bracket-view (hidden for pure GROUP_STAGE)
  - **Strzelcy**: top-scorers
  - **Info**: description, dates, location, format details, organizer
- Score submission: inline in match-row for participants
- Score confirmation: button for other team

- [ ] **Step 6: Verify TypeScript + build**

Run: `npx tsc --noEmit && npm run build`

- [ ] **Step 7: Commit**

```bash
git add src/app/(dashboard)/tournaments/[id]/ src/components/tournament/
git commit -m "feat: add tournament detail page with 5 tabs (groups, bracket, scorers)"
```

---

### Task 7: Sidebar + Feed + Calendar Integration

**Files:**
- Modify: `src/components/layout/sidebar.tsx`
- Modify: `src/server/trpc/routers/feed.ts`
- Modify: `src/app/(dashboard)/feed/page.tsx`
- Modify: `src/components/calendar-view.tsx`

- [ ] **Step 1: Add sidebar link**

In `src/components/layout/sidebar.tsx`, add to NAV_SECTIONS "Więcej" section:
```typescript
{ href: "/tournaments", icon: Trophy, label: "Turnieje" },
```
Note: Trophy is already imported. Place before "Tablica".

- [ ] **Step 2: Add tournaments to feed**

In `src/server/trpc/routers/feed.ts`, in the `get` procedure's `Promise.all`, add a tournament query:
```typescript
ctx.db.tournament.findMany({
  where: {
    status: { in: ["REGISTRATION", "IN_PROGRESS"] },
    ...(regionId ? { regionId } : {}),
  },
  orderBy: { createdAt: "desc" },
  take: 5,
  include: { creator: { select: { id: true, club: { select: { name: true } }, player: { select: { firstName: true, lastName: true } } } }, _count: { select: { teams: true } } },
}),
```

Add tournament items to the unified feed array with type "tournament" and orange color.

- [ ] **Step 3: Add tournament FeedCard variant in feed page**

In `src/app/(dashboard)/feed/page.tsx`, handle `type === "tournament"` in FeedCard:
- Orange left accent/badge
- Trophy icon
- Title, date, format badge, team count
- Link to `/tournaments/[id]`

- [ ] **Step 4: Add tournaments to calendar**

In `src/components/calendar-view.tsx`:
- Add "tournament" to CalendarItem type
- Query tournaments for the month (via new tRPC procedure or reuse list with date filter)
- Display with orange color in calendar grid
- Toggle: include "Turnieje" alongside Sparingi/Wydarzenia

- [ ] **Step 5: Verify build**

Run: `npx tsc --noEmit && npm run build`

- [ ] **Step 6: Commit**

```bash
git add src/components/layout/sidebar.tsx src/server/trpc/routers/feed.ts src/app/(dashboard)/feed/page.tsx src/components/calendar-view.tsx
git commit -m "feat: integrate tournaments into sidebar, feed, and calendar"
```

---

### Task 8: Final Verification

- [ ] **Step 1: Run all unit tests**

Run: `npm test`
Expected: All pass (~55 tests)

- [ ] **Step 2: TypeScript check**

Run: `npx tsc --noEmit`

- [ ] **Step 3: Build**

Run: `npm run build`

- [ ] **Step 4: Apply migration to DB**

Same manual SQL pattern as previous migrations — create migration file and apply via node script.

- [ ] **Step 5: Commit if fixes needed**

```bash
git add -A
git commit -m "fix: final adjustments after tournament module"
```

---

## File Summary

| # | File | Action | Task |
|---|------|--------|------|
| 1 | `prisma/schema.prisma` | Modify (+5 models, +4 enums, +5 NotifTypes, +relations) | T1 |
| 2 | `src/lib/gamification.ts` | Modify (+3 actions, +1 badge) | T1 |
| 3 | `src/lib/labels.ts` | Modify (+notification labels, +format/status/phase labels) | T1 |
| 4 | `src/__tests__/gamification.test.ts` | Modify (counts: 20 actions, 10 badges) | T1 |
| 5 | `src/server/tournament-logic.ts` | Create (round-robin, bracket, standings) | T2 |
| 6 | `src/__tests__/tournament-logic.test.ts` | Create (~12 tests) | T2 |
| 7 | `src/lib/validators/tournament.ts` | Create (6 Zod schemas) | T3 |
| 8 | `src/server/trpc/routers/tournament.ts` | Create (~15 procedures) | T3, T4 |
| 9 | `src/server/trpc/router.ts` | Modify (+tournamentRouter) | T3 |
| 10 | `src/app/(dashboard)/tournaments/page.tsx` | Create (list page) | T5 |
| 11 | `src/app/(dashboard)/tournaments/new/page.tsx` | Create (create form) | T5 |
| 12 | `src/components/tournament/tournament-card.tsx` | Create | T5 |
| 13 | `src/app/(dashboard)/tournaments/[id]/page.tsx` | Create (detail with 5 tabs) | T6 |
| 14 | `src/components/tournament/group-table.tsx` | Create | T6 |
| 15 | `src/components/tournament/bracket-view.tsx` | Create | T6 |
| 16 | `src/components/tournament/match-row.tsx` | Create | T6 |
| 17 | `src/components/tournament/top-scorers.tsx` | Create | T6 |
| 18 | `src/components/layout/sidebar.tsx` | Modify (+Turnieje link) | T7 |
| 19 | `src/server/trpc/routers/feed.ts` | Modify (+tournaments) | T7 |
| 20 | `src/app/(dashboard)/feed/page.tsx` | Modify (+tournament FeedCard) | T7 |
| 21 | `src/components/calendar-view.tsx` | Modify (+tournaments) | T7 |
| 22 | `prisma/migrations/20260328140000_add_tournaments/` | Create | T1/T8 |
