# PilkaSport — Stan Projektu

**Ostatnia sesja:** 2026-04-17
**Aktualny etap:** 54 etapów ukończonych
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
| 54 | 2026-04-17 | Digest Card: karta „Twój status" na feedzie per rola (CLUB/PLAYER/COACH) — 14 wierszy liczników (aplikacje, zaproszenia, attendance 48h, upcoming 7d, stale pipeline, recommendations). Nowy `digest.get` tRPC endpoint + `src/lib/digest.ts` helpers. 87/87 unit tests pass, 1 E2E (+1 fixme). Inwalidacja cache z 9 mutacji. 9 backlog rows (brakujące filtry `?tab/?filter` — Low). |
| 53 | 2026-04-16 | Stabilizacja E2E (bug #7): +16 testów odblokowanych — recruitment-board 4/4 (+fix Rules of Hooks violation w `/recruitment`), coach 4/4, event, messages, sparing, sparing-advanced, public-profiles, onboarding. Robust `login()` helper w helpers.ts. 43/47 pass (91.4%). Simplify review: usunięty duplikat `robustLogin`, `test.skip` → `test.fixme`. |
| 52 | 2026-04-16 | Stabilizacja: E2E spec dla Etap 51 (5 testów — SectionNav desktop/mobile, URL routing, filtr pozycji, PLAYER bez sekcji), fix middleware cookie name (HTTP/HTTPS-aware), archiwizacja 3 przedawnionych planów po pivocie matchmaking |
| 51 | 2026-04-16 | Dashboard Sections: Pulpit klubowy z 5 sekcjami (Terminarz/Aktywność/Rekrutacja/Szukający klubu/Nowe kluby), filtr pozycji, feed redistribution, deduplikacja, date picker fix |
| 50 | 2026-04-14 | Activity Heatmap: GitHub-style heatmap aktywności na publicznych profilach (klub/zawodnik/trener), 4 stat cards, tooltip, responsive |

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

> Audyt UX z 2026-04-17 zidentyfikował 15 findings (3 × 5 kategorii). Z top 3 do wdrożenia wybrane:
> **B2 Digest Card** (✅ Etap 54), **D1 Quick-apply**, **E1+E2 Design sweep**. Reszta w `docs/superpowers/specs/2026-04-17-digest-card-design.md` sekcja „Out of scope" + poniższe.

### Priority 1 — pick next
- **D1 Inline quick-apply na karcie sparingu** — 1-click apply zamiast 2. Nowy brainstorming → spec → plan → execute. Reużywa istniejący `sparing.applyFor` mutation. Effort: mały. Impact: konwersja × 2 na core business flow.
- **E1+E2 Design discipline sweep** — łamany własny DESIGN.md (indigo/sky gradienty w landing + profilu klubu), unifikacja „Pulpit/Feed/Panel". Effort: mały. Impact: polish widoczny wszędzie.

### Priority 2 — follow-up z Etap 54 (non-blocking, drobne)
- Zamień `recommendedWhere: any` → `Prisma.EventWhereInput` w `src/lib/digest.ts:201` (~10 min).
- Decyzja dla `generatedAt`: wire relative timestamp (`formatDistanceToNow`) albo drop z `DigestResponse` contract (obecnie unused client-side).
- Happy-path E2E dla digestu (`e2e/digest.spec.ts:47` fixme) gdy pojawi się seed helper dla pending sparing application.
- Digest telemetria — log click-through per `row.key` (przy własnym telemetry pipeline, obecnie brak).

### Priority 3 — audit findings odsunięte (osobne cykle)
- **A1** Landing — product shot/GIF/preview feedu w hero (zamiast tylko tekstu + CTA).
- **A2** Propozycja wartości — rotujący headline per persona (Strava pattern) albo 3 landing warianty per rola.
- **A3** Coachmark tour + persistent „Pierwsze kroki" + FAB „Dodaj sparing" na feedzie CLUB.
- **B1** Feed hierarchia — przenieść `DashboardStats` do sidebar, uprościć main column.
- **B3** Notification grouping — `/notifications` jako płaska lista; konkurencja (FB/IG) grupuje per typ/aktor + sekcje „Dziś/Wcześniej".
- **C1** Cover photo na profilu klubu (data model: `Club.coverUrl` + upload flow). Landing + club profile używają indigo/sky gradients (łamie DESIGN.md).
- **C2** Reputation metrics na profilu — response rate, response time, fulfilment rate jako badge pod avatarem (Airbnb pattern).
- **C3** „Kluby dla Ciebie" (PLAYER) z reasoning — `NewClubsInRegion` istnieje, ale bez kuratorstwa.
- **D2** PLAYER view „Twoje aplikacje" — osobna ścieżka `/events?tab=my-applications` (obecnie fallback do parent view, patrz #14 w backlog).
- **D3** Unified sparing flow — „szybki sparing" vs 3-krokowy wizard to dwa tory z kolizjami. Progressive disclosure w jednym formularzu.
- **E3** Global search / command palette (⌘K) + search w sidebar header (desktop).

### Priority 4 — hygiene
- **`next lint` broken** — Next.js 16 usunął `next lint` subcommand, `npm run lint` rzuca błąd. Do decyzji: ESLint 9 flat config (`eslint.config.mjs`) albo `biome`. Pre-existing od upgrade'u, nieblokujący.
- Push 15 commitów z Etapu 54 na `origin/main` → auto-deploy Vercel (jeśli nie wypchnięte przez skończeniem sesji).

---

## Znane Problemy (backlog)

| # | Problem | Priorytet |
|---|---------|-----------|
| ~~1~~ | ~~Cookie `__Secure-` nie działa na localhost (HTTP)~~ | ~~✅ Naprawione (Etap 52 — middleware sprawdza protokół, HTTPS=__Secure-, HTTP=bez prefixu)~~ |
| ~~6~~ | ~~2 testy w `e2e/auth.spec.ts` failing (outdated: h1 "Feed"→"Pulpit" po Etap 47, `tab`→`button` role selector)~~ | ~~✅ Naprawione (Etap 52)~~ |
| ~~7~~ | ~~14 E2E testów failing (pre-existing, odblokowane po fix middleware)~~ | ~~✅ Naprawione w większości (Etap 53) — 43/47 pass (91.4%), pozostałe 2: complete sparing flow + onboarding step re-mount (`test.skip`)~~ |
| 8 | E2E: `sparing-advanced.spec:65` "club A accepts and completes" — complete sparing flow (`Oznacz jako zakończony` button) nie wykonuje się w teście. Do sprawdzenia czy to bug w teście czy w UI. | Low |
| 9 | Filtr `?filter=pending-attendance` na `/events` — brak handlera (`events/page.tsx` nie czyta URL), digest linkuje do pełnej listy wydarzeń zamiast zgłoszeń czekających na potwierdzenie obecności | Low |
| 10 | Tab `?tab=applications` na `/sparings` — brak handlera (`sparings-client.tsx` używa lokalnego `useState` bez synchronizacji z URL), digest linkuje klub do zakładki "Szukaj" zamiast "Moje sparingi" z pendingami | Low |
| 11 | Tab `?tab=invitations` na `/sparings` — brak osobnej zakładki invitations, digest linkuje do listy sparingów bez możliwości filtrowania zaproszeń | Low |
| 12 | Zakres `?range=week` na `/calendar` — `CalendarView` nie czyta URL, digest linkuje do domyślnego widoku miesięcznego zamiast tygodniowego | Low |
| 13 | Filtr `?filter=stale` na `/recruitment` — brak handlera (`StagePill` filter to lokalny `activeStage`), digest linkuje do pełnego pipeline zamiast kandydatów bez ruchu >14 dni | Low |
| 14 | Tab `?tab=my-applications` na `/events` — zakładka nie istnieje (tylko `search`/`my` dla klubów/trenerów), digest linkuje zawodnika do wyszukiwarki zamiast jego aplikacji | Low |
| 15 | Filtr `?filter=recommended` na `/events` — brak zakładki/filtra "polecane", digest linkuje zawodnika do pełnej listy zamiast nowych naborów dopasowanych do profilu | Low |
| 16 | Tab `?tab=applications` na `/trainings` — zakładki to `trainings`/`coaches` (brak `applications`), digest linkuje trenera do listy treningów zamiast zgłoszeń na jego treningi | Low |
| 17 | Filtr `?filter=invitations` na `/notifications` — strona jest płaską listą (brak filtrów), digest linkuje trenera do wszystkich powiadomień zamiast samych zaproszeń od klubów | Low |
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
