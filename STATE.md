# PilkaSport — Stan Projektu

## Etap: 2 — Auth + Profile (UKOŃCZONA)
**Data rozpoczęcia:** 2026-03-20

---

## Co jest gotowe
- [x] Faza 1: Scaffold projektu
- [x] **Faza 2: Auth + User + Profile CRUD**
  - Auth.js v5 (credentials provider, JWT sessions)
  - Rejestracja z wyborem roli (Klub/Zawodnik) — `/register`
  - Logowanie — `/login`
  - Middleware ochrony tras (JWT check, bez Prisma w Edge)
  - tRPC protectedProcedure
  - CRUD profilu Klubu (name, city, region, contact, website, opis)
  - CRUD profilu Zawodnika (dane osobowe, pozycja, warunki fizyczne, bio)
  - Historia kariery (dodawanie/usuwanie wpisów)
  - Cursor-based pagination na listach klubów i zawodników
  - Zod walidacja na wszystkich formularzach
  - shadcn/ui komponenty (Button, Input, Label, Card, Tabs, Select)
  - Dashboard layout z nawigacją

## Co w trakcie
- [ ] Faza 3: Regiony, Ligi, Grupy (seed)

---

## Tech Stack
| Warstwa     | Technologia                          |
|-------------|--------------------------------------|
| Frontend    | Next.js 16 (App Router) + TypeScript |
| UI          | Tailwind CSS 4 + shadcn/ui           |
| API         | tRPC v11 (fetch adapter)             |
| ORM         | Prisma 7 + @prisma/adapter-pg        |
| Baza danych | PostgreSQL (Supabase — Session Pooler) |
| Auth        | Auth.js v5 (next-auth@beta)          |
| Walidacja   | Zod v4                               |
| Hosting     | Vercel                               |

---

## Kluczowe Pliki
```
prisma/schema.prisma                  — schemat BD (14 modeli)
prisma/prisma.config.ts               — konfiguracja Prisma 7 (env() helper)
src/middleware.ts                      — ochrona tras (JWT, bez Prisma)
src/server/auth/config.ts             — Auth.js config (credentials)
src/server/trpc/trpc.ts               — tRPC init + protectedProcedure
src/server/trpc/router.ts             — root router (health, auth, club, player)
src/server/trpc/routers/auth.ts       — rejestracja
src/server/trpc/routers/club.ts       — CRUD klubu + lista
src/server/trpc/routers/player.ts     — CRUD zawodnika + kariera + lista
src/lib/validators/auth.ts            — Zod schema rejestracji/logowania
src/lib/validators/profile.ts         — Zod schema profili
src/lib/trpc.ts                       — tRPC client (frontend)
src/app/(auth)/login/page.tsx         — strona logowania
src/app/(auth)/register/page.tsx      — strona rejestracji
src/app/(dashboard)/layout.tsx        — layout z nawigacją
src/app/(dashboard)/feed/page.tsx     — placeholder feed
src/app/(dashboard)/profile/page.tsx  — profil (server component)
src/components/forms/club-profile-form.tsx    — formularz klubu
src/components/forms/player-profile-form.tsx  — formularz zawodnika
src/components/layout/dashboard-nav.tsx       — nawigacja
src/types/next-auth.d.ts              — rozszerzenie typów sesji
```

---

## Kluczowe Decyzje
1. Monorepo Next.js full-stack.
2. Prisma 7: `env()` helper w prisma.config.ts (nie process.env).
3. Prisma adapter-pg z PoolConfig (Supabase Session Pooler).
4. Middleware: `getToken()` z next-auth/jwt (bez Prisma — Edge compatible).
5. Next.js 16 deprecjonuje middleware → warning, ale działa.
6. Zod v4 z importem `zod/v4`.

---

## Supabase
- Projekt: Kabanos (free tier)
- Host: aws-1-eu-west-1.pooler.supabase.com (Session Pooler)
- Baza: postgres
- 14 tabel utworzonych via `prisma db push`

---

## Roadmapa

| Faza | Nazwa                         | Status       |
|------|-------------------------------|--------------|
| 1    | Inicjalizacja projektu        | ✅ Gotowe    |
| 2    | Auth + User + Profile CRUD    | ✅ Gotowe    |
| 3    | Regiony, Ligi, Grupy (seed)   | ⏳ Następna  |
| 4    | Moduł Sparingów i Wydarzeń    | ⬜           |
| 5    | System Wiadomości             | ⬜           |
| 6    | Feed, Filtrowanie, Polish     | ⬜           |

---

## Następne Kroki (Faza 3)
1. Seed 16 województw (ZPN) + szczebli ligowych + grup.
2. Endpoint do pobierania regionów/lig/grup (kaskadowe dropdown).
3. Przypisywanie klubu do regionu i grupy ligowej w profilu.
