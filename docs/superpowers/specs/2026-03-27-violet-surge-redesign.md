# Violet Surge — PilkaSport Visual Redesign

## Overview

Redesign wizualny platformy PilkaSport z emerald/black na violet-sky gradient z bold sports identity. Zakres: design tokens, landing page, dashboard (feed + sidebar). Efekty: scroll reveal, hover glow, gradient borders, page transitions, animated hero, micro-interactions.

## Color Palette

### Dark mode (primary)
| Token | Value | Usage |
|-------|-------|-------|
| `--primary` | `#7c3aed` | CTA, active states, links |
| `--primary-hover` | `#6d28d9` | Hover states |
| `--primary-gradient` | `#7c3aed → #0ea5e9` | Hero, gradient buttons, accent borders |
| `--background` | `#0c0a1a` | Page background |
| `--card` | `#131025` | Card backgrounds |
| `--border` | `#1e1a2e` | Default borders |
| `--muted-foreground` | `#8888a0` | Secondary text |
| `--accent-emerald` | `#10b981` | Sparingi, success states |
| `--accent-pink` | `#f472b6` | Notifications, badges |
| `--accent-amber` | `#f59e0b` | Events, warnings |
| `--accent-sky` | `#0ea5e9` | Trainings, links |

### Light mode
Same hue family but lighter: violet-50 bg, violet-600 primary, violet-100 cards. Keep existing light mode structure, swap emerald → violet.

### Sidebar
| Token | Value |
|-------|-------|
| `--sidebar` | `#0e0b1e` |
| `--sidebar-accent` | `rgba(124,58,237,0.15)` |
| `--sidebar-accent-foreground` | `#a78bfa` |

## Animations & Effects

### 1. Scroll Reveal
- CSS class `.reveal` — default state: `opacity:0; transform:translateY(20px)`
- On intersection (Intersection Observer): add `.revealed` → `opacity:1; transform:translateY(0)` with `transition: 0.6s ease-out`
- Staggered: `.reveal-delay-1` through `.reveal-delay-4` (100ms increments)
- Client component `ScrollReveal` wrapping children, using `useEffect` + `IntersectionObserver`

### 2. Hover Glow & Lift
- Cards: `transition: transform 0.2s, box-shadow 0.2s`
- Hover: `transform: translateY(-2px); box-shadow: 0 0 20px rgba(124,58,237,0.15)`
- Per-type glow colors: violet (sparingi), sky (events), emerald (transfers), pink (community)
- CSS utility classes: `.hover-glow-violet`, `.hover-glow-sky`, `.hover-glow-emerald`, `.hover-glow-pink`

### 3. Gradient Borders
- `@keyframes gradient-rotate` — rotates `conic-gradient` background of `::before` pseudo-element
- Applied via `.gradient-border` class on key elements (CTA buttons, hero card, featured items)
- Colors: violet → sky → emerald → violet (360deg rotation over 3s)
- Implementation: padding trick with pseudo-element behind, `border-radius` inheritance

### 4. Page Transitions
- CSS `@starting-style` + `@view-transition` if supported (Next.js 16)
- Fallback: `.page-enter` class with `opacity:0 → 1` + `translateY(8px) → 0` on mount
- Applied in dashboard layout component

### 5. Animated Hero Background
- 3 blur blobs: violet (#7c3aed), sky (#0ea5e9), emerald (#10b981)
- Each blob: `position:absolute`, `border-radius:50%`, `filter:blur(80px)`, `opacity:0.15`
- `@keyframes blob-1` / `blob-2` / `blob-3` — different translate paths, 8-12s duration, infinite
- Container: `overflow:hidden; position:relative`

### 6. Micro-interactions
- Notification badge: `@keyframes pulse-dot` — scale 1→1.2→1, 2s infinite
- Loading state: custom spinner with gradient (violet→sky)
- Button press: `active:scale(0.97)` (current: 0.98)
- Icon hover: `transition: transform 0.2s; hover: rotate(5deg) scale(1.1)` on nav icons

## Landing Page Changes

### Hero Section
- Background: `#050505` → `#0c0a1a` with 3 animated blur blobs
- Headline: gradient text `violet → sky` (was emerald)
- Pill badge: violet bg with pulse animation
- CTA primary: gradient button violet→sky with gradient-border effect
- CTA secondary: white outline with hover fill

### Stats Bar
- Numbers: `text-violet-400` (was foreground)
- Separator dots between stats

### Features Grid
- Card hover: glow effect per card (different accent color per feature)
- Icons in colored circles: violet, sky, emerald, amber

### How It Works
- Step numbers: gradient violet→sky
- Cards in bordered container (keep current pattern)

### Role Cards (Dla kogo)
- Club card: emerald accent (piłkarski charakter)
- Player card: violet accent
- Coach card: sky accent
- Skew decorative element stays, colors updated

### Bottom CTA
- Gradient button matching hero CTA

## Dashboard Changes

### Sidebar
- Background: `#0e0b1e`
- Logo "PS": gradient violet→sky background
- Active nav item: violet glow left-border + violet/15 bg
- Hover: subtle violet highlight
- User section: violet avatar ring

### Feed Page
- Stats bar pills: gradient bg instead of plain border
- Feed cards: hover lift + type-specific glow
  - Sparing: violet glow
  - Event: sky glow
  - Transfer: emerald glow
  - Community: pink glow
- Quick actions CTA: gradient violet→sky button
- Empty state: violet-tinted icon

### General Dashboard
- Primary buttons: gradient violet→sky (was solid emerald)
- Active tabs: violet underline
- Badge notifications: violet bg (was emerald)

## Files to Modify

| File | Changes |
|------|---------|
| `src/styles/globals.css` | New color tokens, 6 new keyframes, utility classes |
| `src/app/page.tsx` | Landing redesign — colors, hero blobs, gradient text |
| `src/app/(dashboard)/feed/page.tsx` | Card hover effects, stats redesign |
| `src/components/layout/sidebar.tsx` | Violet theme, logo gradient, active glow |
| `src/app/(dashboard)/layout.tsx` | Page transition wrapper |
| `src/components/scroll-reveal.tsx` | NEW — IntersectionObserver wrapper |

## Non-Goals
- No changes to backend/API
- No changes to page structure/layout (only visual)
- No new dependencies (pure CSS + vanilla JS IntersectionObserver)
- Individual feature pages (sparings, events, etc.) inherit new tokens automatically
