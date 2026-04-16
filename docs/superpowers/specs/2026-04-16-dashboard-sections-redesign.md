# PilkaSport — Dashboard Sections Redesign

**Data:** 2026-04-16
**Scope:** Reorganizacja Pulpitu klubowego — sekcje z boczną nawigacją zamiast jednego długiego scrollu
**Podejście:** Query param routing (`?section=X`) + rozszerzony prawy sidebar z nawigacją sekcji
**Rola:** Dotyczy TYLKO roli CLUB. Pulpity PLAYER i COACH pozostają bez zmian.
**Nadpisuje:** Spec z 2026-04-14 w zakresie: right panel width (260→320px), usunięcie Quick Actions widgeta z right panelu (zastąpiony nawigacją sekcji)

---

## Problem

Obecny Pulpit klubowy to jeden długi scroll: pipeline → rekrutacja → sparingi → wydarzenia → feed z nowymi zawodnikami/klubami. Użytkownik musi scrollować w dół żeby cokolwiek znaleźć. Dodatkowo, po prawej stronie jest pusta przestrzeń (sidebar ma tylko 260px z kalendarzem, rankingiem i quick actions).

---

## Decyzje projektowe

| # | Decyzja | Wybór |
|---|---------|-------|
| 1 | Rola Pulpitu | Command center: KPI + hero na górze, sekcje z nawigacją boczną poniżej |
| 2 | Nawigacja sekcji | Rozszerzony prawy sidebar (320px) — nawigacja pod istniejącymi widgetami |
| 3 | Interakcja sekcji | Podmiana głównego obszaru (pod hero) po kliknięciu sekcji |
| 4 | Sekcje | 3: Aktywność (domyślna), Terminarz, Rekrutacja |
| 5 | Hero zone | KPI (4 karty) + Hero Card — bez profilu klubu, bez quick action buttonów |
| 6 | Routing | Query param `?section=` z `useSearchParams` |

---

## 1. Layout — nowa struktura strony

```
┌──────┬──────────────────────────────┬──────────────┐
│      │  Top Tabs (Przegląd, ...)    │              │
│ Side ├──────────────────────────────┤  Right       │
│ bar  │  HERO ZONE                  │  Sidebar     │
│ 64px │  KPI (4 karty)              │  (320px)     │
│      │  + Hero Card                │              │
│      ├──────────────────────────────┤  Calendar    │
│      │                              │  Ranking     │
│      │  CONTENT ZONE               │  ──────────  │
│      │                              │  NAWIGACJA   │
│      │  (podmieniana wg sekcji)    │  ● Aktywność │
│      │                              │  ○ Terminarz │
│      │                              │  ○ Rekrutacja│
│      │                              │              │
└──────┴──────────────────────────────┴──────────────┘
```

**Kluczowe:**
- Right sidebar: `w-[260px]` → `w-[320px]`
- Separator wizualny (linia) między widgetami a nawigacją sekcji
- Hero zone **stała** — zawsze widoczna niezależnie od wybranej sekcji
- Content zone pod hero — podmieniana na podstawie `?section=` query param

---

## 2. Hero Zone — KPI + Hero Card

### KPI — 4 karty w jednym rzędzie

| KPI | Źródło | Kliknięcie |
|-----|--------|------------|
| Aktywne sparingi | count z API | → `?section=schedule` |
| Oczekujące aplikacje | count pipeline "Na radarze" + "Zaproszeni" | → `?section=recruitment` |
| Nadchodzące wydarzenia | count events w ciągu 7 dni | → `?section=schedule` |
| Ranking | pozycja w lidze | → strona rankingu |

- Styl: obecne karty `DashboardStats` — bez zmian wizualnych
- KPI karty **zachowują** istniejące linki do dedykowanych stron (`/sparings`, `/recruitment`, `/events`, `/ranking`) — nawigacja do sekcji odbywa się przez sidebar, nie przez KPI

### Hero Card — bez zmian

- Następny mecz/sparing z odliczaniem, cresty przeciwników, przyciski "Szczegóły" / "Ustaw skład"
- Fallback bez sparingu: CTA "Utwórz sparing"
- Fallback bez wydarzeń: ukryta

### Usunięte z hero zone

- Profil klubu (logo + nazwa + region + liga) — widoczny w lewym sidebarze
- Quick action buttony (Nowy sparing, Nabór, Pipeline) — zastąpione nawigacją sekcji + akcjami wewnątrz sekcji
- "Więcej działań" expandable

---

## 3. Sekcje — zawartość

### 3a) Aktywność (domyślna, `?section=activity` lub brak param)

Obecny Feed przeniesiony as-is:
- Nowy zawodnik, Nowy klub, Transfer, Sparing (wynik), Turniej, Post klubu
- **Usunięte z feeda:** pipeline stats, recruitment preview, sparingi grid, wydarzenia grid (osobne sekcje)
- Feed staje się czysty — tylko aktywność społecznościowa

### 3b) Terminarz (`?section=schedule`)

Połączone sparingi + wydarzenia:
- **Górny pasek:** filtry po typie (Wszystko | Sparingi | Wydarzenia | Turnieje) + przycisk "+ Dodaj"
- **Lista chronologiczna:** karty posortowane po dacie, badge z typem (orange=sparing, purple=wydarzenie, green=turniej)
- Komponenty: reużycie `SparingCard` (`src/components/sparings/sparing-card.tsx`). `EventCard` nie istnieje — wyekstrahować rendering eventu z `club-sections.tsx` do nowego `src/components/events/event-card.tsx`
- Domyślnie: nadchodzące (przyszłe). Link "Pokaż minione" na dole.

### 3c) Rekrutacja (`?section=recruitment`)

Połączone pipeline + nabory + sugerowani:
- **Górny pasek:** sub-taby (Pipeline | Nabory | Sugerowani) + przycisk "+ Nowy nabór"
- **Pipeline:** obecny `RecruitmentStats` (4 statusy z liczbami) + lista kandydatów. Kliknięcie → pełna strona `/recruitment` z kanbanem
- **Nabory:** lista aktywnych naborów (RECRUITMENT, TRYOUT, CAMP) z obecnego `ClubRecruitment`
- **Sugerowani:** lista sugerowanych zawodników w regionie z obecnego `ClubRecruitment`

### Wspólne dla sekcji

- Nagłówek sekcji z ikoną + tytuł
- Link "Zobacz wszystko →" kierujący do dedykowanej strony (np. `/sparings`, `/recruitment`)

---

## 4. Prawy sidebar — nawigacja sekcji

```
┌──────────────────┐
│  Mini Calendar   │  ← bez zmian
├──────────────────┤
│  Nadchodzące     │  ← bez zmian (upcoming widget)
├──────────────────┤
│  Ranking         │  ← bez zmian
├──────────────────┤
│  ─── separator ──│
│                  │
│  SEKCJE          │  ← nowy blok
│                  │
│  ● Aktywność     │  aktywna = podświetlona
│  ○ Terminarz     │
│  ○ Rekrutacja    │
│                  │
└──────────────────┘
```

**Styl nawigacji:**
- Tytuł bloku: "Sekcje" (`text-xs text-muted-foreground`)
- Każda pozycja: ikona + label (Activity / Calendar / Users)
- Aktywna: `bg-sport-orange/10 text-sport-orange` + border-left accent
- Nieaktywna: `text-muted-foreground hover:bg-muted/50`
- Kliknięcie → `router.push(?section=X)` bez przeładowania

**Mobile fallback:**
- Prawy sidebar ukryty (`hidden lg:block`)
- Nawigacja sekcji renderowana jako poziomy pill bar pod hero zone (`lg:hidden`)
- Styl: mniejsze pills/chips, horizontal scroll

---

## 5. Routing i state management

### Query param

- Param: `section` z wartościami: `activity`, `schedule`, `recruitment`
- Brak param = `activity` (domyślna)
- Przykłady: `/feed`, `/feed?section=schedule`, `/feed?section=recruitment`

### Implementacja w feed-client.tsx

```typescript
// useSearchParams wymaga <Suspense> boundary — owrapować w feed/page.tsx
const searchParams = useSearchParams()
const section = searchParams.get('section') ?? 'activity'

// W renderze (TYLKO dla roli CLUB — PLAYER/COACH zachowują obecny layout):
switch(section) {
  case 'schedule':  return <ScheduleSection />
  case 'recruitment': return <RecruitmentSection />
  default:          return <ActivitySection />
}
```

### Nawigacja

- `router.push(url, { scroll: false })` (Next.js App Router nie wspiera `shallow` — cache TanStack Query zapobiega re-fetchowi)
- KPI karty klikalne → `router.push(?section=X)`
- Sidebar nawigacja → `router.push(?section=X)`
- Mobile pills → `router.push(?section=X)`

### Data fetching

- Hero zone (KPI + hero card): fetch raz, niezależnie od sekcji — shared data
- Sekcje: każda fetchuje swoje dane osobno przez tRPC
- Lazy loading — nie fetchujesz danych rekrutacji dopóki nie klikniesz "Rekrutacja"
- TanStack Query `staleTime` — dane cache'owane, przełączanie nie re-fetchuje

---

## 6. Nowe komponenty

| Komponent | Ścieżka | Opis |
|-----------|---------|------|
| `ActivitySection` | `src/components/dashboard/sections/activity-section.tsx` | Obecny feed przeniesiony |
| `ScheduleSection` | `src/components/dashboard/sections/schedule-section.tsx` | Sparingi + wydarzenia z filtrami |
| `RecruitmentSection` | `src/components/dashboard/sections/recruitment-section.tsx` | Pipeline + nabory + sugerowani |
| `SectionNav` | `src/components/dashboard/section-nav.tsx` | Nawigacja w prawym sidebarze |
| `SectionNavMobile` | `src/components/dashboard/section-nav-mobile.tsx` | Mobile pill bar |

---

## 7. Zmiany w istniejących komponentach

| Komponent | Zmiana |
|-----------|--------|
| `feed-client.tsx` | Dodanie query param routing, usunięcie inline sekcji, renderowanie `<XSection />` |
| `right-panel.tsx` | Zmiana width 260→320px, dodanie `<SectionNav />` pod widgetami |
| `DashboardStats` | Bez zmian — KPI karty zachowują istniejące linki do dedykowanych stron |
| `club-sections.tsx` | Treść przeniesiona do `ScheduleSection` — komponent do usunięcia lub opróżnienia |
| `club-recruitment.tsx` | Treść przeniesiona do `RecruitmentSection` — jw. |
| `ClubStatsRow` (w feed-client.tsx) | Usunąć — duplikuje dane z `DashboardStats` |

### Scope PLAYER/COACH

Zmiany dotyczą TYLKO bloku `isClub` w `feed-client.tsx`. Renderowanie PLAYER i COACH pozostaje bez zmian. Warunek:

```typescript
if (isClub) {
  // nowy layout: hero + section routing
} else {
  // istniejący layout PLAYER/COACH — bez zmian
}
```

---

## 8. Kryteria sukcesu

1. Pulpit ładuje się z sekcją Aktywność domyślnie
2. Kliknięcie w nawigację sidebara przełącza sekcję bez przeładowania strony
3. URL z `?section=schedule` ładuje bezpośrednio Terminarz (deep linking)
4. Back/forward w przeglądarce działa poprawnie
5. Hero zone (KPI + hero card) widoczne zawsze, niezależnie od sekcji
6. Mobile: pill bar pod hero zone zastępuje sidebar nawigację
7. Prawy sidebar 320px wypełnia pustą przestrzeń
8. Brak scrollowania żeby dotrzeć do rekrutacji/terminarza — 1 klik
9. Zero regresji w istniejących flow (auth, sparingi, rekrutacja, feed)
10. Dane sekcji ładowane leniwie (nie fetch all na starcie)
