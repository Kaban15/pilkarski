# PilkaSport — Stan Projektu

## Aktualny etap: Fazy 1–12 + Prisma Migrations
**Ostatnia sesja:** 2026-03-22

---

## Co jest gotowe

### Faza 1: Inicjalizacja ✅
- Next.js 16 + TypeScript + Tailwind CSS 4 + shadcn/ui
- Prisma 7 z `@prisma/adapter-pg` (Supabase Session Pooler)
- tRPC v11 (fetch adapter, superjson)
- Struktura folderów, git repo, `.env`, `.gitignore`

### Faza 2: Auth + Profile ✅
- Auth.js v5 (credentials provider, JWT sessions)
- Rejestracja `/register` z wyborem roli (Klub / Zawodnik)
- Logowanie `/login` (z Suspense boundary dla useSearchParams)
- Middleware ochrony tras (`getToken()` — Edge-compatible, bez Prisma)
- `protectedProcedure` w tRPC
- CRUD profilu Klubu: nazwa, miasto, region, kontakt, strona www, opis
- CRUD profilu Zawodnika: dane personalne, pozycja, wzrost/waga, noga, bio
- Historia kariery zawodnika (dodawanie/usuwanie)
- Cursor-based pagination na listach klubów i zawodników
- Zod v4 walidacja na wszystkich formularzach
- Dashboard layout z nawigacją (`DashboardNav`)
- shadcn/ui: Button, Input, Label, Card, Tabs, Select

### Faza 3: Regiony, Ligi, Grupy ✅
- Seed: 16 województw (ZPN), 80 szczebli ligowych, 272 grup
- tRPC region router: `list`, `leagueLevels`, `leagueGroups`, `hierarchy`
- Kaskadowe dropdowny w profilu klubu: Region → Szczebel → Grupa
- `dotenv` + `tsx` do uruchamiania seed

### Faza 4: Sparingi i Wydarzenia ✅
- **Sparingi:**
  - `sparing.create` / `list` / `getById` / `applyFor` / `respond` / `cancel` / `my`
  - Tworzenie ogłoszenia (tytuł, data, miejsce, koszty, region)
  - Aplikowanie klubów + akceptacja/odrzucenie przez właściciela
  - Auto-reject pozostałych po akceptacji → status MATCHED
  - UI: `/sparings` (lista + filtr region), `/sparings/new`, `/sparings/[id]`
- **Wydarzenia:**
  - `event.create` / `list` / `getById` / `applyFor` / `respond` / `my` / `myApplications`
  - Typy: trening otwarty, nabór
  - Zgłoszenia zawodników + akceptacja/odrzucenie przez klub
  - Limit miejsc (maxParticipants) respektowany
  - UI: `/events` (lista + filtry region/typ), `/events/new`, `/events/[id]`

---

### Faza 5: System Wiadomości ✅
- **tRPC router `message`:**
  - `getConversations` — lista konwersacji z ostatnią wiadomością i danymi rozmówcy
  - `getMessages` — wiadomości w konwersacji (cursor-based pagination)
  - `send` — wyślij wiadomość (auto-tworzenie konwersacji jeśli nie istnieje)
  - `markAsRead` — oznacz wiadomości od rozmówcy jako przeczytane
  - `unreadCount` — liczba nieprzeczytanych (do badge'a)
  - `getConversationWith` — szukanie istniejącej konwersacji z danym userem
- **UI:**
  - `/messages` — lista konwersacji (avatar, nazwa, ostatnia wiadomość, data)
  - `/messages/[conversationId]` — widok czatu (bąbelki, auto-scroll, polling co 5s)
  - Komponent `SendMessageButton` — przycisk "Napisz wiadomość" (inline formularz → redirect do czatu)
  - Przycisk dodany na `/sparings/[id]` i `/events/[id]` (kontakt z właścicielem klubu)
- **Prisma:** modele `Conversation`, `ConversationParticipant`, `Message`
- **Validators:** `sendMessageSchema`, `getMessagesSchema`, `markAsReadSchema`

---

### Faza 6: Feed, Filtrowanie, Polish ✅
- **Feed (`/feed`):**
  - tRPC `feed.get` — agregacja sparingów, wydarzeń, nowych klubów i zawodników z regionu użytkownika
  - Unified feed posortowany po dacie, kolorowe tagi typów (sparing/wydarzenie/klub/zawodnik)
- **Wyszukiwarka (`/search`):**
  - tRPC `search.global` — szukanie po klubach (nazwa, miasto), zawodnikach (imię, nazwisko), sparingach i wydarzeniach
  - Case-insensitive matching, wyniki pogrupowane po typie
- **Responsywność mobilna:**
  - Hamburger menu z animacją (3 kreski → X), pełne menu mobilne z linkami i wylogowaniem
- **SEO:**
  - Root layout: OpenGraph meta, template title (`%s | PilkaSport`), locale `pl_PL`
  - Landing page: dedykowane meta tagi i OG
- **Landing page (`/`):**
  - Hero z CTA (rejestracja + logowanie), sekcja 3 filarów, dolne CTA, footer
- **Code review & cleanup (`/simplify`):**
  - Wyekstrahowano wspólne stałe do `src/lib/labels.ts`: `POSITION_LABELS`, `EVENT_TYPE_LABELS`, `SPARING_STATUS_*`, `APPLICATION_STATUS_*`, `getUserDisplayName()`
  - Usunięto duplikacje z 6 plików UI (feed, search, events, sparings, messages)
  - Zrównoleglono zapytania w feed router (`Promise.all` dla club/player lookup)
  - Polling w czacie: change detection (skip `markAsRead` gdy brak nowych wiadomości)

---

### Faza 7: Publiczne Profile ✅
- **Strony publiczne (bez logowania):**
  - `/clubs/[id]` — profil klubu: logo, nazwa, miasto, region, liga, kontakt, www, opis
  - `/players/[id]` — profil zawodnika: zdjęcie, imię, pozycja, wiek, region, wzrost/waga, noga, bio, historia kariery
- **Middleware:** dodane `/clubs/` i `/players/` do publicznych prefixów
- **Linki:** karty klubów/zawodników w feedzie i wyszukiwarce prowadzą do publicznych profili
- **CTA:** przyciski "Dołącz do PilkaSport" / "Zaloguj się" na stronach publicznych
- **Layout:** grupa `(public)` z własnym layoutem (bez nawigacji dashboardu)

---

### Faza 8: Upload Zdjęć ✅
- **Supabase Storage:** bucket `avatars` (publiczny, 2 MB limit, JPEG/PNG/WebP)
- **Klient Supabase:** `src/lib/supabase.ts` (`@supabase/supabase-js`)
- **Komponent `ImageUpload`:** upload z podglądem, walidacja typu i rozmiaru, upsert
- **Formularz klubu:** upload logo (`logoUrl`) nad formularzem
- **Formularz zawodnika:** upload zdjęcia (`photoUrl`) nad formularzem
- **Publiczne profile:** wyświetlanie zdjęcia obok nazwy (placeholder z inicjałami gdy brak)
- **Validators:** `logoUrl` i `photoUrl` dodane do schematów Zod

---

### Faza 9: Powiadomienia ✅
- **Prisma:** model `Notification` (typ, tytuł, treść, link, read) — 19 tabel łącznie
- **Enum `NotificationType`:** SPARING_APPLICATION, SPARING_ACCEPTED, SPARING_REJECTED, EVENT_APPLICATION, EVENT_ACCEPTED, EVENT_REJECTED, NEW_MESSAGE
- **tRPC router `notification`:** `list` (cursor-based), `unreadCount`, `markAsRead`, `markAllAsRead`
- **Automatyczne notyfikacje (fire-and-forget):**
  - Aplikacja na sparing → powiadomienie do właściciela sparingu
  - Odpowiedź na aplikację sparingową → powiadomienie do aplikanta
  - Zgłoszenie na wydarzenie → powiadomienie do właściciela wydarzenia
  - Odpowiedź na zgłoszenie → powiadomienie do zawodnika
  - Nowa wiadomość → powiadomienie do odbiorcy
- **UI:**
  - Bell icon z badge w nawigacji (desktop + mobile), polling co 30s z change detection
  - `/notifications` — lista powiadomień z oznaczaniem jako przeczytane (pojedynczo + wszystkie)
  - Polskie etykiety typów (`NOTIFICATION_TYPE_LABELS`, `NOTIFICATION_TYPE_COLORS` w `labels.ts`)
- **Code review (`/simplify`):**
  - Bell icon SVG zdeduplikowany do komponentu `NotifBell`
  - `getUserDisplayName()` użyte w message.ts
  - Redundantne zapytania DB usunięte (include club w istniejącym query)
  - Notyfikacje fire-and-forget (nie blokują response'a)

---

### Faza 10: Testy E2E ✅
- **Playwright** (`@playwright/test`) — Chromium, headless
- **22 testy** pokrywające wszystkie krytyczne ścieżki:
  - **Auth (5):** rejestracja klub/zawodnik, logowanie, błędne hasło, redirect niezalogowanego, duplikat email
  - **Sparingi (4):** tworzenie → lista → aplikacja klubu B → akceptacja (status "Dopasowany")
  - **Wydarzenia (4):** tworzenie → lista → zgłoszenie zawodnika → akceptacja (status "Zaakceptowany")
  - **Wiadomości (4):** rejestracja kont → tworzenie sparingu → przycisk "Napisz wiadomość" → lista konwersacji
  - **Powiadomienia (2):** strona `/notifications` dostępna, bell icon w nawigacji
  - **Publiczne profile (3):** `/clubs/[id]` i `/players/[id]` bez logowania, landing page
- **Konfiguracja:** `playwright.config.ts` (workers: 1, serial, webServer: `npm run dev`)
- **Helpery:** `e2e/helpers.ts` — `registerClub`, `registerPlayer`, `login`, `logout`, `uniqueEmail`
- **Skrypty:** `npm run test:e2e` (headless), `npm run test:e2e:ui` (z UI)

---

### Faza 11: UX Polish ✅
- **Toast notifications (sonner):**
  - `<Toaster>` w root layout (`position="top-right"`, `richColors`, `closeButton`)
  - `toast.success()` / `toast.error()` na wszystkich akcjach: zapis profilu, tworzenie/aplikowanie/akceptacja/odrzucenie sparingów i wydarzeń, wysyłka wiadomości, rejestracja
  - Usunięto inline success/error state i `alert()` — zastąpione toastami
- **Skeleton loadery (shadcn/ui Skeleton):**
  - Komponent `CardSkeleton` z 4 wariantami: `CardSkeleton`, `FeedCardSkeleton`, `ConversationSkeleton`, `NotificationSkeleton`
  - Skeleton loadery na: feed, sparingi (lista + detail), wydarzenia (lista + detail), wiadomości (lista + czat), powiadomienia
- **Infinite scroll:**
  - Hook `useInfiniteScroll` (IntersectionObserver)
  - Automatyczne doładowywanie na listach sparingów i wydarzeń (cursor-based pagination z tRPC)
  - Skeleton loadery jako wskaźnik ładowania kolejnych elementów
- **Inline walidacja formularzy:**
  - Helper `getFieldErrors()` — parsowanie Zod errors na per-field messages
  - Walidacja client-side z podświetleniem pól (border-red-500) i komunikatami pod polami
  - Dodane na: rejestracja, nowy sparing, nowe wydarzenie

---

### Faza 12: Deploy + Quick Wins + Code Review ✅
- **Deploy na Vercel:**
  - Projekt: `pilkarski.vercel.app` (auto-deploy z GitHub `main`)
  - GitHub: `https://github.com/Kaban15/pilkarski`
  - Env vars: `DATABASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `AUTH_SECRET`, `AUTH_TRUST_HOST`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `postinstall: "prisma generate"` w package.json (Vercel nie ma wygenerowanego klienta)
- **Auth fixes (Vercel):**
  - `SessionProvider` w root layout (`src/components/providers.tsx`) — bez niego `signIn()` nie pobierał CSRF tokena
  - Middleware: cookie name `__Secure-authjs.session-token` + `AUTH_SECRET` (Auth.js v5 zmienił nazwy vs v4)
- **SEO:**
  - `robots.ts` — blokuje crawlery na prywatnych trasach
  - `sitemap.ts` — publiczne strony
  - `manifest.ts` — PWA manifest (standalone, theme green-600)
  - `icon.svg` — favicon SVG (zielona piłka z "PS")
- **Strony błędów:**
  - `error.tsx` — globalny error boundary (po polsku, przycisk "Spróbuj ponownie")
  - `not-found.tsx` — 404 (po polsku, link do strony głównej)
- **Rate limiting:**
  - In-memory rate limiter (`src/lib/rate-limit.ts`) z auto-cleanup co 5 min
  - Rejestracja: 3 próby/min na email
  - Logowanie: 5 prób/min na email
- **Publiczne profile — session-aware CTA:**
  - Komponent `PublicProfileCTA` — zalogowany widzi "Wróć do dashboardu", niezalogowany "Dołącz/Zaloguj"
- **Code review (`/simplify`):**
  - Fix memory leak w rate limiterze (unbounded Map → cleanup expired entries)
  - `FOOT_LABELS` scentralizowane do `labels.ts` (było zduplikowane)
  - Event type options z `EVENT_TYPE_LABELS` (było hardcoded)
  - `DetailPageSkeleton` wyekstrahowany (było zduplikowane w events/sparings)
  - `PublicProfileCTA` wyekstrahowany (było zduplikowane w clubs/players)

---

## Co zostało do zrobienia (opcjonalnie)
- Supabase Realtime (WebSocket) dla live chat

---

### Prisma Migrations ✅
- Baseline migration: `prisma/migrations/0_init/migration.sql` (336 linii, wygenerowane z live DB)
- Migration oznaczona jako zastosowana (`migrate resolve --applied 0_init`)
- `vercel-build` script: `prisma migrate deploy && next build` (Vercel używa tego zamiast `build`)
- Workflow zmian schematu:
  1. Edytuj `prisma/schema.prisma`
  2. `npm run db:migrate -- --url "postgresql://..." --name <nazwa_zmiany>` (tworzy plik migration)
  3. Commituj `prisma/migrations/` do gita
  4. Push → Vercel auto-deploy uruchamia `prisma migrate deploy`
- **Uwaga:** `env()` w `prisma.config.ts` nie działa na Windows (Prisma 7.5.0 bug) — zawsze używaj `--url "..."` dla lokalnych komend migrate

---

## Tech Stack
| Warstwa     | Technologia                            |
|-------------|----------------------------------------|
| Frontend    | Next.js 16 (App Router) + TypeScript   |
| UI          | Tailwind CSS 4 + shadcn/ui + sonner    |
| API         | tRPC v11 (fetch adapter)               |
| ORM         | Prisma 7 + @prisma/adapter-pg          |
| Baza danych | PostgreSQL (Supabase — Session Pooler) |
| Storage     | Supabase Storage (bucket `avatars`)    |
| Auth        | Auth.js v5 (next-auth@beta)            |
| Walidacja   | Zod v4                                 |
| Testy       | Playwright (E2E, 22 testy)             |
| Hosting     | Vercel (`pilkarski.vercel.app`)         |

---

## Kluczowe Pliki
```
prisma/schema.prisma                  — schemat BD (19 modeli)
prisma/prisma.config.ts               — konfiguracja Prisma 7 (env() helper)
prisma/seed.ts                        — seed regionów/lig/grup

src/middleware.ts                      — ochrona tras (JWT, Edge-compatible, public prefixes)
src/server/auth/config.ts             — Auth.js config (credentials)
src/server/db/client.ts               — Prisma client singleton (PrismaPg adapter)
src/server/trpc/trpc.ts               — tRPC init + publicProcedure + protectedProcedure
src/server/trpc/router.ts             — root router (health, auth, club, player, region, sparing, event, message, feed, search, notification)
src/server/trpc/routers/auth.ts       — rejestracja
src/server/trpc/routers/club.ts       — CRUD klubu + lista
src/server/trpc/routers/player.ts     — CRUD zawodnika + kariera + lista
src/server/trpc/routers/region.ts     — regiony, ligi, grupy, hierarchy
src/server/trpc/routers/sparing.ts    — CRUD sparingów + aplikacje + notyfikacje
src/server/trpc/routers/event.ts      — CRUD wydarzeń + zgłoszenia + notyfikacje
src/server/trpc/routers/message.ts    — system wiadomości (konwersacje, czat) + notyfikacje
src/server/trpc/routers/feed.ts       — feed z regionu użytkownika
src/server/trpc/routers/search.ts     — globalna wyszukiwarka
src/server/trpc/routers/notification.ts — powiadomienia (list, unreadCount, markAsRead)

src/lib/trpc.ts                       — tRPC vanilla client (frontend)
src/lib/supabase.ts                   — Supabase client (storage)
src/lib/format.ts                     — formatDate (pl-PL)
src/lib/labels.ts                     — wspólne stałe (labels, statusy, FOOT_LABELS, notification types, getUserDisplayName)
src/lib/rate-limit.ts                 — in-memory rate limiter z auto-cleanup
src/lib/validators/auth.ts            — Zod: rejestracja, logowanie
src/lib/validators/profile.ts         — Zod: profil klubu (+ logoUrl), zawodnika (+ photoUrl), kariera
src/lib/validators/sparing.ts         — Zod: tworzenie sparingu, aplikacja
src/lib/validators/event.ts           — Zod: tworzenie wydarzenia, zgłoszenie
src/lib/validators/message.ts         — Zod: wysyłka wiadomości, paginacja, markAsRead
src/lib/form-errors.ts                — helper getFieldErrors() (Zod → per-field errors)

src/app/(auth)/login/page.tsx         — logowanie
src/app/(auth)/register/page.tsx      — rejestracja (z tab Klub/Zawodnik)
src/app/(dashboard)/layout.tsx        — layout z nawigacją
src/app/(dashboard)/feed/page.tsx     — feed z regionu (sparingi, wydarzenia, kluby, zawodnicy)
src/app/(dashboard)/search/page.tsx   — globalna wyszukiwarka
src/app/(dashboard)/profile/page.tsx  — profil (server component → formularz z upload zdjęcia)
src/app/(dashboard)/sparings/         — lista, nowy, szczegóły sparingu (+ przycisk wiadomości)
src/app/(dashboard)/events/           — lista, nowy, szczegóły wydarzenia (+ przycisk wiadomości)
src/app/(dashboard)/messages/         — lista konwersacji, widok czatu
src/app/(dashboard)/notifications/    — lista powiadomień
src/app/(public)/clubs/[id]/page.tsx  — publiczny profil klubu
src/app/(public)/players/[id]/page.tsx — publiczny profil zawodnika

src/components/forms/club-profile-form.tsx    — formularz klubu (kaskadowe dropdowny + upload logo)
src/components/forms/player-profile-form.tsx  — formularz zawodnika + kariera + upload zdjęcia
src/components/layout/dashboard-nav.tsx       — górna nawigacja (responsywna, bell icon z badge)
src/components/send-message-button.tsx       — przycisk "Napisz wiadomość" (inline)
src/components/image-upload.tsx              — komponent uploadu zdjęć (Supabase Storage)
src/components/card-skeleton.tsx             — skeleton loadery (CardSkeleton, FeedCardSkeleton, DetailPageSkeleton, ConversationSkeleton, NotificationSkeleton)
src/components/public-profile-cta.tsx       — session-aware CTA na publicznych profilach
src/components/providers.tsx                — SessionProvider wrapper (root layout)
src/hooks/use-infinite-scroll.ts             — hook IntersectionObserver do infinite scroll
src/types/next-auth.d.ts              — rozszerzenie typów sesji (id, role)

src/app/robots.ts                     — robots.txt (Next.js metadata API)
src/app/sitemap.ts                    — sitemap.xml
src/app/manifest.ts                   — PWA web manifest
src/app/icon.svg                      — favicon SVG
src/app/error.tsx                     — globalny error boundary
src/app/not-found.tsx                 — strona 404

playwright.config.ts                  — konfiguracja Playwright (workers: 1, serial)
e2e/helpers.ts                        — helpery testowe (register, login, uniqueEmail)
e2e/auth.spec.ts                      — testy auth (rejestracja, logowanie, redirect)
e2e/sparing.spec.ts                   — testy sparingów (tworzenie → aplikacja → akceptacja)
e2e/event.spec.ts                     — testy wydarzeń (tworzenie → zgłoszenie → akceptacja)
e2e/messages.spec.ts                  — testy wiadomości (przycisk, konwersacje)
e2e/notifications.spec.ts             — testy powiadomień (strona, bell icon)
e2e/public-profiles.spec.ts           — testy publicznych profili i landing page
```

---

## Kluczowe Decyzje Techniczne
1. **Monorepo** Next.js full-stack (zamiast osobnego backendu).
2. **Prisma 7** wymaga `prisma.config.ts` z `env()` helper (nie `process.env` w schema).
3. **Prisma adapter-pg** z `PoolConfig` object (nie string URL w konstruktorze).
4. **Middleware** używa `getToken()` z `next-auth/jwt` (nie `auth()`) — Edge-compatible.
5. **Next.js 16** deprecjonuje middleware na rzecz proxy — warning, ale działa.
6. **Zod v4** import z `zod/v4` (nie `zod`).
7. **tRPC** — `apply` to reserved word, używamy `applyFor`.
8. **Supabase Session Pooler** zamiast direct connection (IPv4 kompatybilność).
9. **Prisma generated client** → `src/generated/prisma/` (gitignored, import z `/client`).
10. **Prisma db push** — flaga `--url` wymagana (env() w prisma.config.ts nie działa z db push w v7.5.0).
11. **Notyfikacje fire-and-forget** — nie blokują response'a, `.catch(() => {})`.
12. **Supabase Storage** — bucket `avatars` publiczny, upsert z entity ID jako nazwa pliku.
13. **Auth.js v5 na Vercel** — wymaga `AUTH_SECRET`, `AUTH_TRUST_HOST=true`, cookie name `__Secure-authjs.session-token` (nie `__Secure-next-auth.*`).
14. **SessionProvider** — wymagany w root layout żeby `signIn()`/`useSession()` z `next-auth/react` działały.

---

## Supabase
- Projekt: **Kabanos** (free tier)
- Host: `aws-1-eu-west-1.pooler.supabase.com` (Session Pooler)
- Baza: `postgres`
- 19 tabel + seed data (16 regionów, 80 lig, 272 grup)
- Storage: bucket `avatars` (public, 2 MB, image/jpeg, image/png, image/webp)

---

## Roadmapa

| Faza | Nazwa                         | Status       |
|------|-------------------------------|--------------|
| 1    | Inicjalizacja projektu        | ✅ Gotowe    |
| 2    | Auth + User + Profile CRUD    | ✅ Gotowe    |
| 3    | Regiony, Ligi, Grupy (seed)   | ✅ Gotowe    |
| 4    | Moduł Sparingów i Wydarzeń    | ✅ Gotowe    |
| 5    | System Wiadomości             | ✅ Gotowe    |
| 6    | Feed, Filtrowanie, Polish     | ✅ Gotowe    |
| 7    | Publiczne Profile             | ✅ Gotowe    |
| 8    | Upload Zdjęć                  | ✅ Gotowe    |
| 9    | Powiadomienia                 | ✅ Gotowe    |
| 10   | Testy E2E                     | ✅ Gotowe    |
| 11   | UX Polish                     | ✅ Gotowe    |
| 12   | Deploy + Quick Wins + Review  | ✅ Gotowe    |

---

## Instrukcje na start następnej sesji
1. Przeczytaj ten plik (`STATE.md`).
2. **Nie skanuj** całego repo — pliki kluczowe wymienione powyżej.
3. Wszystkie 12 faz ukończone — dalsze prace to opcjonalne ulepszenia (sekcja "Co zostało do zrobienia").
   - Aplikacja live: **https://pilkarski.vercel.app**
   - GitHub: **https://github.com/Kaban15/pilkarski**
4. Przed instalacją nowych zależności — pytaj o zgodę.
5. Po zakończeniu prac — zaktualizuj ten plik.
6. **Prisma migrations:** używaj `npm run db:migrate -- --url "postgresql://..." --name <nazwa>` do tworzenia nowych migracji lokalnie.
   - `env()` w `prisma.config.ts` nie działa na Windows → zawsze podaj `--url "..."` dla lokalnych komend.
   - Na Vercel działa automatycznie przez `vercel-build` script (`prisma migrate deploy`).
