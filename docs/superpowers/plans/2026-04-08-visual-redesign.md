# Visual Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform PilkaSport from flat X/Twitter-style to a dynamic, sports-themed UI with depth, gradients, and visual hierarchy.

**Architecture:** Theme Layer approach — changes concentrated in `globals.css` theme variables, shadcn/ui base components, and 4 domain components. Zero business logic changes.

**Tech Stack:** Tailwind CSS 4, shadcn/ui (CVA), Next.js Google Fonts, inline SVG

**Spec:** `docs/superpowers/specs/2026-04-08-visual-redesign-design.md`

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `src/styles/globals.css` | Modify | Theme variables, utility classes, font-display, sport-heading gradient update |
| `src/app/layout.tsx` | Modify | Import Rubik font, add CSS variable to `<html>` |
| `src/components/ui/card.tsx` | Modify | `rounded-2xl`, shadow, elevated background |
| `src/components/ui/button.tsx` | Modify | `rounded-lg`, gradient on default variant, shadow |
| `src/components/ui/dialog.tsx` | Modify | `rounded-[20px]` on DialogContent |
| `src/components/ui/sheet.tsx` | Modify | `rounded-t-[20px]` on bottom sheet |
| `src/components/ui/input.tsx` | Modify | `rounded-[10px]` |
| `src/components/sparings/sparing-card.tsx` | Modify | VS layout, gradient left border, larger crests |
| `src/components/recruitment/recruitment-stats.tsx` | Modify | Gradient tiles, larger numbers, icons |
| `src/components/calendar-view.tsx` | Modify | Gradient backgrounds on event days |
| `src/app/(dashboard)/feed/page.tsx` | Modify | ClubHeaderCard SVG overlay, larger crest, Rubik font |

---

### Task 1: Theme Variables & Utility Classes (`globals.css`)

**Files:**
- Modify: `src/styles/globals.css`

- [ ] **Step 1: Update `:root` color variables**

Change primary and ring from `#7c3aed` to `#8b5cf6`. Add card elevation variables.

```css
/* In :root block, change: */
--primary: #8b5cf6;
--ring: #8b5cf6;
--accent-foreground: #6d28d9;
--sidebar-accent-foreground: #6d28d9;
/* Add new variables: */
--card-elevated-bg: #ffffff;
--card-elevated-border: rgba(139, 92, 246, 0.08);
--shadow-card: 0 2px 8px rgba(0, 0, 0, 0.06);
--shadow-card-hover: 0 4px 24px rgba(139, 92, 246, 0.08);
--shadow-button-primary: 0 4px 16px rgba(139, 92, 246, 0.15);
```

- [ ] **Step 2: Update `.dark` color variables**

```css
/* In .dark block, change: */
--primary: #8b5cf6;
--ring: #8b5cf6;
--card: #0a0a0f;
--border: rgba(139, 92, 246, 0.10);
--input: rgba(139, 92, 246, 0.10);
/* Add new variables: */
--card-elevated-bg: #0a0a0f;
--card-elevated-border: rgba(139, 92, 246, 0.10);
--shadow-card: 0 2px 8px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(139, 92, 246, 0.05);
--shadow-card-hover: 0 4px 24px rgba(139, 92, 246, 0.15);
--shadow-button-primary: 0 4px 16px rgba(139, 92, 246, 0.3);
```

- [ ] **Step 3: Add `--font-display` to `@theme inline`**

```css
/* Inside @theme inline, add: */
--font-display: var(--font-rubik), sans-serif;
```

- [ ] **Step 4: Add utility classes after existing styles**

Append before the `@media (prefers-reduced-motion)` block:

```css
/* Sport gradient backgrounds for pipeline cards */
.sport-gradient-blue { background: linear-gradient(135deg, rgba(59,130,246,0.12), rgba(59,130,246,0.04)); }
.sport-gradient-amber { background: linear-gradient(135deg, rgba(245,158,11,0.12), rgba(245,158,11,0.04)); }
.sport-gradient-violet { background: linear-gradient(135deg, rgba(139,92,246,0.12), rgba(139,92,246,0.04)); }
.sport-gradient-green { background: linear-gradient(135deg, rgba(34,197,94,0.12), rgba(34,197,94,0.04)); }

/* Card elevation */
.sport-card-elevated {
  background: var(--card-elevated-bg);
  border: 1px solid var(--card-elevated-border);
  box-shadow: var(--shadow-card);
  transition: box-shadow 0.2s ease-out, border-color 0.2s ease-out;
}
.sport-card-elevated:hover {
  box-shadow: var(--shadow-card-hover);
  border-color: rgba(139, 92, 246, 0.2);
}
```

- [ ] **Step 5: Update `.sport-heading::after` gradient**

Change `#7c3aed` to `#8b5cf6` in the existing gradient:

```css
background: linear-gradient(to right, #8b5cf6, var(--sport-cyan));
```

- [ ] **Step 6: Update `.hover-glow-violet`**

Change `rgba(124,58,237,0.15)` to `rgba(139,92,246,0.20)`:

```css
.hover-glow-violet:hover { box-shadow: 0 0 24px rgba(139,92,246,0.20); }
```

- [ ] **Step 7: Verify dev server compiles without errors**

Run: `npm run dev` (or `pnpm dev`)
Expected: No CSS compilation errors, page loads

- [ ] **Step 8: Commit**

```bash
git add src/styles/globals.css
git commit -m "feat: update theme variables — violet-500, card elevation, gradients"
```

---

### Task 2: Rubik Font Import (`layout.tsx`)

**Files:**
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Add Rubik import and configure both fonts as CSS variables**

Change the font setup at the top of the file:

```typescript
import { Inter, Rubik } from "next/font/google";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-inter",
});

const rubik = Rubik({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-rubik",
});
```

- [ ] **Step 2: Update `<html>` className to use both font variables**

Change:
```tsx
<html lang="pl" className={inter.className} suppressHydrationWarning>
```
To:
```tsx
<html lang="pl" className={`${inter.variable} ${rubik.variable} ${inter.className}`} suppressHydrationWarning>
```

Note: `inter.className` stays for body font fallback. The `variable` props expose `--font-inter` and `--font-rubik` as CSS custom properties.

- [ ] **Step 3: Verify fonts load**

Run dev server, open browser DevTools → Elements → `<html>`. Confirm both `--font-inter` and `--font-rubik` CSS variables are present.

- [ ] **Step 4: Commit**

```bash
git add src/app/layout.tsx
git commit -m "feat: add Rubik display font alongside Inter"
```

---

### Task 3: Card Component (`card.tsx`)

**Files:**
- Modify: `src/components/ui/card.tsx:5-15`

- [ ] **Step 1: Update Card base classes**

Change the className in the `Card` function from:
```
"flex flex-col gap-6 rounded-none border bg-card py-6 text-card-foreground"
```
To:
```
"flex flex-col gap-6 rounded-2xl border border-[var(--card-elevated-border)] bg-card py-6 text-card-foreground shadow-[var(--shadow-card)] transition-[box-shadow,border-color]"
```

- [ ] **Step 2: Verify cards render with rounded corners and shadows**

Open any page with cards (e.g., `/feed`, `/sparings`). Confirm:
- Cards have `16px` border-radius
- Cards have subtle shadow in dark mode
- Cards have violet-tinted border

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/card.tsx
git commit -m "feat: card component — rounded-2xl, elevation shadow, violet border"
```

---

### Task 4: Button Component (`button.tsx`)

**Files:**
- Modify: `src/components/ui/button.tsx:7-8`

- [ ] **Step 1: Update base button rounding and default variant**

In the CVA base string (line 8), change `rounded-md` to `rounded-lg`.

Update the `default` variant from:
```
"bg-primary text-primary-foreground hover:bg-primary/90"
```
To:
```
"bg-gradient-to-br from-[#8b5cf6] to-[#7c3aed] text-primary-foreground shadow-[var(--shadow-button-primary)] hover:from-[#7c3aed] hover:to-[#6d28d9]"
```

- [ ] **Step 2: Update size variants rounding**

In all size variants that have `rounded-md`, change to `rounded-lg`:
- `xs`: `rounded-md` → `rounded-lg`
- `sm`: `rounded-md` → `rounded-lg`
- `lg`: `rounded-md` → `rounded-lg`

- [ ] **Step 3: Verify buttons render correctly**

Open any page with buttons. Confirm:
- Primary buttons show violet gradient
- All buttons have `8px` radius
- Shadow visible on primary buttons

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/button.tsx
git commit -m "feat: button — rounded-lg, gradient primary, shadow"
```

---

### Task 5: Dialog & Sheet Components

**Files:**
- Modify: `src/components/ui/dialog.tsx:63-64`
- Modify: `src/components/ui/sheet.tsx:62-63`

- [ ] **Step 1: Update DialogContent rounding**

In `DialogContent`, change `rounded-lg` to `rounded-[20px]` in the className string (line 64).

- [ ] **Step 2: Update SheetContent rounding for bottom sheets**

In `SheetContent`, for the `side === "bottom"` variant (line 71), add `rounded-t-[20px]` to the className. For `side === "right"` and `side === "left"`, these are full-height panels — no rounding change needed.

- [ ] **Step 3: Verify dialogs open with rounded corners**

Open any dialog (e.g., new sparing form, invite dialog). Confirm `20px` radius.

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/dialog.tsx src/components/ui/sheet.tsx
git commit -m "feat: dialog & sheet — rounded-[20px]"
```

---

### Task 6: Input Component

**Files:**
- Modify: `src/components/ui/input.tsx:11`

- [ ] **Step 1: Update input rounding**

Change `rounded-md` to `rounded-[10px]` in the className string.

- [ ] **Step 2: Commit**

```bash
git add src/components/ui/input.tsx
git commit -m "feat: input — rounded-[10px]"
```

---

### Task 7: Hero Section — ClubHeaderCard SVG Overlay

**Files:**
- Modify: `src/app/(dashboard)/feed/page.tsx:278-345` (ClubHeaderCard function)

- [ ] **Step 1: Replace the dot pattern overlay with SVG pitch overlay**

In `ClubHeaderCard`, replace the existing dot pattern `<div>` (lines 301-308) with an inline SVG pitch:

```tsx
{/* SVG pitch overlay */}
<svg
  className="absolute inset-0 w-full h-full opacity-[0.04]"
  viewBox="0 0 400 200"
  fill="none"
  preserveAspectRatio="xMidYMid slice"
>
  <rect x="10" y="10" width="380" height="180" stroke="white" strokeWidth="1.5" rx="4" />
  <line x1="200" y1="10" x2="200" y2="190" stroke="white" strokeWidth="1" />
  <circle cx="200" cy="100" r="40" stroke="white" strokeWidth="1" />
  <rect x="10" y="50" width="60" height="100" stroke="white" strokeWidth="1" />
  <rect x="330" y="50" width="60" height="100" stroke="white" strokeWidth="1" />
  <rect x="10" y="70" width="25" height="60" stroke="white" strokeWidth="1" />
  <rect x="365" y="70" width="25" height="60" stroke="white" strokeWidth="1" />
</svg>
{/* Gradient glow */}
<div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.15),transparent_70%)]" />
```

- [ ] **Step 2: Update the gradient background**

Change the outer div's className from:
```
"bg-gradient-to-r from-indigo-950 to-slate-900 rounded-xl p-4 relative overflow-hidden mb-3"
```
To:
```
"bg-gradient-to-br from-[#0a0a1a] via-[#12061f] to-[#0a0a1a] rounded-2xl p-5 relative overflow-hidden mb-3"
```

- [ ] **Step 3: Enlarge club crest**

Change the logo container from `h-14 w-14` to `h-[72px] w-[72px]`, and update background:

```tsx
<div className="h-[72px] w-[72px] shrink-0 rounded-2xl overflow-hidden bg-gradient-to-br from-[#8b5cf6] to-[#6d28d9] flex items-center justify-center shadow-[0_4px_20px_rgba(139,92,246,0.3)]">
```

Change the fallback text from `text-lg` to `text-2xl`.

- [ ] **Step 4: Update club name typography**

Change the club name `<p>` from:
```
"text-lg font-extrabold text-white leading-tight line-clamp-1"
```
To:
```
"text-[26px] font-bold text-white leading-tight line-clamp-1 tracking-[-0.5px]"
```

Add `style={{ fontFamily: 'var(--font-rubik)' }}` to apply Rubik font.

Change the subtitle color from `text-white/60` to `text-[#a78bfa]`.

- [ ] **Step 5: Verify hero section**

Navigate to `/feed` as a club user. Confirm:
- SVG pitch lines visible at ~4% opacity
- Violet gradient glow in top-right
- Large crest (72px) with violet gradient background
- Club name in Rubik font, 26px
- Subtitle in light violet

- [ ] **Step 6: Commit**

```bash
git add src/app/\(dashboard\)/feed/page.tsx
git commit -m "feat: hero section — SVG pitch overlay, large crest, Rubik headings"
```

---

### Task 8: Sparing Card Redesign

**Files:**
- Modify: `src/components/sparings/sparing-card.tsx:62-141`

- [ ] **Step 1: Update the card container classes**

Change the outer card `<div>` className (line 64) from:
```
"h-full border border-border bg-card p-5 transition-all hover:bg-white/[0.03] hover:border-sport-cyan/30 border-l-2 border-l-sport-cyan"
```
To:
```
"h-full rounded-2xl bg-card p-5 transition-all hover:border-[rgba(139,92,246,0.2)] hover:shadow-[var(--shadow-card-hover)] border border-[rgba(6,182,212,0.12)] shadow-[var(--shadow-card)] relative overflow-hidden"
```

- [ ] **Step 2: Add gradient left border via pseudo-element**

Add a `::before` pseudo-element for the gradient left border. Wrap the card content and add this styled div at the top of the card's children:

```tsx
{/* Gradient left border */}
<div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-sport-cyan to-primary rounded-l-2xl" />
```

Add `pl-3` extra padding to account for the border.

- [ ] **Step 3: Update club logo section to VS layout**

Replace the existing club logo section (lines 67-88) with a VS layout showing both club crests:

```tsx
{/* VS layout — club crests */}
<div className="mb-3 flex items-center gap-3">
  <div className="flex items-center gap-2.5">
    <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-[#1a1a2e] to-secondary border border-[rgba(139,92,246,0.15)]">
      {sparing.club.logoUrl ? (
        <img src={sparing.club.logoUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        <span className="text-sm font-bold text-muted-foreground">
          {sparing.club.name.slice(0, 2).toUpperCase()}
        </span>
      )}
    </div>
    <span className="text-base text-muted-foreground font-light">vs</span>
    <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-[#1a1a2e] to-secondary border border-[rgba(139,92,246,0.15)]">
      <span className="text-sm font-bold text-muted-foreground">?</span>
    </div>
  </div>
  <div className="min-w-0 flex-1">
    <h3 className="text-[15px] font-semibold leading-snug text-foreground group-hover:text-primary transition-colors line-clamp-2" style={{ fontFamily: 'var(--font-rubik)' }}>
      {sparing.title}
    </h3>
    <p className="text-[11px] text-muted-foreground mt-0.5">{sparing.club.name}</p>
  </div>
  {showFavorite && (
    <div className="shrink-0" onClick={(e) => e.preventDefault()}>
      <FavoriteButton sparingOfferId={sparing.id} initialFavorited={favorited ?? false} />
    </div>
  )}
</div>
```

- [ ] **Step 4: Remove the duplicate title `<h3>`**

The old title `<h3>` at line 91-93 is now inside the VS layout. Remove it.

- [ ] **Step 5: Update badge styling**

Change the badge container badges to use gradient backgrounds. For the level badge, add `bg-gradient-to-r from-sport-cyan/15 to-sport-cyan/5` as a className override:

```tsx
<Badge variant="secondary" className={`text-[11px] font-medium rounded-lg ${SPARING_LEVEL_COLORS[sparing.level]}`}>
```

For the region badge:
```tsx
<Badge variant="outline" className="text-[11px] font-normal text-muted-foreground gap-1 rounded-lg">
```

- [ ] **Step 6: Verify sparing cards**

Navigate to `/sparings` or `/feed`. Confirm:
- Cards have rounded corners (16px)
- Gradient left border (cyan → violet)
- VS layout with two crest placeholders (44px)
- Title in Rubik font
- Subtle card shadow

- [ ] **Step 7: Commit**

```bash
git add src/components/sparings/sparing-card.tsx
git commit -m "feat: sparing card — VS layout, gradient border, rounded-2xl"
```

---

### Task 9: Recruitment Pipeline Redesign

**Files:**
- Modify: `src/components/recruitment/recruitment-stats.tsx:9-14,41-56`

- [ ] **Step 1: Update STAGE_CONFIG with gradient classes and emoji icons**

Replace the existing `STAGE_CONFIG` array (lines 9-14):

```typescript
const STAGE_CONFIG = [
  { key: "watching", label: "Na radarze", icon: Eye, color: "text-blue-400", bg: "bg-blue-500/10", gradientClass: "sport-gradient-blue", borderColor: "border-blue-500/15" },
  { key: "invited", label: "Zaproszeni", icon: FileText, color: "text-amber-400", bg: "bg-amber-500/10", gradientClass: "sport-gradient-amber", borderColor: "border-amber-500/15" },
  { key: "afterTryout", label: "Po testach", icon: UserCheck, color: "text-violet-400", bg: "bg-violet-500/10", gradientClass: "sport-gradient-violet", borderColor: "border-violet-500/15" },
  { key: "signed", label: "Podpisani", icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10", gradientClass: "sport-gradient-green", borderColor: "border-emerald-500/15" },
] as const;
```

- [ ] **Step 2: Update the pipeline tile layout**

Change the flex container (line 41) from:
```tsx
<div className="flex flex-wrap gap-3">
```
To:
```tsx
<div className="grid grid-cols-2 gap-3">
```

- [ ] **Step 3: Update individual tile rendering**

Replace the tile rendering (lines 43-56) with gradient tiles:

```tsx
{STAGE_CONFIG.map(({ key, label, icon: Icon, color, bg, gradientClass, borderColor }) => {
  const value = (stats as Record<string, number>)[key] ?? 0;
  return (
    <Link key={key} href="/recruitment">
      <div className={`${gradientClass} rounded-2xl border ${borderColor} p-4 transition-all hover:border-primary/40`}>
        <div className="flex items-center gap-1.5 mb-2">
          <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${bg}`}>
            <Icon className={`h-3.5 w-3.5 ${color}`} />
          </div>
          <span className={`text-[11px] font-medium ${color}`}>{t(label)}</span>
        </div>
        <span className={`text-[32px] font-extrabold tabular-nums leading-none ${color}`}>
          {value}
        </span>
      </div>
    </Link>
  );
})}
```

- [ ] **Step 4: Update avgTime tile to match new design**

The existing `avgTime` tile (after the mapped stages) also needs the gradient treatment. Update its rendering to match:

```tsx
{avgTime && (
  <div className="sport-gradient-green rounded-2xl border border-emerald-500/15 p-4">
    <div className="flex items-center gap-1.5 mb-2">
      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10">
        <Timer className="h-3.5 w-3.5 text-emerald-400" />
      </div>
      <span className="text-[11px] font-medium text-emerald-400">{t("Śr. do podpisania")}</span>
    </div>
    <span className="text-[32px] font-extrabold tabular-nums leading-none text-emerald-400">
      {avgTime.avgDays}d
    </span>
  </div>
)}
```

Note: With 4 pipeline tiles + 1 avgTime tile in a 2-column grid, the avgTime sits alone in row 3. This is fine visually — it's a summary metric, separate from the pipeline stages.

- [ ] **Step 5: Verify recruitment pipeline**

Navigate to `/feed` as a club user with recruitment data. Confirm:
- 2x2 grid layout (+ avgTime tile in row 3 if present)
- Each tile has gradient background matching its color
- Large numbers (32px, extrabold)
- Icon + label in header
- Rounded corners (16px)

- [ ] **Step 6: Commit**

```bash
git add src/components/recruitment/recruitment-stats.tsx
git commit -m "feat: recruitment pipeline — gradient tiles, 2x2 grid, large numbers"
```

---

### Task 10: Calendar Event Day Highlighting

**Files:**
- Modify: `src/components/calendar-view.tsx:237-274`

- [ ] **Step 1: Create a helper function for day gradient styles**

Add this helper before the `CalendarView` component:

```typescript
function getDayGradientStyle(items: CalendarItem[]): string {
  if (items.length === 0) return "";
  const type = items[0].type;
  switch (type) {
    case "sparing":
      return "bg-gradient-to-br from-cyan-500/15 to-cyan-500/5 border border-cyan-500/25 shadow-[0_0_8px_rgba(6,182,212,0.1)] rounded-[10px]";
    case "tournament":
      return "bg-gradient-to-br from-orange-500/15 to-orange-500/5 border border-orange-500/25 shadow-[0_0_8px_rgba(249,115,22,0.1)] rounded-[10px]";
    case "event":
      return "bg-gradient-to-br from-violet-500/15 to-violet-500/5 border border-violet-500/25 shadow-[0_0_8px_rgba(139,92,246,0.1)] rounded-[10px]";
    default:
      return "";
  }
}
```

- [ ] **Step 2: Apply gradient to calendar day cells**

In the day cell rendering (line 242-244), update the className to include the gradient:

Change from:
```tsx
className={`bg-background min-h-[80px] p-1 ${isToday ? "ring-2 ring-primary ring-inset" : ""}`}
```
To:
```tsx
className={`bg-background min-h-[80px] p-1 ${isToday ? "ring-2 ring-primary ring-inset" : ""} ${getDayGradientStyle(dayItems)}`}
```

- [ ] **Step 3: Verify calendar highlighting**

Navigate to `/calendar`. Confirm:
- Days with sparings have cyan gradient background
- Days with events have violet gradient background
- Days with tournaments have orange gradient background
- Gradient is subtle (15% → 5% opacity)
- Colored border and glow on event days

- [ ] **Step 4: Commit**

```bash
git add src/components/calendar-view.tsx
git commit -m "feat: calendar — gradient highlights on event days"
```

---

### Task 11: Final Visual Verification & Heading Font Application

**Files:**
- Modify: `src/styles/globals.css` (sport-heading font)

- [ ] **Step 1: Add Rubik to `.sport-heading`**

In the existing `.sport-heading` class, add the font-family:

```css
.sport-heading {
  font-family: var(--font-rubik), sans-serif;
  font-weight: 900;
  letter-spacing: -0.02em;
  text-transform: uppercase;
}
```

- [ ] **Step 2: Full visual pass**

Navigate through all major pages and verify:
- `/feed` — Hero card, stats, recruitment pipeline, feed cards
- `/sparings` — Sparing cards in grid
- `/calendar` — Calendar with highlighted days
- `/recruitment` — Pipeline tiles
- Any dialog (click "Nowy sparing") — rounded corners
- Mobile bottom sheet — rounded top corners
- Light mode toggle — verify shadows and borders work

- [ ] **Step 3: Commit**

```bash
git add src/styles/globals.css
git commit -m "feat: sport-heading — Rubik font family"
```

- [ ] **Step 4: Final commit with all changes verified**

```bash
git log --oneline -10
```

Verify 10 clean commits covering: theme vars, Rubik font, card, button, dialog/sheet, input, hero, sparing card, recruitment, calendar, sport-heading.
