# FotMob Club Management Flow Redesign

**Date:** 2026-03-28
**Scope:** Club management flow end-to-end: Dashboard → Kadra → Pipeline → Profil publiczny
**Style:** Sofascore/FotMob — dark-first, data-dense, sportowy feel

---

## Design Direction

Inspiracja: FotMob Card Stack. Ciemne tlo (#111827), karty w stosie, bold stats, match-preview highlights, uppercase section labels, inline actions. Sportowa identycznosc zamiast generycznego SaaS.

## 1. Design Tokens (globals.css)

### Dark mode overhaul

| Token | Current | New | Reason |
|-------|---------|-----|--------|
| `--background` | `#0c0a1a` | `#111827` | Gray-900, neutralny dark (FotMob style) |
| `--card` | `#131025` | `#1f2937` | Gray-800, czytelniejszy kontrast |
| `--border` | `#1e1a2e` | `#374151` | Gray-700, widoczniejsze separatory |
| `--muted-foreground` | `#71717a` | `#9ca3af` | Gray-400, lepszy kontrast na ciemnym tle |

Light mode zostaje bez zmian (opcjonalny, dark jest domyslny).

### Typography patterns

- Section labels: `text-[11px] font-bold uppercase tracking-wider text-muted-foreground`
- Stats numbers: `text-xl font-extrabold` (or `text-2xl` for hero stats)
- Card titles: `text-sm font-semibold`
- Meta/secondary: `text-[11px] text-muted-foreground`

### Border radius

- Cards: `rounded-xl` (12px) zamiast `rounded-lg` (8px)
- Avatars: `rounded-full` (circles) for players, `rounded-xl` for clubs
- Buttons/pills: `rounded-lg` (8px)
- Badge pills: `rounded-md` (6px)

## 2. Dashboard klubu (`feed/page.tsx`)

### Layout (top to bottom)

```
ClubHeaderCard          — gradient hero with club identity
StatsRow                — 4 inline stat cards
NextMatchCard           — match preview highlight (conditional)
QuickActions            — 2-3 action buttons
PendingAlerts           — alert list with colored dots
Feed (optional)         — collapsed, expandable
```

### ClubHeaderCard

- Full-width card with `bg-gradient-to-r from-indigo-950 to-slate-900`
- Dot pattern overlay (existing pattern from landing)
- Club logo (56px, rounded-xl, semi-transparent border)
- Club name (text-lg font-extrabold), city + region (text-xs muted)
- Badge pills: liga, rating (amber), follower count

### StatsRow

- 4 cards in `grid grid-cols-2 sm:grid-cols-4 gap-2`
- Each: dark card (`bg-card`), centered, number (text-2xl font-extrabold, gradient or colored), uppercase label (text-[10px])
- Stats: Aktywne sparingi (violet), Zgloszenia (amber), Kadra (sky), Bilans W-R-P (emerald)

### NextMatchCard (conditional — only when MATCHED sparing exists with future date)

- `bg-card border-l-3 border-violet-500`
- Section label "Nastepny mecz" uppercase
- Center layout: HomeClub logo+name | Date+Time+Countdown | AwayClub logo+name
- Countdown pill: `bg-violet-500/10 text-violet-400 text-xs font-semibold`

### QuickActions

- `flex gap-2`
- Primary: `bg-gradient-to-r from-violet-600 to-violet-500` — "Nowy sparing"
- Secondary: `bg-card border border-border` — "Nabor", "Pipeline"
- Size: `h-10 text-sm font-semibold rounded-lg`

### PendingAlerts

- Card with header: "Wymagaja uwagi" + red count badge
- List rows with `divide-y divide-border`:
  - Colored dot (8px): amber=counter-proposal, emerald=new applications, violet=messages
  - Bold name + muted description
  - Relative time ("2h temu") on right
- Max 5 items, "Zobacz wszystkie" link if more

### Removed elements

- Old StatsBar gradient pills → replaced by StatsRow
- FeedCard list as primary content → feed becomes secondary/collapsed
- Onboarding wizards stay but get dark styling

## 3. Kadra (`squad/page.tsx`)

### Layout

```
Header                  — title + "Zapros" button
PositionGroup[]         — GK, DEF, MID, FWD sections
CoachGroup              — Trenerzy section
PendingRequests         — Prosby/Zaproszenia section
```

### Replaces current 3-tab layout with single scrollable page with sections.

### PositionGroup

- Section label with colored left-bar (3px): GK=red-500, DEF=blue-500, MID=emerald-500, FWD=amber-500
- Label format: `"BRAMKARZE · 1"` (uppercase, tracking-wider)
- Player rows in shared `bg-card rounded-xl overflow-hidden divide-y divide-border`:
  - Avatar (36px circle) + Name (font-semibold, Link to profile) + age/height meta
  - Position badge (dark pill, text-[10px])
  - Collapsible "+N wiecej" if >3 players in group

### Position mapping

```typescript
const POSITION_GROUPS = {
  GK: { label: "Bramkarze", color: "red", positions: ["GOALKEEPER"] },
  DEF: { label: "Obroncy", color: "blue", positions: ["CENTER_BACK", "LEFT_BACK", "RIGHT_BACK"] },
  MID: { label: "Pomocnicy", color: "emerald", positions: ["DEFENSIVE_MIDFIELDER", "CENTRAL_MIDFIELDER", "ATTACKING_MIDFIELDER", "LEFT_MIDFIELDER", "RIGHT_MIDFIELDER"] },
  FWD: { label: "Napastnicy", color: "amber", positions: ["STRIKER", "LEFT_WINGER", "RIGHT_WINGER"] },
}
```

### CoachGroup

- Same style, amber left-bar
- Coach rows: avatar + name + specialization + license level
- Badge "Zarzadza" (amber) if canManageEvents=true
- Owner always shown first with subtle crown/shield indicator

### PendingRequests

- Violet left-bar, count badge on section label
- Request rows: avatar + name + type badge (PROSBA=blue, ZAPROSZONY=amber)
- Inline accept (green) + reject (red) buttons for PENDING status
- INVITED shows "Oczekuje" muted label (no action buttons)

## 4. Pipeline (`recruitment/page.tsx`)

### Layout

```
Header                  — title + CSV/view-toggle buttons
ProgressBar             — proportional colored bar
StagePills              — scrollable filter tabs
PlayerCards[]           — filtered by active stage
MetricCard              — avg time to sign
```

### ProgressBar

- `flex gap-0.5 h-1 rounded-full overflow-hidden` (top of page)
- Segments proportional to count: blue (Radar), amber (Zaproszeni), violet (Po testach), emerald (Podpisani)
- Skips empty stages

### StagePills

- `flex gap-2 overflow-x-auto pb-2`
- Each pill: `bg-{color}/10 border border-{color}/20 text-{color} rounded-lg px-3 py-1.5 text-xs font-bold`
- Active pill: `bg-{color}/20 border-{color}/40` (stronger)
- Shows count: "Radar · 3"

### PlayerCards

- Shared `bg-card rounded-xl divide-y divide-border`
- Each row:
  - Avatar (40px circle) + Name (font-bold, Link) + meta pills (position, age, city) in `bg-muted rounded-md text-[10px]`
  - Inline action button: "→ Zapros" (amber), "→ Na testy" (violet), etc. — contextual per stage
  - Mini-timeline (optional, below name): colored dots + date + note text
- Empty stage: EmptyState with CTA to /transfers

### MetricCard

- `bg-card rounded-xl p-4 flex items-center gap-3`
- Timer icon in `bg-sky-500/10 rounded-lg` container
- Number (text-xl font-extrabold text-sky-400) + label

### View toggle

- List view (default, described above)
- Board view (existing Kanban, accessible via toggle button on desktop only)

## 5. Profil publiczny klubu (`clubs/[id]/page.tsx`)

### Layout change: 2-column → single-column with tabs

```
Hero                    — gradient banner + club identity
StatsBar                — W/R/P/Kadra inline
TabNavigation           — Mecze | Kadra | Nabory | Opinie | Info
TabContent              — conditional per active tab
```

### Hero

- `bg-gradient-to-br from-indigo-950 via-slate-900 to-sky-950` with dot-pattern
- Back button + action buttons (Wiadomosc, Obserwuj, Dolacz) top row
- Logo (64px rounded-2xl, semi-transparent border) + name (text-xl font-extrabold) + city
- Badge pills: liga (white/15), rating (amber), "Aktywny" (emerald) — conditional

### StatsBar

- `bg-card rounded-xl overflow-hidden flex divide-x divide-border`
- 4 cells: W (count), R (count), P (count), Kadra (count)
- Each: centered, number (text-xl font-extrabold), uppercase label (text-[10px])

### TabNavigation

- `bg-card rounded-lg p-1 flex gap-0.5`
- Active tab: `bg-muted rounded-md font-bold`
- Inactive: `text-muted-foreground font-semibold`
- 5 tabs: Mecze, Kadra, Nabory, Opinie, Info
- State managed by `useState<string>("matches")`

### Tab: Mecze

- Section "Nadchodzace" + "Ostatnie wyniki" (uppercase labels)
- Match rows in `bg-card rounded-xl divide-y`:
  - Date column (44px) | separator | HomeClub (logo+name) | score/vs | AwayClub (logo+name)
  - Score colored: `bg-emerald-500/20 text-emerald-400` (win), `bg-muted/30 text-muted-foreground` (draw), `bg-red-500/20 text-red-400` (loss)
  - Upcoming: show "vs" in muted instead of score

### Tab: Kadra

- Read-only version of squad view (same position groups, no actions)
- Only shows ACCEPTED members

### Tab: Nabory

- Active recruitment events (RECRUITMENT, TRYOUT, CAMP, CONTINUOUS_RECRUITMENT)
- Event cards with type badge, date, target info

### Tab: Opinie

- Average rating display (large stars + number)
- Review list: reviewer name + stars + comment + sparing title + date

### Tab: Info

- Club description (bio)
- Contact: email, phone, website (with icons)
- Join date
- League info with link to /leagues hierarchy

## 6. Shared Components (new/refactored)

### `MatchCard` (new)

Reusable match display for dashboard NextMatch, club profile matches tab, sparing detail:
- Props: homeClub, awayClub, date, score?, status
- Handles upcoming (vs) and completed (score with color) states

### `PositionGroup` (new)

Reusable for squad page and club profile Kadra tab:
- Props: label, color, players[], showActions?, onRemove?
- Read-only mode for public profile

### `StagePill` (new)

Pipeline stage filter pill:
- Props: label, count, color, active, onClick

### `StatsCell` (new)

Single stat in a row:
- Props: value, label, color?
- Used in dashboard StatsRow and club profile StatsBar

## 7. Files Changed

### Modified (8 files)

| File | Change |
|------|--------|
| `src/styles/globals.css` | Dark mode tokens update (4 CSS vars) |
| `src/app/(dashboard)/feed/page.tsx` | Club dashboard redesign (ClubHeaderCard, StatsRow, NextMatch, PendingAlerts) |
| `src/app/(dashboard)/squad/page.tsx` | Position-grouped layout, remove tabs |
| `src/app/(dashboard)/recruitment/page.tsx` | ProgressBar, StagePills, card redesign |
| `src/app/(public)/clubs/[id]/page.tsx` | Single-column with tabs, match cards, stats bar |
| `src/components/dashboard/club-sections.tsx` | Adapt to new dashboard patterns |
| `src/components/recruitment/recruitment-stats.tsx` | Align with new tokens |
| `src/components/layout/sidebar.tsx` | Token alignment |

### New (4 files)

| File | Purpose |
|------|---------|
| `src/components/match-card.tsx` | Reusable match display (upcoming/result) |
| `src/components/squad/position-group.tsx` | Position-grouped player list |
| `src/components/pipeline/stage-pill.tsx` | Stage filter pill |
| `src/components/stats-cell.tsx` | Single stat display cell |

## 8. What's NOT changing

- Sidebar structure and navigation links (only token colors)
- Bottom nav
- Business logic / tRPC routers / Prisma schema
- Other pages (sparings list, events list, messages, etc.) — future etap
- Light mode (stays as-is, dark is primary)
- Existing animations (ScrollReveal, hover-glow, page-enter)

## 9. Migration strategy

- No breaking changes — purely visual refactor
- No new dependencies
- No database migrations
- All changes in CSS + React components
- Existing E2E tests should pass (selectors unchanged where possible)
