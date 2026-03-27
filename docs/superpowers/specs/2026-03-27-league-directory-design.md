# Katalog Drużyn i Struktur Ligowych — Design Spec

**Data:** 2026-03-27
**Status:** Zatwierdzony

---

## Cel

Publiczna wyszukiwarka/katalog drużyn przeglądany przez strukturę ligową: Województwo → Szczebel → Grupa → Lista Klubów. Automatycznie budowany na podstawie deklaracji klubów w profilu.

## Backend (tRPC)

### Nowe procedury w `regionRouter`

1. **`region.listWithStats`** (publicProcedure)
   - Input: brak
   - Output: `{ id, name, slug, clubCount }[]`
   - Prisma: regiony z `_count: { select: { clubs: true } }`, order by name ASC

2. **`region.levelsWithStats`** (publicProcedure)
   - Input: `regionId: number`
   - Output: `{ id, name, tier, clubCount }[]`
   - Prisma: LeagueLevel where regionId, z count klubów through LeagueGroup → Club, order by tier ASC

3. **`region.groupsWithStats`** (publicProcedure)
   - Input: `leagueLevelId: number`
   - Output: `{ id, name, clubCount }[]`
   - Prisma: LeagueGroup where leagueLevelId, z `_count: { select: { clubs: true } }`, order by name ASC

### Rozbudowa `clubRouter.list`

- Dodać opcjonalny parametr `leagueGroupId: z.number().optional()`
- Filtrowanie: `where: { leagueGroupId }` (łączy się z istniejącym `regionId` i `search`)
- Include rozszerzony o: `leagueGroup: { include: { leagueLevel: true } }`

### Rozbudowa `search.global`

- Clubs w wynikach wzbogacone o `leagueGroup: { include: { leagueLevel: true } }`
- Frontend wyświetla "Klasa A · Grupa I" pod nazwą klubu

## Frontend — Strony

Wszystkie strony publiczne w `src/app/(public)/leagues/`.

### `/leagues` — Lista województw
- Grid 2×8 (desktop) / 1 kolumna (mobile)
- Karta per województwo: nazwa ZPN + badge z liczbą klubów
- Sortowanie alfabetyczne
- Dane z `region.listWithStats`

### `/leagues/[regionSlug]` — Szczeble ligowe
- Breadcrumbs: Polska > [Nazwa ZPN]
- Lista szczebli od najwyższego (tier 1) w dół
- Karta per szczebel: nazwa + badge z liczbą klubów
- Jeśli szczebel ma 1 grupę → link od razu do listy klubów (skip grupy)
- Dane z `region.levelsWithStats` (regionId z resolucji slug → id)

### `/leagues/[regionSlug]/[levelId]` — Grupy
- Breadcrumbs: Polska > [ZPN] > [Szczebel]
- Grid grup z liczbą klubów
- Dane z `region.groupsWithStats`

### `/leagues/[regionSlug]/[levelId]/[groupId]` — Lista klubów
- Breadcrumbs: Polska > [ZPN] > [Szczebel] > [Grupa]
- Karty klubów: mini logo (32px), nazwa, miasto, link do `/clubs/[id]`
- Cursor-based pagination (infinite scroll)
- Dane z `club.list` z parametrem `leagueGroupId`

## UI/UX

- Styl Etap 14 "Pitch Black Precision": czyste karty, `hover:border-primary/30`, zinc-based typografia
- Komponent `LeagueBreadcrumbs` — reużywalny na 4 stronach
- Empty state gdy brak klubów/grup

## Integracja nawigacyjna

- Sidebar: link "Ligi" (ikona Trophy) w sekcji "Więcej"
- Na `/clubs/[id]`: liga/grupa w hero → klikalny link do `/leagues/[regionSlug]/[levelId]/[groupId]`
- Na `/clubs/[id]`: region w hero → klikalny link do `/leagues/[regionSlug]`

## Edge cases

- Klub bez `leagueGroupId` — nie pojawia się w katalogu lig
- Region bez klubów — wyświetlany z badge "0 klubów"
- Nieistniejący `regionSlug` / `levelId` / `groupId` → `notFound()`
- `levelId`/`groupId` niezgodne z regionem → `notFound()`

## Poza zakresem

- Mapa województw (graficzna)
- Model sezonu/roku
- Tabela ligowa / wyniki
- Wyszukiwarka na stronie `/leagues`
