# Violet Surge Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign PilkaSport from emerald/black to violet-sky gradient with bold sports identity, animated effects, and premium feel.

**Architecture:** Pure CSS + minimal client JS approach. New design tokens in globals.css cascade to all components automatically. New ScrollReveal component for intersection-based animations. Landing page and dashboard feed get explicit visual updates. No backend changes.

**Tech Stack:** Tailwind CSS 4 custom properties, CSS @keyframes, IntersectionObserver API, Next.js 16 view transitions.

---

### Task 1: Design Tokens — Color Palette

**Files:**
- Modify: `src/styles/globals.css`

- [ ] **Step 1: Update `:root` (light mode) colors**

Replace emerald primary with violet:
```css
:root {
  --background: #faf8ff;
  --foreground: #0a0a0a;
  --card: #ffffff;
  --card-foreground: #0a0a0a;
  --popover: #ffffff;
  --popover-foreground: #0a0a0a;
  --primary: #7c3aed;
  --primary-foreground: #ffffff;
  --secondary: #f5f3ff;
  --secondary-foreground: #27272a;
  --muted: #f5f3ff;
  --muted-foreground: #71717a;
  --accent: #f5f3ff;
  --accent-foreground: #5b21b6;
  --destructive: #ef4444;
  --destructive-foreground: #ffffff;
  --border: #e4e4e7;
  --input: #e4e4e7;
  --ring: #7c3aed;
  --sidebar-background: #ffffff;
  --sidebar-foreground: #27272a;
  --sidebar-border: #e4e4e7;
  --sidebar-accent: #f5f3ff;
  --sidebar-accent-foreground: #5b21b6;
  --sidebar-muted: #f5f3ff;
  --sidebar-muted-foreground: #71717a;
}
```

- [ ] **Step 2: Update `.dark` colors**

```css
.dark {
  --background: #0c0a1a;
  --foreground: #ededed;
  --card: #131025;
  --card-foreground: #ededed;
  --popover: #131025;
  --popover-foreground: #ededed;
  --primary: #7c3aed;
  --primary-foreground: #ffffff;
  --secondary: #1a1530;
  --secondary-foreground: #a1a1a1;
  --muted: #1a1530;
  --muted-foreground: #8888a0;
  --accent: #1a1040;
  --accent-foreground: #a78bfa;
  --destructive: #dc2626;
  --destructive-foreground: #fef2f2;
  --border: #1e1a2e;
  --input: #1e1a2e;
  --ring: #7c3aed;
  --sidebar-background: #0e0b1e;
  --sidebar-foreground: #a1a1a1;
  --sidebar-border: #1a1530;
  --sidebar-accent: rgba(124,58,237,0.15);
  --sidebar-accent-foreground: #a78bfa;
  --sidebar-muted: #131025;
  --sidebar-muted-foreground: #666680;
}
```

- [ ] **Step 3: Verify build**

Run: `npx tsc --noEmit`
Expected: no errors (CSS-only change, no TS impact)

- [ ] **Step 4: Commit**

```bash
git add src/styles/globals.css
git commit -m "feat: violet surge — new color tokens (light + dark)"
```

---

### Task 2: Animation Keyframes & Utility Classes

**Files:**
- Modify: `src/styles/globals.css`

- [ ] **Step 1: Add new keyframes inside `@theme inline`**

After existing keyframes (line 54), add:
```css
  @keyframes blob-1 {
    0%, 100% { transform: translate(0, 0) scale(1); }
    33% { transform: translate(30px, -20px) scale(1.1); }
    66% { transform: translate(-20px, 20px) scale(0.9); }
  }
  @keyframes blob-2 {
    0%, 100% { transform: translate(0, 0) scale(1); }
    33% { transform: translate(-30px, 20px) scale(0.9); }
    66% { transform: translate(20px, -30px) scale(1.1); }
  }
  @keyframes blob-3 {
    0%, 100% { transform: translate(0, 0) scale(1); }
    33% { transform: translate(20px, 30px) scale(1.1); }
    66% { transform: translate(-30px, -20px) scale(0.9); }
  }
  @keyframes gradient-rotate {
    0% { --gradient-angle: 0deg; }
    100% { --gradient-angle: 360deg; }
  }
  @keyframes pulse-dot {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.3); }
  }

  --animate-blob-1: blob-1 8s ease-in-out infinite;
  --animate-blob-2: blob-2 10s ease-in-out infinite;
  --animate-blob-3: blob-3 12s ease-in-out infinite;
  --animate-pulse-dot: pulse-dot 2s ease-in-out infinite;
```

- [ ] **Step 2: Add utility classes after existing CSS**

After the smooth transitions block (line 150), add:
```css
/* Scroll reveal */
.reveal {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.6s ease-out, transform 0.6s ease-out;
}
.reveal.revealed {
  opacity: 1;
  transform: translateY(0);
}
.reveal-delay-1 { transition-delay: 100ms; }
.reveal-delay-2 { transition-delay: 200ms; }
.reveal-delay-3 { transition-delay: 300ms; }
.reveal-delay-4 { transition-delay: 400ms; }

/* Hover glow */
.hover-glow-violet { transition: transform 0.2s, box-shadow 0.2s; }
.hover-glow-violet:hover { transform: translateY(-2px); box-shadow: 0 0 24px rgba(124,58,237,0.15); }
.hover-glow-sky { transition: transform 0.2s, box-shadow 0.2s; }
.hover-glow-sky:hover { transform: translateY(-2px); box-shadow: 0 0 24px rgba(14,165,233,0.15); }
.hover-glow-emerald { transition: transform 0.2s, box-shadow 0.2s; }
.hover-glow-emerald:hover { transform: translateY(-2px); box-shadow: 0 0 24px rgba(16,185,129,0.15); }
.hover-glow-pink { transition: transform 0.2s, box-shadow 0.2s; }
.hover-glow-pink:hover { transform: translateY(-2px); box-shadow: 0 0 24px rgba(244,114,182,0.15); }

/* Gradient border */
.gradient-border {
  position: relative;
  background: var(--card);
  z-index: 0;
}
.gradient-border::before {
  content: "";
  position: absolute;
  inset: -1px;
  border-radius: inherit;
  background: conic-gradient(from var(--gradient-angle, 0deg), #7c3aed, #0ea5e9, #10b981, #7c3aed);
  z-index: -1;
  animation: gradient-rotate 3s linear infinite;
}

/* Pulse notification dot */
.pulse-dot {
  animation: pulse-dot 2s ease-in-out infinite;
}

/* Page enter */
.page-enter {
  animation: slide-up 0.3s ease-out;
}
```

- [ ] **Step 3: Update button press to 0.97**

Change `scale(0.98)` to `scale(0.97)` on line 142.

- [ ] **Step 4: Commit**

```bash
git add src/styles/globals.css
git commit -m "feat: violet surge — keyframes, hover glow, gradient borders, scroll reveal"
```

---

### Task 3: ScrollReveal Component

**Files:**
- Create: `src/components/scroll-reveal.tsx`

- [ ] **Step 1: Create the component**

```tsx
"use client";

import { useEffect, useRef, type ReactNode } from "react";

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export function ScrollReveal({ children, className = "", delay }: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("revealed");
          observer.unobserve(el);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const delayClass = delay ? `reveal-delay-${delay}` : "";

  return (
    <div ref={ref} className={`reveal ${delayClass} ${className}`}>
      {children}
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add src/components/scroll-reveal.tsx
git commit -m "feat: add ScrollReveal component (IntersectionObserver)"
```

---

### Task 4: Landing Page Redesign

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Update hero section**

Key changes to hero:
- Background: `bg-[#0c0a1a]` (was `#050505`)
- Add 3 animated blur blobs (absolute positioned divs):
  - Violet blob: `bg-violet-500/[0.12]`, `animate-[blob-1_8s_ease-in-out_infinite]`, `blur-[80px]`, w-72 h-72
  - Sky blob: `bg-sky-500/[0.10]`, `animate-[blob-2_10s_ease-in-out_infinite]`, `blur-[80px]`, w-64 h-64
  - Emerald blob: `bg-emerald-500/[0.08]`, `animate-[blob-3_12s_ease-in-out_infinite]`, `blur-[80px]`, w-56 h-56
- Gradient text: `bg-gradient-to-r from-violet-400 to-sky-400 bg-clip-text text-transparent` (was emerald)
- Pill badge: `bg-violet-500/10 text-violet-400` with pulse-dot on the dot
- CTA primary: `bg-gradient-to-r from-violet-500 to-sky-500 hover:from-violet-600 hover:to-sky-600`
- CTA secondary: `border-white/20 text-white hover:bg-white/10`
- Nav CTA: `bg-violet-500 hover:bg-violet-600` (was emerald)

- [ ] **Step 2: Update remaining sections**

- Stats: numbers `text-violet-400`
- Features: icon circles use `bg-violet-500/10 text-violet-400`, `bg-sky-500/10 text-sky-400`, `bg-emerald-500/10 text-emerald-400`, `bg-amber-500/10 text-amber-400`
- Feature card hover: add `hover-glow-violet` class (or per-card glow class)
- "Jak to działa" step numbers: `bg-gradient-to-br from-violet-500 to-sky-500 text-white`
- Role cards: violet accent for players, sky for coaches, emerald for clubs
- Bottom CTA: gradient button matching hero

- [ ] **Step 3: Wrap sections in ScrollReveal**

Wrap each section (stats, features, how-it-works, roles, CTA) in `<ScrollReveal>` with staggered delays.

- [ ] **Step 4: Verify build**

Run: `npx tsc --noEmit`

- [ ] **Step 5: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: violet surge — landing page redesign with hero blobs and scroll reveal"
```

---

### Task 5: Sidebar Violet Theme

**Files:**
- Modify: `src/components/layout/sidebar.tsx`

- [ ] **Step 1: Update logo**

Change logo "PS" badge from emerald to gradient:
- `bg-gradient-to-br from-violet-500 to-sky-500 text-white` (was `bg-primary text-primary-foreground`)

- [ ] **Step 2: Update active state styling**

Active nav item: add left border glow:
- `border-l-2 border-violet-500` + existing `bg-sidebar-accent` (which is now violet/15 from tokens)

- [ ] **Step 3: Update notification badges**

Badge styling: `bg-violet-500 text-white` (was `bg-primary`). Add `pulse-dot` class to notification count badges.

- [ ] **Step 4: Update user avatar**

Avatar ring: `ring-2 ring-violet-500/30` around user initial circle.

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/sidebar.tsx
git commit -m "feat: violet surge — sidebar with gradient logo and violet active states"
```

---

### Task 6: Dashboard Feed Redesign

**Files:**
- Modify: `src/app/(dashboard)/feed/page.tsx`

- [ ] **Step 1: Update stats bar**

Stats pills: add gradient bg accent:
- `bg-gradient-to-r from-violet-500/10 to-sky-500/10 border-violet-500/20` (was plain `border-border`)

- [ ] **Step 2: Update feed cards with hover glow**

Add hover-glow classes per type:
- Sparing cards: `hover-glow-violet`
- Event cards: `hover-glow-sky`
- Transfer cards: `hover-glow-emerald`
- Club post cards: `hover-glow-pink`

- [ ] **Step 3: Update quick actions CTA**

Primary CTA "Dodaj sparing": `bg-gradient-to-r from-violet-500 to-sky-500 hover:from-violet-600 hover:to-sky-600 text-white`

- [ ] **Step 4: Verify build**

Run: `npx tsc --noEmit`

- [ ] **Step 5: Commit**

```bash
git add src/app/(dashboard)/feed/page.tsx
git commit -m "feat: violet surge — dashboard feed with hover glow and gradient accents"
```

---

### Task 7: Page Transition in Dashboard Layout

**Files:**
- Modify: `src/app/(dashboard)/layout.tsx`

- [ ] **Step 1: Add page-enter class to main content**

Wrap the `{children}` in the layout with `page-enter` class:
```tsx
<main className="page-enter ...existing classes...">
  {children}
</main>
```

This applies the `slide-up 0.3s ease-out` animation on each page load within the dashboard.

- [ ] **Step 2: Commit**

```bash
git add src/app/(dashboard)/layout.tsx
git commit -m "feat: violet surge — page enter transition in dashboard"
```

---

### Task 8: Final Verification & Push

- [ ] **Step 1: TypeScript check**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 2: Visual verification**

Run: `npm run dev`
Check:
1. Landing page: violet/sky gradient hero, animated blobs, scroll reveals
2. Dashboard: violet sidebar, glow cards, gradient stats
3. Dark mode: deep violet background, proper contrast
4. Light mode: violet tints, readable text
5. Mobile: no layout breaks

- [ ] **Step 3: Push**

```bash
git push
```
