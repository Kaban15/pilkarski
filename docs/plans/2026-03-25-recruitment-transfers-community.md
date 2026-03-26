# PilkaSport 3-Etapowy Rozwój: Rekrutacja + Transfery + Community

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rozbudowa PilkaSport o wzmocnioną rekrutację (nowe typy wydarzeń), pasywne ogłoszenia zawodników z pipeline'em rekrutacyjnym dla klubów, oraz marketplace treningów indywidualnych i lekki moduł community.

**Architecture:** Rozszerzenie istniejących modułów Event i Transfer zamiast nowych tabel. Nowe EventType enum values, nowe pola w Transfer, nowa tabela RecruitmentPipeline do śledzenia statusów kandydatów. Community jako nowy EventType z dedykowanym feedem.

**Tech Stack:** Next.js 16 App Router, tRPC v11, Prisma 7, Supabase PostgreSQL, Tailwind CSS 4, shadcn/ui, Zod v4

---

## Analiza obecnego stanu

### Moduł EVENTS — jak działa dziś

**Model Prisma** (`schema.prisma:265-308`):
- `Event` — clubId, type (enum `EventType`), title, description, eventDate, location, lat/lng, maxParticipants, regionId
- `EventApplication` — eventId, playerId, message, status (reuse `ApplicationStatus`)
- `EventType` enum: `OPEN_TRAINING` | `RECRUITMENT` — tylko 2 typy

**Router tRPC** (`routers/event.ts`):
- `create` — klub tworzy event (rateLimited), powiadamia followerów
- `update` / `delete` — owner only, walidacja
- `list` — publicProcedure, filtry: clubId, regionId, type, city, dateFrom/dateTo, sort, cursor pagination
- `getById` — z applications + player data
- `applyFor` — player only, sprawdza maxParticipants
- `respond` — accept/reject, powiadomienia + push
- `my` — events danego klubu
- `myApplications` — zgłoszenia danego playera

**Validator** (`validators/event.ts`):
- `createEventSchema`: type z enum, title, description, eventDate, location, lat/lng, maxParticipants, regionId

**UI** (`events/page.tsx`):
- Tabs "Szukaj" / "Moje wydarzenia" (dla klubów)
- Filtry: region, typ (Select: Trening otwarty / Nabór), miasto, daty, sort
- Karty z badge typu, data, lokalizacja, count zapisanych
- Infinite scroll

**Feed** (`routers/feed.ts:109-153`):
- `feed.recruitments` — zwraca RECRUITMENT events z regionu playera, matchuje po regionId

**Labele** (`labels.ts:22-30`):
- `EVENT_TYPE_LABELS`: OPEN_TRAINING → "Trening otwarty", RECRUITMENT → "Nabór"
- `EVENT_TYPE_COLORS`: green/purple

### Moduł TRANSFERS — jak działa dziś

**Model Prisma** (`schema.prisma:435-467`):
- `Transfer` — userId, type (enum `TransferType`), status (ACTIVE/CLOSED), title, description, position, regionId, minAge, maxAge
- `TransferType`: LOOKING_FOR_CLUB | LOOKING_FOR_PLAYER | FREE_AGENT

**Router tRPC** (`routers/transfer.ts`):
- `create` — walidacja roli (klub=LOOKING_FOR_PLAYER, player=LOOKING_FOR_CLUB/FREE_AGENT)
- `update` / `delete` / `close` — owner only
- `list` — filtry: type, position, regionId, status, sort, cursor
- `getById` — include user.club/player + region
- `my` — moje ogłoszenia

**Brak:** pola availableFrom, preferredLeagueLevel, pipeline rekrutacyjny

### Gamifikacja

**POINTS_MAP** (`gamification.ts`): event_created=10, application_sent=5, application_accepted=10, transfer_created=5
**BADGES**: Organizator (5 events), Łowca okazji (10 applications)

---

## ETAP 1: Wzmocnienie naborów (Tydzień 1–2)

### Propozycja zmian

1. **Nowe EventType**: `TRYOUT` (testy), `CAMP` (obóz/camp), `CONTINUOUS_RECRUITMENT` (ciągły nabór)
   - Minimalna zmiana: rozszerzenie enum + labeli + filtrów
   - "Ciągły nabór" = event bez konkretnej daty końcowej (opcjonalnie `eventDate` daleko w przyszłości)

2. **Sekcja "Rekrutacja" w dashboardzie**:
   - Klub: lista aktywnych naborów + sugerowani zawodnicy (z transferów LOOKING_FOR_CLUB w regionie)
   - Zawodnik: "Nabory dla Ciebie" rozszerzone o nowe typy (TRYOUT, CAMP, CONTINUOUS_RECRUITMENT)

3. **Powiadomienia rekrutacyjne**:
   - `RECRUITMENT_NEW` — gdy obserwowany klub otwiera nabór/testy/camp
   - `RECRUITMENT_MATCH` — gdy w regionie zawodnika pojawi się nabór na jego pozycję

### Nowe NotificationType

```
RECRUITMENT_NEW     // Obserwowany klub otworzył nabór (fire-and-forget w event.create)
RECRUITMENT_MATCH   // Nabór w Twoim regionie na Twoją pozycję (fire-and-forget w event.create)
```

**Gdzie wpiąć:**
- `event.create` (routers/event.ts:17-58): po createMany followerów → dodać match na playerów z regionu + pozycji
- Transfer `create` (routers/transfer.ts:9-36): gdy LOOKING_FOR_CLUB → powiadomić kluby z regionu o nowym kandydacie

---

### Task 1.1: Rozszerzenie EventType enum + labeli

**Files:**
- Modify: `prisma/schema.prisma:265-268` (EventType enum)
- Modify: `src/lib/labels.ts:22-30` (EVENT_TYPE_LABELS, EVENT_TYPE_COLORS)
- Modify: `src/lib/validators/event.ts:4` (createEventSchema type enum)
- Modify: `src/app/(dashboard)/events/page.tsx:66,165-173` (type filter + badge styles)
- Migration: nowa migracja Prisma

- [ ] **Step 1: Dodaj nowe wartości do EventType enum w schema.prisma**

```prisma
enum EventType {
  OPEN_TRAINING
  RECRUITMENT
  TRYOUT
  CAMP
  CONTINUOUS_RECRUITMENT
}
```

- [ ] **Step 2: Dodaj labele i kolory w labels.ts**

Rozszerz `EVENT_TYPE_LABELS`:
```typescript
export const EVENT_TYPE_LABELS: Record<string, string> = {
  OPEN_TRAINING: "Trening otwarty",
  RECRUITMENT: "Nabór",
  TRYOUT: "Testy",
  CAMP: "Obóz / Camp",
  CONTINUOUS_RECRUITMENT: "Ciągły nabór",
};
```

Rozszerz `EVENT_TYPE_COLORS`:
```typescript
export const EVENT_TYPE_COLORS: Record<string, string> = {
  OPEN_TRAINING: "bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300",
  RECRUITMENT: "bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300",
  TRYOUT: "bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300",
  CAMP: "bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300",
  CONTINUOUS_RECRUITMENT: "bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300",
};
```

- [ ] **Step 3: Zaktualizuj validator**

W `src/lib/validators/event.ts`:
```typescript
export const createEventSchema = z.object({
  type: z.enum(["OPEN_TRAINING", "RECRUITMENT", "TRYOUT", "CAMP", "CONTINUOUS_RECRUITMENT"]),
  // ... reszta bez zmian
});

export type EventTypeValue = "OPEN_TRAINING" | "RECRUITMENT" | "TRYOUT" | "CAMP" | "CONTINUOUS_RECRUITMENT";
```

- [ ] **Step 4: Zaktualizuj filtry na liście wydarzeń**

W `events/page.tsx` — zmień state type na nowy union:
```typescript
const [type, setType] = useState<EventTypeValue | undefined>();
```

Rozszerz Select opcjami:
```tsx
<SelectItem value="OPEN_TRAINING">Treningi otwarte</SelectItem>
<SelectItem value="RECRUITMENT">Nabory</SelectItem>
<SelectItem value="TRYOUT">Testy</SelectItem>
<SelectItem value="CAMP">Obozy / Campy</SelectItem>
<SelectItem value="CONTINUOUS_RECRUITMENT">Ciągłe nabory</SelectItem>
```

Rozszerz `EVENT_BADGE_STYLES`:
```typescript
const EVENT_BADGE_STYLES: Record<string, string> = {
  OPEN_TRAINING: "bg-violet-500/10 text-violet-700 dark:text-violet-400",
  RECRUITMENT: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  TRYOUT: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
  CAMP: "bg-sky-500/10 text-sky-700 dark:text-sky-400",
  CONTINUOUS_RECRUITMENT: "bg-rose-500/10 text-rose-700 dark:text-rose-400",
};
```

- [ ] **Step 5: Zaktualizuj event.list w router (type enum)**

W `routers/event.ts:109`:
```typescript
type: z.enum(["OPEN_TRAINING", "RECRUITMENT", "TRYOUT", "CAMP", "CONTINUOUS_RECRUITMENT"]).optional(),
```

- [ ] **Step 6: Utwórz migrację**

```bash
npm run db:migrate -- --url "postgresql://..." --name add_event_types
```

- [ ] **Step 7: Zaktualizuj feed.recruitments aby uwzględnił nowe typy rekrutacyjne**

W `routers/feed.ts:128` zamień:
```typescript
type: "RECRUITMENT",
```
na:
```typescript
type: { in: ["RECRUITMENT", "TRYOUT", "CAMP", "CONTINUOUS_RECRUITMENT"] },
```

- [ ] **Step 8: Zweryfikuj build**

```bash
npx tsc --noEmit && npm run build
```

- [ ] **Step 9: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/ src/lib/labels.ts src/lib/validators/event.ts src/server/trpc/routers/event.ts src/server/trpc/routers/feed.ts src/app/(dashboard)/events/page.tsx
git commit -m "feat: add new event types (TRYOUT, CAMP, CONTINUOUS_RECRUITMENT)"
```

---

### Task 1.2: Dodaj pola targetowe do Event (opcjonalnie dla naborów)

**Files:**
- Modify: `prisma/schema.prisma:270-293` (Event model — nowe pola)
- Modify: `src/lib/validators/event.ts` (nowe pola w schema)
- Modify: `src/server/trpc/routers/event.ts` (create/update — nowe pola)
- Migration: nowa migracja

- [ ] **Step 1: Dodaj pola do Event model**

```prisma
model Event {
  // ... istniejące pola ...
  targetPosition   PlayerPosition? @map("target_position")   // szukana pozycja (nabór/testy)
  targetAgeMin     Int?            @map("target_age_min")     // min wiek
  targetAgeMax     Int?            @map("target_age_max")     // max wiek
  targetLevel      SparingLevel?   @map("target_level")       // poziom (enum reuse)
  // ... reszta ...
}
```

- [ ] **Step 2: Zaktualizuj validator**

```typescript
export const createEventSchema = z.object({
  type: z.enum(["OPEN_TRAINING", "RECRUITMENT", "TRYOUT", "CAMP", "CONTINUOUS_RECRUITMENT"]),
  title: z.string().min(3, "Tytuł musi mieć min. 3 znaki").max(300),
  description: z.string().max(2000).optional(),
  eventDate: z.string().min(1, "Data wydarzenia jest wymagana"),
  location: z.string().max(300).optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  maxParticipants: z.number().int().positive().optional(),
  regionId: z.number().int().positive().optional(),
  targetPosition: z.enum(["GK","CB","LB","RB","CDM","CM","CAM","LM","RM","LW","RW","ST"]).optional(),
  targetAgeMin: z.number().int().min(5).max(60).optional(),
  targetAgeMax: z.number().int().min(5).max(60).optional(),
  targetLevel: z.enum(["YOUTH","AMATEUR","SEMI_PRO","PRO"]).optional(),
});
```

- [ ] **Step 3: Zaktualizuj router event.create i event.update**

W `event.create` data:
```typescript
data: {
  // ...istniejące pola...
  targetPosition: input.targetPosition,
  targetAgeMin: input.targetAgeMin,
  targetAgeMax: input.targetAgeMax,
  targetLevel: input.targetLevel,
},
```

Analogicznie w `event.update`.

- [ ] **Step 4: Zaktualizuj event.getById include**

Brak zmian — pola skalarne są automatycznie zwracane.

- [ ] **Step 5: Utwórz migrację**

```bash
npm run db:migrate -- --url "postgresql://..." --name add_event_target_fields
```

- [ ] **Step 6: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/ src/lib/validators/event.ts src/server/trpc/routers/event.ts
git commit -m "feat: add target fields to Event (position, age, level)"
```

---

### Task 1.3: Formularz tworzenia wydarzenia — nowe pola + warunkowo

**Files:**
- Modify: `src/app/(dashboard)/events/new/page.tsx` — dodaj pola warunkowe
- Modify: `src/app/(dashboard)/events/[id]/edit/page.tsx` — analogicznie

- [ ] **Step 1: Przeczytaj obecny formularz new/edit**

- [ ] **Step 2: Dodaj pola warunkowe (widoczne dla typów: RECRUITMENT, TRYOUT, CAMP, CONTINUOUS_RECRUITMENT)**

Po wyborze typu, jeśli to nie OPEN_TRAINING, pokaż:
```tsx
{type !== "OPEN_TRAINING" && (
  <div className="space-y-4 rounded-lg border p-4">
    <h3 className="text-sm font-medium">Szczegóły rekrutacyjne</h3>
    {/* Select: targetPosition (z POSITION_LABELS) */}
    {/* Input: targetAgeMin, targetAgeMax */}
    {/* Select: targetLevel (z SPARING_LEVEL_LABELS) */}
  </div>
)}
```

- [ ] **Step 3: Podłącz do mutacji (pola opcjonalne, przesyłane tylko jeśli wypełnione)**

- [ ] **Step 4: Zweryfikuj build + test ręczny**

- [ ] **Step 5: Commit**

```bash
git add src/app/(dashboard)/events/new/page.tsx src/app/(dashboard)/events/[id]/edit/page.tsx
git commit -m "feat: conditional recruitment fields in event form"
```

---

### Task 1.4: Event detail — wyświetlanie pól rekrutacyjnych

**Files:**
- Modify: `src/app/(dashboard)/events/[id]/page.tsx` — sekcja "Wymagania" pod info grid

- [ ] **Step 1: Przeczytaj obecny detail page**

- [ ] **Step 2: Dodaj sekcję "Wymagania" (widoczną gdy event ma targetPosition/targetAge/targetLevel)**

```tsx
{(event.targetPosition || event.targetAgeMin || event.targetLevel) && (
  <div className="mt-4 rounded-lg border p-4">
    <h3 className="mb-2 text-sm font-semibold">Wymagania</h3>
    <div className="flex flex-wrap gap-2">
      {event.targetPosition && (
        <Badge variant="secondary">{POSITION_LABELS[event.targetPosition]}</Badge>
      )}
      {event.targetAgeMin && event.targetAgeMax && (
        <Badge variant="secondary">Wiek: {event.targetAgeMin}–{event.targetAgeMax}</Badge>
      )}
      {event.targetLevel && (
        <Badge variant="secondary">{SPARING_LEVEL_LABELS[event.targetLevel]}</Badge>
      )}
    </div>
  </div>
)}
```

- [ ] **Step 3: Badge "Dopasowane" na karcie gdy event matchuje profil playera**

Na liście wydarzeń, porównaj `event.targetPosition` z `playerProfile.primaryPosition`:
```tsx
{isPlayer && playerProfile?.primaryPosition && event.targetPosition === playerProfile.primaryPosition && (
  <Badge className="bg-emerald-500/10 text-emerald-600 text-[10px]">Dopasowane</Badge>
)}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/(dashboard)/events/[id]/page.tsx src/app/(dashboard)/events/page.tsx
git commit -m "feat: display recruitment requirements on event detail + match badge"
```

---

### Task 1.5: Sekcja "Rekrutacja" w dashboardzie — widok klubu

**Files:**
- Create: `src/components/dashboard/club-recruitment.tsx`
- Modify: `src/server/trpc/routers/feed.ts` — nowy endpoint `feed.suggestedPlayers`
- Modify: `src/app/(dashboard)/feed/page.tsx` — import + render

- [ ] **Step 1: Dodaj endpoint `feed.suggestedPlayers`**

W `routers/feed.ts`:
```typescript
suggestedPlayers: protectedProcedure
  .input(z.object({ limit: z.number().int().min(1).max(10).default(5) }))
  .query(async ({ ctx, input }) => {
    if (ctx.session.user.role !== "CLUB") return { items: [] };

    const club = await ctx.db.club.findUnique({
      where: { userId: ctx.session.user.id },
      select: { regionId: true },
    });
    if (!club?.regionId) return { items: [] };

    // Zawodnicy z transferami LOOKING_FOR_CLUB/FREE_AGENT w regionie klubu
    const transfers = await ctx.db.transfer.findMany({
      where: {
        type: { in: ["LOOKING_FOR_CLUB", "FREE_AGENT"] },
        status: "ACTIVE",
        regionId: club.regionId,
      },
      include: {
        user: {
          include: {
            player: {
              select: {
                id: true, firstName: true, lastName: true,
                photoUrl: true, primaryPosition: true, dateOfBirth: true, city: true,
              },
            },
          },
        },
        region: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: input.limit,
    });

    return { items: transfers };
  }),
```

- [ ] **Step 2: Utwórz komponent `ClubRecruitment`**

```tsx
// src/components/dashboard/club-recruitment.tsx
"use client";

import Link from "next/link";
import { api } from "@/lib/trpc-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { POSITION_LABELS } from "@/lib/labels";
import { Target, Users, ArrowRight } from "lucide-react";

export function ClubRecruitment() {
  const { data: myEvents } = api.event.my.useQuery(undefined, { staleTime: 60_000 });
  const { data: suggested } = api.feed.suggestedPlayers.useQuery({ limit: 5 }, { staleTime: 60_000 });

  const activeRecruitments = (myEvents ?? []).filter(
    (e) => ["RECRUITMENT", "TRYOUT", "CAMP", "CONTINUOUS_RECRUITMENT"].includes(e.type)
      && new Date(e.eventDate) >= new Date()
  );

  if (activeRecruitments.length === 0 && (!suggested || suggested.items.length === 0)) return null;

  return (
    <section className="mb-8 space-y-6">
      <h2 className="flex items-center gap-2 text-lg font-semibold">
        <Target className="h-5 w-5 text-purple-500" />
        Rekrutacja
      </h2>

      {activeRecruitments.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-medium text-muted-foreground">Twoje aktywne nabory</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {activeRecruitments.slice(0, 4).map((event) => (
              <Link key={event.id} href={`/events/${event.id}`} className="group block">
                <Card className="transition-all hover:border-primary/40">
                  <CardContent className="py-3">
                    <p className="text-sm font-medium group-hover:text-primary">{event.title}</p>
                    <p className="text-xs text-muted-foreground">{event._count.applications} zgłoszeń</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {suggested && suggested.items.length > 0 && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">Sugerowani zawodnicy</h3>
            <Link href="/transfers?type=LOOKING_FOR_CLUB" className="text-xs text-primary hover:underline">
              Wszyscy <ArrowRight className="inline h-3 w-3" />
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {suggested.items.map((t) => (
              <Link key={t.id} href={`/transfers/${t.id}`} className="group block">
                <Card className="transition-all hover:border-primary/40">
                  <CardContent className="flex items-center gap-3 py-3">
                    {t.user.player?.photoUrl ? (
                      <img src={t.user.player.photoUrl} className="h-8 w-8 rounded-full object-cover" />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-500/10 text-xs font-bold text-violet-600">
                        {t.user.player ? `${t.user.player.firstName[0]}${t.user.player.lastName[0]}` : "?"}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium group-hover:text-primary truncate">
                        {t.user.player ? `${t.user.player.firstName} ${t.user.player.lastName}` : t.title}
                      </p>
                      <div className="flex gap-1">
                        {t.user.player?.primaryPosition && (
                          <Badge variant="secondary" className="text-[10px]">
                            {POSITION_LABELS[t.user.player.primaryPosition]}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
```

- [ ] **Step 3: Dodaj `ClubRecruitment` do feed/page.tsx**

Pod istniejącym `ClubSections`, przed feedem:
```tsx
import { ClubRecruitment } from "@/components/dashboard/club-recruitment";

// W renderze, dla roli CLUB:
{isClub && <ClubRecruitment />}
```

- [ ] **Step 4: Zweryfikuj build**

- [ ] **Step 5: Commit**

```bash
git add src/components/dashboard/club-recruitment.tsx src/server/trpc/routers/feed.ts src/app/(dashboard)/feed/page.tsx
git commit -m "feat: club recruitment section with suggested players"
```

---

### Task 1.6: Rozszerzone "Nabory dla Ciebie" — nowe typy + lepszy matching

**Files:**
- Modify: `src/server/trpc/routers/feed.ts:109-153` — `feed.recruitments` uwzględnia target fields
- Modify: `src/components/dashboard/player-recruitments.tsx` — Badge z pozycją

- [ ] **Step 1: Rozszerz feed.recruitments o matching po pozycji**

```typescript
// W feed.recruitments, po pobraniu playera:
const where: any = {
  type: { in: ["RECRUITMENT", "TRYOUT", "CAMP", "CONTINUOUS_RECRUITMENT"] },
  eventDate: { gte: now },
};

if (player.regionId) {
  where.regionId = player.regionId;
}

// Zwróć info o target match
const items = await ctx.db.event.findMany({
  where,
  include: {
    club: { select: { id: true, name: true, city: true, logoUrl: true } },
    region: { select: { name: true } },
    _count: { select: { applications: true } },
  },
  orderBy: { eventDate: "asc" },
  take: input.limit,
});

// Oznacz które eventy matchują pozycję
const enriched = items.map((e: any) => ({
  ...e,
  positionMatch: !e.targetPosition || e.targetPosition === player.primaryPosition,
}));

return {
  items: enriched,
  matched: !!player.regionId,
  playerPosition: player.primaryPosition,
};
```

- [ ] **Step 2: Zaktualizuj player-recruitments.tsx o Badge pozycji**

```tsx
{event.positionMatch && (
  <Badge className="bg-emerald-500/10 text-emerald-600 text-[10px]">Twoja pozycja</Badge>
)}
```

- [ ] **Step 3: Commit**

```bash
git add src/server/trpc/routers/feed.ts src/components/dashboard/player-recruitments.tsx
git commit -m "feat: enhanced recruitment matching with position + new event types"
```

---

### Task 1.7: Powiadomienia rekrutacyjne

**Files:**
- Modify: `prisma/schema.prisma:314-323` (NotificationType enum)
- Modify: `src/lib/labels.ts:85-105` (notification labels + colors)
- Modify: `src/server/trpc/routers/event.ts:17-58` (create — powiadomienia matchujących playerów)
- Migration: migracja enum

- [ ] **Step 1: Rozszerz NotificationType**

```prisma
enum NotificationType {
  // ... istniejące ...
  RECRUITMENT_NEW       // obserwowany klub otworzył nabór
  RECRUITMENT_MATCH     // nabór w Twoim regionie na Twoją pozycję
}
```

- [ ] **Step 2: Dodaj labele**

```typescript
// W labels.ts
RECRUITMENT_NEW: "Nowy nabór",
RECRUITMENT_MATCH: "Nabór na Twoją pozycję",

// Kolory
RECRUITMENT_NEW: "bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300",
RECRUITMENT_MATCH: "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300",
```

- [ ] **Step 3: W event.create — powiadom matchujących playerów (fire-and-forget)**

Po istniejącym bloku follower notifications, dodaj:
```typescript
// Jeśli to event rekrutacyjny, powiadom matchujących playerów
const recruitTypes = ["RECRUITMENT", "TRYOUT", "CAMP", "CONTINUOUS_RECRUITMENT"];
if (recruitTypes.includes(input.type) && (input.regionId ?? club.regionId)) {
  const targetRegionId = input.regionId ?? club.regionId;

  ctx.db.player.findMany({
    where: {
      regionId: targetRegionId,
      ...(input.targetPosition ? { primaryPosition: input.targetPosition } : {}),
    },
    select: { userId: true, firstName: true },
    take: 100, // limit do 100 powiadomień
  }).then((players) => {
    if (players.length === 0) return;
    ctx.db.notification.createMany({
      data: players.map((p) => ({
        userId: p.userId,
        type: "RECRUITMENT_MATCH" as const,
        title: "Nabór w Twoim regionie",
        message: `${club.name} szuka zawodników: ${input.title}`,
        link: `/events/${event.id}`,
      })),
    }).catch(() => {});
  }).catch(() => {});
}
```

- [ ] **Step 4: Zamień istniejące follower notifications na RECRUITMENT_NEW**

W event.create follower block, zmień type z `"EVENT_APPLICATION"` na:
```typescript
type: recruitTypes.includes(input.type) ? "RECRUITMENT_NEW" as const : "EVENT_APPLICATION" as const,
```

- [ ] **Step 5: Migracja + build**

```bash
npm run db:migrate -- --url "postgresql://..." --name add_recruitment_notification_types
npx tsc --noEmit && npm run build
```

- [ ] **Step 6: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/ src/lib/labels.ts src/server/trpc/routers/event.ts
git commit -m "feat: recruitment notifications (RECRUITMENT_NEW, RECRUITMENT_MATCH)"
```

---

### Task 1.8: Link "Rekrutacja" w sidebar + bottom-nav

**Files:**
- Modify: `src/components/layout/sidebar.tsx:31-57` — dodaj "Rekrutacja"
- Modify: `src/components/layout/bottom-nav.tsx` — opcjonalnie

- [ ] **Step 1: Dodaj "Rekrutacja" w sekcji "Główne" po "Wydarzenia"**

```typescript
{ href: "/events?tab=recruitment", icon: Target, label: "Rekrutacja" },
```

Import `Target` z lucide-react.

Uwaga: to nie nowa strona, a deep link do events z filtrem — można też rozważyć osobną stronę `/recruitment` w przyszłości.

- [ ] **Step 2: Commit**

```bash
git add src/components/layout/sidebar.tsx
git commit -m "feat: add Rekrutacja link in sidebar navigation"
```

---

### Task 1.9: Gamifikacja — nowe akcje

**Files:**
- Modify: `src/lib/gamification.ts` — nowe wpisy w POINTS_MAP, POINTS_LABELS

- [ ] **Step 1: Dodaj nowe akcje punktowe**

```typescript
// W POINTS_MAP:
recruitment_created: 10,   // utworzenie naboru/testu/campu

// W POINTS_LABELS:
recruitment_created: "Utworzenie naboru",
```

- [ ] **Step 2: W event.create — awardPoints z action "recruitment_created" gdy typ rekrutacyjny**

```typescript
const recruitTypes = ["RECRUITMENT", "TRYOUT", "CAMP", "CONTINUOUS_RECRUITMENT"];
const action = recruitTypes.includes(input.type) ? "recruitment_created" : "event_created";
awardPoints(ctx.db, ctx.session.user.id, action, event.id).catch(() => {});
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/gamification.ts src/server/trpc/routers/event.ts
git commit -m "feat: gamification points for recruitment events"
```

---

## ETAP 2: Pasywne ogłoszenia zawodników + pipeline (Tydzień 3–4)

### Propozycja zmian

1. **Rozszerzenie modelu Transfer:**
   - `availableFrom` (Date) — "dostępny od"
   - `preferredLevel` (SparingLevel?) — preferowany poziom ligi
   - `preferredRegions` — wiele regionów (relacja M:N lub JSON array)
   → Prostsze: jedno `preferredLevel` + istniejące `regionId`

2. **Nowa tabela `RecruitmentPipeline`:**
   - Klub śledzi kandydatów (transfery) ze statusem: WATCHING, INVITED_TO_TRYOUT, AFTER_TRYOUT, OFFER_SENT, SIGNED, REJECTED
   - Relacja: clubId + transferId, unique constraint

3. **Filtry dla klubów:**
   - Pozycja (już jest), rocznik (już jest minAge/maxAge), region (już jest)
   - Nowe: dostępność od daty, preferowany poziom

---

### Task 2.1: Rozszerzenie modelu Transfer + nowe pola

**Files:**
- Modify: `prisma/schema.prisma:446-467` (Transfer model)
- Modify: `src/lib/validators/transfer.ts`
- Modify: `src/server/trpc/routers/transfer.ts`
- Migration: nowa migracja

- [ ] **Step 1: Dodaj pola do Transfer**

```prisma
model Transfer {
  // ... istniejące pola ...
  availableFrom    DateTime?    @map("available_from") @db.Date
  preferredLevel   SparingLevel? @map("preferred_level")
  // ... reszta ...
}
```

- [ ] **Step 2: Zaktualizuj validator**

```typescript
export const createTransferSchema = z.object({
  // ... istniejące pola ...
  availableFrom: z.string().optional(), // ISO date
  preferredLevel: z.enum(["YOUTH", "AMATEUR", "SEMI_PRO", "PRO"]).optional(),
});
```

- [ ] **Step 3: Zaktualizuj router create/update**

Dodaj nowe pola do `data`:
```typescript
availableFrom: input.availableFrom ? new Date(input.availableFrom) : undefined,
preferredLevel: input.preferredLevel,
```

- [ ] **Step 4: Dodaj nowe filtry do transfer.list**

```typescript
// W input schema:
availableFrom: z.string().optional(),
preferredLevel: z.enum(["YOUTH","AMATEUR","SEMI_PRO","PRO"]).optional(),

// W where building:
if (input.availableFrom) {
  where.availableFrom = { lte: new Date(input.availableFrom) };
}
if (input.preferredLevel) where.preferredLevel = input.preferredLevel;
```

- [ ] **Step 5: Migracja + build**

- [ ] **Step 6: Commit**

```bash
git commit -m "feat: extend Transfer with availableFrom + preferredLevel"
```

---

### Task 2.2: Model RecruitmentPipeline

**Files:**
- Modify: `prisma/schema.prisma` — nowy enum + model
- Create: `src/server/trpc/routers/recruitment.ts`
- Modify: `src/server/trpc/router.ts` — rejestracja routera
- Migration: nowa migracja

- [ ] **Step 1: Dodaj enum i model**

```prisma
enum RecruitmentStage {
  WATCHING           // Na radarze
  INVITED_TO_TRYOUT  // Zaproszony na testy
  AFTER_TRYOUT       // Po testach
  OFFER_SENT         // Oferta wysłana
  SIGNED             // Podpisany
  REJECTED           // Odrzucony
}

model RecruitmentPipeline {
  id         String           @id @default(uuid()) @db.Uuid
  clubId     String           @map("club_id") @db.Uuid
  transferId String           @map("transfer_id") @db.Uuid
  stage      RecruitmentStage @default(WATCHING)
  notes      String?
  createdAt  DateTime         @default(now()) @map("created_at") @db.Timestamptz
  updatedAt  DateTime         @updatedAt @map("updated_at") @db.Timestamptz

  club     Club     @relation(fields: [clubId], references: [id], onDelete: Cascade)
  transfer Transfer @relation(fields: [transferId], references: [id], onDelete: Cascade)

  @@unique([clubId, transferId])
  @@index([clubId, stage])
  @@map("recruitment_pipeline")
}
```

Dodaj relacje do Club i Transfer:
```prisma
// W model Club:
recruitmentPipeline  RecruitmentPipeline[]

// W model Transfer:
pipelineEntries      RecruitmentPipeline[]
```

- [ ] **Step 2: Utwórz router**

```typescript
// src/server/trpc/routers/recruitment.ts
import { z } from "zod/v4";
import { router, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

export const recruitmentRouter = router({
  // Dodaj kandydata do pipeline
  addToRadar: protectedProcedure
    .input(z.object({ transferId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const club = await ctx.db.club.findUnique({ where: { userId: ctx.session.user.id } });
      if (!club) throw new TRPCError({ code: "FORBIDDEN" });

      return ctx.db.recruitmentPipeline.upsert({
        where: { clubId_transferId: { clubId: club.id, transferId: input.transferId } },
        create: { clubId: club.id, transferId: input.transferId, stage: "WATCHING" },
        update: {},
      });
    }),

  // Zmień stage
  updateStage: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
      stage: z.enum(["WATCHING", "INVITED_TO_TRYOUT", "AFTER_TRYOUT", "OFFER_SENT", "SIGNED", "REJECTED"]),
      notes: z.string().max(500).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const club = await ctx.db.club.findUnique({ where: { userId: ctx.session.user.id } });
      if (!club) throw new TRPCError({ code: "FORBIDDEN" });

      const entry = await ctx.db.recruitmentPipeline.findUnique({ where: { id: input.id } });
      if (!entry || entry.clubId !== club.id) throw new TRPCError({ code: "FORBIDDEN" });

      return ctx.db.recruitmentPipeline.update({
        where: { id: input.id },
        data: { stage: input.stage, notes: input.notes },
      });
    }),

  // Usuń z pipeline
  remove: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const club = await ctx.db.club.findUnique({ where: { userId: ctx.session.user.id } });
      if (!club) throw new TRPCError({ code: "FORBIDDEN" });

      const entry = await ctx.db.recruitmentPipeline.findUnique({ where: { id: input.id } });
      if (!entry || entry.clubId !== club.id) throw new TRPCError({ code: "FORBIDDEN" });

      return ctx.db.recruitmentPipeline.delete({ where: { id: input.id } });
    }),

  // Lista pipeline'u klubu
  myPipeline: protectedProcedure
    .input(z.object({
      stage: z.enum(["WATCHING", "INVITED_TO_TRYOUT", "AFTER_TRYOUT", "OFFER_SENT", "SIGNED", "REJECTED"]).optional(),
    }))
    .query(async ({ ctx, input }) => {
      const club = await ctx.db.club.findUnique({ where: { userId: ctx.session.user.id } });
      if (!club) return [];

      return ctx.db.recruitmentPipeline.findMany({
        where: {
          clubId: club.id,
          ...(input.stage ? { stage: input.stage } : {}),
        },
        include: {
          transfer: {
            include: {
              user: {
                include: {
                  player: {
                    select: {
                      id: true, firstName: true, lastName: true,
                      photoUrl: true, primaryPosition: true, dateOfBirth: true, city: true,
                    },
                  },
                },
              },
              region: { select: { name: true } },
            },
          },
        },
        orderBy: { updatedAt: "desc" },
      });
    }),

  // Check czy transfer jest w pipeline (batch)
  check: protectedProcedure
    .input(z.object({ transferIds: z.array(z.string().uuid()) }))
    .query(async ({ ctx, input }) => {
      const club = await ctx.db.club.findUnique({ where: { userId: ctx.session.user.id } });
      if (!club) return {};

      const entries = await ctx.db.recruitmentPipeline.findMany({
        where: { clubId: club.id, transferId: { in: input.transferIds } },
        select: { transferId: true, stage: true, id: true },
      });

      return Object.fromEntries(entries.map((e) => [e.transferId, { id: e.id, stage: e.stage }]));
    }),
});
```

- [ ] **Step 3: Zarejestruj w router.ts**

```typescript
import { recruitmentRouter } from "./routers/recruitment";
// ...
recruitment: recruitmentRouter,
```

- [ ] **Step 4: Migracja + build**

- [ ] **Step 5: Commit**

```bash
git commit -m "feat: recruitment pipeline model + tRPC router"
```

---

### Task 2.3: UI — formularz Transfer z nowymi polami

**Files:**
- Modify: `src/app/(dashboard)/transfers/new/page.tsx`
- Modify: `src/app/(dashboard)/transfers/[id]/edit/page.tsx`

- [ ] **Step 1: Dodaj pola "Dostępny od" i "Preferowany poziom" w formularzu**

Widoczne tylko dla LOOKING_FOR_CLUB / FREE_AGENT:
```tsx
{(type === "LOOKING_FOR_CLUB" || type === "FREE_AGENT") && (
  <>
    <div>
      <Label>Dostępny od</Label>
      <Input type="date" value={availableFrom} onChange={...} />
    </div>
    <div>
      <Label>Preferowany poziom</Label>
      <Select value={preferredLevel} onValueChange={...}>
        {Object.entries(SPARING_LEVEL_LABELS).map(([k, v]) => (
          <SelectItem key={k} value={k}>{v}</SelectItem>
        ))}
      </Select>
    </div>
  </>
)}
```

- [ ] **Step 2: Podłącz do mutacji**

- [ ] **Step 3: Commit**

---

### Task 2.4: UI — lista transferów z filtrami dla klubów

**Files:**
- Modify: `src/app/(dashboard)/transfers/page.tsx` — nowe filtry + przycisk "Na radar"

- [ ] **Step 1: Dodaj filtr "Dostępny od" i "Poziom" do panelu filtrów**

- [ ] **Step 2: Dodaj przycisk "Na radar" na karcie transferu (dla roli CLUB)**

```tsx
{isClub && (
  <Button
    size="sm"
    variant="ghost"
    onClick={() => addToRadar.mutate({ transferId: t.id })}
  >
    <Eye className="h-4 w-4" />
  </Button>
)}
```

- [ ] **Step 3: Commit**

---

### Task 2.5: UI — strona Pipeline `/recruitment`

**Files:**
- Create: `src/app/(dashboard)/recruitment/page.tsx`

- [ ] **Step 1: Utwórz stronę z Kanban-style kolumnami (lub tabs)**

Tabs: "Na radarze" / "Zaproszeni" / "Po testach" / "Oferta" / "Podpisani" / "Odrzuceni"

Każda karta zawodnika z:
- Avatar + imię + pozycja
- Dropdown do zmiany stage'a
- Link do profilu/transferu
- Notatki (editable)

- [ ] **Step 2: Dodaj link "Rekrutacja" w sidebar**

Zmień/rozszerz istniejący link na `/recruitment` zamiast `/events?tab=recruitment`.

- [ ] **Step 3: Commit**

---

### Task 2.6: Powiadomienie PLAYER_LOOKING_FOR_CLUB

**Files:**
- Modify: `prisma/schema.prisma` (NotificationType)
- Modify: `src/server/trpc/routers/transfer.ts` (create)
- Modify: `src/lib/labels.ts`

- [ ] **Step 1: Dodaj `PLAYER_LOOKING_FOR_CLUB` do enum**

- [ ] **Step 2: W transfer.create, gdy LOOKING_FOR_CLUB → powiadom kluby z regionu**

```typescript
if (input.type === "LOOKING_FOR_CLUB" && (input.regionId)) {
  ctx.db.club.findMany({
    where: { regionId: input.regionId },
    select: { userId: true, name: true },
    take: 50,
  }).then((clubs) => {
    if (clubs.length === 0) return;
    ctx.db.notification.createMany({
      data: clubs.map((c) => ({
        userId: c.userId,
        type: "PLAYER_LOOKING_FOR_CLUB" as const,
        title: "Nowy zawodnik szuka klubu",
        message: `${input.title} — w Twoim regionie`,
        link: `/transfers/${transfer.id}`,
      })),
    }).catch(() => {});
  }).catch(() => {});
}
```

Uwaga: transfer.create musi zwrócić obiekt z id najpierw (zachować w zmiennej).

- [ ] **Step 3: Migracja + labele + build**

- [ ] **Step 4: Commit**

---

### Task 2.7: Gamifikacja — pipeline akcje

**Files:**
- Modify: `src/lib/gamification.ts`

- [ ] **Step 1: Dodaj akcję**

```typescript
// POINTS_MAP:
player_added_to_radar: 3,

// POINTS_LABELS:
player_added_to_radar: "Dodanie zawodnika na radar",
```

- [ ] **Step 2: W recruitment.addToRadar — awardPoints**

- [ ] **Step 3: Commit**

---

## ETAP 3: Marketplace treningów + Community (Tydzień 5–7+)

### Propozycja: Treningi indywidualne jako nowy EventType

Zamiast nowej tabeli — dodajemy `INDIVIDUAL_TRAINING` i `GROUP_TRAINING` do EventType.
Dodajemy nowe pola: `priceInfo` (String), `targetAgeMin/Max` (już mamy), `targetPosition` (już mamy).

### Propozycja: Community jako nowy EventType `CLUB_NEWS`

"Aktualności klubu" — typ eventu bez konkretnej daty (lub z datą ważności), z kategorią inline.
Alternatywnie — nowa tabela `ClubPost` (czystsze, ale więcej pracy).

**Rekomendacja:** Nowa tabela `ClubPost` jest czystsza niż wpychanie tego w Event.
Event to "coś z datą i zgłoszeniami" — aktualność to "post z kategorią".

---

### Task 3.1: Marketplace treningów — rozszerzenie EventType

**Files:**
- Modify: `prisma/schema.prisma` (EventType + Event pola)
- Modify: `src/lib/labels.ts`
- Modify: `src/lib/validators/event.ts`
- Modify: `src/server/trpc/routers/event.ts`
- Migration

- [ ] **Step 1: Dodaj EventType values**

```prisma
enum EventType {
  OPEN_TRAINING
  RECRUITMENT
  TRYOUT
  CAMP
  CONTINUOUS_RECRUITMENT
  INDIVIDUAL_TRAINING      // Trening indywidualny
  GROUP_TRAINING           // Trening w małej grupie
}
```

- [ ] **Step 2: Dodaj pole priceInfo do Event**

```prisma
model Event {
  // ... istniejące ...
  priceInfo     String?     @map("price_info") @db.VarChar(200)  // np. "120 zł/h"
}
```

- [ ] **Step 3: Labele**

```typescript
INDIVIDUAL_TRAINING: "Trening indywidualny",
GROUP_TRAINING: "Trening w małej grupie",
```

- [ ] **Step 4: Validator + router + migracja**

- [ ] **Step 5: Commit**

---

### Task 3.2: UI — katalog treningów `/trainings`

**Files:**
- Create: `src/app/(dashboard)/trainings/page.tsx`

- [ ] **Step 1: Utwórz stronę listującą events typu INDIVIDUAL_TRAINING + GROUP_TRAINING**

Reuse `event.list` z type filter.
Filtry: miasto, cena (sortowanie), pozycja (targetPosition), wiek.
Karty z ceną prominentnie wyświetlaną.

- [ ] **Step 2: Dodaj "Rozwój" / "Treningi" w sidebar**

- [ ] **Step 3: Commit**

---

### Task 3.3: Model ClubPost (aktualności klubowe)

**Files:**
- Modify: `prisma/schema.prisma` — nowy model + enum
- Create: `src/server/trpc/routers/club-post.ts`
- Modify: `src/server/trpc/router.ts`
- Migration

- [ ] **Step 1: Dodaj model**

```prisma
enum ClubPostCategory {
  LOOKING_FOR_GOALKEEPER   // Szukamy bramkarza
  LOOKING_FOR_SPARRING     // Szukamy sparingpartnera
  LOOKING_FOR_COACH        // Szukamy trenera
  GENERAL_NEWS             // Aktualność ogólna
  MATCH_RESULT             // Wynik meczu
}

model ClubPost {
  id        String           @id @default(uuid()) @db.Uuid
  clubId    String           @map("club_id") @db.Uuid
  category  ClubPostCategory
  title     String           @db.VarChar(300)
  content   String?
  expiresAt DateTime?        @map("expires_at") @db.Timestamptz
  createdAt DateTime         @default(now()) @map("created_at") @db.Timestamptz
  updatedAt DateTime         @updatedAt @map("updated_at") @db.Timestamptz

  club Club @relation(fields: [clubId], references: [id], onDelete: Cascade)

  @@index([clubId, createdAt])
  @@index([category])
  @@map("club_posts")
}
```

Dodaj relację do Club: `posts ClubPost[]`

- [ ] **Step 2: Router clubPost**

Endpointy: `create`, `list` (publicProcedure, filtry category+regionId), `delete`, `my`.

- [ ] **Step 3: Migracja + build**

- [ ] **Step 4: Commit**

---

### Task 3.4: UI — feed aktualności + strona `/community`

**Files:**
- Create: `src/app/(dashboard)/community/page.tsx`
- Modify: `src/server/trpc/routers/feed.ts` — dodaj clubPosts do feeda
- Modify: `src/app/(dashboard)/feed/page.tsx` — karty aktualności w feedzie

- [ ] **Step 1: Strona `/community` z listą aktualności**

Tabs: "Wszystkie" / "Szukam zawodnika" / "Szukam trenera" / "Wyniki"
Karty: avatar klubu, kategoria badge, tytuł, treść (line-clamp-2), data

- [ ] **Step 2: Małe karty w głównym feedzie**

Dodaj typ `"club_post"` do unified feed w `feed.get`.

- [ ] **Step 3: Link "Aktualności" w sidebar**

- [ ] **Step 4: Commit**

---

### Task 3.5: Gamifikacja — community

**Files:**
- Modify: `src/lib/gamification.ts`

- [ ] **Step 1: Nowe akcje**

```typescript
// POINTS_MAP:
club_post_created: 5,
training_created: 10,

// POINTS_LABELS:
club_post_created: "Dodanie aktualności",
training_created: "Dodanie oferty treningowej",

// BADGES — nowa odznaka:
{ key: "active_club", name: "Aktywny klub", description: "Dodaj 10 aktualności", icon: "📢",
  check: (s) => s.clubPostsCount >= 10 },
```

- [ ] **Step 2: Rozszerz BadgeCheckStats o `clubPostsCount`**

- [ ] **Step 3: W clubPost.create i event.create (training types) — awardPoints**

- [ ] **Step 4: Commit**

---

## Podsumowanie Timeline

| Tydzień | Etap | Taski | Opis |
|---------|------|-------|------|
| 1 | E1 | 1.1–1.4 | Nowe EventType + pola targetowe + UI formularzy/detail |
| 2 | E1 | 1.5–1.9 | Sekcja "Rekrutacja" + powiadomienia + gamifikacja |
| 3 | E2 | 2.1–2.3 | Transfer nowe pola + pipeline model + UI formularzy |
| 4 | E2 | 2.4–2.7 | Pipeline UI + filtry + powiadomienia + gamifikacja |
| 5 | E3 | 3.1–3.2 | Marketplace treningów (EventType + katalog UI) |
| 6 | E3 | 3.3–3.4 | ClubPost model + community feed + UI |
| 7+ | E3 | 3.5 | Gamifikacja community + polish |

---

## Kluczowe decyzje

1. **Nowe typy w EventType zamiast nowej tabeli** — Event ma już daty, lokalizacje, zgłoszenia, maxParticipants. Reuse > rewrite.
2. **RecruitmentPipeline jako osobna tabela** — nie wpychamy statusu rekrutacji do Transfer (to dotyczy relacji klub↔kandydat, nie samego ogłoszenia).
3. **ClubPost jako nowa tabela** — aktualność to nie event (nie ma daty, zgłoszeń). Czysta separacja odpowiedzialności.
4. **Powiadomienia fire-and-forget** — konsekwentnie z istniejącym wzorcem `.catch(() => {})`.
5. **Gamifikacja: tylko nowe wpisy w POINTS_MAP** — BEZ rozbudowy zasad/mechanik.
