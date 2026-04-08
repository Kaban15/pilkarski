# Visual Redesign — PilkaSport

## Problem

Obecny interfejs PilkaSport jest zaprojektowany w stylu X/Twitter — płaski, pure black, `rounded-none`, bez cieni. Dla platformy sportowej brakuje mu dynamiki, emocji i głębi wizualnej. Interfejs wygląda "biurowo" zamiast sportowo.

## Cel

Transformacja wizualna platformy: dodanie głębi (cienie, zaokrąglenia), graficznej tożsamości (duże herby, tekstury, gradienty) i dynamicznego koloru — przy zachowaniu dark-mode DNA i istniejącej architektury komponentów.

## Podejście: Theme Layer

Zmiany skoncentrowane w warstwie tematycznej (`globals.css`, theme config, komponenty bazowe shadcn/ui). Komponenty domenowe dziedziczą automatycznie. Punktowe poprawki w 3-4 komponentach kluczowych.

**Zasięg:** ~10-15 plików. Zero zmian w logice biznesowej.

---

## 1. Paleta kolorów

### Primary accent
- **Przed:** `#7c3aed` (violet-600)
- **Po:** `#8b5cf6` (violet-500) — jaśniejszy, lepszy kontrast na ciemnym tle

### Gradienty zamiast płaskich kolorów
- Primary button: `linear-gradient(135deg, #8b5cf6, #7c3aed)`
- Progress bars: `linear-gradient(90deg, #8b5cf6, #06b6d4)` (violet → cyan)
- Badge/pills: subtelny gradient w obrębie jednego hue
- Pipeline kafelki: gradient tła z 12% → 4% opacity koloru akcentu per etap

### Kolory pipeline rekrutacyjnego
| Etap | Kolor | Gradient tła |
|------|-------|-------------|
| Na radarze | `#60a5fa` (blue-400) | `rgba(59,130,246, 0.12)` → `0.04` |
| Zaproszeni | `#fbbf24` (amber-400) | `rgba(245,158,11, 0.12)` → `0.04` |
| Testowani | `#a78bfa` (violet-400) | `rgba(139,92,246, 0.12)` → `0.04` |
| Podpisani | `#4ade80` (green-400) | `rgba(34,197,94, 0.12)` → `0.04` |

### Tło kart
- **Przed:** `#000000` (pure black, identyczne z tłem strony)
- **Po:** `#0a0a0f` — subtelnie jaśniejsze, odcinające kartę od tła

---

## 2. Zaokrąglenia (border-radius)

Zróżnicowana hierarchia zamiast jednego globalnego `--radius`:

| Element | Radius | Tailwind class |
|---------|--------|---------------|
| Badge, pill | 6px | `rounded-md` |
| Button | 8px | `rounded-lg` |
| Input, select | 10px | `rounded-[10px]` |
| Card, panel | 16px | `rounded-2xl` |
| Dialog, modal, sheet | 20px | `rounded-[20px]` |
| Avatar (kwadratowy) | 12px | `rounded-xl` |

### Implementacja
- Zmiana `--radius` w `globals.css` na `0.5rem` (8px) jako base
- Nadpisanie w `card.tsx`: `rounded-2xl`
- Nadpisanie w `dialog.tsx`, `sheet.tsx`: `rounded-[20px]`
- Badge zostaje z computed radius

---

## 3. Cienie i głębia

### Card shadow (dark mode)
```css
box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(139, 92, 246, 0.05);
```

### Card border
- **Przed:** `border: 1px solid #2f3336`
- **Po:** `border: 1px solid rgba(139, 92, 246, 0.10)` — subtelny violet tint

### Button shadow (primary)
```css
box-shadow: 0 4px 16px rgba(139, 92, 246, 0.3);
```

### Hover glow (karty)
```css
hover:box-shadow: 0 4px 24px rgba(139, 92, 246, 0.15);
hover:border-color: rgba(139, 92, 246, 0.2);
```

### Light mode
- Card shadow: `0 2px 8px rgba(0, 0, 0, 0.06)`
- Card border: `rgba(139, 92, 246, 0.08)`
- Button shadow: `0 4px 16px rgba(139, 92, 246, 0.15)`

---

## 4. Typografia

### Font pairing
- **Nagłówki (display):** Rubik 600-700 — miękki, sportowy charakter
- **Body text:** Inter 400-500 — czytelny, geometryczny (bez zmian)
- **Statystyki/liczby:** Inter 800 z `font-variant-numeric: tabular-nums`

### Implementacja
```typescript
// layout.tsx
import { Inter } from "next/font/google";
import { Rubik } from "next/font/google";

const inter = Inter({ subsets: ["latin", "latin-ext"], display: "swap", variable: "--font-inter" });
const rubik = Rubik({ subsets: ["latin", "latin-ext"], display: "swap", variable: "--font-rubik" });
```

### Użycie
- `<html className={`${inter.variable} ${rubik.variable}`}>`
- CSS: `font-family: var(--font-rubik)` na nagłówkach
- Tailwind: utility class `font-display` mapujący na `--font-rubik`

---

## 5. Hero Section — SVG Overlay

### SVG boiska
Inline SVG z zarysem boiska piłkarskiego (linie boczne, środkowa, pole karne, koło środkowe). `opacity: 0.04`, `position: absolute`, `fill: none`, `stroke: white`.

### Gradient glow
Radialny gradient w prawym górnym rogu: `radial-gradient(circle, rgba(139,92,246,0.15), transparent 70%)`.

### Duży herb klubu
- **Przed:** 36px, `rounded-full`, płaski
- **Po:** 72px, `rounded-2xl`, gradient tło (`#8b5cf6` → `#6d28d9`), `box-shadow: 0 4px 20px rgba(139,92,246,0.3)`

### Nazwa klubu
- Font: Rubik 700, 26px, `letter-spacing: -0.5px`
- Podtytuł (liga, miasto): Inter 13px, kolor `#a78bfa`

### Lokalizacja
Komponent dashboard page — sekcja z nazwą klubu na górze pulpitu.

---

## 6. Karta Sparingu

### Layout "VS"
Dwa herby klubów (44x44px, `rounded-xl`) z "vs" pomiędzy, zamiast jednego małego herbu.

### Border
- Left border: gradient `linear-gradient(to bottom, #06b6d4, #8b5cf6)` (3px) — implementacja via `border-image: linear-gradient(...) 1` lub pseudo-element `::before` z gradient background
- Outer border: `rgba(6, 182, 212, 0.12)`

### Badge
- Gradient tło per kolor (cyan, violet)
- `rounded-lg` (8px)
- `font-weight: 500`

### Lokalizacja
`src/components/sparings/sparing-card.tsx`

---

## 7. Pipeline Rekrutacyjny

### Kafelki
- Gradient tło: `linear-gradient(135deg, rgba(color, 0.12), rgba(color, 0.04))`
- Border: `rgba(color, 0.15)`
- `rounded-2xl` (16px)
- Emoji ikona + label u góry
- Liczba: Inter 800, 32px, kolor akcentu per etap

### Lokalizacja
`src/components/recruitment/recruitment-stats.tsx`

---

## 8. Kalendarz

### Dni z wydarzeniami
- Gradient tło: `linear-gradient(135deg, rgba(color, 0.15), rgba(color, 0.05))`
- Border: `1px solid rgba(color, 0.25)`
- Glow: `box-shadow: 0 0 8px rgba(color, 0.1)`
- `rounded-[10px]`
- Kolor zależy od typu wydarzenia (violet=event, cyan=sparing, green=trening)

### Lokalizacja
`src/components/calendar-view.tsx`

---

## 9. Utility Classes (globals.css)

Nowe utility classes do dodania:

```css
/* Gradient backgrounds for pipeline cards */
.sport-gradient-blue { background: linear-gradient(135deg, rgba(59,130,246,0.12), rgba(59,130,246,0.04)); }
.sport-gradient-amber { background: linear-gradient(135deg, rgba(245,158,11,0.12), rgba(245,158,11,0.04)); }
.sport-gradient-violet { background: linear-gradient(135deg, rgba(139,92,246,0.12), rgba(139,92,246,0.04)); }
.sport-gradient-green { background: linear-gradient(135deg, rgba(34,197,94,0.12), rgba(34,197,94,0.04)); }

/* Card elevation — uses CSS custom properties for theme switching */
.sport-card-elevated {
  background: var(--color-card);
  border: 1px solid var(--color-card-border);
  box-shadow: var(--shadow-card);
}

/* Theme variables (added to :root and .dark in globals.css) */
/* :root { --color-card: #ffffff; --color-card-border: rgba(139,92,246,0.08); --shadow-card: 0 2px 8px rgba(0,0,0,0.06); } */
/* .dark { --color-card: #0a0a0f; --color-card-border: rgba(139,92,246,0.10); --shadow-card: 0 2px 8px rgba(0,0,0,0.5), 0 0 0 1px rgba(139,92,246,0.05); } */

/* Font display */
.font-display { font-family: var(--font-rubik), sans-serif; }
```

---

## Pliki do zmiany

| Plik | Zmiana |
|------|--------|
| `src/styles/globals.css` | Kolory, radius, cienie, nowe utility classes, font vars |
| `src/app/layout.tsx` | Import Rubik, CSS variables na `<html>` |
| `src/components/ui/card.tsx` | `rounded-2xl`, nowe cienie, tło `#0a0a0f` |
| `src/components/ui/button.tsx` | `rounded-lg`, gradient na primary, shadow |
| `src/components/ui/badge.tsx` | `rounded-md`, gradient tło |
| `src/components/ui/dialog.tsx` | `rounded-[20px]` |
| `src/components/ui/sheet.tsx` | `rounded-[20px]` na content |
| `src/components/ui/input.tsx` | `rounded-[10px]` |
| `src/components/sparings/sparing-card.tsx` | VS layout, duże herby, gradient border |
| `src/components/recruitment/recruitment-stats.tsx` | Gradient kafelki, ikony, duże liczby |
| `src/components/calendar-view.tsx` | Kolorowe gradient tła na dniach z wydarzeniami |
| `src/app/(dashboard)/feed/page.tsx` | Hero section z SVG overlay (dashboard/feed page — główny pulpit) |

---

## Czego NIE ruszamy

- Logika biznesowa — zero zmian
- tRPC routes / API — bez zmian
- Prisma schema — bez zmian
- Sidebar / bottom-nav layout — strukturalnie bez zmian (dziedziczą theme)
- Light mode — dziedzczy automatycznie z theme, drobne korekty cieni

## Ryzyka

- **Niskie:** Zmiany głównie CSS/Tailwind, łatwe do rollbacku
- **Spójność:** Utility classes w globals.css zapewniają spójność
- **Performance:** Rubik to dodatkowy font (~20KB), ale `display: swap` minimalizuje impact
- **Border-radius na card.tsx:** Zmiana w base component propaguje wszędzie — to zamierzony efekt
