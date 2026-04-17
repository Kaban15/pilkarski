# Digest Card — Design Spec

**Data:** 2026-04-17
**Status:** Draft (oczekuje na review)
**Owner:** Piotr
**Audit source:** UX audit 2026-04-17 — finding **B2 (flagship)**

---

## 1. Kontekst i problem

Obecny feed PilkaSport (`src/app/(dashboard)/feed/feed-client.tsx`) dla zalogowanego użytkownika pokazuje równolegle: onboarding, DashboardStats, HeroCard, „Pierwsze kroki", SectionNav, sekcje per-rola i listę feed items. Brakuje jednego elementu: **„co wymaga mojej uwagi właśnie teraz"**.

Dane są rozsiane po kilku widokach (sparingi, rekrutacja, wydarzenia, wiadomości, kalendarz). Użytkownik musi obchodzić dashboard żeby ustalić co go czeka — to kosztuje uwagę i jest głównym powodem niskiej retencji D+1/D+7 w platformach podobnego typu.

Konkurencja (FB notifications bell, LinkedIn „Top updates", Slack unread summary) rozwiązuje to słabo — digesty są albo zbyt ogólne, albo mieszają komunikaty z akcjami. PilkaSport może wygrać tym elementem dzięki silnie domenowemu kontekstowi (attendance 48h, pipeline stale, matched sparingi).

## 2. Goals / Non-goals

### Goals
- G1. Użytkownik w <5s widzi „ile rzeczy czeka na moją akcję" bez scrollowania feedu.
- G2. Każdy wiersz digestu prowadzi do pre-filtered listy, gdzie można działać.
- G3. Digest pokazuje się tylko gdy jest treść (`any count > 0`), nie dodaje wizualnego szumu dla nowych userów.
- G4. Jedno zapytanie server-side agregujące wszystkie liczniki (zero waterfall).
- G5. Logika zróżnicowana per rola (CLUB/PLAYER/COACH) — każda rola widzi swoje.

### Non-goals (explicit)
- NG1. **Inline akcje** (accept/reject w karcie). To wariant B/C z auditu — osobny spec jeśli okaże się potrzebny.
- NG2. **Dismiss / snooze**. Karta sama znika gdy treść = 0. YAGNI.
- NG3. **Real-time updates**. Polling/staleTime 2 min wystarczy.
- NG4. **Weekly recap, followers, matchmaking suggestions** (warianty C z auditu).
- NG5. **Nowe widoki routingowe**. Jeśli row prowadzi do widoku którego nie ma (np. PLAYER "Twoje aplikacje"), używamy najbliższego istniejącego; brakujące widoki są osobnym spec-em.

## 3. User stories

### CLUB (admin klubu)
- Jako admin klubu wchodzę rano na feed → widzę że mam 3 pending aplikacje sparingowe + 2 zaproszenia + 1 zgłoszenie z attendance <48h → klikam najpilniejszy wiersz i załatwiam.
- Jeśli mój pipeline rekrutacyjny ma kandydatów bez ruchu >14d → widzę przypomnienie z linkiem do filtra.

### PLAYER
- Jako zawodnik wchodzę na feed → widzę status moich aplikacji (ilu klubów jeszcze rozważa) + zaproszenia na wydarzenia + nowe nabory dopasowane do mojej pozycji+regionu (<72h).
- Nie widzę rzeczy których nie dotyczę (np. stale pipeline).

### COACH
- Jako trener widzę zgłoszenia na moje treningi + zaproszenia klubów (membership) + attendance + nowe wiadomości.

## 4. Design

### 4.1. Placement

- **Lokalizacja:** górna część głównej kolumny `FeedClient` (`src/app/(dashboard)/feed/feed-client.tsx`).
- **Kolejność renderowania:** `PullToRefresh → H1 → DigestCard → [Onboarding] → DashboardStats → HeroCard → …`
- **Conditional render:** karta NIE renderuje się gdy:
  - `digest.isLoading` (skeleton placeholder jeden wiersz, 40px wysokości, unikamy CLS)
  - agregat zwraca `totalCount === 0` (brak czegokolwiek do pokazania)
  - aktywny jest onboarding wizard (`showOnboarding || showPlayerOnboarding || showCoachOnboarding`) — nie mieszamy dwóch CTA
- **Nie sticky** — scrolluje z feedem.

### 4.2. Visual structure

```
┌──────────────────────────────────────────────────┐
│ Twój status                  zaktualizowano teraz│  ← header (label + timestamp)
├──────────────────────────────────────────────────┤
│ 🗡  3  Aplikacje sparingowe czekają      →│  ← row (icon, count, label, chevron)
│ 📩  2  Nieodebrane zaproszenia           →│
│ ⏰  1  Zgłoszenie na nabór — 48h          →│
│ 📅  5  Wydarzeń w tym tygodniu            →│
│ 🕒  4  Kandydaci bez ruchu >14 dni        →│
└──────────────────────────────────────────────────┘
```

- Surface: istniejący `Card` + `CardContent` z `components/ui/card`.
- Header: `text-xs font-medium uppercase tracking-wider text-muted-foreground` + prawostronna mikro-etykieta „zaktualizowano teraz" (kolor `text-muted-foreground/60`).
- Rows: `flex items-center gap-3 py-2.5 px-1 hover:bg-accent rounded-md transition-colors`.
  - Ikona: 20×20, kolor per typ (reużywamy feed accent mapping):
    - sparing → `text-sport-orange`
    - event/tournament → `text-violet-500`
    - message → `text-amber-500`
    - transfer → `text-cyan-500`
    - calendar/upcoming → `text-sky-500`
    - pipeline/stale → `text-slate-500`
  - Liczba: `text-[18px] font-bold tabular-nums` (Rubik bold), min-width 28px żeby wyrównać. Format: raw liczba dla 1–99, `"99+"` dla count ≥ 100.
  - Label: `text-[14px] text-foreground/90 flex-1 truncate`.
  - `ChevronRight` 16px po prawej (`text-muted-foreground/50`, hover → `text-foreground`).
- Max 5 wierszy — jeśli pojawi się 6., zastępujemy ostatni (least-priority) „Zobacz wszystkie →" linkiem do `/notifications`.
- Separator między rows: subtelny `border-b border-border/40` na wszystkich poza ostatnim.

### 4.3. Per-rola — content matrix

Wszystkie progi są w `DIGEST_THRESHOLDS` const w `src/lib/digest.ts` (nowy plik, reużywalne).

**CLUB (kolejność = priorytet malejąco):**

| # | Warunek | Liczba | Label | Href |
|---|---------|--------|-------|------|
| 1 | attendance 48h (TRYOUT/RECRUITMENT z ACCEPTED bez YES/NO/MAYBE) | count zgłoszeń | „Zgłoszenia bez potwierdzenia (<48h)" | `/events?filter=pending-attendance` |
| 2 | pending aplikacje sparingowe (status=PENDING, ogłoszenia mojego klubu + moje aplikacje do innych) | count | „Aplikacje sparingowe czekają" | `/sparings?tab=applications` |
| 3 | nieodebrane SparingInvitation **otrzymane przez mój klub** (invitedClubId=me, expiresAt > now, response=null) | count | „Nieodebrane zaproszenia" | `/sparings?tab=invitations` |
| 4 | sparingi+eventy w najbliższych 7d dla klubu (user lub ACCEPTED) | count | „Wydarzenia w tym tygodniu" | `/calendar?range=week` |
| 5 | RecruitmentTarget bez RecruitmentEvent w ostatnich 14d, stage ≠ (SIGNED, ARCHIVED) | count | „Kandydaci bez ruchu >14 dni" | `/recruitment?filter=stale` |

**PLAYER:**

| # | Warunek | Liczba | Label | Href |
|---|---------|--------|-------|------|
| 1 | moje aplikacje (EventApplication.applicantUserId = me, status in PENDING/INVITED/REVIEWING) | count | „Twoje aplikacje w toku" | `/events?tab=my-applications` *(zobacz §6 fallback)* |
| 2 | zaproszenia na wydarzenia (InvitePlayer, status=PENDING) | count | „Zaproszenia na wydarzenia" | `/events?filter=invited` |
| 3 | attendance 48h (moje ACCEPTED aplikacje bez response) | count | „Potwierdź obecność (<48h)" | `/events?filter=pending-attendance` |
| 4 | wydarzenia w najbliższych 7d gdzie mam ACCEPTED lub YES | count | „Wydarzenia w tym tygodniu" | `/calendar?range=week` |
| 5 | nowe nabory ≤72h, region = moje, position w target | count | „Nowe nabory dla Ciebie" | `/events?filter=recommended` |

**COACH:**

| # | Warunek | Liczba | Label | Href |
|---|---------|--------|-------|------|
| 1 | zgłoszenia na moje treningi (EventApplication dla event.coachId=me, status=PENDING) | count | „Zgłoszenia na treningi" | `/trainings?tab=applications` *(lub fallback `/events?mine=true`)* |
| 2 | zaproszenia klubów (ClubMembership, status=INVITED) | count | „Zaproszenia od klubów" | `/notifications?filter=invitations` *(fallback: `/notifications`)* |
| 3 | attendance 48h | count | „Potwierdź obecność (<48h)" | `/events?filter=pending-attendance` |
| 4 | treningi w najbliższych 7d | count | „Treningi w tym tygodniu" | `/calendar?range=week` |
| 5 | unread messages (`api.message.unreadCount`) | count | „Nowe wiadomości" | `/messages` |

### 4.4. Data strategy

#### Nowy tRPC endpoint: `digest.get`

Lokalizacja: `src/server/trpc/routers/digest.ts` (nowy plik, zarejestrować w `router.ts`).

Kontrakt:

```ts
// Query (bez inputu, rola z kontekstu)
type DigestResponse = {
  role: "CLUB" | "PLAYER" | "COACH";
  rows: Array<{
    key: string;          // stabilny identyfikator (do testów + a11y)
    count: number;        // > 0 zawsze (zero rows są filtrowane po stronie serwera)
    label: string;        // z słownika i18n po stronie klienta (serwer zwraca klucz? → patrz open questions)
    href: string;         // pre-filtered target route
    iconKey: "sparing" | "event" | "message" | "transfer" | "calendar" | "pipeline" | "attendance" | "invitation" | "recommendation";
  }>;
  totalCount: number;    // suma count-ów — jeśli 0, klient nie renderuje karty
  generatedAt: string;   // ISO — „zaktualizowano teraz"
};
```

Implementacja:
- `protectedProcedure` — wymaga sesji.
- Wewnątrz: `switch (role)` → wywołuje 5 helperów per-rola (w `src/lib/digest.ts`).
- Każdy helper wykonuje jedno `db.xxx.count({ where: ... })` lub `findMany` z `_count` — **nigdy pełnych obiektów** (to są tylko liczniki).
- Wszystkie `count` wywołane w `Promise.all` wewnątrz helpera roli.
- Helper zwraca `rows` z `count > 0` (filtr po stronie serwera — klient nie widzi pustych wierszy).
- `generatedAt` = `new Date().toISOString()` w momencie resolve.

#### Cache po stronie klienta

- `staleTime: 120_000` (2 min) — digest nie musi być real-time.
- `refetchInterval: 120_000` — gdy user siedzi na feedzie, odświeża co 2 min.
- `refetchOnWindowFocus: true` — alt-tab → fresh counts.
- Invalidation: wszystkie mutacje które mogą zmienić liczniki powinny wołać `utils.digest.get.invalidate()`. W praktyce: `sparing.apply`, `sparing.respondToApplication`, `event.applyFor`, `event.respondToInvitation`, `event.setAttendance`, `sparing.invite.respond`, `recruitment.updateStage`, `message.send` (wszystko gdzie już robimy `utils.xxx.invalidate()`).
- **Kompromis:** żeby nie rozsypywać inwalidacji po 10+ mutacjach, dodajemy prosty helper `invalidateDigest` w `src/lib/trpc-react.ts` i wołamy go z każdego callbacku `onSuccess`.

#### Server-side prefetch

W `src/app/(dashboard)/feed/page.tsx` (Server Component) dodać:
```ts
void trpc.digest.get.prefetch();
```
obok istniejących prefetchów. Dzięki temu digest ładuje się równolegle z feedem, zero waterfall.

### 4.5. Loading / error states

- **Loading (first paint):** placeholder o tej samej wysokości co 3-wierszowa karta (`h-[168px]`), `bg-card border rounded-xl animate-pulse`. Zapobiega CLS.
- **Error:** karta nie renderuje się (silent fail — digest jest enhancement, nie blocker). `console.error("[digest] fetch failed", err)` do logów.
- **totalCount === 0:** karta nie renderuje się.

### 4.6. i18n key convention

Serwer zwraca `labelKey` (nie pre-translated string). Klucze używają stabilnego schematu:
- `digest.row.{role}.{rowKey}` — np. `digest.row.club.pendingSparingApplications`, `digest.row.player.myApplicationsInProgress`, `digest.row.coach.trainingApplications`.
- `digest.header.title` = „Twój status"
- `digest.header.updatedNow` = „zaktualizowano teraz"

`rowKey` jest tym samym identyfikatorem co `key` w `DigestResponse.rows` (§4.4) — jedno źródło prawdy dla testów, a11y (`data-testid={key}`) i i18n.

### 4.7. Mobile treatment

- Karta używa pełnej szerokości głównej kolumny (już `min-w-0 flex-1` w `feed-client.tsx`).
- Labels dłuższe → `truncate` (label ma `flex-1`, liczba + ikona + chevron są shrink-0).
- Touch target: wiersz ma `py-2.5 + px-1` = ~44px wysokości → zgodne z WCAG 2.5.5.
- Brak specjalnego mobile layout — standard stack responsive.

## 5. Komponenty i plik touchpoints

### Nowe pliki

| Plik | Odpowiedzialność |
|------|-------------------|
| `src/components/dashboard/digest-card.tsx` | React component (client) — rendering, loading, 0-state skip. |
| `src/server/trpc/routers/digest.ts` | tRPC router `digest.get`. |
| `src/lib/digest.ts` | Helpery per rola (`getClubDigest`, `getPlayerDigest`, `getCoachDigest`), `DIGEST_THRESHOLDS` const. |
| `src/server/trpc/routers/digest.test.ts` *(vitest)* | Unit: dla każdej roli fixture + oczekiwane rows. |
| `e2e/digest.spec.ts` | E2E: CLUB z seed-owaną pending application widzi wiersz i klik prowadzi do `/sparings?tab=applications`. |

### Zmodyfikowane pliki

| Plik | Zmiana |
|------|--------|
| `src/server/trpc/router.ts` | Rejestracja `digest` routera. |
| `src/app/(dashboard)/feed/page.tsx` | Dodać `void trpc.digest.get.prefetch();`. |
| `src/app/(dashboard)/feed/feed-client.tsx` | Import `DigestCard`, render nad `DashboardStatsWidget`, pod H1, pod `showOnboarding` check. |
| `src/lib/trpc-react.ts` | Dodać `invalidateDigest()` helper. |
| Mutacje zmieniające liczniki: `sparing.applyFor`, `sparing.respond`, `event.applyFor`, `event.respondToInvitation`, `event.setAttendance`, `sparing.invite.respond`, `recruitment.updateStage`, `message.send` (**dokładne nazwy do zweryfikowania w `src/server/trpc/router.ts` podczas planowania — `apply` jest reserved word, stąd `applyFor`, decyzja #6 w STATE.md**) | W `onSuccess` / `utils` dodać `invalidateDigest()`. |
| `src/lib/translations.ts` | Nowe klucze: `"Twój status"`, `"zaktualizowano teraz"`, wszystkie labels z content matrix. |

## 6. Routing fallback (§4.3)

Niektóre href-y prowadzą do widoków które mogą nie istnieć lub nie obsługiwać danego filtra. Reguła:

- `/sparings?tab=applications`, `/sparings?tab=invitations`, `/events?filter=invited`, `/events?filter=pending-attendance`, `/events?filter=recommended`, `/recruitment?filter=stale`, `/trainings?tab=applications`, `/calendar?range=week` — **każdy z tych filtrów/tabów musi zostać sprawdzony w trakcie implementacji**:
  - jeśli istnieje → używamy
  - jeśli nie istnieje → używamy najbliższego rodzica (`/sparings`, `/events`, `/recruitment`, `/trainings`, `/calendar`, `/notifications`) i TODO do backlogu (np. „Etap X+1: filtr `pending-attendance` w `/events`").
- `/events?tab=my-applications` dla PLAYER prawdopodobnie wymaga nowego widoku — fallback: `/events` (zawodnik widzi wszystkie). Backlog: „PLAYER view: Twoje aplikacje" (to finding D2 z auditu — osobny spec).
- `/notifications?filter=invitations` — fallback `/notifications`.

**Decyzja:** spec nie wymusza istnienia filtrów — plan implementacji weryfikuje każdy href i albo dodaje filtr (jeśli 1-2h pracy), albo rejestruje TODO.

## 7. Testing

### Unit (Vitest)
- `src/lib/digest.test.ts`:
  - `getClubDigest`: fixture z 2 pending apps + 0 zaproszeń + 1 attendance 48h + 3 eventów w 7d + 0 stale kandydatów → rows = 3 (filter count > 0), zaokrąglona kolejność.
  - `getPlayerDigest`: fixture z 1 aplikacją + 2 zaproszeniami → rows = 2.
  - `getCoachDigest`: analogicznie.
  - Edge: wszystkie liczby = 0 → `totalCount = 0, rows = []`.
  - Edge: liczba > 99 → display format „99+" po stronie klienta (test rendering w component test).

### Integration (digest router)
- `digest.get` z session CLUB + seed-owanych danych → zwraca role, rows, totalCount.
- Auth guard: brak sesji → `UNAUTHORIZED`.

### E2E (Playwright)
- `e2e/digest.spec.ts`:
  - Login CLUB, seed pending application, wejdź na `/feed` → assert widoczna karta z wierszem „Aplikacje sparingowe czekają" z liczbą 1.
  - Klik wiersza → `page.waitForURL(/sparings\?tab=applications/)`.
  - Edge: nowy CLUB bez danych → karta nie renderuje się (`expect(digestCard).not.toBeVisible()`).

### Manual QA checklist (po wdrożeniu)
- Dark mode: kontrast wszystkich ikon + tekstu.
- Mobile (320px): brak overflow, liczby nie urywają się.
- Loading → success → empty (po wyczyszczeniu pending apps refresh → karta znika).

## 8. Rollout

- Feature flag: **brak**. Digest jest enhancement, nie zmienia istniejących flow.
- Deploy: standardowo przez Vercel.
- Observability: log pierwszego zapytania `digest.get` dla każdej roli (`console.info("[digest] served", { role, totalCount, rowCount })`) przez 7 dni po wdrożeniu → walidacja że dane realne zgadzają się z oczekiwaniami. Potem usunąć log (lub podpiąć pod real telemetry gdy będzie).

## 9. Open questions

1. **i18n:** serwer zwraca `label` pre-translated czy `labelKey` + klient tłumaczy? **Propozycja:** serwer zwraca `labelKey`, klient używa `t()`. Powód: i18n żyje po stronie klienta (`useI18n()`), jedno źródło prawdy.
2. **„Nowe nabory dla Ciebie"** (PLAYER, row 5): próg „<72h" — czy liczyć `createdAt` czy `publishedAt`? **Propozycja:** `createdAt` (prostsze, brak `publishedAt` w modelu).
3. **Stale pipeline** (CLUB, row 5): definicja „bez ruchu" — brak RecruitmentEvent czy brak stage change? **Propozycja:** brak `RecruitmentEvent` w ostatnich 14d. Matches obecny model i `isStalePipeline` helper jeśli istnieje (do sprawdzenia przy implementacji).
4. **Kolejność rows** — czy stała jak w §4.3, czy priorytetyzowana dynamicznie (np. attendance 48h zawsze na górze jeśli count > 0)? **Propozycja:** stała kolejność (predictable UX, łatwiejsze testy). Dynamic priorytetyzacja to v2.

## 10. Out of scope (re-confirmed)

- Inline akcje (accept/reject w karcie).
- Snooze / dismiss / „nie pokazuj dziś".
- Real-time WebSocket updates (polling 2min wystarczy).
- Weekly recap, followers, matchmaking suggestions, „nowi obserwujący".
- Nowe widoki filtrowane (pending-attendance, my-applications, recommended) — spec nie wymusza, plan weryfikuje i ewentualnie zgłasza do backlogu.
- Telemetria click-through — osobny spec jeśli pojawi się potrzeba.

---

## Następne kroki (poza tym dokumentem)

1. Spec review loop (spec-document-reviewer).
2. User review gate.
3. `writing-plans` skill → plan implementacyjny z fazami (API → component → integracja → testy → rollout).
