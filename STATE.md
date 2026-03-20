# PilkaSport — Stan Projektu

## Aktualny etap: Wszystkie fazy ukończone
**Ostatnia sesja:** 2026-03-20

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
- **Prisma:** modele `Conversation`, `ConversationParticipant`, `Message` (17 tabel łącznie)
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
  - Usunięto dead code (`unused q` w search, `unreadCount = 0` w message router)
  - Region name w feed pobierany bezpośrednio z DB zamiast fragile chain `??`

---

## Co zostało do zrobienia (opcjonalnie)
- Testy e2e krytycznych ścieżek (rejestracja → logowanie → profil → sparing)
- Supabase Realtime (WebSocket) dla live chat
- Publiczne profile klubów/zawodników (strony `/clubs/[id]`, `/players/[id]`)
- Upload zdjęć (logo klubu, zdjęcie zawodnika)
- Powiadomienia (nowe wiadomości, nowe zgłoszenia)

---

## Tech Stack
| Warstwa     | Technologia                            |
|-------------|----------------------------------------|
| Frontend    | Next.js 16 (App Router) + TypeScript   |
| UI          | Tailwind CSS 4 + shadcn/ui             |
| API         | tRPC v11 (fetch adapter)               |
| ORM         | Prisma 7 + @prisma/adapter-pg          |
| Baza danych | PostgreSQL (Supabase — Session Pooler) |
| Auth        | Auth.js v5 (next-auth@beta)            |
| Walidacja   | Zod v4                                 |
| Hosting     | Vercel (planowany)                     |

---

## Kluczowe Pliki
```
prisma/schema.prisma                  — schemat BD (17 modeli)
prisma/prisma.config.ts               — konfiguracja Prisma 7 (env() helper)
prisma/seed.ts                        — seed regionów/lig/grup

src/middleware.ts                      — ochrona tras (JWT, Edge-compatible)
src/server/auth/config.ts             — Auth.js config (credentials)
src/server/db/client.ts               — Prisma client singleton (PrismaPg adapter)
src/server/trpc/trpc.ts               — tRPC init + publicProcedure + protectedProcedure
src/server/trpc/router.ts             — root router (health, auth, club, player, region, sparing, event, message, feed, search)
src/server/trpc/routers/auth.ts       — rejestracja
src/server/trpc/routers/club.ts       — CRUD klubu + lista
src/server/trpc/routers/player.ts     — CRUD zawodnika + kariera + lista
src/server/trpc/routers/region.ts     — regiony, ligi, grupy, hierarchy
src/server/trpc/routers/sparing.ts    — CRUD sparingów + aplikacje
src/server/trpc/routers/event.ts      — CRUD wydarzeń + zgłoszenia
src/server/trpc/routers/message.ts    — system wiadomości (konwersacje, czat)
src/server/trpc/routers/feed.ts       — feed z regionu użytkownika
src/server/trpc/routers/search.ts     — globalna wyszukiwarka

src/lib/trpc.ts                       — tRPC vanilla client (frontend)
src/lib/format.ts                     — formatDate (pl-PL)
src/lib/labels.ts                     — wspólne stałe (labels, statusy, getUserDisplayName)
src/lib/validators/auth.ts            — Zod: rejestracja, logowanie
src/lib/validators/profile.ts         — Zod: profil klubu, zawodnika, kariera
src/lib/validators/sparing.ts         — Zod: tworzenie sparingu, aplikacja
src/lib/validators/event.ts           — Zod: tworzenie wydarzenia, zgłoszenie
src/lib/validators/message.ts         — Zod: wysyłka wiadomości, paginacja, markAsRead

src/app/(auth)/login/page.tsx         — logowanie
src/app/(auth)/register/page.tsx      — rejestracja (z tab Klub/Zawodnik)
src/app/(dashboard)/layout.tsx        — layout z nawigacją
src/app/(dashboard)/feed/page.tsx     — feed z regionu (sparingi, wydarzenia, kluby, zawodnicy)
src/app/(dashboard)/search/page.tsx   — globalna wyszukiwarka
src/app/(dashboard)/profile/page.tsx  — profil (server component → formularz)
src/app/(dashboard)/sparings/         — lista, nowy, szczegóły sparingu (+ przycisk wiadomości)
src/app/(dashboard)/events/           — lista, nowy, szczegóły wydarzenia (+ przycisk wiadomości)
src/app/(dashboard)/messages/         — lista konwersacji, widok czatu

src/components/forms/club-profile-form.tsx    — formularz klubu (kaskadowe dropdowny)
src/components/forms/player-profile-form.tsx  — formularz zawodnika + kariera
src/components/layout/dashboard-nav.tsx       — górna nawigacja (responsywna, hamburger menu)
src/components/send-message-button.tsx       — przycisk "Napisz wiadomość" (inline)
src/types/next-auth.d.ts              — rozszerzenie typów sesji (id, role)
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

---

## Supabase
- Projekt: **Kabanos** (free tier)
- Host: `aws-1-eu-west-1.pooler.supabase.com` (Session Pooler)
- Baza: `postgres`
- 17 tabel + seed data (16 regionów, 80 lig, 272 grup)

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

---

## Instrukcje na start następnej sesji
1. Przeczytaj ten plik (`STATE.md`).
2. **Nie skanuj** całego repo — pliki kluczowe wymienione powyżej.
3. Wszystkie 6 faz ukończone — dalsze prace to opcjonalne ulepszenia (sekcja "Co zostało do zrobienia").
4. Przed instalacją nowych zależności — pytaj o zgodę.
5. Po zakończeniu prac — zaktualizuj ten plik.
