# PilkaSport Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Przekształcić PilkaSport z bazowej aplikacji CRUD w profesjonalną platformę sportową o wyglądzie na poziomie Transfermarkt / Sofascore / nowoczesny SaaS.

**Architecture:** Redesign oparty na istniejącym stosie (Next.js 16, Tailwind CSS 4, shadcn/ui, tRPC). Etap 1 wymienia design tokens, typografię, komponenty layoutu i kluczowe strony. Etap 2 dodaje brakujące interakcje UX. Etap 3 rozbudowuje platformę o nowe moduły.

**Tech Stack:** Next.js 16 (App Router), Tailwind CSS 4, shadcn/ui (Radix UI), Lucide React, tRPC v11, Prisma 7, Supabase, TypeScript

---

## Etap 1: UI / Design Redesign

### Cele etapu
- Profesjonalny, sportowy wygląd (ciemny motyw jako domyślny, zielone akcenty)
- Nowoczesna typografia (Inter font)
- Spójny design system (spacing, elevation, kolory)
- Przeprojektowane kluczowe strony: landing, dashboard/feed, nawigacja, listy, profile

---

### Task 1.1: Design System — Typografia i Kolory

**Files:**
- Modify: `src/styles/globals.css`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Dodaj font Inter z next/font**

W `src/app/layout.tsx` dodaj import fontu Inter z `next/font/google` i zastosuj go na `<html>` jako className.

```tsx
import { Inter } from "next/font/google";
const inter = Inter({ subsets: ["latin", "latin-ext"] });
// w JSX: <html className={`${inter.className} ...`}>
```

- [ ] **Step 2: Zaktualizuj design tokens w globals.css**

Nowa paleta kolorów — sportowy, profesjonalny look:

```css
:root {
  --background: #fafbfc;
  --foreground: #0f172a;
  --card: #ffffff;
  --card-foreground: #0f172a;
  --popover: #ffffff;
  --popover-foreground: #0f172a;
  --primary: #16a34a;
  --primary-foreground: #ffffff;
  --secondary: #f1f5f9;
  --secondary-foreground: #334155;
  --muted: #f1f5f9;
  --muted-foreground: #64748b;
  --accent: #f0fdf4;
  --accent-foreground: #166534;
  --destructive: #ef4444;
  --destructive-foreground: #ffffff;
  --border: #e2e8f0;
  --input: #e2e8f0;
  --ring: #16a34a;
  --radius: 0.75rem;
  --sidebar-background: #ffffff;
  --sidebar-foreground: #334155;
}

.dark {
  --background: #0b0f1a;
  --foreground: #f1f5f9;
  --card: #111827;
  --card-foreground: #f1f5f9;
  --popover: #111827;
  --popover-foreground: #f1f5f9;
  --primary: #22c55e;
  --primary-foreground: #052e16;
  --secondary: #1e293b;
  --secondary-foreground: #cbd5e1;
  --muted: #1e293b;
  --muted-foreground: #94a3b8;
  --accent: #052e16;
  --accent-foreground: #86efac;
  --destructive: #dc2626;
  --destructive-foreground: #fef2f2;
  --border: #1e293b;
  --input: #1e293b;
  --ring: #22c55e;
  --sidebar-background: #111827;
  --sidebar-foreground: #94a3b8;
}
```

- [ ] **Step 3: Dodaj utility klasy typograficzne**

W `globals.css` dodaj bazowe style typografii:

```css
body {
  font-feature-settings: "cv02", "cv03", "cv04", "cv11";
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

- [ ] **Step 4: Zweryfikuj że strona się renderuje poprawnie**

Run: `npm run dev` → otwórz localhost:3000, sprawdź light i dark mode.

- [ ] **Step 5: Commit**

```bash
git add src/styles/globals.css src/app/layout.tsx
git commit -m "feat: update design tokens — new color palette, Inter font, typography"
```

---

### Task 1.2: Nawigacja — Sidebar Layout (Desktop) + Bottom Nav (Mobile)

**Files:**
- Create: `src/components/layout/sidebar.tsx`
- Create: `src/components/layout/bottom-nav.tsx`
- Modify: `src/components/layout/dashboard-nav.tsx`
- Modify: `src/app/(dashboard)/layout.tsx`

- [ ] **Step 1: Stwórz komponent Sidebar**

Sidebar (lewy panel, 240px) z:
- Logo "PilkaSport" + ikona piłki na górze
- Sekcje nawigacji pogrupowane: "Główne" (Feed, Szukaj), "Aktywność" (Sparingi, Wydarzenia, Kalendarz), "Komunikacja" (Wiadomości, Powiadomienia), "Moje" (Profil, Ulubione)
- Każdy link z ikoną Lucide + label
- Aktywny link podświetlony (bg-primary/10, text-primary, border-left accent)
- Na dole: user avatar + imię + rola badge + przycisk wylogowania
- Ciemne tło w dark mode, białe w light mode
- `hidden md:flex` — widoczny tylko na desktop

```tsx
// src/components/layout/sidebar.tsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Home, Search, Swords, CalendarDays, Trophy,
  MessageSquare, Bell, Heart, User, LogOut
} from "lucide-react";

const NAV_SECTIONS = [
  {
    label: "Główne",
    items: [
      { href: "/feed", icon: Home, label: "Feed" },
      { href: "/search", icon: Search, label: "Szukaj" },
    ],
  },
  {
    label: "Aktywność",
    items: [
      { href: "/sparings", icon: Swords, label: "Sparingi" },
      { href: "/events", icon: Trophy, label: "Wydarzenia" },
      { href: "/calendar", icon: CalendarDays, label: "Kalendarz" },
    ],
  },
  {
    label: "Komunikacja",
    items: [
      { href: "/messages", icon: MessageSquare, label: "Wiadomości" },
      { href: "/notifications", icon: Bell, label: "Powiadomienia" },
    ],
  },
  {
    label: "Moje",
    items: [
      { href: "/profile", icon: User, label: "Profil" },
      { href: "/favorites", icon: Heart, label: "Ulubione" },
    ],
  },
];
```

- [ ] **Step 2: Stwórz komponent BottomNav (mobile)**

Bottom navigation bar (fixed, h-16) z 5 głównymi ikonami:
- Feed, Sparingi, Wydarzenia, Wiadomości, Profil
- Aktywna ikona podświetlona primary color
- `md:hidden` — widoczny tylko na mobile
- Badge na Wiadomościach (unread count)

- [ ] **Step 3: Zaktualizuj dashboard layout**

Zamień obecny top-nav layout na sidebar + content:

```tsx
// Layout: sidebar (fixed left) + main content (ml-60 na desktop)
<div className="min-h-screen bg-background">
  <Sidebar user={session.user} />
  <main className="pb-20 md:pb-0 md:ml-60">
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      {children}
    </div>
  </main>
  <BottomNav />
</div>
```

- [ ] **Step 4: Zachowaj stary dashboard-nav.tsx jako backup**

Nie usuwaj — może być potrzebny do referencji. Dodaj komentarz `// DEPRECATED — replaced by sidebar.tsx`.

- [ ] **Step 5: Zweryfikuj nawigację na desktop i mobile**

Run: `npm run dev` → sprawdź sidebar na desktop, bottom nav na mobile (Chrome DevTools responsive).

- [ ] **Step 6: Commit**

```bash
git add src/components/layout/ src/app/(dashboard)/layout.tsx
git commit -m "feat: replace top nav with sidebar (desktop) + bottom nav (mobile)"
```

---

### Task 1.3: Landing Page — Hero Redesign

**Files:**
- Modify: `src/app/page.tsx`
- Create: `src/components/landing/hero-section.tsx`
- Create: `src/components/landing/features-section.tsx`
- Create: `src/components/landing/stats-section.tsx`
- Create: `src/components/landing/cta-section.tsx`

- [ ] **Step 1: Stwórz hero section**

Nowoczesny hero z:
- Gradient tło (dark green → black w dark mode, white → green-50 w light)
- Duży heading: "Platforma dla polskiego futbolu"
- Subheading: opis wartości
- 2 CTA buttony: "Zarejestruj klub" (primary, duży) + "Dołącz jako zawodnik" (outline)
- Animowane statystyki (liczba klubów, sparingów, wydarzeń) — pobrane z API lub hardcoded
- Dekoracyjne elementy: gradient orb, grid pattern

- [ ] **Step 2: Stwórz features section**

3-kolumnowy grid z ikonami:
- Sparingi (Swords icon) — "Znajdź rywala na sparing"
- Wydarzenia (Trophy) — "Organizuj treningi i nabory"
- Wiadomości (MessageSquare) — "Komunikuj się z klubami"
- Każda karta z subtle border, hover lift effect, ikona w kółku z primary bg

- [ ] **Step 3: Stwórz stats section**

Pasek ze statystykami (ciemne tło):
- Liczba klubów, zawodników, sparingów, wydarzeń
- Animowane countup (opcjonalnie)
- `grid-cols-2 md:grid-cols-4`

- [ ] **Step 4: Stwórz CTA section**

Dolna sekcja z gradient tłem i przyciskiem rejestracji.

- [ ] **Step 5: Złóż landing page z komponentów**

```tsx
export default function LandingPage() {
  return (
    <>
      <HeroSection />
      <FeaturesSection />
      <StatsSection />
      <CTASection />
    </>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add src/app/page.tsx src/components/landing/
git commit -m "feat: redesign landing page — modern hero, features, stats, CTA"
```

---

### Task 1.4: Dashboard Feed — Redesign

**Files:**
- Modify: `src/app/(dashboard)/feed/page.tsx`
- Create: `src/components/dashboard/stats-cards.tsx`
- Create: `src/components/dashboard/feed-card.tsx`
- Create: `src/components/dashboard/welcome-banner.tsx`

- [ ] **Step 1: Stwórz welcome banner**

Banner na górze feeda:
- "Witaj, {imię}!" + "Oto co nowego w Twoim regionie"
- Subtle gradient tło (primary/5)
- Ikona lub ilustracja po prawej

- [ ] **Step 2: Przeprojektuj stats cards**

Karty statystyk w nowym designie:
- Ikona w kolorowym kółku (nie tylko tekst)
- Wartość dużą czcionką + label małą
- Subtle trend indicator (opcjonalnie)
- `grid-cols-2 lg:grid-cols-4 gap-4`

- [ ] **Step 3: Przeprojektuj feed cards**

Nowy design kart feeda:
- Lewa kolorowa linia (border-left 3px) zamiast badge na górze
- Typ jako mały tag w rogu
- Większy tytuł, czytelniejsze info
- Hover: subtle lift (translateY -1px + shadow)
- Footer z datą i regionem
- Avatar klubu po lewej (jeśli dostępny)

- [ ] **Step 4: Złóż nowy feed page**

```tsx
<WelcomeBanner user={session.user} />
<StatsCards role={session.user.role} />
<div className="space-y-3">
  {items.map(item => <FeedCard key={...} item={item} />)}
</div>
```

- [ ] **Step 5: Commit**

```bash
git add src/app/(dashboard)/feed/ src/components/dashboard/
git commit -m "feat: redesign dashboard feed — welcome banner, stats cards, feed cards"
```

---

### Task 1.5: Listy Sparingów i Wydarzeń — Redesign

**Files:**
- Modify: `src/app/(dashboard)/sparings/page.tsx`
- Modify: `src/app/(dashboard)/events/page.tsx`
- Create: `src/components/listing/listing-card.tsx`
- Create: `src/components/listing/filter-bar.tsx`

- [ ] **Step 1: Stwórz nowy listing card**

Uniwersalna karta do list:
- Layout: lewa strona — avatar/logo klubu, prawa — info
- Tytuł (font-semibold, text-lg)
- Meta info: data, miasto, region (z ikonami Calendar, MapPin, Globe)
- Status badge (kolorowy, rounded-full, text-xs)
- Footer: przycisk "Szczegóły" + serduszko (favorite)
- Hover state: border-primary/50 + shadow-md
- Left color accent bar (green dla sparingów, purple dla wydarzeń)

- [ ] **Step 2: Stwórz filter bar**

Nowoczesny pasek filtrów:
- Inline search/city input z ikoną Search
- Dropdown'y: region, sort, typ (wydarzenia)
- Chip'y do szybkiego filtrowania (np. "Dziś", "Ten tydzień", "Mój region")
- Przycisk "Wyczyść" gdy aktywne filtry
- Responsive: na mobile filtry w sheet/drawer

- [ ] **Step 3: Zastosuj na stronie sparingów**

- [ ] **Step 4: Zastosuj na stronie wydarzeń**

- [ ] **Step 5: Commit**

```bash
git add src/app/(dashboard)/sparings/ src/app/(dashboard)/events/ src/components/listing/
git commit -m "feat: redesign listing pages — new cards, modern filter bar"
```

---

### Task 1.6: Strony szczegółów (Sparing, Wydarzenie)

**Files:**
- Modify: `src/app/(dashboard)/sparings/[id]/page.tsx`
- Modify: `src/app/(dashboard)/events/[id]/page.tsx`

- [ ] **Step 1: Przeprojektuj header strony szczegółów**

- Duży tytuł + status badge obok
- Pod tytułem: klub + avatar, data utworzenia
- Przyciski akcji (Edytuj, Usuń, Wiadomość) w grupie po prawej
- Separator (border-b) pod headerem

- [ ] **Step 2: Przeprojektuj sekcję informacji**

- Grid z ikonami: data (Calendar), miejsce (MapPin), region (Globe), koszty (Banknote)
- Każda info w mini-karcie z subtle bg
- Opis w osobnej sekcji z prose styling

- [ ] **Step 3: Przeprojektuj sekcję aplikacji/zgłoszeń**

- Lista aplikacji jako tabela/karty z avatarem, nazwą, datą, status badge
- Przyciski akceptuj/odrzuć czytelniejsze (zielony/czerwony z ikonami)

- [ ] **Step 4: Commit**

```bash
git add src/app/(dashboard)/sparings/[id]/ src/app/(dashboard)/events/[id]/
git commit -m "feat: redesign detail pages — better header, info grid, application list"
```

---

### Task 1.7: Profile publiczne (Klub, Zawodnik)

**Files:**
- Modify: `src/app/(public)/clubs/[id]/page.tsx`
- Modify: `src/app/(public)/players/[id]/page.tsx`

- [ ] **Step 1: Redesign profilu klubu**

- Hero banner z gradient tłem (ciemny zielony) + logo klubu (duże, okrągłe)
- Nazwa, miasto, region, liga — w hero
- Tabs: "O klubie" | "Sparingi" | "Wydarzenia"
- Sekcja kontaktowa w karcie bocznej
- Aktywne ogłoszenia w grid

- [ ] **Step 2: Redesign profilu zawodnika**

- Hero z gradient + zdjęcie (okrągłe, duże)
- Imię, pozycja badge, wiek
- Stats bar: wzrost, waga, noga (w 3 kolumnach z ikonami)
- Bio w karcie
- Historia kariery jako timeline (linia pionowa + kropki)

- [ ] **Step 3: Commit**

```bash
git add src/app/(public)/
git commit -m "feat: redesign public profiles — hero banners, tabs, timeline"
```

---

### Task 1.8: Instalacja brakujących komponentów shadcn/ui

**Files:**
- Create: `src/components/ui/dialog.tsx`
- Create: `src/components/ui/badge.tsx`
- Create: `src/components/ui/avatar.tsx`
- Create: `src/components/ui/tooltip.tsx`
- Create: `src/components/ui/separator.tsx`
- Create: `src/components/ui/sheet.tsx`
- Create: `src/components/ui/dropdown-menu.tsx`
- Create: `src/components/ui/textarea.tsx`

- [ ] **Step 1: Zainstaluj komponenty shadcn/ui**

```bash
npx shadcn@latest add dialog badge avatar tooltip separator sheet dropdown-menu textarea
```

- [ ] **Step 2: Zweryfikuj instalację**

Sprawdź czy pliki pojawiły się w `src/components/ui/`.

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/
git commit -m "feat: add missing shadcn/ui components — dialog, badge, avatar, tooltip, etc."
```

---

### Task 1.9: Strony Auth (Login, Rejestracja)

**Files:**
- Modify: `src/app/(auth)/login/page.tsx`
- Modify: `src/app/(auth)/register/page.tsx`

- [ ] **Step 1: Redesign strony logowania**

- Centered card (max-w-md) na subtle gradient tle
- Logo PilkaSport na górze
- Formularz z lepszym spacing, labels, placeholder
- Link do rejestracji na dole
- Footer "© PilkaSport"

- [ ] **Step 2: Redesign strony rejestracji**

- Podobny layout jak login
- Tabs Klub/Zawodnik jako czytelne przyciski (nie tabs)
- Lepsze grupowanie pól formularza
- Progress indicator (opcjonalnie)

- [ ] **Step 3: Commit**

```bash
git add src/app/(auth)/
git commit -m "feat: redesign auth pages — modern centered card layout"
```

---

### Task 1.10: Wiadomości — Chat UI

**Files:**
- Modify: `src/app/(dashboard)/messages/page.tsx`
- Modify: `src/app/(dashboard)/messages/[conversationId]/page.tsx`

- [ ] **Step 1: Redesign listy konwersacji**

- Sidebar-style lista (na desktop: 2-kolumnowy layout z listą i czatem)
- Każda konwersacja: avatar, nazwa, ostatnia wiadomość (truncated), czas, unread badge
- Aktywna konwersacja podświetlona

- [ ] **Step 2: Redesign widoku czatu**

- Bąbelki wiadomości: własne (primary bg, prawo), rozmówcy (muted bg, lewo)
- Timestamp pod bąbelkiem
- Input na dole: sticky, z ikoną Send
- Header czatu: avatar + nazwa rozmówcy + link do profilu

- [ ] **Step 3: Commit**

```bash
git add src/app/(dashboard)/messages/
git commit -m "feat: redesign messages — modern chat UI with conversation sidebar"
```

---

## Etap 2: UX i Funkcjonalności

### Task 2.1: Animacje i Micro-interactions

**Files:**
- Modify: `src/styles/globals.css`
- Modyfikacja wielu komponentów

- [ ] **Step 1: Dodaj animacje CSS**

Keyframes w globals.css:
- `fade-in` — opacity 0→1
- `slide-up` — translateY 10px→0 + opacity
- `scale-in` — scale 0.95→1

- [ ] **Step 2: Zastosuj animacje na kartach i listach**

- Karty feeda: `animate-fade-in` z `animation-delay` per index
- Modals: `animate-scale-in`
- Toast: `animate-slide-up`

- [ ] **Step 3: Dodaj hover/active transitions na przyciskach**

- Scale 0.98 na active
- Smooth color transitions (150ms)

- [ ] **Step 4: Commit**

---

### Task 2.2: Empty States

**Files:**
- Create: `src/components/empty-state.tsx`

- [ ] **Step 1: Stwórz uniwersalny komponent Empty State**

Props: `icon`, `title`, `description`, `action` (button).
Użycie: feed bez wyników, puste listy, brak wiadomości, brak powiadomień.

- [ ] **Step 2: Zastosuj na wszystkich listach**

- [ ] **Step 3: Commit**

---

### Task 2.3: Potwierdzenia akcji (Dialog zamiast inline)

**Files:**
- Create: `src/components/confirm-dialog.tsx`
- Modify: strony z akcjami delete

- [ ] **Step 1: Stwórz ConfirmDialog**

Oparty na shadcn Dialog:
- Tytuł, opis, 2 przyciski (Anuluj / Potwierdź)
- Wariant destructive (czerwony przycisk)

- [ ] **Step 2: Zamień inline delete confirmation na Dialog**

- [ ] **Step 3: Commit**

---

### Task 2.4: Lepsze formularze

**Files:**
- Modify: formularz sparingu, wydarzenia, profilu

- [ ] **Step 1: Dodaj Textarea z shadcn/ui**

Zamień plain `<textarea>` na komponent shadcn.

- [ ] **Step 2: Dodaj Tooltip z pomocą przy polach**

Ikonka `(?)` z tooltip wyjaśniającym pole.

- [ ] **Step 3: Lepsze date picker**

Zamień plain `<input type="date">` na czytelniejszy komponent.

- [ ] **Step 4: Commit**

---

### Task 2.5: Breadcrumbs na stronach podrzędnych

**Files:**
- Create: `src/components/breadcrumbs.tsx`
- Modify: strony detail i edit

- [ ] **Step 1: Stwórz komponent Breadcrumbs**

Auto-generowanie z pathname. Np: Feed > Sparingi > Tytuł sparingu.

- [ ] **Step 2: Dodaj do stron szczegółów i edycji**

- [ ] **Step 3: Commit**

---

### Task 2.6: Real-time unread indicators

**Files:**
- Modify: `src/components/layout/sidebar.tsx`
- Modify: `src/components/layout/bottom-nav.tsx`

- [ ] **Step 1: Dodaj badge z liczbą nieprzeczytanych**

- Wiadomości: badge z unread count
- Powiadomienia: badge z unread count
- Polling co 30s (istniejący mechanizm)

- [ ] **Step 2: Commit**

---

## Etap 3: Rozbudowa Platformy

### Task 3.1: System Ocen i Recenzji

- Model `Review` (gwiazdki 1-5, komentarz, po sparingu)
- Router tRPC z CRUD
- UI: formularz oceny po zakończonym sparingu, gwiazdki na profilu klubu
- Średnia ocena na karcie klubu

### Task 3.2: System Ogłoszeń Transferowych

- Model `Transfer` (zawodnik szuka klubu / klub szuka zawodnika)
- Typy: szukam klubu, szukam zawodnika, wolny agent
- Filtry: pozycja, region, wiek, liga
- UI: dedykowana sekcja `/transfers`

### Task 3.3: Statystyki i Analityka Rozszerzona

- Dashboard z wykresami (liczba sparingów/miesiąc, aktywność regionu)
- Biblioteka Recharts lub Chart.js
- Profil klubu: historia sparingów, procent akceptacji
- Profil zawodnika: liczba zgłoszeń, akceptacji

### Task 3.4: Mapa z Lokalizacjami

- Integracja Mapbox GL lub Leaflet
- Mapa na stronach: sparingi w regionie, kluby w okolicy
- Geolokalizacja do auto-wykrywania regionu

### Task 3.5: System Punktacji / Gamifikacja

- Punkty za aktywność (stworzenie sparingu, zgłoszenie, recenzja)
- Odznaki (badge system)
- Ranking aktywnych klubów/zawodników

### Task 3.6: PWA + Push Notifications

- Service Worker (next-pwa lub custom)
- Web Push API (Supabase Edge Functions lub własny backend)
- Powiadomienia push o nowych sparingach w regionie, wiadomościach

---

## File Structure Map

```
src/
├── components/
│   ├── ui/           (shadcn/ui — existing + new: dialog, badge, avatar, tooltip, separator, sheet, dropdown-menu, textarea)
│   ├── layout/
│   │   ├── sidebar.tsx          (NEW — desktop sidebar navigation)
│   │   ├── bottom-nav.tsx       (NEW — mobile bottom navigation)
│   │   └── dashboard-nav.tsx    (DEPRECATED — old top navigation)
│   ├── landing/
│   │   ├── hero-section.tsx     (NEW)
│   │   ├── features-section.tsx (NEW)
│   │   ├── stats-section.tsx    (NEW)
│   │   └── cta-section.tsx      (NEW)
│   ├── dashboard/
│   │   ├── welcome-banner.tsx   (NEW)
│   │   ├── stats-cards.tsx      (NEW)
│   │   └── feed-card.tsx        (NEW)
│   ├── listing/
│   │   ├── listing-card.tsx     (NEW)
│   │   └── filter-bar.tsx       (NEW)
│   ├── empty-state.tsx          (NEW)
│   ├── confirm-dialog.tsx       (NEW)
│   └── breadcrumbs.tsx          (NEW)
├── styles/
│   └── globals.css              (MODIFIED — new tokens, animations)
└── app/
    ├── layout.tsx               (MODIFIED — Inter font)
    ├── page.tsx                 (MODIFIED — new landing)
    ├── (auth)/                  (MODIFIED — redesign)
    ├── (dashboard)/
    │   ├── layout.tsx           (MODIFIED — sidebar layout)
    │   ├── feed/page.tsx        (MODIFIED — redesign)
    │   ├── sparings/page.tsx    (MODIFIED — redesign)
    │   ├── events/page.tsx      (MODIFIED — redesign)
    │   ├── messages/            (MODIFIED — chat UI)
    │   └── ...
    └── (public)/                (MODIFIED — profile redesign)
```

---

## Execution Order

1. **Task 1.8** — Install missing shadcn/ui components (prerequisite)
2. **Task 1.1** — Design tokens + typography (foundation)
3. **Task 1.2** — Sidebar + Bottom nav (layout change)
4. **Task 1.3** — Landing page redesign
5. **Task 1.4** — Dashboard/Feed redesign
6. **Task 1.5** — Listing pages redesign
7. **Task 1.6** — Detail pages redesign
8. **Task 1.7** — Public profiles redesign
9. **Task 1.9** — Auth pages redesign
10. **Task 1.10** — Messages chat UI redesign

Etap 2 tasks (2.1–2.6) po ukończeniu Etapu 1.
Etap 3 tasks (3.1–3.6) jako osobne feature branches.
