# PilkaSport — Stan Projektu

## Aktualny etap: Faza 5 — System Wiadomości (DO ZROBIENIA)
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

## Co zostało do zrobienia

### Faza 5: System Wiadomości ⏳ NASTĘPNA
1. tRPC router `message`:
   - `getConversations` — lista konwersacji użytkownika
   - `getMessages` — wiadomości w konwersacji (z paginacją)
   - `send` — wyślij wiadomość (utwórz konwersację jeśli nie istnieje)
   - `markAsRead` — oznacz jako przeczytane
2. UI:
   - `/messages` — lista konwersacji
   - `/messages/[conversationId]` — widok czatu
   - Przycisk "Napisz wiadomość" na profilu klubu/zawodnika i w sparingach
3. Opcjonalnie: Supabase Realtime (WebSocket) dla live updates

### Faza 6: Feed, Filtrowanie, Polish ⬜
1. Główny feed (`/feed`) — agregacja aktywności z regionu użytkownika:
   - Nowe sparingi, wydarzenia, nowi zawodnicy/kluby
2. Wyszukiwarka:
   - Kluby (po nazwie, mieście, regionie)
   - Zawodnicy (po nazwisku, pozycji, regionie)
   - Sparingi i wydarzenia
3. Responsywność mobilna (nawigacja hamburger, karty full-width)
4. SEO: meta tagi, OpenGraph
5. Landing page `/` — opis platformy, CTA do rejestracji
6. Testy e2e krytycznych ścieżek (rejestracja → logowanie → profil → sparing)

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
prisma/schema.prisma                  — schemat BD (14 modeli)
prisma/prisma.config.ts               — konfiguracja Prisma 7 (env() helper)
prisma/seed.ts                        — seed regionów/lig/grup

src/middleware.ts                      — ochrona tras (JWT, Edge-compatible)
src/server/auth/config.ts             — Auth.js config (credentials)
src/server/db/client.ts               — Prisma client singleton (PrismaPg adapter)
src/server/trpc/trpc.ts               — tRPC init + publicProcedure + protectedProcedure
src/server/trpc/router.ts             — root router (health, auth, club, player, region, sparing, event)
src/server/trpc/routers/auth.ts       — rejestracja
src/server/trpc/routers/club.ts       — CRUD klubu + lista
src/server/trpc/routers/player.ts     — CRUD zawodnika + kariera + lista
src/server/trpc/routers/region.ts     — regiony, ligi, grupy, hierarchy
src/server/trpc/routers/sparing.ts    — CRUD sparingów + aplikacje
src/server/trpc/routers/event.ts      — CRUD wydarzeń + zgłoszenia

src/lib/trpc.ts                       — tRPC vanilla client (frontend)
src/lib/format.ts                     — formatDate (pl-PL)
src/lib/validators/auth.ts            — Zod: rejestracja, logowanie
src/lib/validators/profile.ts         — Zod: profil klubu, zawodnika, kariera
src/lib/validators/sparing.ts         — Zod: tworzenie sparingu, aplikacja
src/lib/validators/event.ts           — Zod: tworzenie wydarzenia, zgłoszenie

src/app/(auth)/login/page.tsx         — logowanie
src/app/(auth)/register/page.tsx      — rejestracja (z tab Klub/Zawodnik)
src/app/(dashboard)/layout.tsx        — layout z nawigacją
src/app/(dashboard)/feed/page.tsx     — placeholder feed
src/app/(dashboard)/profile/page.tsx  — profil (server component → formularz)
src/app/(dashboard)/sparings/         — lista, nowy, szczegóły sparingu
src/app/(dashboard)/events/           — lista, nowy, szczegóły wydarzenia

src/components/forms/club-profile-form.tsx    — formularz klubu (kaskadowe dropdowny)
src/components/forms/player-profile-form.tsx  — formularz zawodnika + kariera
src/components/layout/dashboard-nav.tsx       — górna nawigacja
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
- 14 tabel + seed data (16 regionów, 80 lig, 272 grup)

---

## Roadmapa

| Faza | Nazwa                         | Status       |
|------|-------------------------------|--------------|
| 1    | Inicjalizacja projektu        | ✅ Gotowe    |
| 2    | Auth + User + Profile CRUD    | ✅ Gotowe    |
| 3    | Regiony, Ligi, Grupy (seed)   | ✅ Gotowe    |
| 4    | Moduł Sparingów i Wydarzeń    | ✅ Gotowe    |
| 5    | System Wiadomości             | ⏳ Następna  |
| 6    | Feed, Filtrowanie, Polish     | ⬜           |

---

## Instrukcje na start następnej sesji
1. Przeczytaj ten plik (`STATE.md`).
2. **Nie skanuj** całego repo — pliki kluczowe wymienione powyżej.
3. Rozpocznij od **Fazy 5** (System Wiadomości).
4. Przed instalacją nowych zależności — pytaj o zgodę.
5. Po zakończeniu fazy — zaktualizuj ten plik i commitnij.
