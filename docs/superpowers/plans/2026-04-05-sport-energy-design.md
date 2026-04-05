# Sport Energy Design — Kolorystyka & Mikro-interakcje

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add sporty visual energy (cyan/yellow accents, dynamic typography, sport lines) and micro-interactions (heart bounce, sign-up animation, countdown pulse, badge slide-in, skeleton transition) to PilkaSport.

**Architecture:** All changes are CSS-level or component-state-level. New CSS custom properties + keyframes in `globals.css`, then targeted edits to existing components. No new files, no new dependencies.

**Tech Stack:** Tailwind CSS 4, CSS custom properties, CSS keyframes, React state for interactive animations.

---

### Task 1: Add cyan/yellow CSS variables and new keyframes to globals.css

**Files:**
- Modify: `src/styles/globals.css`

- [ ] **Step 1: Add sport accent CSS variables to `:root` and `.dark`**

In `:root`, before the closing `}` (after `--sidebar-muted-foreground: #71717a;`), add:

```css
--sport-cyan: #06B6D4;
--sport-yellow: #FACC15;
```

In `.dark`, before the closing `}` (after `--sidebar-muted-foreground: #6b7280;`), add:

```css
--sport-cyan: #22D3EE;
--sport-yellow: #FDE047;
```

- [ ] **Step 2: Add sport accent color mappings in `@theme inline`**

After `--color-sidebar-muted-foreground` (before `--radius`) in `@theme inline`, add:

```css
--color-sport-cyan: var(--sport-cyan);
--color-sport-yellow: var(--sport-yellow);
```

- [ ] **Step 3: Add new keyframe animations in `@theme inline`**

After the existing `pulse-dot` keyframes block, add:

```css
@keyframes heart-bounce {
  0% { transform: scale(1); }
  25% { transform: scale(1.3); }
  50% { transform: scale(0.9); }
  75% { transform: scale(1.15); }
  100% { transform: scale(1); }
}
@keyframes check-pop {
  0% { transform: scale(0); opacity: 0; }
  50% { transform: scale(1.2); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}
@keyframes badge-slide-in {
  from { opacity: 0; transform: translateX(8px) scale(0.8); }
  to { opacity: 1; transform: translateX(0) scale(1); }
}
@keyframes countdown-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
@keyframes skeleton-fade-out {
  from { opacity: 1; }
  to { opacity: 0; }
}
```

And add animation custom properties inside `@theme inline`, after `--animate-scale-in` (line 37):

```css
--animate-heart-bounce: heart-bounce 0.4s ease-out;
--animate-check-pop: check-pop 0.3s ease-out;
--animate-badge-slide-in: badge-slide-in 0.3s ease-out;
--animate-countdown-pulse: countdown-pulse 1.5s ease-in-out infinite;
```

- [ ] **Step 4: Add hover-glow-cyan utility and sport-line utility**

After existing `.hover-glow-pink` line, add:

```css
.hover-glow-cyan:hover { box-shadow: 0 0 24px rgba(6,182,212,0.20); }
.hover-glow-yellow:hover { box-shadow: 0 0 24px rgba(250,204,21,0.15); }
```

After `.page-enter` block, add:

```css
/* Sport card accent line */
.sport-card-line {
  border-top: 2px solid var(--sport-cyan);
}

/* Gradient stripe under section headings */
.sport-heading::after {
  content: "";
  display: block;
  margin-top: 0.5rem;
  height: 3px;
  width: 3rem;
  border-radius: 2px;
  background: linear-gradient(to right, #7c3aed, var(--sport-cyan));
}

/* Section heading typography */
.sport-heading {
  font-weight: 900;
  letter-spacing: -0.02em;
  text-transform: uppercase;
}

/* Heart bounce */
.heart-bounce {
  animation: heart-bounce 0.4s ease-out;
}

/* Check pop for sign-up confirmation */
.check-pop {
  animation: check-pop 0.3s ease-out;
}

/* Badge slide in */
.badge-slide-in {
  animation: badge-slide-in 0.3s ease-out;
}

/* Countdown urgent pulse (< 24h) */
.countdown-urgent {
  animation: countdown-pulse 1.5s ease-in-out infinite;
}

/* Skeleton fade-out transition */
.skeleton-reveal {
  animation: skeleton-fade-out 0.3s ease-out reverse;
}
```

- [ ] **Step 5: Add reduced motion overrides for new animations**

In the existing `@media (prefers-reduced-motion: reduce)` block, add:

```css
.heart-bounce, .check-pop, .badge-slide-in, .countdown-urgent, .skeleton-reveal { animation: none; }
```

- [ ] **Step 6: Verify changes compile**

Run: `cd /c/Users/piotr/CascadeProjects/pilkarski && npx next build --no-lint 2>&1 | head -20`
Expected: No CSS compilation errors.

- [ ] **Step 7: Commit**

```bash
git add src/styles/globals.css
git commit -m "feat: add sport energy CSS — cyan/yellow accents, keyframes, utilities"
```

---

### Task 2: CTA gradient buttons — violet→cyan

**Files:**
- Modify: `src/components/ui/button.tsx`

- [ ] **Step 1: Add `sport` variant to buttonVariants**

In the `variant` object inside `buttonVariants`, after the `link` variant, add:

```typescript
sport:
  "bg-gradient-to-r from-primary to-sport-cyan text-white hover:from-primary/90 hover:to-sport-cyan/90 shadow-md hover:shadow-lg hover:shadow-sport-cyan/20",
```

- [ ] **Step 2: Verify build compiles**

Run: `cd /c/Users/piotr/CascadeProjects/pilkarski && npx next build --no-lint 2>&1 | head -20`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/button.tsx
git commit -m "feat: add sport button variant with violet→cyan gradient"
```

---

### Task 3: Heart favorite bounce animation

**Files:**
- Modify: `src/components/favorite-button.tsx`

- [ ] **Step 1: Add bounce state to FavoriteButton**

Add a `bouncing` state and trigger it on toggle success. Replace the entire component:

In the `FavoriteButton` component, add after `const [favorited, setFavorited] = useState(initialFavorited);`:

```typescript
const [bouncing, setBouncing] = useState(false);
```

In the `onSuccess` callback of `toggle`, add before `setFavorited(result.favorited);`:

```typescript
if (result.favorited) {
  setBouncing(true);
  setTimeout(() => setBouncing(false), 400);
}
```

- [ ] **Step 2: Apply bounce class to SVG**

Change the SVG className from:

```typescript
className={`h-5 w-5 ${favorited ? "text-destructive" : "text-muted-foreground"}`}
```

to:

```typescript
className={`h-5 w-5 ${favorited ? "text-destructive" : "text-muted-foreground"} ${bouncing ? "heart-bounce" : ""}`}
```

- [ ] **Step 3: Verify build**

Run: `cd /c/Users/piotr/CascadeProjects/pilkarski && npx next build --no-lint 2>&1 | head -20`

- [ ] **Step 4: Commit**

```bash
git add src/components/favorite-button.tsx
git commit -m "feat: add heart bounce animation on favorite toggle"
```

---

### Task 4: Sparing card — sport line + cyan hover + countdown pulse

**Files:**
- Modify: `src/components/sparings/sparing-card.tsx`

- [ ] **Step 1: Add sport-card-line and hover-glow-cyan to card div**

Change the card wrapper div classes from:

```
h-full rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/30 hover:shadow-sm
```

to:

```
h-full rounded-xl border border-border bg-card p-5 transition-all hover-glow-cyan sport-card-line hover:border-sport-cyan/30
```

- [ ] **Step 2: Add countdown-urgent class for < 24h countdown**

The `getCountdown` function returns `"za chwilę"` or `"za Xh"` when < 24h. Add an `isUrgent` flag.

After the `const countdown = getCountdown(sparing.matchDate);` line, add:

```typescript
const isUrgent = countdown !== null && (countdown === "za chwilę" || countdown.endsWith("h"));
```

Then change the countdown span from:

```tsx
<span className="ml-auto shrink-0 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[12px] font-semibold text-emerald-600 dark:text-emerald-400">
```

to:

```tsx
<span className={`ml-auto shrink-0 rounded-md px-2 py-0.5 text-[12px] font-semibold ${isUrgent ? "bg-sport-yellow/10 text-sport-yellow countdown-urgent" : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"}`}>
```

- [ ] **Step 3: Verify build**

Run: `cd /c/Users/piotr/CascadeProjects/pilkarski && npx next build --no-lint 2>&1 | head -20`

- [ ] **Step 4: Commit**

```bash
git add src/components/sparings/sparing-card.tsx
git commit -m "feat: sparing card — sport line, cyan hover glow, countdown pulse"
```

---

### Task 5: Apply button — "Aplikuj" → "Wysłano ✓" animation

**Files:**
- Modify: `src/app/(dashboard)/sparings/[id]/_components/apply-form.tsx`

- [ ] **Step 1: Add applied state**

After the `const [showCounterDate, setShowCounterDate] = useState(false);` line, add:

```typescript
const [justApplied, setJustApplied] = useState(false);
```

- [ ] **Step 2: Set justApplied on success**

In the `onSuccess` callback of `applyMutation`, add before `onApplied();`:

```typescript
setJustApplied(true);
```

- [ ] **Step 3: Change the apply Button to show animated state**

Replace the Button element:

```tsx
<Button onClick={handleApply} disabled={applyMutation.isPending} className="gap-1.5">
  <Send className="h-4 w-4" />
  {applyMutation.isPending ? "Wysyłanie..." : "Aplikuj"}
</Button>
```

with:

```tsx
<Button
  onClick={handleApply}
  disabled={applyMutation.isPending || justApplied}
  variant={justApplied ? "secondary" : "default"}
  className={`gap-1.5 ${justApplied ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : ""}`}
>
  {justApplied ? (
    <>
      <svg className="h-4 w-4 check-pop" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
      Wysłano
    </>
  ) : (
    <>
      <Send className="h-4 w-4" />
      {applyMutation.isPending ? "Wysyłanie..." : "Aplikuj"}
    </>
  )}
</Button>
```

- [ ] **Step 4: Verify build**

Run: `cd /c/Users/piotr/CascadeProjects/pilkarski && npx next build --no-lint 2>&1 | head -20`

- [ ] **Step 5: Commit**

```bash
git add src/app/\(dashboard\)/sparings/\[id\]/_components/apply-form.tsx
git commit -m "feat: apply button — animated Wysłano ✓ state after submission"
```

---

### Task 6: Event apply button — "Zgłoś się" → "Zgłoszono ✓" animation

**Files:**
- Modify: `src/app/(dashboard)/events/[id]/page.tsx`

- [ ] **Step 1: Add justApplied state**

Find the event detail page component. Add a `justApplied` state near other state declarations:

```typescript
const [justApplied, setJustApplied] = useState(false);
```

- [ ] **Step 2: Set justApplied on applyMut success**

In `applyMut`'s `onSuccess` callback, add before `toast.success("Zgłoszenie wysłane");`:

```typescript
setJustApplied(true);
```

- [ ] **Step 3: Update the apply Button**

Replace:

```tsx
<Button onClick={() => applyMut.mutate({ eventId: id, message: message || undefined })} disabled={applyMut.isPending} className="gap-1.5">
  <Send className="h-4 w-4" />
  {applyMut.isPending ? "Wysyłanie..." : "Zgłoś się"}
</Button>
```

with:

```tsx
<Button
  onClick={() => applyMut.mutate({ eventId: id, message: message || undefined })}
  disabled={applyMut.isPending || justApplied}
  variant={justApplied ? "secondary" : "default"}
  className={`gap-1.5 ${justApplied ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : ""}`}
>
  {justApplied ? (
    <>
      <svg className="h-4 w-4 check-pop" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
      Zgłoszono
    </>
  ) : (
    <>
      <Send className="h-4 w-4" />
      {applyMut.isPending ? "Wysyłanie..." : "Zgłoś się"}
    </>
  )}
</Button>
```

- [ ] **Step 4: Verify build**

Run: `cd /c/Users/piotr/CascadeProjects/pilkarski && npx next build --no-lint 2>&1 | head -20`

- [ ] **Step 5: Commit**

```bash
git add src/app/\(dashboard\)/events/\[id\]/page.tsx
git commit -m "feat: event apply button — animated Zgłoszono ✓ state"
```

---

### Task 7: Navigation — cyan active indicator

**Files:**
- Modify: `src/components/layout/sidebar.tsx`
- Modify: `src/components/layout/bottom-nav.tsx`

- [ ] **Step 1: Update sidebar active indicator gradient**

In `sidebar.tsx`, change the active indicator div gradient from:

```
bg-gradient-to-b from-violet-400 to-sky-400
```

to:

```
bg-gradient-to-b from-primary to-sport-cyan
```

- [ ] **Step 2: Update sidebar active icon color**

Change active icon color from:

```
text-violet-400
```

to:

```
text-sport-cyan
```

- [ ] **Step 3: Update bottom-nav active color**

In `bottom-nav.tsx`, change active text color from:

```
text-primary
```

to:

```
text-sport-cyan
```

- [ ] **Step 4: Update bottom-nav notification badge**

In `bottom-nav.tsx`, change the full badge span className. Replace:

```tsx
<span className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">
```

with:

```tsx
<span className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-sport-cyan px-1 text-[9px] font-bold text-white">
```

- [ ] **Step 5: Verify build**

Run: `cd /c/Users/piotr/CascadeProjects/pilkarski && npx next build --no-lint 2>&1 | head -20`

- [ ] **Step 6: Commit**

```bash
git add src/components/layout/sidebar.tsx src/components/layout/bottom-nav.tsx
git commit -m "feat: navigation — cyan active indicator and notification badges"
```

---

### Task 8: Hero section — cyan & yellow blobs

**Files:**
- Modify: `src/app/page.tsx` (landing page)

- [ ] **Step 1: Update animated blob colors**

Change the sky blob from:

```
bg-sky-500/[0.10]
```

to:

```
bg-[#06B6D4]/[0.12]
```

Change the emerald blob from:

```
bg-emerald-500/[0.08]
```

to:

```
bg-[#FACC15]/[0.06]
```

- [ ] **Step 2: Update hero CTA gradient to include cyan**

The primary CTA link already uses `from-violet-500 to-sky-500`. Update hover shadow to cyan:

Change:

```
hover:shadow-[0_0_24px_rgba(139,92,246,0.3)]
```

to:

```
hover:shadow-[0_0_24px_rgba(6,182,212,0.3)]
```

- [ ] **Step 3: Add sport-heading class to section headings**

Add `sport-heading` class to the "Funkcje" and "Jak to działa" section h2 elements. Also to "Dla kogo" and "Szukasz rywala" h2.

Change each `<h2 className="text-2xl font-bold tracking-tight sm:text-3xl">` to `<h2 className="text-2xl font-bold tracking-tight sm:text-3xl sport-heading">` in sections: Funkcje, Jak to działa, Dla kogo, Szukasz rywala.

- [ ] **Step 4: Update stats numbers to cyan**

Change:

```
text-violet-400 sm:text-4xl
```

to:

```
text-sport-cyan sm:text-4xl
```

- [ ] **Step 5: Update bottom CTA glow**

Change:

```
from-violet-500/[0.04]
```

to:

```
from-[#06B6D4]/[0.06]
```

- [ ] **Step 6: Verify build**

Run: `cd /c/Users/piotr/CascadeProjects/pilkarski && npx next build --no-lint 2>&1 | head -20`

- [ ] **Step 7: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: hero — cyan/yellow blobs, sport headings, cyan stat numbers"
```

---

### Task 9: Skeleton fade-in transition

**Files:**
- Modify: `src/components/ui/skeleton.tsx`

- [ ] **Step 1: Add skeleton-reveal class**

Change the Skeleton component className from:

```
"animate-pulse rounded-md bg-accent"
```

to:

```
"animate-pulse rounded-md bg-accent skeleton-reveal"
```

This adds a subtle fade-in when skeletons first appear, making the transition from skeleton to real content feel smoother.

- [ ] **Step 2: Verify build**

Run: `cd /c/Users/piotr/CascadeProjects/pilkarski && npx next build --no-lint 2>&1 | head -20`

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/skeleton.tsx
git commit -m "feat: skeleton — smooth fade-in reveal transition"
```

---

### Task 10: Final verification

- [ ] **Step 1: Full build check**

Run: `cd /c/Users/piotr/CascadeProjects/pilkarski && npx next build 2>&1 | tail -30`
Expected: Build succeeds with no errors.

- [ ] **Step 2: Visual check list**

Manually verify these in the browser (`npm run dev`):
- Landing page: cyan/yellow blobs visible, sport-heading uppercase with gradient stripe, cyan stat numbers
- Sidebar: cyan active indicator line, cyan active icon
- Bottom nav (mobile): cyan active text, cyan notification badge
- Sparing cards: cyan top border, cyan hover glow, pulsing countdown for < 24h
- Favorite button: heart bounces on toggle
- Apply forms: "Wysłano ✓" / "Zgłoszono ✓" with check-pop animation
- Skeletons: smooth fade-in appearance
- Dark mode: all accents look good (slightly brighter cyan/yellow variants)
- Reduced motion: no animations play
