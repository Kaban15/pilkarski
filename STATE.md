# PilkaSport — Stan Projektu

## Etap: 1 — Inicjalizacja (UKOŃCZONA)
**Data rozpoczęcia:** 2026-03-20

---

## Co jest gotowe
- [x] Zdefiniowany scope MVP
- [x] Tech Stack
- [x] Schemat bazy danych (Prisma schema v1)
- [x] Architektura folderów
- [x] Roadmapa (Fazy 1–6)
- [x] **Faza 1: Scaffold projektu**
  - Next.js 16 + TypeScript + Tailwind CSS 4
  - Prisma 7 z adapterem PG (schema.prisma + prisma.config.ts)
  - tRPC (health router, fetch adapter)
  - shadcn/ui config (components.json)
  - Bazowy layout + landing page
  - Git repo zainicjalizowane

## Co w trakcie
- [ ] Faza 2: Auth + User + Profile CRUD

---

## Tech Stack
| Warstwa     | Technologia                          |
|-------------|--------------------------------------|
| Frontend    | Next.js 16 (App Router) + TypeScript |
| UI          | Tailwind CSS 4 + shadcn/ui           |
| API         | tRPC v11 (fetch adapter)             |
| ORM         | Prisma 7 + @prisma/adapter-pg        |
| Baza danych | PostgreSQL (Supabase)                |
| Auth        | Auth.js v5 (do wdrożenia Faza 2)     |
| Walidacja   | Zod                                  |
| Hosting     | Vercel                               |

---

## Kluczowe Pliki
```
prisma/schema.prisma          — schemat BD (14 modeli)
prisma/prisma.config.ts       — konfiguracja Prisma 7 (datasource URL)
src/app/layout.tsx             — root layout
src/app/page.tsx               — landing page
src/app/api/trpc/[trpc]/route.ts — tRPC HTTP handler
src/server/trpc/trpc.ts       — inicjalizacja tRPC + context
src/server/trpc/router.ts     — root router (AppRouter)
src/server/trpc/routers/      — routery per-domain
src/server/db/client.ts       — Prisma client singleton (PrismaPg adapter)
src/lib/utils.ts               — cn() helper
src/generated/prisma/          — wygenerowany Prisma client (gitignored)
components.json                — shadcn/ui config
```

---

## Kluczowe Decyzje
1. Monorepo Next.js full-stack (zamiast osobnego backendu).
2. Prisma 7 wymaga `prisma.config.ts` (url w config, nie w schema).
3. Prisma 7 wymaga driver adapter — używamy `@prisma/adapter-pg` z PoolConfig.
4. Generator output: `src/generated/prisma` (gitignored).
5. tRPC v11 z fetch adapterem (Next.js App Router compatible).

---

## Roadmapa

| Faza | Nazwa                         | Status       |
|------|-------------------------------|--------------|
| 1    | Inicjalizacja projektu        | ✅ Gotowe    |
| 2    | Auth + User + Profile CRUD    | ⏳ Następna  |
| 3    | Regiony, Ligi, Grupy (seed)   | ⬜           |
| 4    | Moduł Sparingów i Wydarzeń    | ⬜           |
| 5    | System Wiadomości             | ⬜           |
| 6    | Feed, Filtrowanie, Polish     | ⬜           |

---

## Następne Kroki (Faza 2)
1. Instalacja i konfiguracja Auth.js v5 (credentials provider).
2. Strony: `/login`, `/register` (z wyborem roli Klub/Zawodnik).
3. Middleware ochrony tras (protectedProcedure w tRPC).
4. CRUD profilu Klubu i Zawodnika.
5. Formularze z walidacją Zod.
