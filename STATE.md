# PilkaSport — Stan Projektu

**Ostatnia sesja:** 2026-03-28
**Aktualny etap:** 37 etapów ukończonych
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
- Zaproszenia (`SparingInvitation` z expiresAt)
- Wyniki meczów (submit + confirm flow, push + email notifications)
- Protokół meczowy: strzelcy bramek (MatchGoal) z kadry obu klubów, powiadomienia + gamifikacja
- Koszty: costPerTeam na sparingach/turniejach, costPerPerson na wydarzeniach, status opłacone/nieopłacone per strona
- Recenzje (rating 1-5, StarRating komponent)
- Post-match timeline, "Moje sparingi" z tabs per status

### Wydarzenia (7 typów)
- Typy: OPEN_TRAINING, RECRUITMENT, TRYOUT, CAMP, CONTINUOUS_RECRUITMENT, INDIVIDUAL_TRAINING, GROUP_TRAINING
- Widoczność: PUBLIC / INTERNAL (tylko kadra)
- Obecność: YES/NO/MAYBE (AttendanceSection)
- Delegowanie uprawnień (canManageEvents)
- COACH tworzy treningi przez klub (membership required)

### Turnieje
- Format: faza grupowa, puchar (drabinka), grupa + puchar (4-16 drużyn)
- Rejestracja: kluby i ad-hoc drużyny, accept/reject przez organizatora
- Round-robin + knockout bracket (auto-generowane)
- Wyniki z dwustronnym potwierdzeniem, karne w fazie pucharowej
- Tabele grupowe (materialized standings), strzelcy turnieju
- 5-tabowa strona turnieju (Drużyny/Grupy/Drabinka/Strzelcy/Info)
- Feed + kalendarz + sidebar integration (orange accent)
- Gamifikacja: tournament_created/win/goal + badge "Mistrz turniejów"

### Transfery & Rekrutacja
- Ogłoszenia transferowe (LOOKING_FOR_CLUB/PLAYER/FREE_AGENT)
- Pipeline rekrutacyjny: Kanban board (6 etapów WATCHING→SIGNED), drag-and-drop
- RecruitmentEvent timeline, stats, CSV export
- "Na radar" button, "Nabory dla Ciebie" (region-matched)

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
- Mapa Polski (grid 4x4), badge "Aktywny" przy klubach
- Dynamic sitemap (~480 URL-i)

### Powiadomienia & Push & Email
- In-app: 15+ typów, fire-and-forget, bell badge z polling 60s
- Push: web-push + VAPID, Service Worker, auto-cleanup expired subscriptions
- Email: Resend (6 triggerów: sparing apply/respond/invite, score submit, message, club invite), throttle 15min na wiadomościach
- Przypomnienia 24h (attendance, inactive clubs, stale pipeline)

### Gamifikacja
- Punkty (17 akcji w tym goal_scored), 9 odznak, leaderboard top 20
- `/ranking` — punkty, odznaki, historia

### UI/Design
- **Paleta FotMob:** primary violet `#7c3aed`, gradient violet→sky, dark bg `#111827` (gray-900)
- **Club flow FotMob style:** dashboard (hero+stats+NextMatch+alerts), kadra (position-grouped), pipeline (progress bar+stage pills), profil publiczny (5-tab single-column)
- Shared components: StatsCell, MatchCard (compact/highlight), PositionGroup, StagePill
- Sidebar desktop (240px) + Bottom Nav mobile (role-aware)
- 6 systemów animacji: ScrollReveal, Hover Glow, Animated Hero, Micro-interactions, Page Transitions, `prefers-reduced-motion`
- Landing: dark-first, animated blobs, gradient text, dot grid
- shadcn/ui: 15 komponentów
- Dark mode: class-based, ThemeToggle, zero-flash script

### Inne
- Feed z regionu (sparingi, wydarzenia, kluby, zawodnicy, transfery, posty)
- Wyszukiwarka globalna, ulubione, kalendarz, mapa (Leaflet), statystyki (Recharts)
- Publiczne profile: kluby, zawodnicy, trenerzy (SEO z generateMetadata)
- Klikalne profile na 11+ stronach (`getProfileHref()`)
- E2E: Playwright, 26+ testów
- Unit: Vitest, 33 testów (format, gamification, form-errors, award-points, is-club-member, file-validation)
- Server-side file validation: magic bytes (JPEG/PNG/WebP) w `/api/upload`
- Shared hook `usePaginatedList` — DRY pagination w sparings + events

---

## Ostatnie zmiany (max 5, FIFO)

| Etap | Data | Opis |
|------|------|------|
| 37 | 2026-03-28 | Rozliczenia kosztów — costPerTeam/costPerPerson + payment status tracking (sparingi, wydarzenia, turnieje) |
| 36 | 2026-03-28 | Moduł Turniejowy — grupa + puchar, 5 modeli, 15 procedur, 5-tabowa strona, feed/kalendarz/sidebar |
| 35 | 2026-03-28 | Etap B — Email transakcyjne (Resend, 6 triggerów) + Protokół meczowy (strzelcy bramek, MatchGoal) |
| 34 | 2026-03-28 | Backlog Etap A — Vitest (33 testów), magic bytes upload validation, usePaginatedList hook |
| 33 | 2026-03-28 | FotMob Club Flow Redesign — dashboard, kadra, pipeline, profil publiczny (gray-900 tokens, 4 shared components) |

> Szczegóły wszystkich etapów: [CHANGELOG.md](CHANGELOG.md)

---

## Tech Stack

| Warstwa | Technologia |
|---------|-------------|
| Frontend | Next.js 16 (App Router) + TypeScript |
| UI | Tailwind CSS 4 + shadcn/ui (15) + sonner + Recharts + Leaflet |
| Font | Inter (next/font/google) |
| API | tRPC v11 (fetch adapter) |
| ORM | Prisma 7 + @prisma/adapter-pg |
| DB | PostgreSQL (Supabase — Transaction Pooler, port 6543) |
| Storage | Supabase Storage (bucket `avatars`, server-side upload) |
| Push | web-push (VAPID, Service Worker) |
| Auth | Auth.js v5 (next-auth@beta) |
| Walidacja | Zod v4 |
| Testy | Playwright (E2E, 26+) + Vitest (unit, 33) |
| Hosting | Vercel (`pilkarski.vercel.app`) |

---

## Kluczowe Pliki

```
prisma/schema.prisma              — schemat BD (27+ modeli)
prisma/prisma.config.ts           — konfiguracja Prisma 7
prisma/migrations/                — migracje BD (16 migracji)
prisma/seed.ts                    — seed regionów/lig/grup

src/middleware.ts                  — ochrona tras (JWT, public prefixes)
src/server/auth/config.ts         — Auth.js config
src/server/db/client.ts           — Prisma client singleton
src/server/trpc/trpc.ts           — tRPC init + procedures
src/server/trpc/router.ts         — root router (14 routerów)
src/server/trpc/routers/          — auth, club, player, coach, region, sparing, event,
                                    message, feed, search, notification, favorite, stats,
                                    review, transfer, gamification, push, recruitment,
                                    club-post, club-membership, team-lineup
src/server/award-points.ts        — gamifikacja helper
src/server/send-push.ts           — web-push helper
src/server/is-club-member.ts      — membership helpers
src/server/check-event-permission.ts — event permission helper
src/app/api/upload/route.ts       — server-side image upload
src/app/api/reminders/route.ts    — cron przypomnienia

src/lib/trpc.ts                   — tRPC client (frontend)
src/lib/supabase.ts               — Supabase client (realtime)
src/lib/labels.ts                 — stałe, labele, statusy, helpers (getUserDisplayName, getProfileHref, pluralPL)
src/lib/format.ts                 — formatDate, formatEventDateTime
src/lib/rate-limit.ts             — in-memory rate limiter
src/lib/gamification.ts           — punkty, odznaki
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
src/components/sparings/              — sparing-form, sparing-card
src/components/onboarding/            — club, player, coach onboarding wizards
src/components/dashboard/             — club-sections, player-recruitments, club-invitations, recruitment-stats
src/components/squad/                 — invite-member-dialog, position-group
src/components/recruitment/           — recruitment-stats, stage-pill
src/components/leagues/               — poland-map
src/components/                       — empty-state, confirm-dialog, breadcrumbs, star-rating,
                                        favorite-button, follow-club-button, back-button,
                                        profile-message-button, club-invite-button, scroll-reveal,
                                        image-upload, card-skeleton, theme-toggle, map-view,
                                        push-notification-toggle, form-tooltip, public-profile-cta,
                                        stats-cell, match-card

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
9. **Sidebar layout** — desktop fixed 240px (`md:flex`) + bottom nav mobile (`md:hidden`)
10. **Font Inter** — className na `<html>`, NIE font-family w globals.css
11. **Kolorowanie typów** — emerald=sparingi, violet=wydarzenia, blue=kluby, orange=zawodnicy, amber=wiadomości, cyan=transfery, pink=notifications
12. **Notyfikacje fire-and-forget** — `.catch(() => {})`, nie blokują response
13. **Server-side upload** — `/api/upload` z `SUPABASE_SERVICE_ROLE_KEY` (nie anon key)
14. **Migracje** — ręcznie przed deploy: `npm run db:migrate -- --url "..." --name <nazwa>`

---

## Znane Problemy (backlog)

| # | Problem | Priorytet |
|---|---------|-----------|
| 1 | Cookie `__Secure-` nie działa na localhost (HTTP) | Low |
| ~~2~~ | ~~Upload bez walidacji server-side content-type~~ | ~~✅ Naprawione (Etap 34)~~ |
| 3 | Fire-and-forget notifications połykają błędy | Low |
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
8. **Animacje:** `.stagger-children` na listach, `animate-fade-in` na stronach, `animate-scale-in` na modalach.

---

## Reguły aktualizacji tego pliku

> **WAŻNE:** Po zakończeniu każdej sesji wykonaj:
>
> 1. **CHANGELOG.md** — dodaj nowy etap na końcu pliku (append-only).
> 2. **STATE.md sekcja "Co jest zbudowane"** — zaktualizuj odpowiednie bullet points (dodaj nowe feature, zmień opis istniejącego). Nie dodawaj szczegółów implementacji — te idą do CHANGELOG.
> 3. **STATE.md sekcja "Ostatnie zmiany"** — dodaj nowy wiersz na górze tabeli. Jeśli tabela ma >5 wierszy, **usuń najstarszy** (FIFO).
> 4. **STATE.md sekcja "Znane Problemy"** — zaktualizuj jeśli naprawiono bug lub pojawił się nowy.
> 5. **Pilnuj limitu:** STATE.md nie powinien przekraczać ~350 linii. Jeśli przekracza, skompresuj sekcję "Co jest zbudowane".
