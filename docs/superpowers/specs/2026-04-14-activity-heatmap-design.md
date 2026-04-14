# Activity Heatmap — Design Spec

## Overview

Panel aktywności w stylu GitHub contribution graph, widoczny publicznie na profilu każdego typu użytkownika (klub, zawodnik, trener). Zawiera heatmapę aktywności (rolling 12 miesięcy) oraz 4 karty statystyk.

## Cel

Gamifikacja + social proof — użytkownicy widzą aktywność innych (np. trener widzi, że zawodnik regularnie korzysta z platformy), a właściciel profilu ma motywację do regularnego używania platformy (streak).

## Źródło danych

Tabela `UserPoints` — 18 typów akcji z `createdAt`, `action`, `points`, `userId`. Zero nowych tabel.

### Śledzone akcje (istniejące w `UserPoints`)

| Akcja | Punkty | Typ użytkownika |
|-------|--------|-----------------|
| `sparing_created` | 10 | Klub |
| `sparing_matched` | 15 | Klub |
| `event_created` | 10 | Klub/Trener |
| `recruitment_created` | 10 | Klub |
| `application_sent` | 5 | Klub/Zawodnik |
| `application_accepted` | 10 | Klub |
| `review_given` | 10 | Klub |
| `transfer_created` | 5 | Klub/Zawodnik |
| `player_added_to_radar` | 3 | Klub |
| `club_post_created` | 5 | Klub |
| `message_sent` | 2 | Wszyscy |
| `profile_completed` | 20 | Wszyscy |
| `first_training_published` | 15 | Trener |
| `first_club_post` | 10 | Klub |
| `first_nabor_application` | 10 | Zawodnik |
| `profile_region_set` | 5 | Wszyscy |
| `tournament_created` | 15 | Klub |
| `tournament_win` | 20 | Klub |

## tRPC Endpoint

### `stats.activityHeatmap`

- **Typ:** `publicProcedure` (heatmap jest na publicznym profilu)
- **Input:** `{ userId: string (UUID) }`
- **Logika:**
  1. Pobierz `UserPoints` z ostatnich 365 dni dla danego `userId`
  2. Agreguj w JS (nie raw SQL — Prisma nie wspiera `GROUP BY DATE` natywnie, dane jednego usera za rok to max kilkaset rekordów):
     - `dailyCounts` — mapa `YYYY-MM-DD → count`
     - `totalActions` — łączna liczba akcji
     - `activeDays` — `COUNT(DISTINCT date)`
     - `longestStreak` — obliczony z posortowanej listy dat (consecutive days)
     - `bestMonth` — miesiąc z max akcjami (nazwa po polsku)
     - `bestDow` — dzień tygodnia z max akcjami (nazwa po polsku)

**Return type:**

```typescript
{
  dailyCounts: Record<string, number>; // "2026-04-14" → 3
  totalActions: number;
  activeDays: number;
  longestStreak: number;
  bestMonth: string | null;   // "Kwiecień" lub null jeśli brak danych
  bestDow: string | null;     // "Poniedziałek" lub null
}
```

## Komponent UI

### `ActivityHeatmap` — `src/components/activity-heatmap.tsx`

Komponent kliencki (`"use client"`), reużywalny na 3 profilach.

**Props:**

```typescript
{ userId: string }
```

### Karty statystyk

4 karty w rzędzie (grid `grid-cols-2 sm:grid-cols-4`):

| Karta | Wartość | Ikona (lucide) | Kolor ikony |
|-------|---------|-----------------|-------------|
| Aktywne dni | `activeDays` | `Calendar` | violet-500 |
| Najdłuższa seria | `longestStreak` dni | `Zap` | orange-500 |
| Najaktywniejszy miesiąc | `bestMonth` | `TrendingUp` | emerald-500 |
| Najlepszy dzień | `bestDow` | `Star` | amber-500 |

Wartość: `font-bold text-lg` (Rubik). Label: `text-[11px] text-muted-foreground`.

### Heatmap grid

- 52 kolumny (tygodnie) × 7 wierszy (dni tygodnia)
- Etykiety po lewej: Pon, Śr, Pt, Nd
- Etykiety na górze: nazwy miesięcy (skrócone po polsku: sty, lut, mar...)
- Legenda w prawym dolnym rogu: "Mniej" [gradient 5 kratek] "Więcej"

### Kolorystyka heatmap (dark mode)

| Poziom | Warunek | Kolor |
|--------|---------|-------|
| 0 | 0 akcji | `bg-muted/20` |
| 1 | 1-2 akcji | `violet-900/40` |
| 2 | 3-5 akcji | `violet-700/60` |
| 3 | 6-9 akcji | `violet-500/80` |
| 4 | 10+ akcji | `violet-500` |

Light mode: analogiczne odcienie violet, kratki puste `bg-muted/30`.

### Interakcja

- **Hover na kratce:** tooltip z datą i liczbą akcji (`"14 kwi 2026 — 3 akcje"`)
- **Bez klikania** — read-only
- **Karty statystyk:** statyczne, brak hover/click

### Responsywność

- **Desktop:** pełna heatmapa 52 tygodnie + 4 karty w rzędzie
- **Mobile (<640px):** heatmapa scroll horyzontalnie (`overflow-x-auto`), karty grid 2x2

### Wielkość kratek

- Desktop: `12px × 12px`, gap `3px`
- Mobile: `10px × 10px`, gap `2px`

### Brak danych

Komunikat: "Brak aktywności w tym okresie" — wycentrowany w obszarze heatmapy.

## Integracja na profilach

Komponent wstawiamy na 3 publicznych profilach:

| Profil | Plik | Pozycja |
|--------|------|---------|
| Klub | `src/app/(public)/clubs/[id]/page.tsx` | Pod StatsBar, nad `ClubProfileTabs` |
| Zawodnik | `src/app/(public)/players/[id]/page.tsx` | Pod stats bar, nad Bio |
| Trener | `src/app/(public)/coaches/[id]/page.tsx` | Pod hero, nad Bio |

**Wywołanie (identyczne na każdym profilu):**

```tsx
<ActivityHeatmap userId={entity.userId} />
```

Potrzeba: pobrać `userId` w query — kluby/zawodnicy/trenerzy mają pole `userId` w modelu Prisma.

## Poza zakresem (MVP)

- Per-role customizacja kart (wspólne karty dla wszystkich)
- Filtrowanie heatmapy per typ akcji
- Cache/materialized views
- Prywatność (heatmap zawsze publiczny)
- Dashboard integracja (tylko public profiles)
