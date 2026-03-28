# FotMob Club Management Flow Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the club management flow (Dashboard → Squad → Pipeline → Public Profile) from generic SaaS to FotMob/Sofascore sports-app style — dark-first, data-dense, bold stats, match previews.

**Architecture:** Pure visual refactor — CSS tokens + React components. No backend changes, no new dependencies, no DB migrations. 4 new shared components extracted for reuse. Existing business logic untouched.

**Tech Stack:** Next.js 16, Tailwind CSS 4, shadcn/ui, tRPC React Query hooks, Lucide icons

**Spec:** `docs/superpowers/specs/2026-03-28-fotmob-club-redesign.md`

---

### Task 1: Design Tokens — Dark Mode Update

**Files:**
- Modify: `src/styles/globals.css` (`.dark` block)

- [ ] **Step 1: Update dark mode CSS variables**

In `src/styles/globals.css`, find the `.dark { ... }` block and update these values:

```css
/* OLD → NEW */
--background: #0c0a1a;         → --background: #111827;
--card: #131025;               → --card: #1f2937;
--card-foreground: #ededed;    → (keep)
--secondary: #1a1530;          → --secondary: #1e293b;
--secondary-foreground: #a1a1a1; → (keep)
--muted: #1a1530;              → --muted: #1e293b;
--muted-foreground: #8888a0;   → --muted-foreground: #9ca3af;
--border: #1e1a2e;             → --border: #374151;
--input: #1e1a2e;              → --input: #374151;
--sidebar-background: #0e0b1e; → --sidebar-background: #0f1623;
--sidebar-border: #1a1530;     → --sidebar-border: #1e293b;
--sidebar-muted: #131025;      → --sidebar-muted: #1e293b;
--sidebar-muted-foreground: #666680; → --sidebar-muted-foreground: #6b7280;
```

Keep all other values (`--primary`, `--accent`, `--destructive`, etc.) unchanged.

- [ ] **Step 2: Verify dark mode renders correctly**

Run: `npm run dev`
Open browser, toggle dark mode. Check: sidebar, cards, borders should be gray-toned (not purple-toned). All text should remain readable.

- [ ] **Step 3: Commit**

```bash
git add src/styles/globals.css
git commit -m "style: update dark mode tokens to gray-900 palette (FotMob style)"
```

---

### Task 2: Shared Component — StatsCell

**Files:**
- Create: `src/components/stats-cell.tsx`

- [ ] **Step 1: Create StatsCell component**

```tsx
"use client";

interface StatsCellProps {
  value: string | number;
  label: string;
  color?: "violet" | "amber" | "sky" | "emerald" | "red" | "default";
}

const COLOR_MAP: Record<string, string> = {
  violet: "text-violet-400",
  amber: "text-amber-400",
  sky: "text-sky-400",
  emerald: "text-emerald-400",
  red: "text-red-400",
  default: "text-foreground",
};

export function StatsCell({ value, label, color = "default" }: StatsCellProps) {
  return (
    <div className="bg-card rounded-xl p-3 text-center">
      <div className={`text-2xl font-extrabold ${COLOR_MAP[color] || COLOR_MAP.default}`}>
        {value}
      </div>
      <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mt-1">
        {label}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: No errors related to stats-cell.tsx

- [ ] **Step 3: Commit**

```bash
git add src/components/stats-cell.tsx
git commit -m "feat: add StatsCell shared component"
```

---

### Task 3: Shared Component — MatchCard

**Files:**
- Create: `src/components/match-card.tsx`

- [ ] **Step 1: Create MatchCard component**

```tsx
"use client";

import Link from "next/link";
import { formatShortDate } from "@/lib/format";

interface ClubInfo {
  id: string;
  name: string;
  logoUrl?: string | null;
  initials: string;
}

interface MatchCardProps {
  homeClub: ClubInfo;
  awayClub: ClubInfo;
  date: Date;
  homeScore?: number | null;
  awayScore?: number | null;
  scoreConfirmed?: boolean;
  variant?: "compact" | "highlight";
}

function ClubAvatar({ club, size = "sm" }: { club: ClubInfo; size?: "sm" | "md" }) {
  const dim = size === "md" ? "w-9 h-9 text-xs" : "w-7 h-7 text-[9px]";
  if (club.logoUrl) {
    return (
      <img
        src={club.logoUrl}
        alt={club.name}
        className={`${dim} rounded-lg object-cover`}
      />
    );
  }
  return (
    <div className={`${dim} rounded-lg bg-muted flex items-center justify-center font-bold`}>
      {club.initials}
    </div>
  );
}

function ScoreBadge({ home, away, isHome }: { home: number; away: number; isHome: boolean }) {
  const won = isHome ? home > away : away > home;
  const lost = isHome ? home < away : away < home;
  const colorClass = won
    ? "bg-emerald-500/20 text-emerald-400"
    : lost
      ? "bg-red-500/20 text-red-400"
      : "bg-muted/30 text-muted-foreground";

  return (
    <div className={`${colorClass} px-3 py-1 rounded-lg text-sm font-extrabold`}>
      {home} : {away}
    </div>
  );
}

export function MatchCard({ homeClub, awayClub, date, homeScore, awayScore, scoreConfirmed, variant = "compact" }: MatchCardProps) {
  const hasScore = homeScore != null && awayScore != null && scoreConfirmed;
  const dateStr = formatShortDate(date);
  const timeStr = date.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" });

  if (variant === "highlight") {
    // Dashboard "Next Match" style
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    const countdown = diffDays === 0 ? "Dziś" : diffDays === 1 ? "Jutro" : `za ${diffDays} dni`;

    return (
      <div className="bg-card rounded-xl p-4 border-l-[3px] border-violet-500">
        <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
          Następny mecz
        </div>
        <div className="flex items-center justify-center gap-4">
          <div className="text-center">
            <ClubAvatar club={homeClub} size="md" />
            <div className="text-[11px] font-semibold mt-1 truncate max-w-[80px]">{homeClub.name}</div>
          </div>
          <div className="text-center">
            <div className="text-[11px] text-muted-foreground">{dateStr}</div>
            <div className="text-lg font-extrabold my-0.5">{timeStr}</div>
            <div className="text-[10px] font-semibold text-violet-400">{countdown}</div>
          </div>
          <div className="text-center">
            <ClubAvatar club={awayClub} size="md" />
            <div className="text-[11px] font-semibold mt-1 truncate max-w-[80px]">{awayClub.name}</div>
          </div>
        </div>
      </div>
    );
  }

  // Compact row (for match lists)
  return (
    <div className="flex items-center py-3 px-3">
      <div className="w-11 text-center mr-3 shrink-0">
        <div className="text-[11px] text-muted-foreground">{dateStr}</div>
        {!hasScore && <div className="text-[10px] text-muted-foreground">{timeStr}</div>}
      </div>
      <div className="w-px h-8 bg-border mr-3 shrink-0" />
      <Link href={`/clubs/${homeClub.id}`} className="flex items-center gap-2 flex-1 min-w-0 hover:text-primary transition-colors">
        <ClubAvatar club={homeClub} />
        <span className="text-[13px] font-semibold truncate">{homeClub.name}</span>
      </Link>
      <div className="mx-2 shrink-0">
        {hasScore ? (
          <ScoreBadge home={homeScore} away={awayScore} isHome />
        ) : (
          <span className="text-[13px] font-extrabold text-muted-foreground">vs</span>
        )}
      </div>
      <Link href={`/clubs/${awayClub.id}`} className="flex items-center gap-2 flex-1 min-w-0 justify-end hover:text-primary transition-colors">
        <span className="text-[13px] font-semibold truncate">{awayClub.name}</span>
        <ClubAvatar club={awayClub} />
      </Link>
    </div>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add src/components/match-card.tsx
git commit -m "feat: add MatchCard shared component (compact + highlight variants)"
```

---

### Task 4: Shared Component — PositionGroup

**Files:**
- Create: `src/components/squad/position-group.tsx`

- [ ] **Step 1: Create PositionGroup component**

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { POSITION_LABELS } from "@/lib/labels";
import { Trash2 } from "lucide-react";

interface PlayerRow {
  id: string;
  userId: string;
  firstName: string | null;
  lastName: string | null;
  photoUrl?: string | null;
  position?: string | null;
  age?: number | null;
  height?: number | null;
  preferredFoot?: string | null;
}

interface PositionGroupProps {
  label: string;
  color: "red" | "blue" | "emerald" | "amber";
  players: PlayerRow[];
  showActions?: boolean;
  onRemove?: (userId: string) => void;
  removingId?: string | null;
  collapsedMax?: number;
}

const BAR_COLORS: Record<string, string> = {
  red: "bg-red-500",
  blue: "bg-blue-500",
  emerald: "bg-emerald-500",
  amber: "bg-amber-500",
};

export const POSITION_GROUPS = [
  { key: "GK", label: "Bramkarze", color: "red" as const, positions: ["GK"] },
  { key: "DEF", label: "Obrońcy", color: "blue" as const, positions: ["CB", "LB", "RB"] },
  { key: "MID", label: "Pomocnicy", color: "emerald" as const, positions: ["CDM", "CM", "CAM", "LM", "RM"] },
  { key: "FWD", label: "Napastnicy", color: "amber" as const, positions: ["ST", "LW", "RW"] },
];

export function PositionGroup({
  label,
  color,
  players,
  showActions = false,
  onRemove,
  removingId,
  collapsedMax = 3,
}: PositionGroupProps) {
  const [expanded, setExpanded] = useState(false);
  const visiblePlayers = expanded ? players : players.slice(0, collapsedMax);
  const hiddenCount = players.length - collapsedMax;

  if (players.length === 0) return null;

  return (
    <div className="mb-4">
      <div className="flex items-center gap-1.5 mb-2">
        <div className={`w-[3px] h-3.5 rounded-sm ${BAR_COLORS[color]}`} />
        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <span className="text-[11px] text-muted-foreground/60">{players.length}</span>
      </div>
      <div className="bg-card rounded-xl overflow-hidden divide-y divide-border">
        {visiblePlayers.map((p) => {
          const name = [p.firstName, p.lastName].filter(Boolean).join(" ") || "Bez nazwy";
          const initials = `${(p.firstName?.[0] || "").toUpperCase()}${(p.lastName?.[0] || "").toUpperCase()}`;
          const meta = [p.age ? `${p.age} lat` : null, p.height ? `${p.height} cm` : null, p.preferredFoot === "LEFT" ? "Lewa" : p.preferredFoot === "RIGHT" ? "Prawa" : null].filter(Boolean).join(" · ");

          return (
            <div key={p.userId} className="flex items-center px-3 py-2.5">
              <Link href={`/players/${p.id}`} className="flex items-center gap-2.5 flex-1 min-w-0 hover:text-primary transition-colors">
                {p.photoUrl ? (
                  <img src={p.photoUrl} alt={name} className="w-9 h-9 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold shrink-0">
                    {initials}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="text-[13px] font-semibold truncate">{name}</div>
                  {meta && <div className="text-[11px] text-muted-foreground">{meta}</div>}
                </div>
              </Link>
              {p.position && (
                <span className="bg-muted px-2 py-0.5 rounded-md text-[10px] font-semibold text-muted-foreground shrink-0 ml-2">
                  {POSITION_LABELS[p.position] || p.position}
                </span>
              )}
              {showActions && onRemove && (
                <button
                  onClick={() => onRemove(p.userId)}
                  disabled={removingId === p.userId}
                  className="ml-2 p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors shrink-0"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          );
        })}
        {!expanded && hiddenCount > 0 && (
          <button
            onClick={() => setExpanded(true)}
            className="w-full py-2 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
          >
            + {hiddenCount} więcej
          </button>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add src/components/squad/position-group.tsx
git commit -m "feat: add PositionGroup shared component with collapsible rows"
```

---

### Task 5: Shared Component — StagePill

**Files:**
- Create: `src/components/recruitment/stage-pill.tsx`

- [ ] **Step 1: Create StagePill component**

```tsx
"use client";

interface StagePillProps {
  label: string;
  count: number;
  color: "blue" | "amber" | "violet" | "cyan" | "emerald" | "red";
  active: boolean;
  onClick: () => void;
}

const PILL_COLORS: Record<string, { base: string; active: string }> = {
  blue: { base: "bg-blue-500/10 border-blue-500/20 text-blue-400", active: "bg-blue-500/20 border-blue-500/40 text-blue-300" },
  amber: { base: "bg-amber-500/10 border-amber-500/20 text-amber-400", active: "bg-amber-500/20 border-amber-500/40 text-amber-300" },
  violet: { base: "bg-violet-500/10 border-violet-500/20 text-violet-400", active: "bg-violet-500/20 border-violet-500/40 text-violet-300" },
  cyan: { base: "bg-cyan-500/10 border-cyan-500/20 text-cyan-400", active: "bg-cyan-500/20 border-cyan-500/40 text-cyan-300" },
  emerald: { base: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400", active: "bg-emerald-500/20 border-emerald-500/40 text-emerald-300" },
  red: { base: "bg-red-500/10 border-red-500/20 text-red-400", active: "bg-red-500/20 border-red-500/40 text-red-300" },
};

export function StagePill({ label, count, color, active, onClick }: StagePillProps) {
  const colors = PILL_COLORS[color] || PILL_COLORS.blue;
  return (
    <button
      onClick={onClick}
      className={`border rounded-lg px-3 py-1.5 text-xs font-bold whitespace-nowrap transition-colors ${active ? colors.active : colors.base}`}
    >
      {label} · {count}
    </button>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add src/components/recruitment/stage-pill.tsx
git commit -m "feat: add StagePill shared component for pipeline filters"
```

---

### Task 6: Dashboard Redesign — Club View (`feed/page.tsx`)

**Files:**
- Modify: `src/app/(dashboard)/feed/page.tsx`
- Modify: `src/components/dashboard/club-sections.tsx`

This is the largest task. The current `feed/page.tsx` is 563 lines. We're replacing the CLUB section of the dashboard (StatsBar, QuickActions, ClubSections, Feed) with:
- ClubHeaderCard (gradient hero)
- StatsRow (4 cells)
- NextMatchCard (conditional)
- QuickActions (restyled)
- PendingAlerts (new pattern)
- Feed (collapsed, optional)

- [ ] **Step 1: Add `nextMatch` and `pendingAlerts` to `stats.clubDashboard`**

In `src/server/trpc/routers/stats.ts`, find the `clubDashboard` procedure. Add two new queries to its `Promise.all`:
- Next match: `sparingOffer.findFirst` where status=MATCHED, matchDate > now, ordered by matchDate asc, include matched club info
- Pending alerts: last 5 pending applications + counter-proposals, with club names and timestamps

This gives the dashboard the data it needs without N+1 queries.

- [ ] **Step 2: Rewrite the CLUB dashboard section in `feed/page.tsx`**

Replace the existing CLUB block (StatsBar + ClubQuickActions + ClubSections + Feed list) with:

**ClubHeaderCard** — inline in feed/page.tsx:
```tsx
{/* Club Header Card */}
{isClub && clubData && (
  <div className="bg-gradient-to-r from-indigo-950 to-slate-900 rounded-xl p-4 mb-4 relative overflow-hidden">
    <div className="absolute inset-0 opacity-[0.03]" style={{backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "24px 24px"}} />
    <div className="relative flex items-center gap-3">
      {clubData.logoUrl ? (
        <img src={clubData.logoUrl} alt={clubData.name} className="w-14 h-14 rounded-xl border-2 border-white/10 object-cover" />
      ) : (
        <div className="w-14 h-14 rounded-xl bg-white/10 border-2 border-white/10 flex items-center justify-center text-xl font-extrabold">
          {clubData.name?.substring(0, 2).toUpperCase()}
        </div>
      )}
      <div>
        <h1 className="text-lg font-extrabold">{clubData.name}</h1>
        <p className="text-xs text-white/60">{clubData.city} · {regionName}</p>
        <div className="flex gap-1.5 mt-1.5">
          {leagueLabel && <span className="bg-white/10 px-2 py-0.5 rounded-md text-[10px] font-semibold">{leagueLabel}</span>}
          {avgRating > 0 && <span className="bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-md text-[10px] font-semibold">★ {avgRating.toFixed(1)}</span>}
        </div>
      </div>
    </div>
  </div>
)}
```

**StatsRow** — using `StatsCell`:
```tsx
<div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
  <StatsCell value={dashboardStats.activeSparings} label="Aktywne" color="violet" />
  <StatsCell value={dashboardStats.pendingApplications} label="Zgłoszenia" color="amber" />
  <StatsCell value={squadCount} label="Kadra" color="sky" />
  <StatsCell value={winRecord} label="Bilans" color="emerald" />
</div>
```

**NextMatchCard** — using `MatchCard` with `variant="highlight"` (conditional — only if nextMatch exists)

**QuickActions** — restyled:
```tsx
<div className="flex gap-2 mb-4">
  <Link href="/sparings/new" className="flex-1 bg-gradient-to-r from-violet-600 to-violet-500 h-10 rounded-lg flex items-center justify-center text-sm font-semibold text-white hover:opacity-90 transition-opacity">
    <Swords className="h-4 w-4 mr-1.5" /> Nowy sparing
  </Link>
  <Link href="/events/new" className="flex-1 bg-card border border-border h-10 rounded-lg flex items-center justify-center text-sm font-semibold hover:bg-muted transition-colors">
    <Trophy className="h-4 w-4 mr-1.5" /> Nabór
  </Link>
  <Link href="/recruitment" className="flex-1 bg-card border border-border h-10 rounded-lg flex items-center justify-center text-sm font-semibold hover:bg-muted transition-colors">
    <Target className="h-4 w-4 mr-1.5" /> Pipeline
  </Link>
</div>
```

**PendingAlerts** — new inline component:
```tsx
{pendingAlerts.length > 0 && (
  <div className="bg-card rounded-xl overflow-hidden mb-4">
    <div className="px-3 py-2 border-b border-border flex items-center">
      <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Wymagają uwagi</span>
      <span className="bg-red-500 text-white rounded-full px-2 py-0.5 text-[10px] font-bold ml-2">{pendingAlerts.length}</span>
    </div>
    <div className="divide-y divide-border">
      {pendingAlerts.slice(0, 5).map((alert) => (
        <Link key={alert.id} href={alert.href} className="flex items-center px-3 py-2.5 hover:bg-muted/50 transition-colors">
          <div className={`w-2 h-2 rounded-full ${alert.dotColor} mr-3 shrink-0`} />
          <div className="flex-1 min-w-0">
            <span className="text-[12px] font-semibold">{alert.title}</span>
            <span className="text-[11px] text-muted-foreground ml-1">{alert.description}</span>
          </div>
          <span className="text-[10px] text-muted-foreground shrink-0 ml-2">{alert.timeAgo}</span>
        </Link>
      ))}
    </div>
  </div>
)}
```

Feed list stays below as optional/secondary content.

- [ ] **Step 3: Update `club-sections.tsx` to align with new token style**

Update card radius `rounded-lg` → `rounded-xl`, ensure section labels use `text-[11px] font-bold uppercase tracking-wider text-muted-foreground`.

- [ ] **Step 4: Verify build**

Run: `npx tsc --noEmit && npm run build`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add src/app/(dashboard)/feed/page.tsx src/components/dashboard/club-sections.tsx src/server/trpc/routers/stats.ts
git commit -m "feat: redesign club dashboard — FotMob card stack style"
```

---

### Task 7: Squad Page Redesign (`squad/page.tsx`)

**Files:**
- Modify: `src/app/(dashboard)/squad/page.tsx`

- [ ] **Step 1: Rewrite squad page to use PositionGroup sections**

Replace the current 3-tab layout (Players, Coaches, Requests) with a single scrollable page:

1. Header: title "Kadra" + subtitle "X zawodników · Y trenerów" + "Zaproś" button
2. Position groups: loop over `POSITION_GROUPS`, filter members by position, render `<PositionGroup>` for each non-empty group
3. Coaches section: same PositionGroup-style but with specialization + license + "Zarządza" badge
4. Pending requests section: inline accept/reject with colored badges (PROŚBA=blue, ZAPROSZONY=amber)

Key changes:
- Import `PositionGroup, POSITION_GROUPS` from `@/components/squad/position-group`
- Group players by matching `member.player?.position` against `POSITION_GROUPS[].positions`
- Players not matching any group go into "Inni" catch-all section
- Remove the `useState` tab state and Tab UI
- Keep existing mutation hooks (`respond`, `removeMember`, `setPermissions`) unchanged
- Keep `InviteMemberDialog` unchanged
- Use section labels pattern: colored left-bar + uppercase text + count

- [ ] **Step 2: Verify build**

Run: `npx tsc --noEmit && npm run build`

- [ ] **Step 3: Test manually**

Open `/squad` as a club owner. Verify:
- Players grouped by position (GK/DEF/MID/FWD)
- Coaches shown separately with badge
- Pending requests with accept/reject buttons
- Remove button works
- "Zaproś" dialog opens

- [ ] **Step 4: Commit**

```bash
git add src/app/(dashboard)/squad/page.tsx
git commit -m "feat: redesign squad page — position-grouped layout (FotMob style)"
```

---

### Task 8: Pipeline Page Redesign (`recruitment/page.tsx`)

**Files:**
- Modify: `src/app/(dashboard)/recruitment/page.tsx`

- [ ] **Step 1: Add ProgressBar and StagePill to the pipeline page**

Replace the current header and kanban column headers with:

**ProgressBar** at top:
```tsx
const stageCounts = STAGES.map(s => ({ ...s, count: pipeline.filter(p => p.stage === s.key).length }));
const total = stageCounts.reduce((a, b) => a + b.count, 0);

{total > 0 && (
  <div className="flex gap-0.5 h-1 rounded-full overflow-hidden mb-4">
    {stageCounts.filter(s => s.count > 0).map(s => (
      <div key={s.key} className={`${s.barColor}`} style={{ flex: s.count }} />
    ))}
  </div>
)}
```

**StagePills** replacing column headers:
```tsx
<div className="flex gap-2 overflow-x-auto pb-2 mb-4">
  <StagePill label="Wszyscy" count={total} color="violet" active={activeStage === null} onClick={() => setActiveStage(null)} />
  {stageCounts.map(s => (
    <StagePill key={s.key} label={s.label} count={s.count} color={s.color} active={activeStage === s.key} onClick={() => setActiveStage(s.key)} />
  ))}
</div>
```

Define STAGES config:
```tsx
const STAGES = [
  { key: "WATCHING", label: "Radar", color: "blue" as const, barColor: "bg-blue-500" },
  { key: "INVITED_TO_TRYOUT", label: "Zaproszeni", color: "amber" as const, barColor: "bg-amber-500" },
  { key: "AFTER_TRYOUT", label: "Po testach", color: "violet" as const, barColor: "bg-violet-500" },
  { key: "OFFER_SENT", label: "Oferta", color: "cyan" as const, barColor: "bg-cyan-500" },
  { key: "SIGNED", label: "Podpisani", color: "emerald" as const, barColor: "bg-emerald-500" },
  { key: "REJECTED", label: "Odrzuceni", color: "red" as const, barColor: "bg-red-500" },
];
```

- [ ] **Step 2: Redesign player cards in list view**

Replace current card layout with:
- `bg-card rounded-xl divide-y divide-border` container
- Each row: avatar (40px) + name (bold, link) + meta pills (position, age, city) + inline action button
- Mini-timeline below name (if recruitment events exist): colored dots + date + note
- Contextual action per stage: "→ Zaproś" (WATCHING), "→ Na testy" (INVITED), etc.

- [ ] **Step 3: Make list view the default (board view as toggle)**

Change default `view` state from board to list. Board view remains accessible via toggle on desktop.

- [ ] **Step 4: Update MetricCard styling**

Align the "avg time to sign" card: `bg-card rounded-xl p-4`, timer icon in `bg-sky-500/10 rounded-lg`, number `text-xl font-extrabold text-sky-400`.

- [ ] **Step 5: Verify build**

Run: `npx tsc --noEmit && npm run build`

- [ ] **Step 6: Commit**

```bash
git add src/app/(dashboard)/recruitment/page.tsx
git commit -m "feat: redesign pipeline — progress bar, stage pills, card list (FotMob style)"
```

---

### Task 9: Public Club Profile Redesign (`clubs/[id]/page.tsx`)

**Files:**
- Modify: `src/app/(public)/clubs/[id]/page.tsx`

- [ ] **Step 1: Replace 2-column layout with single-column + tabs**

The current page is a server component with 2-column grid (lg:grid-cols-3). Replace with:
- Hero (kept as server component)
- StatsBar (server component)
- Client component wrapper for tabs (new `ClubProfileTabs` component inline or extracted)

**Hero update:**
- Change gradient: `bg-gradient-to-br from-indigo-950 via-slate-900 to-sky-950`
- Keep existing elements (BackButton, logo, name, badges, action buttons)
- Update badge styling: `bg-white/10 rounded-md text-[11px]`

**StatsBar** (new, below hero):
```tsx
<div className="bg-card rounded-xl overflow-hidden flex divide-x divide-border my-4">
  <StatsCell value={wins} label="Wygrane" />
  <StatsCell value={draws} label="Remisy" />
  <StatsCell value={losses} label="Porażki" />
  <StatsCell value={memberCount} label="Kadra" />
</div>
```

Calculate W/D/L from existing `sparingHistory` query.

- [ ] **Step 2: Add tab navigation**

Create client island `ClubProfileTabs`:
```tsx
"use client";
import { useState } from "react";

const TABS = [
  { key: "matches", label: "Mecze" },
  { key: "squad", label: "Kadra" },
  { key: "recruitment", label: "Nabory" },
  { key: "reviews", label: "Opinie" },
  { key: "info", label: "Info" },
];

// Tab bar
<div className="bg-card rounded-lg p-1 flex gap-0.5 mb-4">
  {TABS.map(tab => (
    <button
      key={tab.key}
      onClick={() => setActiveTab(tab.key)}
      className={`flex-1 py-2 rounded-md text-xs font-semibold transition-colors ${
        activeTab === tab.key ? "bg-muted font-bold text-foreground" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {tab.label}
    </button>
  ))}
</div>
```

- [ ] **Step 3: Implement tab content sections**

**Mecze tab:** Use `MatchCard` component for each match. Sections: "Nadchodzące" (upcoming sparings) + "Ostatnie wyniki" (sparingHistory with scores).

**Kadra tab:** Use `PositionGroup` in read-only mode (`showActions={false}`). Data from existing members query.

**Nabory tab:** List of active recruitment events with type badge, date, target info.

**Opinie tab:** Average rating (large) + review list (existing pattern, restyled).

**Info tab:** Description, contact (email/phone/www with icons), join date, league link.

- [ ] **Step 4: Remove old 2-column layout**

Remove `lg:grid-cols-3` grid, sidebar card, and separate section cards. All content now lives inside tabs.

- [ ] **Step 5: Verify build**

Run: `npx tsc --noEmit && npm run build`

- [ ] **Step 6: Test manually**

Open `/clubs/[id]` (any club with data). Verify:
- Hero renders with gradient
- Stats bar shows W/R/P/Kadra
- All 5 tabs switch content
- Match cards show scores with colors
- Kadra shows position groups (read-only)
- Info tab shows contact details

- [ ] **Step 7: Commit**

```bash
git add src/app/(public)/clubs/[id]/page.tsx
git commit -m "feat: redesign public club profile — single-column tabs (FotMob style)"
```

---

### Task 10: Token Alignment — Sidebar + RecruitmentStats

**Files:**
- Modify: `src/components/layout/sidebar.tsx`
- Modify: `src/components/recruitment/recruitment-stats.tsx`

- [ ] **Step 1: Update sidebar border-radius and spacing**

In `sidebar.tsx`:
- Logo container: keep as-is (already rounded-lg)
- Nav items: no changes needed (tokens auto-apply via CSS vars)
- Verify sidebar looks correct with new `--sidebar-background` and `--sidebar-border` values

- [ ] **Step 2: Update RecruitmentStats widget**

In `recruitment-stats.tsx`:
- Card: `rounded-lg` → `rounded-xl`
- Stage items: update border radius to match new tokens
- Section label: ensure `text-[11px] font-bold uppercase tracking-wider`

- [ ] **Step 3: Verify build**

Run: `npx tsc --noEmit && npm run build`

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/sidebar.tsx src/components/recruitment/recruitment-stats.tsx
git commit -m "style: align sidebar and recruitment-stats with new design tokens"
```

---

### Task 11: Final Verification

- [ ] **Step 1: Full TypeScript check**

Run: `npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 2: Full build**

Run: `npm run build`
Expected: Successful build

- [ ] **Step 3: Visual check — dark mode**

Open each page in browser (dark mode):
1. `/feed` (as CLUB) — header card, stats, next match, quick actions, alerts
2. `/squad` — position groups, coaches, requests
3. `/recruitment` — progress bar, stage pills, player cards
4. `/clubs/[id]` — hero, stats bar, all 5 tabs

Verify: consistent gray-900 backgrounds, readable text, no purple-tinted remnants.

- [ ] **Step 4: Visual check — mobile (375px)**

Same 4 pages at 375px width. Verify: stats grid collapses to 2-col, pills scroll horizontally, tabs wrap or scroll.

- [ ] **Step 5: E2E tests**

Run: `npm run test:e2e`
Expected: All existing tests pass (no structural HTML changes that break selectors).

- [ ] **Step 6: Final commit (if any fixes needed)**

```bash
git add -A
git commit -m "fix: final adjustments after FotMob redesign verification"
```

---

## File Summary

| # | File | Action | Task |
|---|------|--------|------|
| 1 | `src/styles/globals.css` | Modify (4 dark CSS vars) | T1 |
| 2 | `src/components/stats-cell.tsx` | Create | T2 |
| 3 | `src/components/match-card.tsx` | Create | T3 |
| 4 | `src/components/squad/position-group.tsx` | Create | T4 |
| 5 | `src/components/recruitment/stage-pill.tsx` | Create | T5 |
| 6 | `src/app/(dashboard)/feed/page.tsx` | Major rewrite (CLUB section) | T6 |
| 7 | `src/server/trpc/routers/stats.ts` | Add nextMatch + pendingAlerts | T6 |
| 8 | `src/components/dashboard/club-sections.tsx` | Token alignment | T6 |
| 9 | `src/app/(dashboard)/squad/page.tsx` | Major rewrite (position groups) | T7 |
| 10 | `src/app/(dashboard)/recruitment/page.tsx` | Major rewrite (progress+pills) | T8 |
| 11 | `src/app/(public)/clubs/[id]/page.tsx` | Major rewrite (tabs) | T9 |
| 12 | `src/components/layout/sidebar.tsx` | Token alignment | T10 |
| 13 | `src/components/recruitment/recruitment-stats.tsx` | Token alignment | T10 |
