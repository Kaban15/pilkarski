# Etap A: Unit Tests + File Validation + Shared Pagination Hook

**Date:** 2026-03-28
**Scope:** 3 independent technical improvements — backlog cleanup before new features
**Dependencies:** None between the 3 items — can be implemented in any order

---

## 1. Unit Tests — Vitest Setup

### Goal

Add Vitest as unit testing framework. Write tests for existing pure helpers and server-side utilities. Establish pattern for future test coverage.

### Setup

**New devDependency:** `vitest`

**Config:** `vitest.config.ts` at project root:
- `test.globals: true` (no import needed for describe/it/expect)
- `resolve.alias: { "@/": "./src/" }` (match existing path aliases)
- `test.include: ["src/**/*.test.ts"]`

**Scripts in package.json:**
- `"test": "vitest run"` — single run
- `"test:watch": "vitest"` — watch mode

### Test files

#### `src/__tests__/format.test.ts`
Tests for `src/lib/format.ts`:
- `formatDate` — returns Polish formatted date with time ("28 marca 2026, 16:00")
- `formatShortDate` — returns short Polish date without time ("28 mar 2026")
- `formatEventDateTime` — returns short date with time ("28 mar, 16:00")
- Edge: handles string and Date inputs
- Edge: handles invalid date (doesn't crash)

#### `src/__tests__/gamification.test.ts`
Tests for `src/lib/gamification.ts`:
- `POINTS_MAP` — all 16 actions have positive integer values
- `BADGES` — each badge has key, name, description, icon, check function
- Badge checks: test each badge's `check()` with stats that should pass and fail
  - Debiutant: totalSparings >= 1
  - Mistrz sparingów: totalSparings >= 10
  - Matchmaker: totalMatched >= 5
  - Organizator: totalEvents >= 5
  - Recenzent: totalReviews >= 5
  - Komunikator: totalMessages >= 50
  - Aktywny gracz: totalApplications >= 20
  - Weteran: totalPoints >= 500
  - Łowca okazji: totalTransfers >= 3

#### `src/__tests__/form-errors.test.ts`
Tests for `src/lib/form-errors.ts`:
- `getFieldErrors` — parses ZodError into `Record<string, string>`
- Returns empty object for non-Zod errors
- Returns first error per field when multiple

#### `src/__tests__/file-validation.test.ts`
Tests for `src/lib/file-validation.ts` (created in section 2):
- Detects JPEG from magic bytes `FF D8 FF`
- Detects PNG from magic bytes `89 50 4E 47`
- Detects WebP from magic bytes `52 49 46 46...57 45 42 50`
- Returns null for unknown/invalid bytes
- Returns null for empty or too-short input

#### `src/__tests__/is-club-member.test.ts`
Tests for `src/server/is-club-member.ts`:
- `isClubMember` returns true when status is ACCEPTED
- `isClubMember` returns false when membership not found
- `isClubMember` returns false for PENDING/REJECTED status
- Uses mocked Prisma client

#### `src/__tests__/award-points.test.ts`
Tests for `src/server/award-points.ts`:
- Creates userPoints record with correct action and points value
- Uses refId when provided
- Handles unknown action gracefully (no crash)
- Uses mocked Prisma client

### Prisma mock pattern

For tests that need Prisma (`is-club-member`, `award-points`), use manual mock:

```typescript
const mockDb = {
  clubMembership: { findUnique: vi.fn() },
  userPoints: { create: vi.fn() },
} as unknown as PrismaClient;
```

No additional mock library needed — `vi.fn()` from Vitest is sufficient.

---

## 2. Server-side File Validation (Magic Bytes)

### Goal

Validate uploaded files by their actual content (magic bytes), not just declared MIME type. Prevents malicious file uploads disguised as images.

### `src/lib/file-validation.ts` (new)

```typescript
const SIGNATURES: Array<{ type: string; bytes: number[]; offset?: number }> = [
  { type: "image/jpeg", bytes: [0xFF, 0xD8, 0xFF] },
  { type: "image/png", bytes: [0x89, 0x50, 0x4E, 0x47] },
  { type: "image/webp", bytes: [0x52, 0x49, 0x46, 0x46], offset: 0 },
  // WebP also needs bytes at offset 8: [0x57, 0x45, 0x42, 0x50]
];

export function detectFileType(bytes: Uint8Array): string | null
```

Logic:
1. Check JPEG: first 3 bytes match `FF D8 FF`
2. Check PNG: first 4 bytes match `89 50 4E 47`
3. Check WebP: first 4 bytes match `52 49 46 46` AND bytes 8-11 match `57 45 42 50`
4. Return matched MIME type or `null`

### Changes to `src/app/api/upload/route.ts`

After existing MIME check, before Supabase upload:

```typescript
import { detectFileType } from "@/lib/file-validation";

// After: if (!file.type.startsWith("image/")) return 400
const arrayBuffer = await file.arrayBuffer();
const bytes = new Uint8Array(arrayBuffer.slice(0, 12));
const detectedType = detectFileType(bytes);

if (!detectedType) {
  return NextResponse.json({ error: "Nieprawidłowy format pliku" }, { status: 400 });
}
```

The `arrayBuffer` is then passed to Supabase upload (already needs the buffer for upload, so no extra read).

### Allowed types

Only: `image/jpeg`, `image/png`, `image/webp`. Any other content → 400.

### No new dependencies

Uses built-in `ArrayBuffer` / `Uint8Array` APIs.

---

## 3. Shared Pagination Hook — `usePaginatedList`

### Goal

Extract the repeated infinite-scroll + tRPC pagination pattern from sparings and events pages into a reusable hook.

### Current pattern (duplicated in sparings + events)

Both pages do:
1. Call tRPC infinite query with cursor
2. Flatten pages into items array
3. Track hasNextPage / isFetchingNextPage
4. Wire useInfiniteScroll hook to fetchNextPage
5. Handle loading/error states

### `src/hooks/use-paginated-list.ts` (new)

```typescript
import { useInfiniteScroll } from "./use-infinite-scroll";

interface UsePaginatedListResult<T> {
  items: T[];
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
  sentinelRef: (node: HTMLElement | null) => void;
  hasMore: boolean;
  isFetchingNextPage: boolean;
}

export function usePaginatedList<T>(
  query: {
    data: { pages: Array<{ items: T[]; nextCursor?: string }> } | undefined;
    isLoading: boolean;
    isError: boolean;
    hasNextPage: boolean;
    isFetchingNextPage: boolean;
    fetchNextPage: () => void;
    refetch: () => void;
  }
): UsePaginatedListResult<T>
```

Implementation:
- `items` = `query.data?.pages.flatMap(p => p.items) ?? []`
- `sentinelRef` = `useInfiniteScroll(query.fetchNextPage, query.hasNextPage, query.isFetchingNextPage)`
- Pass-through: `isLoading`, `isError`, `refetch`, `hasMore: query.hasNextPage`, `isFetchingNextPage`

### Usage in sparings/page.tsx

Before:
```typescript
const sparingsQuery = api.sparing.list.useInfiniteQuery(...);
const items = sparingsQuery.data?.pages.flatMap(p => p.items) ?? [];
const sentinelRef = useInfiniteScroll(
  () => sparingsQuery.fetchNextPage(),
  sparingsQuery.hasNextPage,
  sparingsQuery.isFetchingNextPage
);
// + separate isLoading, isError checks
```

After:
```typescript
const sparingsQuery = api.sparing.list.useInfiniteQuery(...);
const { items, isLoading, isError, refetch, sentinelRef } = usePaginatedList(sparingsQuery);
```

### Pages to refactor

1. `src/app/(dashboard)/sparings/page.tsx` — SearchTab section
2. `src/app/(dashboard)/events/page.tsx` — SearchTab section

Both replace ~10 lines of boilerplate with 1 hook call.

---

## Files Summary

### New files (8)

| File | Purpose |
|------|---------|
| `vitest.config.ts` | Vitest configuration |
| `src/lib/file-validation.ts` | Magic bytes detection |
| `src/hooks/use-paginated-list.ts` | Shared pagination hook |
| `src/__tests__/format.test.ts` | Format helper tests |
| `src/__tests__/gamification.test.ts` | Gamification logic tests |
| `src/__tests__/form-errors.test.ts` | Form error parser tests |
| `src/__tests__/file-validation.test.ts` | File validation tests |
| `src/__tests__/is-club-member.test.ts` | Membership helper tests |
| `src/__tests__/award-points.test.ts` | Points helper tests |

### Modified files (4)

| File | Change |
|------|--------|
| `package.json` | +vitest devDep, +test scripts |
| `src/app/api/upload/route.ts` | +magic bytes validation |
| `src/app/(dashboard)/sparings/page.tsx` | Use usePaginatedList |
| `src/app/(dashboard)/events/page.tsx` | Use usePaginatedList |

### New dependency (1)

| Package | Type | Reason |
|---------|------|--------|
| `vitest` | devDependency | Unit testing framework |

---

## What's NOT changing

- E2E tests (Playwright) — stay as-is
- Business logic in tRPC routers
- Database schema
- UI components
- Other pages beyond sparings/events pagination refactor
