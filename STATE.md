# PilkaSport — Stan Projektu

**Ostatnia sesja:** 2026-04-18
**Aktualny etap:** 74 etapów ukończonych
**Live:** https://pilkarski.vercel.app
**GitHub:** https://github.com/Kaban15/pilkarski

---

## Co jest zbudowane

### Auth & Role (3 role)
- Auth.js v5 (credentials, JWT), auto-login po rejestracji
- Role: CLUB, PLAYER, COACH — rejestracja, profil, dashboard per rola
- Middleware: `getToken()` Edge-compatible, public prefixes
- Onboarding: 3-krokowy wizard per rola (club/player/coach)

### Sparingi (pełny flow)
- CRUD + aplikacje + kontr-propozycje (COUNTER_PROPOSED) + dopasowanie (MATCHED) + zakończenie (COMPLETED)
- 3-krokowy wizard tworzenia + tryb "Szybki sparing"
- Zaproszenia (`SparingInvitation` z expiresAt) — grupowe do 5 klubów na raz
- Koszty: costPerTeam (tylko info tekstowe, bez śledzenia opłat)
- **PitchStatus**: WE_HAVE_PITCH / LOOKING_FOR_PITCH / SPLIT_COSTS — select w formularzu, kolorowe badge na kartach
- Recenzje (rating 1-5, StarRating komponent)
- "Moje sparingi" z tabs per status

### Wydarzenia (7 typów)
- Typy: OPEN_TRAINING, RECRUITMENT, TRYOUT, CAMP, CONTINUOUS_RECRUITMENT, INDIVIDUAL_TRAINING, GROUP_TRAINING
- Widoczność: PUBLIC / INTERNAL (tylko kadra)
- Obecność: YES/NO/MAYBE (AttendanceSection) + **Anty No-Show**: baner 48h dla TRYOUT/RECRUITMENT z ACCEPTED, badge attendance na liście zgłoszeń
- Smart lokalizacje: auto-ładowanie ostatniej, picker z zapisanymi, edycja inline
- Delegowanie uprawnień (canManageEvents)
- COACH tworzy treningi przez klub (membership required)

### Turnieje
- Format: faza grupowa, puchar (drabinka), grupa + puchar (4-16 drużyn)
- Rejestracja: kluby i ad-hoc drużyny, accept/reject przez organizatora
- Round-robin + knockout bracket (auto-generowane)
- Wyniki z dwustronnym potwierdzeniem, karne w fazie pucharowej
- Tabele grupowe (materialized standings)
- 4-tabowa strona turnieju (Drużyny/Grupy/Drabinka/Info)
- Feed + kalendarz + sidebar integration (orange accent)
- Gamifikacja: tournament_created/win + badge "Mistrz turniejów"

### Transfery & Rekrutacja
- Ogłoszenia transferowe (LOOKING_FOR_CLUB/PLAYER/FREE_AGENT)
- Pipeline rekrutacyjny: Kanban board (6 etapów WATCHING→SIGNED), drag-and-drop
- RecruitmentEvent timeline, stats, CSV export
- "Na radar" button, "Nabory dla Ciebie" (region-matched)
- "Szukam klubu" toggle na profilu (prywatny, powiadomienia na nabory/transfery w regionie)
- **Tryb dyskretny** (`isDiscreet` na Player + Transfer) — ukrywa profil w wyszukiwarce, feed i listach transferowych; widoczny tylko dla klubów do których zawodnik aplikuje
- Smart club sorting w zaproszeniach sparingowych (LeagueLevel + Region priority)
- Zapraszanie zawodników na wydarzenia (`player.search` + `event.invitePlayer` + `InvitePlayerDialog`)

### Wiadomości
- 1:1 czat z Supabase Realtime (WebSocket), fallback poll 30s
- Czat grupowy klubu (`Conversation.clubId`, polling 10s)
- `ProfileMessageButton` na publicznych profilach

### Kadra & Membership
- `ClubMembership` (PENDING/ACCEPTED/REJECTED/LEFT/REMOVED/INVITED)
- Join request + club invite flow
- `TeamLineup` + `TeamLineupPlayer` (składy: STARTER/BENCH)
- `/squad` — 3 taby (Zawodnicy, Trenerzy, Prośby), permissions toggle

### Community
- `ClubPost` z kategoriami (6 + INTERNAL), limit 5 aktywnych per klub
- Zgłaszanie postów, bookmarki (Favorite z clubPostId)
- Feed integration (region-filtered, wyklucza wygasłe)

### Ligi (publiczny katalog)
- 4-poziomowa hierarchia: `/leagues` → region → szczebel → grupa → kluby
- Seed: 16 regionów, 69 szczebli, 397 grup (dane realne 2024/2025)
- Mapa Polski (grid 4x4) z logami ZPN, badge "Aktywny" przy klubach
- Loga ZPN regionów we wszystkich widokach lig, profilach, sparingach
- Dynamic sitemap (~480 URL-i)

### Powiadomienia & Push & Email
- In-app: 19 typów, fire-and-forget z kontekstowym error logging, bell badge z polling 60s
- Push: web-push + VAPID, Service Worker, auto-cleanup expired subscriptions
- Email: Resend (5 triggerów: sparing apply/respond/invite, message, club invite), throttle 15min na wiadomościach
- Przypomnienia 24h (attendance, inactive clubs, stale pipeline)

### Gamifikacja
- Punkty (18 akcji), 10 odznak, leaderboard top 20
- `/ranking` — punkty, odznaki, historia
- **Activity Heatmap** — GitHub-style heatmap aktywności na publicznych profilach (kluby, zawodnicy, trenerzy), rolling 12 miesięcy, 4 karty statystyk (aktywne dni, aktualna seria, najaktywniejszy miesiąc, najlepszy dzień), violet kolorystyka, responsive
- **Digest Card** — karta „Twój status" na górze feedu, per rola (CLUB/PLAYER/COACH), agregat liczników (aplikacje, zaproszenia, attendance 48h, upcoming 7d, stale pipeline, recommendations), linki do pre-filtered list, skip gdy `totalCount = 0`, staleTime 2min + invalidation z 8 mutacji, RSC prefetch, test-id per wiersz

### UI/Design
- **Cover photo klubu:** `Club.coverUrl` (nullable VarChar 500), edytowalne w panelu profilu klubu przez `ImageUpload variant="cover"` (1600px max, 16:5 preview), renderowane jako tło hero bannera na publicznym profilu z gradient overlay; fallback gradient violet→slate→black gdy brak
- **Dashboard Redesign (Etap 47):** Deep Charcoal palette, Sportstream-inspired hybrid layout
- **Dark mode:** tło `#09090b`, karty `#111116`, cienie z violet tint, border `rgba(139,92,246,0.06)`
- **Light mode:** tło `#fafafa`, karty `#ffffff`, violet-tinted borders
- **Dual accent:** violet `#8b5cf6` (primary) + orange `#f97316` (sport-accent)
- **Sidebar:** collapsed by default (64px, ikony), expand toggle, orange active state z gradient bar
- **Top tabs:** role-specific navigation (CLUB/PLAYER/COACH), sticky, pill-style, orange active
- **Dashboard stats:** 4 stat cards z KPI per rola (Rubik 28px bold), trend indicators
- **Hero card:** VS layout z herbami klubów, countdown, gradient-border top (violet→orange)
- **Right panel (lg+):** mini kalendarz, nadchodzące wydarzenia, ranking, szybkie akcje (260px)
- **Feed cards:** ikony z tint per typ (orange=sparing, violet=event, green=turniej, cyan=transfer, blue=post)
- **Zaokrąglenia:** karty 12px (rounded-xl), buttony 8px, inputy 10px, dialogi 16px
- **Fonty:** Rubik (nagłówki/display, wagi 600-900) + Inter (body text)
- **Pipeline rekrutacyjny:** gradient tiles w 2x2 grid, duże liczby 32px
- **Kalendarz:** gradient highlights na dniach z wydarzeniami (orange/violet per typ)
- **Micro-interactions:** heart bounce, check-pop, countdown pulse, hover glow, card elevation transitions
- Shared components: StatsCell, MatchCard, PositionGroup, StagePill, RegionLogo, SocialLinks, InvitePlayerDialog, DashboardStats, HeroCard, MiniCalendar, UpcomingWidget, RankingWidget, TopTabs, RightPanel
- Bottom Nav mobile (role-aware)
- shadcn/ui: 15 komponentów
- Dark mode: class-based, ThemeToggle, zero-flash script
- **i18n PL/EN:** `useI18n()` hook + `t()` + `LanguageToggle` w sidebarze, ~65 komponentów przetłumaczonych

### Admin & Moderacja
- Panel admina `/admin` (4 taby: Raporty, Użytkownicy, Metryki, Treści)
- `isAdmin` Boolean na User — dowolna rola może być adminem
- `isBanned` z 5-min cache w JWT — blokada logowania
- `ClubPostReport` model — zgłoszenia postów z deduplikacją (unique userId+postId)
- Ukrywanie postów (soft delete: hidden flag), filtrowanie w feed/favorites/list
- Zarządzanie użytkownikami: ban/unban, nadawanie/odbieranie admina (guard na ostatniego admina)
- Metryki platformy: łączne i 7-dniowe statystyki
- Zarządzanie treścią: anulowanie sparingów/turniejów, usuwanie wydarzeń
- Edge middleware: `/admin` dostępne tylko dla isAdmin

### Inne
- Feed z regionu: zróżnicowane karty (6 typów z unikalnymi layoutami), 3-kolumnowy layout desktop (feed+right panel 320px z kalendarzem/rankingiem/nawigacją sekcji), pull-to-refresh (mobile gesture)
- **Dashboard sekcje (CLUB):** Pulpit podzielony na 5 nawigowalnych sekcji (Terminarz/Aktywność/Rekrutacja/Szukający klubu/Nowe kluby) z query param routing (`?section=`), SectionNav w sidebarze (desktop) + pill bar (mobile), filtr pozycji w sekcji zawodników
- Wyszukiwarka globalna, ulubione, kalendarz, mapa (Leaflet), statystyki (Recharts)
- Publiczne profile: kluby, zawodnicy, trenerzy (SEO z generateMetadata)
- Klikalne profile na 11+ stronach (`getProfileHref()`)
- E2E: Playwright, 31+ testów (z `test.skip` guards na shared state), w tym `dashboard-sections.spec.ts` pokrywający Etap 51 (SectionNav desktop/mobile, URL routing, filtr pozycji, brak sekcji dla PLAYER)
- Unit: Vitest 67 testów (format, gamification, form-errors, award-points, is-club-member, file-validation, auth router, tournament-logic, activity-utils), coverage v8
- Security: headers (HSTS, CSP, X-Frame-Options), Zod `.strict()`, env validation, upload folder whitelist
- Server-side file validation: magic bytes (JPEG/PNG/WebP) w `/api/upload`
- Route boundaries: skeleton `loading.tsx` + `error.tsx` w 8 dashboard segments
- Shared hook `usePaginatedList` — DRY pagination w sparings + events
- **RSC data prefetch:** feed + sparings pages jako Server Components z `createHydrationHelpers` — dane prefetchowane server-side, zero waterfall na first render
- **Query caching:** staleTime tuning (global 60s, feed/stats 5min, listy 3min, clubDashboard 2min) — szybsza nawigacja między podstronami
- **Prefetch on hover:** `usePrefetchRoute` hook — time-aware (re-prefetch po 60s), sidebar (onMouseEnter) + bottom-nav (onTouchStart)
- **RSC router cache:** `staleTimes` w next.config (dynamic 30s, static 180s) — klient cachuje RSC payload

---

## Ostatnie zmiany (max 5, FIFO)

| Etap | Data | Opis |
|------|------|------|
| 74 | 2026-04-18 | Landing polish (pre-launch FB-ready) + full QA pass. `page.tsx`: `<RotatingHeadline />` → statyczny h1 z gradientem violet→orange na frazie „dla klubów piłkarskich"; liczniki `club/sparing/event.count()` (pre-launch = 0/0/0 anti-trust signal) → katalog PZPN `region/leagueLevel/leagueGroup.count()` (16/69/397 z seed'u); 6 akcentów (violet/sky/emerald/amber) → 1 (violet), orange tylko na main CTA gradient + screenshot; unused imports (Trophy/ChevronRight/Globe) removed; `rotating-headline.tsx` deleted. Commit `e1e2ca4`, −63 linii. **QA pass:** 152/156 (97.4%), 1 skip, 4 pre-existing E2E fails: `quick-apply.spec.ts:12` (click timeout), `dashboard-sections.spec.ts:60+74` (toBeVisible), `digest.spec.ts:44` (click timeout). Próby fixa quick-apply (stopPropagation + hoist button out of Link) cofnięte — zgadywanie root cause bez Playwright trace. Patrz: **Następna sesja — TODO** + Bugi #19–#22. |
| 73 | 2026-04-17 | P4 React Compiler enable: `npm i -D babel-plugin-react-compiler@^1.0.0`, `next.config.ts`: `reactCompiler: true` (top-level, Next 16 moved z experimental). Auto-memoization runtime. Eslint disables z Etap 67 zostają — lint rules dalej firingują (compiler-friendly code guidance). Build pass, tsc 0, unit 103/103, E2E 12/12 (auth + sparing-advanced + digest-urls). |
| 72 | 2026-04-17 | P1 `<img>` → `<Image />` mass refactor: 34 wystąpień w 27 plikach zmigrowane na `next/image`. `next.config.ts`: dodane `images.remotePatterns` dla `*.supabase.co/storage/v1/object/public/**`. Strategia: fixed `h-N w-N` → `<Image width height />` z px; cover-photo `h-full w-full` w relative parent → `fill + sizes`. `image-upload.tsx`: import jako `NextImage` (kolizja z `new Image()` w `compressImage()`). Lint: 35 → 1 warning. Tests: 103/103 unit + 7/7 E2E (sparing-advanced + digest-urls) pass. |
| 71 | 2026-04-17 | P2 Digest telemetry stub: `trackDigestClick()` w `digest-card.tsx` — `console.info("[digest:click]", {key, role, count, ts})` na click każdego wiersza. Grep-friendly prefix dla future pipeline (Vercel Analytics/własny sink). Brak mutacji kontraktu API, brak testów do zmiany. |
| 70 | 2026-04-17 | P1 ESLint exhaustive-deps cleanup: 45 → 35 warnings. `messages/[conversationId]/page.tsx` (3× disable z uzasadnieniem TanStack stable mutate + 3× unused disable removed), `recruitment/page.tsx` (entries wrapped w useMemo), `calendar-view.tsx` (useState initializer dla `now`), `use-paginated-list.ts` (destructure `fetchNextPage`), `theme-toggle.tsx` + `i18n.tsx` (unused disables removed). |

> Szczegóły wszystkich etapów: [CHANGELOG.md](CHANGELOG.md)

---

## Tech Stack

| Warstwa | Technologia |
|---------|-------------|
| Frontend | Next.js 16 (App Router) + TypeScript |
| UI | Tailwind CSS 4 + shadcn/ui (15) + sonner + Recharts + Leaflet |
| Font | Inter (body) + Rubik (display) via next/font/google |
| API | tRPC v11 (fetch adapter) |
| ORM | Prisma 7 + @prisma/adapter-pg |
| DB | PostgreSQL (Supabase — Transaction Pooler, port 6543) |
| Storage | Supabase Storage (bucket `avatars`, server-side upload) |
| Push | web-push (VAPID, Service Worker) |
| Auth | Auth.js v5 (next-auth@beta) |
| Walidacja | Zod v4 (`.strict()` na wszystkich schematach) |
| Env | Zod-validated `src/env.ts` |
| Testy | Playwright (E2E, 26+) + Vitest (unit, 67) + @vitest/coverage-v8 |
| Hosting | Vercel (`pilkarski.vercel.app`) |

---

## Kluczowe Pliki

```
prisma/schema.prisma              — schemat BD (27+ modeli)
prisma/prisma.config.ts           — konfiguracja Prisma 7
prisma/migrations/                — migracje BD (26 migracji)
prisma/seed.ts                    — seed regionów/lig/grup

src/middleware.ts                  — ochrona tras (JWT, public prefixes)
src/server/auth/config.ts         — Auth.js config
src/server/db/client.ts           — Prisma client singleton
src/server/trpc/trpc.ts           — tRPC init + procedures
src/server/trpc/router.ts         — root router (21 routerów)
src/server/trpc/routers/          — auth, club, player, coach, region, sparing, event,
                                    message, feed, search, notification, favorite, stats,
                                    review, transfer, gamification, push, recruitment,
                                    club-post, club-membership, team-lineup, admin
src/env.ts                        — Zod-validated env vars (server-side)
src/server/award-points.ts        — gamifikacja helper
src/server/fire-and-log.ts        — fire-and-forget helper z logging
src/server/send-push.ts           — web-push helper
src/server/is-club-member.ts      — membership helpers
src/server/get-user-club-id.ts    — resolve clubId from user role
src/server/check-event-permission.ts — event permission helper
src/app/api/upload/route.ts       — server-side image upload
src/app/api/reminders/route.ts    — cron przypomnienia

src/lib/trpc.ts                   — tRPC client (frontend)
src/lib/supabase.ts               — Supabase client (realtime)
src/lib/labels.ts                 — stałe, labele, statusy, getLabels(), helpers (getUserDisplayName, getProfileHref, pluralPL)
src/lib/i18n.tsx                  — I18nProvider, useI18n(), t() — przełączanie PL/EN
src/lib/translations.ts           — słownik PL→EN (~950 wpisów)
src/lib/format.ts                 — formatDate, formatEventDateTime
src/lib/rate-limit.ts             — in-memory rate limiter
src/lib/gamification.ts           — punkty, odznaki
src/lib/activity-utils.ts         — agregacja aktywności (daily counts, streaks, best month/dow)
src/lib/training-presets.ts       — szablony treningów
src/lib/validators/               — Zod schemas (auth, profile, sparing, event, review, transfer, message, coach, club-post)
src/lib/form-errors.ts            — getFieldErrors()

src/app/(auth)/                   — login, register
src/app/(dashboard)/              — feed, sparings, events, messages, notifications,
                                    favorites, calendar, map, stats, ranking, transfers,
                                    recruitment, community, trainings, squad, club-chat,
                                    search, profile
src/app/(public)/                 — clubs/[id], players/[id], coaches/[id], leagues/...

src/components/layout/sidebar.tsx     — sidebar desktop
src/components/layout/bottom-nav.tsx  — mobile bottom nav
src/components/ui/                    — shadcn/ui (15 komponentów)
src/components/forms/                 — club, player, coach profile forms
src/components/sparings/              — sparing-form, sparing-card, invite-club-dialog
src/components/events/                — invite-player-dialog
src/components/onboarding/            — club, player, coach onboarding wizards
src/components/dashboard/             — club-sections, player-recruitments, club-invitations, recruitment-stats
src/components/squad/                 — invite-member-dialog, position-group
src/components/recruitment/           — recruitment-stats, stage-pill
src/components/leagues/               — poland-map
src/components/region-logo.tsx        — logo ZPN regionu (reużywalny)
src/components/social-links.tsx       — ikony FB/Insta (reużywalny)
src/components/                       — empty-state, confirm-dialog, breadcrumbs, star-rating,
                                        favorite-button, follow-club-button, back-button,
                                        profile-message-button, club-invite-button, scroll-reveal,
                                        image-upload, card-skeleton, theme-toggle, language-toggle,
                                        map-view, push-notification-toggle, form-tooltip,
                                        public-profile-cta, stats-cell, match-card, activity-heatmap

src/hooks/use-infinite-scroll.ts
src/types/next-auth.d.ts          — Session + JWT types (id, role)

src/app/robots.ts, sitemap.ts, manifest.ts, icon.svg, error.tsx, not-found.tsx

playwright.config.ts
e2e/helpers.ts + *.spec.ts        — 7 plików testowych
```

---

## Kluczowe Decyzje Techniczne

1. **Monorepo** Next.js full-stack
2. **Prisma 7** — `prisma.config.ts` z `process.env.DATABASE_URL!` (nie `env()` — bug na Windows + Vercel)
3. **Prisma adapter-pg** z `PoolConfig` object, Transaction Pooler (port 6543, max:1)
4. **Middleware** — `getToken()` z `next-auth/jwt` (Edge-compatible)
5. **Zod v4** — import z `zod/v4`
6. **tRPC** — `applyFor` (nie `apply` — reserved word)
7. **Auth.js v5 na Vercel** — `AUTH_SECRET`, `AUTH_TRUST_HOST=true`, cookie `__Secure-authjs.session-token`
8. **SessionProvider** w root layout — wymagany dla `signIn()`/`useSession()`
9. **Sidebar layout** — desktop fixed 256px (`md:flex`, X-style collapsible "Więcej") + bottom nav mobile (`md:hidden`)
10. **Fonty Inter + Rubik** — CSS variables (`--font-inter`, `--font-rubik`) na `<html>`, Rubik przez `font-display` Tailwind class
11. **Kolorowanie typów** — emerald=sparingi, violet=wydarzenia, blue=kluby, orange=zawodnicy, amber=wiadomości, cyan=transfery, x-blue=active tabs/chat/notifications
12. **Notyfikacje fire-and-forget** — `.catch(err => console.error("[context]", err))`, nie blokują response
13. **Server-side upload** — `/api/upload` z `SUPABASE_SERVICE_ROLE_KEY` (nie anon key)
14. **Migracje** — ręcznie przed deploy: `npm run db:migrate -- --url "..." --name <nazwa>`

---

## Następna sesja — TODO (priority-ordered)

> Sesja 2026-04-18 zamknęła etap 74 (landing polish + full QA pass).
> **Odkryte 4 pre-existing E2E failures — Priority 1.**
> Kontekst: GTM = FB groups, pre-launch, priorytet = „platforma
> działa zgodnie z zamysłem" (Workstream A) równolegle z
> „FB-traffic-friendly gateway" (Workstream B — landing ✅ done).

### ⚠️ Przed startem nowej sesji — status deploy
- **Migracja prod `add_club_cover_url`:** ✅ zastosowana (2026-04-17).
- **Branch `main`:** lokalne commity 69–74 (incl. `e1e2ca4` landing
  fix), wymaga **`git push origin main`**.

### Priority 1 — E2E debug z Playwright trace (~2h)

**Root cause bez trace'a = zgadywanie. Start w NEXT sesji:**

```bash
npx playwright test --trace on --headed e2e/quick-apply.spec.ts
npx playwright show-trace test-results/.../trace.zip
```

Patrzeć na: `elementFromPoint` przy click, stability check
(animation frames), `<Image>` load timing, Next.js Link prefetch,
`transition-all` CSS.

1. **`quick-apply.spec.ts:12`** — click timeout na inline „Aplikuj"
   button w `SparingCard`. Hipoteza: **Etap 72 (img→Image)**
   wprowadził regresję niezauważoną (tamta weryfikacja testowała
   tylko `sparing-advanced+digest-urls`). Pattern: Next.js `<Image>`
   layout shift + `transition-all` hover + Playwright stability
   check. **Cofnięte próby fixa:** stopPropagation na button `onClick`
   (nie zadziałało), hoist button OUT of `<Link>` as sibling w outer
   div `position:relative` (nie zadziałało, przejściowo rozwalił
   digest.spec.ts przez compile error w oknie edit-between).
   **Rekomendacja:** trace first, nie dalsza iteracja na ślepo.
2. **`digest.spec.ts:44`** — CLUB pending application digest row
   click timeout. Prawdop. **ta sama klasa problemu co quick-apply**
   (click w karcie zawierającej Link + Image). Fix quick-apply może
   naprawić ten test przy okazji.
3. **`dashboard-sections.spec.ts:60+74`** — `toBeVisible` fail na
   position filter pills (PlayersSection) + SectionNavMobile pill bar
   na mobile viewport. Selektory prawdopod. nieaktualne po ostatnim
   refaktorze sekcji (Etap 51). Naprawić selektory **w teście**,
   nie w kodzie — jeśli UI faktycznie renderuje element.

### Priority 2 — po fixie P1
- **D3 Unified sparing flow** (~4h, high-risk) — dwa tory
  („szybki sparing" vs 3-krokowy wizard) z kolizjami. Progressive
  disclosure w jednym formularzu. **Prerequisite:** UX evidence
  (analytics, session recordings). Bez evidence → defer.
- **Digest telemetry pipeline** — spiąć `[digest:click]` console.info
  (Etap 71) do Vercel Analytics albo `/api/telemetry`.
- **ESLint `config.mjs` warning** (`import/no-anonymous-default-export`) —
  1× pre-existing, assign do var przed export.

### Priority 3 — opcjonalne polish z sesji 2026-04-18
- **Weryfikacja landing w browserze** — scommitowano `e1e2ca4` bez
  uruchomienia dev servera. Kontrola: czy gradient violet→orange
  na h1 nie wygląda za „rainbow"; jeśli tak — zamienić na solid
  `text-violet-400`.
- **Copy review** — nowe headline i subhead są generyczne. Po
  soft-launchu (5-10 klubów) zebrać feedback i doprecyzować value
  prop pod konkretny painpoint.

### Priority 3 — audit findings domknięte (dla referencji)
- ~~**A1** Landing hero product shot~~ — ✅ Etap 57
- ~~**A2** Rotujący headline per persona~~ — ✅ Etap 63
- ~~**A3** Coachmark tour + persistent „Pierwsze kroki" + FAB~~ — ✅ Etap 62 (bez coachmark tour)
- ~~**C2** Reputation metrics na profilu~~ — ✅ Etap 58
- ~~**B1** Feed hierarchia~~ — ✅ Etap 59
- ~~**B3** Notification grouping~~ — ✅ Etap 61
- ~~**C3** „Kluby dla Ciebie" z reasoning~~ — ✅ Etap 64
- **D3** Unified sparing flow — „szybki sparing" vs 3-krokowy wizard to dwa tory z kolizjami. Progressive disclosure w jednym formularzu.
- ~~**E3** Global search / command palette (⌘K)~~ — ✅ Etap 60
- ~~**C1** Cover photo na profilu klubu~~ — ✅ Etap 56

### Priority 4 — hygiene
- ~~**`next lint` broken**~~ — ✅ Etap 65 (ESLint 9 flat config)
- ~~**ESLint cleanup (errors)**~~ — ✅ Etap 67 (0 errors)
- ~~**ESLint exhaustive-deps cleanup**~~ — ✅ Etap 70 (10 warnings fixed, 45→35)
- ~~**ESLint img warnings (34×)**~~ — ✅ Etap 72 (0 img warnings, 35→1)
- ~~**React Compiler enable**~~ — ✅ Etap 73 (build + 12/12 E2E pass)
- **eslint.config.mjs 1 warning** — `import/no-anonymous-default-export`; fix zablokowany przez guard-config hook, wymaga explicit user unlock.

---

## Znane Problemy (backlog)

| # | Problem | Priorytet |
|---|---------|-----------|
| ~~1~~ | ~~Cookie `__Secure-` nie działa na localhost (HTTP)~~ | ~~✅ Naprawione (Etap 52 — middleware sprawdza protokół, HTTPS=__Secure-, HTTP=bez prefixu)~~ |
| ~~6~~ | ~~2 testy w `e2e/auth.spec.ts` failing (outdated: h1 "Feed"→"Pulpit" po Etap 47, `tab`→`button` role selector)~~ | ~~✅ Naprawione (Etap 52)~~ |
| ~~7~~ | ~~14 E2E testów failing (pre-existing, odblokowane po fix middleware)~~ | ~~✅ Naprawione w większości (Etap 53) — 43/47 pass (91.4%), pozostałe 2: complete sparing flow + onboarding step re-mount (`test.skip`)~~ |
| ~~8~~ | ~~E2E: `sparing-advanced.spec:65` "club A accepts and completes"~~ | ~~✅ Etap 69 — race condition: `getByText("Dopasowany")` matchował timeline label przed zmianą statusu. Zamiana na `expect(completeBtn).toBeVisible()` który renderuje się tylko przy `status=MATCHED`.~~ |
| ~~9~~ | ~~Filtr `?filter=pending-attendance` na `/events`~~ | ~~✅ Etap 55 — filter search tab do RECRUITMENT/TRYOUT/CONTINUOUS_RECRUITMENT w 48h~~ |
| ~~10~~ | ~~Tab `?tab=applications` na `/sparings`~~ | ~~✅ Etap 55 — URL handler otwiera „Moje sparingi"~~ |
| ~~11~~ | ~~Tab `?tab=invitations` na `/sparings`~~ | ~~✅ Etap 55 — URL handler otwiera „Moje sparingi"~~ |
| ~~12~~ | ~~Zakres `?range=week` na `/calendar`~~ | ~~✅ Etap 55 — switch do list view + week date range~~ |
| ~~13~~ | ~~Filtr `?filter=stale` na `/recruitment`~~ | ~~✅ Etap 55 — client-side filter entries `updatedAt >14d`~~ |
| ~~14~~ | ~~Tab `?tab=my-applications` na `/events`~~ | ~~✅ Etap 55 — nowy `MyApplicationsTab` dla PLAYER z `event.myApplications`~~ |
| ~~15~~ | ~~Filtr `?filter=recommended` na `/events`~~ | ~~✅ Etap 55 — filter RECRUITMENT + player's region + upcoming~~ |
| ~~16~~ | ~~Tab `?tab=applications` na `/trainings`~~ | ~~✅ Etap 55 — nowy endpoint `event.myCoachTrainings` + tab „Zgłoszenia" dla COACH~~ |
| ~~17~~ | ~~Filtr `?filter=invitations` na `/notifications`~~ | ~~✅ Etap 55 — client-side filter na typach CLUB_INVITATION/SPARING_INVITATION/MEMBERSHIP_REQUEST~~ |
| ~~18~~ | ~~35 ESLint warnings pre-existing (34× `<img>` → `<Image />`)~~ | ~~✅ Etap 72 — 0 img warnings, only 1 pre-existing (eslint.config.mjs anon default)~~ |
| 19 | E2E `quick-apply.spec.ts:12` click timeout 60s na inline „Aplikuj" button w `SparingCard`. Odkryte w Etap 74 QA pass. Hipoteza: regres z Etap 72 (img→Image). Wymaga Playwright trace. | Średni |
| 20 | E2E `dashboard-sections.spec.ts:60` — `toBeVisible` fail na position filter pills w `PlayersSection`. Odkryte w Etap 74. Prawdop. stare selektory po refaktorze sekcji (Etap 51). | Niski |
| 21 | E2E `dashboard-sections.spec.ts:74` — `toBeVisible` fail na `SectionNavMobile` pill bar (mobile viewport). Odkryte w Etap 74. Podobnie jak #20 — prawdop. selektor testowy. | Niski |
| 22 | E2E `digest.spec.ts:44` click timeout — CLUB pending application digest row nawigacja. Odkryte w Etap 74. Prawdop. **ta sama klasa** co #19 (Link + Image + transition-all). | Średni |
| ~~2~~ | ~~Upload bez walidacji server-side content-type~~ | ~~✅ Naprawione (Etap 34)~~ |
| ~~3~~ | ~~Fire-and-forget notifications połykają błędy~~ | ~~✅ Naprawione (Etap 42 — kontekstowe console.error)~~ |
| ~~4~~ | ~~Brak unit testów (tylko E2E)~~ | ~~✅ Naprawione (Etap 34 — Vitest, 33 testów)~~ |
| ~~5~~ | ~~Zduplikowane patterny list — shared hook~~ | ~~✅ Naprawione (Etap 34 — usePaginatedList)~~ |

---

## Supabase

- Projekt: **Kabanos** (free tier)
- Host: `aws-1-eu-west-1.pooler.supabase.com` (Transaction Pooler, port 6543)
- Storage: bucket `avatars` (public, 5 MB, image/webp after compression)

---

## Instrukcje na start sesji

1. Przeczytaj ten plik (`STATE.md`).
2. **Nie skanuj** całego repo — pliki kluczowe wymienione powyżej.
3. Przed instalacją nowych zależności — pytaj o zgodę.
4. **Prisma migrations:** `npm run db:migrate -- --url "postgresql://..." --name <nazwa>`. `env()` nie działa na Windows → zawsze `--url "..."`.
5. **UI kolorowanie:** emerald=sparingi, violet=wydarzenia, blue=kluby, orange=zawodnicy, amber=wiadomości, cyan=transfery.
6. **Nawigacja:** sidebar.tsx (desktop) + bottom-nav.tsx (mobile). Stary dashboard-nav.tsx jest DEPRECATED.
7. **Komponenty reużywalne:** EmptyState, ConfirmDialog, Breadcrumbs, FormTooltip, StarRating, BackButton, ScrollReveal. Używaj zamiast inline.
8. **Animacje:** `animate-fade-in` na stronach, `animate-scale-in` na modalach. Brak `stagger-children` i `page-enter` (usunięte — performance).

---

## Reguły aktualizacji tego pliku

> **WAŻNE:** Po zakończeniu każdej sesji wykonaj:
>
> 1. **CHANGELOG.md** — dodaj nowy etap na końcu pliku (append-only).
> 2. **STATE.md sekcja "Co jest zbudowane"** — zaktualizuj odpowiednie bullet points (dodaj nowe feature, zmień opis istniejącego). Nie dodawaj szczegółów implementacji — te idą do CHANGELOG.
> 3. **STATE.md sekcja "Ostatnie zmiany"** — dodaj nowy wiersz na górze tabeli. Jeśli tabela ma >5 wierszy, **usuń najstarszy** (FIFO).
> 4. **STATE.md sekcja "Znane Problemy"** — zaktualizuj jeśli naprawiono bug lub pojawił się nowy.
> 5. **Pilnuj limitu:** STATE.md nie powinien przekraczać ~350 linii. Jeśli przekracza, skompresuj sekcję "Co jest zbudowane".
