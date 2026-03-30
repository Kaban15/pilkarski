# Panel Admina / Moderacji — Design Spec

**Data:** 2026-03-30
**Etap:** 38
**Zakres:** Moderacja zgłoszeń, zarządzanie użytkownikami, metryki platformy, zarządzanie treścią

---

## 1. Model danych

### Nowy model `ClubPostReport`

```prisma
model ClubPostReport {
  id        String   @id @default(cuid())
  postId    String   @map("post_id")
  userId    String   @map("user_id")
  reason    String?
  createdAt DateTime @default(now()) @map("created_at")

  post ClubPost @relation(fields: [postId], references: [id], onDelete: Cascade)
  user User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, postId])
  @@map("club_post_reports")
}
```

- Unique constraint `(userId, postId)` — user nie może zgłosić tego samego posta dwukrotnie
- `reason` — opcjonalny powód zgłoszenia (już istnieje w UI)

### Nowe pola na `User`

```prisma
isAdmin   Boolean @default(false) @map("is_admin")
isBanned  Boolean @default(false) @map("is_banned")
```

- Dowolna rola (CLUB/PLAYER/COACH) może być adminem
- Ostatni admin nie może stracić `isAdmin` (guard na liczbie adminów, nie tylko "nie sobie")

### Nowe pola na `ClubPost`

```prisma
hidden      Boolean   @default(false)
hiddenAt    DateTime?               @map("hidden_at")
hiddenBy    String?                 @map("hidden_by")
reportCount Int       @default(0)   @map("report_count")
```

- `hiddenBy` — userId admina który ukrył post
- `reportCount` — denormalizacja; inkrementowany przy tworzeniu `ClubPostReport`

### Migracja

- Wszystkie pola z `@default` — zero downtime
- Po deploy: `UPDATE "User" SET "is_admin" = true WHERE email = '<admin_email>'`

---

## 2. Backend (tRPC)

### Middleware

```ts
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!ctx.session.user.isAdmin) throw new TRPCError({ code: "FORBIDDEN" });
  return next();
});
```

### Router: `admin` (nowy, dołączony do root routera)

#### admin.reports

| Procedura | Input | Opis |
|-----------|-------|------|
| `list` | `{ cursor?, limit? }` | Posty z `reportCount > 0`, sort by reportCount DESC, cursor pagination. Include: autor, kategoria, lista reportów (userId, reason, date) |
| `dismiss` | `{ postId }` | Ustaw `reportCount = 0`, usuń rekordy `ClubPostReport` dla tego posta |
| `hide` | `{ postId }` | Ustaw `hidden = true`, `hiddenAt = now()`, `hiddenBy = ctx.session.user.id` |

#### admin.users

| Procedura | Input | Opis |
|-----------|-------|------|
| `list` | `{ cursor?, limit?, search? }` | Wszyscy userzy, search po email/nazwie, cursor pagination |
| `ban` | `{ userId }` | Ustaw `isBanned = true`. Walidacja: nie można zbanować siebie |
| `unban` | `{ userId }` | Ustaw `isBanned = false` |
| `setAdmin` | `{ userId, isAdmin }` | Toggle isAdmin. Walidacja: nie można odebrać ostatniemu adminowi (count check) |

#### admin.metrics

| Procedura | Input | Opis |
|-----------|-------|------|
| `dashboard` | — | Agregacje: userzy per rola (CLUB/PLAYER/COACH + total), sparingi/wydarzenia/turnieje (total + 7d), pending reports count |

#### admin.content

| Procedura | Input | Opis |
|-----------|-------|------|
| `sparings` | `{ cursor?, limit?, search? }` | Lista sparingów, search po `title`, cursor pagination |
| `events` | `{ cursor?, limit?, search? }` | Lista wydarzeń, search po `title`, cursor pagination |
| `tournaments` | `{ cursor?, limit?, search? }` | Lista turniejów, search po `title`, cursor pagination |
| `delete` | `{ type: 'sparing'\|'event'\|'tournament', id }` | Soft delete: ustaw `status = CANCELLED`. **Nie hard delete** — zachowuje reviews, goals, notifications |

### Zmiany w istniejącym kodzie

1. **`auth/config.ts`** — dodaj `isAdmin` do JWT callback i session callback
2. **`auth/config.ts` → `authorize()`** — sprawdź `isBanned`, zwróć null jeśli true
3. **`auth/config.ts` → `jwt` callback** — przy każdym wywołaniu sprawdź `isBanned` z DB (dodaj cache 5 min via timestamp w tokenie: jeśli `lastChecked < now - 5min` → query DB, inaczej skip)
4. **`clubPost.report`** — zmień z `console.warn` na: upsert `ClubPostReport` + increment `reportCount` na poście
5. **`clubPost.list`** — dodaj `where: { hidden: false }`
6. **Feed, favorites, search** — dodaj `hidden: false` filter wszędzie gdzie zwracane są ClubPosts
7. **`src/types/next-auth.d.ts`** — dodaj `isAdmin` do Session i JWT types
8. **`src/middleware.ts`** — dodaj route protection: `/admin` wymaga `isAdmin` w tokenie (Edge-level block)

---

## 3. Frontend

### Kolor panelu: `red` (slate-600 ikona, red-500 akcenty na badge'ach)

### Nawigacja

- **Sidebar:** nowa pozycja w sekcji "Więcej" — ikona `Shield` (lucide), label "Admin"
- Widoczna tylko gdy `session.user.isAdmin === true`
- Bottom nav: bez zmian

### Strona `/admin` — 4 taby (shadcn Tabs)

#### Tab "Raporty" (domyślny)

- Tabela: treść (skrócona 80 znaków), autor, kategoria, reportCount, data
- Expand row → lista zgłoszeń (kto, powód, kiedy)
- 2 przyciski: "Odrzuć" (dismiss) → wyzeruj / "Ukryj" (hide) → ConfirmDialog
- Badge na tabie z liczbą pending raportów
- EmptyState gdy brak zgłoszeń

#### Tab "Użytkownicy"

- Search bar (email/nazwa) z debounce 300ms
- Tabela: nazwa, email, rola (badge), data rejestracji, status
- Status badge: zielony "Aktywny" / czerwony "Zbanowany" / fioletowy "Admin"
- Akcje: Ban/Unban toggle + Toggle admin — oba z ConfirmDialog
- Cursor pagination (usePaginatedList)

#### Tab "Metryki"

- 4× StatsCell na górze: Użytkownicy per rola (CLUB/PLAYER/COACH/total), Sparingi, Wydarzenia, Turnieje
- Sekcja "Ostatnie 7 dni": nowi userzy, nowe sparingi, nowe wydarzenia (proste liczby)
- Link "Zgłoszenia do moderacji: X" → przełącza na tab Raporty

#### Tab "Treści"

- 3 pill-buttony: Sparingi / Wydarzenia / Turnieje
- Search bar (po `title`) + tabela z cursor pagination
- Kolumny: tytuł, autor/klub, data, status
- Akcja: "Anuluj" z ConfirmDialog (soft delete → status CANCELLED)

### Reużywane komponenty

Tabs, ConfirmDialog, EmptyState, StatsCell, CardSkeleton, Badge

---

## 4. Bezpieczeństwo

| Reguła | Implementacja |
|--------|---------------|
| Tylko admin widzi `/admin` | Edge middleware (`src/middleware.ts`) + adminProcedure w tRPC |
| Zbanowany nie loguje się | `authorize()` sprawdza `isBanned` |
| Istniejąca sesja zbanowanego | `jwt` callback sprawdza `isBanned` z DB co 5 min (cache w tokenie) |
| Admin nie banuje siebie | Walidacja: `userId !== ctx.session.user.id` |
| Ostatni admin chroniony | `setAdmin(false)` → count adminów > 1 |
| Soft delete treści | Status CANCELLED — brak cascade, dane zachowane |
| Ukryty post niewidoczny | `hidden: false` filter w: clubPost.list, feed, favorites, search |
| Raporty deduplikowane | Unique constraint `(userId, postId)` na ClubPostReport |

---

## 5. Poza zakresem (świadome pominięcia)

- Audit log akcji admina
- Masowe operacje (bulk ban/delete)
- Powiadomienia do usera o banie/ukryciu postu
- Wykresy w metrykach (Recharts)
- Raporty na inne treści niż ClubPost (sparingi, wydarzenia)

---

## 6. Pliki do utworzenia/zmodyfikowania

### Nowe pliki
- `src/server/trpc/routers/admin.ts` — router z 11 procedurami
- `src/app/(dashboard)/admin/page.tsx` — strona z 4 tabami
- `src/lib/validators/admin.ts` — Zod schemas
- `prisma/migrations/xxx_admin_panel/migration.sql`

### Modyfikowane pliki
- `prisma/schema.prisma` — nowy model ClubPostReport + pola na User i ClubPost
- `src/server/trpc/router.ts` — dodaj admin router
- `src/server/trpc/routers/club-post.ts` — upsert ClubPostReport + reportCount increment + hidden filter
- `src/server/auth/config.ts` — isAdmin w JWT/session, isBanned check z 5-min cache
- `src/types/next-auth.d.ts` — isAdmin w typach
- `src/components/layout/sidebar.tsx` — link Admin (conditional)
- `src/middleware.ts` — route protection dla `/admin`
- `src/server/trpc/routers/feed.ts` — hidden filter na ClubPosts
- `src/server/trpc/routers/search.ts` — hidden filter na ClubPosts
- `src/server/trpc/routers/favorite.ts` — hidden filter na ClubPosts
