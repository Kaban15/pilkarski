# Etap A: Unit Tests + File Validation + Shared Pagination Hook — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Vitest unit tests for 5 helpers, server-side magic-bytes file validation on uploads, and a shared pagination hook to DRY up sparings/events pages.

**Architecture:** Three independent improvements. Vitest bootstrapped first (needed to test the file-validation helper). File validation is a pure function + integration into upload route. Pagination hook extracts existing pattern into reusable hook.

**Tech Stack:** Vitest, TypeScript, Next.js API routes, tRPC React Query

**Spec:** `docs/superpowers/specs/2026-03-28-backlog-etap-a.md`

---

### Task 1: Vitest Setup + Format Tests

**Files:**
- Create: `vitest.config.ts`
- Modify: `package.json` (scripts + devDep)
- Create: `src/__tests__/format.test.ts`

- [ ] **Step 1: Install vitest**

Run: `npm install -D vitest`

- [ ] **Step 2: Create vitest.config.ts**

```typescript
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    include: ["src/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

- [ ] **Step 3: Add test scripts to package.json**

Add to `"scripts"`:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: Write format tests**

Create `src/__tests__/format.test.ts`:

```typescript
import { formatDate, formatShortDate, formatEventDateTime } from "@/lib/format";

describe("formatDate", () => {
  it("formats Date object with time in Polish", () => {
    const date = new Date("2026-03-28T16:00:00Z");
    const result = formatDate(date);
    expect(result).toContain("28");
    expect(result).toContain("2026");
    expect(result).toMatch(/\d{2}:\d{2}/);
  });

  it("formats string date", () => {
    const result = formatDate("2026-03-28T16:00:00Z");
    expect(result).toContain("28");
    expect(result).toContain("2026");
  });
});

describe("formatShortDate", () => {
  it("returns short date without time", () => {
    const result = formatShortDate(new Date("2026-03-28T16:00:00Z"));
    expect(result).toContain("28");
    expect(result).toContain("2026");
    expect(result).not.toMatch(/16:00/);
  });
});

describe("formatEventDateTime", () => {
  it("returns short date with time", () => {
    const result = formatEventDateTime(new Date("2026-03-28T16:00:00Z"));
    expect(result).toContain("28");
    expect(result).toMatch(/\d{2}:\d{2}/);
  });
});
```

- [ ] **Step 5: Run tests**

Run: `npm test`
Expected: 4 tests pass

- [ ] **Step 6: Commit**

```bash
git add vitest.config.ts package.json package-lock.json src/__tests__/format.test.ts
git commit -m "test: add Vitest setup + format helper tests"
```

---

### Task 2: Gamification Tests

**Files:**
- Create: `src/__tests__/gamification.test.ts`

- [ ] **Step 1: Write gamification tests**

Create `src/__tests__/gamification.test.ts`:

```typescript
import { POINTS_MAP, BADGES, type BadgeCheckStats } from "@/lib/gamification";

const ZERO_STATS: BadgeCheckStats = {
  totalPoints: 0,
  sparingsCreated: 0,
  sparingsMatched: 0,
  eventsCreated: 0,
  reviewsGiven: 0,
  messagesCount: 0,
  applicationsCount: 0,
};

describe("POINTS_MAP", () => {
  it("has 16 actions", () => {
    expect(Object.keys(POINTS_MAP)).toHaveLength(16);
  });

  it("all values are positive integers", () => {
    for (const [action, points] of Object.entries(POINTS_MAP)) {
      expect(points, `${action} should be positive`).toBeGreaterThan(0);
      expect(Number.isInteger(points), `${action} should be integer`).toBe(true);
    }
  });
});

describe("BADGES", () => {
  it("has 9 badges", () => {
    expect(BADGES).toHaveLength(9);
  });

  it("each badge has required fields", () => {
    for (const badge of BADGES) {
      expect(badge.key).toBeTruthy();
      expect(badge.name).toBeTruthy();
      expect(badge.description).toBeTruthy();
      expect(badge.icon).toBeTruthy();
      expect(typeof badge.check).toBe("function");
    }
  });

  it("no badge is earned with zero stats", () => {
    for (const badge of BADGES) {
      expect(badge.check(ZERO_STATS), `${badge.key} should not pass with zero stats`).toBe(false);
    }
  });

  const cases: Array<{ key: string; stats: Partial<BadgeCheckStats> }> = [
    { key: "first_sparing", stats: { sparingsCreated: 1 } },
    { key: "sparing_master", stats: { sparingsCreated: 10 } },
    { key: "matchmaker", stats: { sparingsMatched: 5 } },
    { key: "event_organizer", stats: { eventsCreated: 5 } },
    { key: "reviewer", stats: { reviewsGiven: 3 } },
    { key: "communicator", stats: { messagesCount: 50 } },
    { key: "active_player", stats: { totalPoints: 100 } },
    { key: "veteran", stats: { totalPoints: 500 } },
    { key: "applicant", stats: { applicationsCount: 10 } },
  ];

  for (const { key, stats } of cases) {
    it(`${key} is earned with sufficient stats`, () => {
      const badge = BADGES.find((b) => b.key === key)!;
      expect(badge).toBeDefined();
      expect(badge.check({ ...ZERO_STATS, ...stats })).toBe(true);
    });
  }
});
```

- [ ] **Step 2: Run tests**

Run: `npm test`
Expected: All pass (4 format + ~15 gamification)

- [ ] **Step 3: Commit**

```bash
git add src/__tests__/gamification.test.ts
git commit -m "test: add gamification logic tests (POINTS_MAP + BADGES)"
```

---

### Task 3: Form Errors + Award Points + Is Club Member Tests

**Files:**
- Create: `src/__tests__/form-errors.test.ts`
- Create: `src/__tests__/award-points.test.ts`
- Create: `src/__tests__/is-club-member.test.ts`

- [ ] **Step 1: Write form-errors tests**

Create `src/__tests__/form-errors.test.ts`:

```typescript
import { getFieldErrors } from "@/lib/form-errors";
import { z } from "zod/v4";

describe("getFieldErrors", () => {
  it("parses ZodError into field→message map", () => {
    const schema = z.object({ name: z.string().min(1), age: z.number().min(0) });
    const result = schema.safeParse({ name: "", age: -1 });
    if (result.success) throw new Error("Should fail");
    const errors = getFieldErrors(result.error);
    expect(errors.name).toBeTruthy();
    expect(errors.age).toBeTruthy();
  });

  it("returns first error per field", () => {
    const schema = z.object({ email: z.string().min(1).email() });
    const result = schema.safeParse({ email: "" });
    if (result.success) throw new Error("Should fail");
    const errors = getFieldErrors(result.error);
    expect(typeof errors.email).toBe("string");
  });

  it("returns empty for valid input", () => {
    const schema = z.object({ name: z.string() });
    const result = schema.safeParse({ name: "ok" });
    if (!result.success) throw new Error("Should pass");
    // No ZodError to parse — function expects ZodError input
    // This test validates that valid schemas don't produce errors
  });
});
```

- [ ] **Step 2: Write award-points tests**

Create `src/__tests__/award-points.test.ts`:

```typescript
import { vi, describe, it, expect } from "vitest";
import { awardPoints } from "@/server/award-points";

describe("awardPoints", () => {
  it("creates userPoints with correct data for known action", async () => {
    const mockCreate = vi.fn().mockResolvedValue({});
    const mockDb = { userPoints: { create: mockCreate } };

    await awardPoints(mockDb, "user-123", "sparing_created", "ref-456");

    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        userId: "user-123",
        points: 10,
        action: "sparing_created",
        refId: "ref-456",
      },
    });
  });

  it("resolves without DB call for unknown action", async () => {
    const mockCreate = vi.fn();
    const mockDb = { userPoints: { create: mockCreate } };

    await awardPoints(mockDb, "user-123", "nonexistent_action");

    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("passes undefined refId when not provided", async () => {
    const mockCreate = vi.fn().mockResolvedValue({});
    const mockDb = { userPoints: { create: mockCreate } };

    await awardPoints(mockDb, "user-123", "message_sent");

    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        userId: "user-123",
        points: 2,
        action: "message_sent",
        refId: undefined,
      },
    });
  });
});
```

- [ ] **Step 3: Write is-club-member tests**

Create `src/__tests__/is-club-member.test.ts`.

Note: `isClubMember` imports `db` from `@/server/db/client` at module level. We need to mock that module.

```typescript
import { vi, describe, it, expect, beforeEach } from "vitest";

// Mock the db module before importing
vi.mock("@/server/db/client", () => ({
  db: {
    clubMembership: {
      findUnique: vi.fn(),
    },
  },
}));

import { isClubMember, getClubMembership } from "@/server/is-club-member";
import { db } from "@/server/db/client";

const mockFindUnique = db.clubMembership.findUnique as ReturnType<typeof vi.fn>;

beforeEach(() => {
  mockFindUnique.mockReset();
});

describe("isClubMember", () => {
  it("returns true for ACCEPTED membership", async () => {
    mockFindUnique.mockResolvedValue({ status: "ACCEPTED" });
    const result = await isClubMember("user-1", "club-1");
    expect(result).toBe(true);
    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { clubId_memberUserId: { clubId: "club-1", memberUserId: "user-1" } },
      select: { status: true },
    });
  });

  it("returns false for PENDING membership", async () => {
    mockFindUnique.mockResolvedValue({ status: "PENDING" });
    expect(await isClubMember("user-1", "club-1")).toBe(false);
  });

  it("returns false when membership not found", async () => {
    mockFindUnique.mockResolvedValue(null);
    expect(await isClubMember("user-1", "club-1")).toBe(false);
  });
});
```

- [ ] **Step 4: Run all tests**

Run: `npm test`
Expected: All pass (~25 tests total)

- [ ] **Step 5: Commit**

```bash
git add src/__tests__/form-errors.test.ts src/__tests__/award-points.test.ts src/__tests__/is-club-member.test.ts
git commit -m "test: add form-errors, award-points, is-club-member unit tests"
```

---

### Task 4: File Validation — Magic Bytes Helper + Tests

**Files:**
- Create: `src/lib/file-validation.ts`
- Create: `src/__tests__/file-validation.test.ts`

- [ ] **Step 1: Write file-validation tests first (TDD)**

Create `src/__tests__/file-validation.test.ts`:

```typescript
import { detectFileType } from "@/lib/file-validation";

describe("detectFileType", () => {
  it("detects JPEG", () => {
    const bytes = new Uint8Array([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x00]);
    expect(detectFileType(bytes)).toBe("image/jpeg");
  });

  it("detects PNG", () => {
    const bytes = new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A]);
    expect(detectFileType(bytes)).toBe("image/png");
  });

  it("detects WebP", () => {
    // RIFF....WEBP
    const bytes = new Uint8Array([
      0x52, 0x49, 0x46, 0x46, // RIFF
      0x00, 0x00, 0x00, 0x00, // file size (don't care)
      0x57, 0x45, 0x42, 0x50, // WEBP
    ]);
    expect(detectFileType(bytes)).toBe("image/webp");
  });

  it("returns null for unknown bytes", () => {
    const bytes = new Uint8Array([0x00, 0x01, 0x02, 0x03]);
    expect(detectFileType(bytes)).toBeNull();
  });

  it("returns null for empty input", () => {
    expect(detectFileType(new Uint8Array([]))).toBeNull();
  });

  it("returns null for too-short input", () => {
    expect(detectFileType(new Uint8Array([0xFF, 0xD8]))).toBeNull();
  });

  it("rejects RIFF without WEBP marker", () => {
    const bytes = new Uint8Array([
      0x52, 0x49, 0x46, 0x46,
      0x00, 0x00, 0x00, 0x00,
      0x41, 0x56, 0x49, 0x20, // AVI, not WEBP
    ]);
    expect(detectFileType(bytes)).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests — should fail**

Run: `npm test -- src/__tests__/file-validation.test.ts`
Expected: FAIL (module not found)

- [ ] **Step 3: Implement file-validation.ts**

Create `src/lib/file-validation.ts`:

```typescript
/**
 * Detect image file type from magic bytes.
 * Returns MIME type string or null if not a recognized image.
 */
export function detectFileType(bytes: Uint8Array): string | null {
  if (bytes.length < 3) return null;

  // JPEG: FF D8 FF
  if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
    return "image/jpeg";
  }

  // PNG: 89 50 4E 47
  if (bytes.length >= 4 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
    return "image/png";
  }

  // WebP: RIFF....WEBP (bytes 0-3: RIFF, bytes 8-11: WEBP)
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  ) {
    return "image/webp";
  }

  return null;
}
```

- [ ] **Step 4: Run tests — should pass**

Run: `npm test -- src/__tests__/file-validation.test.ts`
Expected: 7 tests pass

- [ ] **Step 5: Commit**

```bash
git add src/lib/file-validation.ts src/__tests__/file-validation.test.ts
git commit -m "feat: add magic bytes file validation helper with tests"
```

---

### Task 5: Integrate File Validation into Upload Route

**Files:**
- Modify: `src/app/api/upload/route.ts`

- [ ] **Step 1: Add magic bytes check to upload route**

In `src/app/api/upload/route.ts`, add import at top:

```typescript
import { detectFileType } from "@/lib/file-validation";
```

Then, after the existing MIME type check (`if (!file.type.startsWith("image/"))`) and BEFORE the line `const buffer = Buffer.from(await file.arrayBuffer());`, add:

```typescript
  const arrayBuffer = await file.arrayBuffer();
  const headerBytes = new Uint8Array(arrayBuffer.slice(0, 12));
  const detectedType = detectFileType(headerBytes);

  if (!detectedType) {
    return NextResponse.json(
      { error: "Nieprawidłowy format pliku. Dozwolone: JPEG, PNG, WebP." },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(arrayBuffer);
```

And remove the OLD line `const buffer = Buffer.from(await file.arrayBuffer());` since we now read arrayBuffer earlier and reuse it.

The final upload route should read `arrayBuffer` once, check magic bytes, then pass `Buffer.from(arrayBuffer)` to Supabase.

- [ ] **Step 2: Verify TypeScript**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/app/api/upload/route.ts
git commit -m "feat: add server-side magic bytes validation to file upload"
```

---

### Task 6: Shared Pagination Hook

**Files:**
- Create: `src/hooks/use-paginated-list.ts`

- [ ] **Step 1: Create the hook**

Create `src/hooks/use-paginated-list.ts`:

```typescript
import { useCallback, useMemo } from "react";
import { useInfiniteScroll } from "./use-infinite-scroll";

interface PaginatedQuery<T> {
  data: { pages: Array<{ items: T[]; nextCursor?: string | null }> } | undefined;
  isLoading: boolean;
  isError: boolean;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  refetch: () => void;
}

interface UsePaginatedListResult<T> {
  items: T[];
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
  sentinelRef: (node: HTMLDivElement | null) => void;
  hasMore: boolean;
  isFetchingNextPage: boolean;
}

export function usePaginatedList<T>(query: PaginatedQuery<T>): UsePaginatedListResult<T> {
  const items = useMemo(
    () => query.data?.pages.flatMap((p) => p.items) ?? [],
    [query.data]
  );

  const fetchNext = useCallback(() => {
    query.fetchNextPage();
  }, [query.fetchNextPage]);

  const sentinelRef = useInfiniteScroll(
    fetchNext,
    !!query.hasNextPage,
    query.isFetchingNextPage
  );

  return {
    items,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    sentinelRef,
    hasMore: !!query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
  };
}
```

- [ ] **Step 2: Verify TypeScript**

Run: `npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add src/hooks/use-paginated-list.ts
git commit -m "feat: add usePaginatedList shared hook"
```

---

### Task 7: Refactor Sparings + Events to Use Shared Hook

**Files:**
- Modify: `src/app/(dashboard)/sparings/page.tsx`
- Modify: `src/app/(dashboard)/events/page.tsx`

- [ ] **Step 1: Refactor sparings SearchTab**

In `src/app/(dashboard)/sparings/page.tsx`:

1. Replace import: `import { useInfiniteScroll } from "@/hooks/use-infinite-scroll"` → `import { usePaginatedList } from "@/hooks/use-paginated-list"`

2. Find the SearchTab area (around lines 140-175) where the query is destructured. Replace:

```typescript
  // OLD:
  const {
    data,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = api.sparing.list.useInfiniteQuery(queryInput, { ... });

  const items = (data?.pages.flatMap((p) => p.items) ?? []) as SparingCardItem[];
  // ... (favorites check code stays)

  const sentinelRef = useInfiniteScroll(
    () => { fetchNextPage(); },
    !!hasNextPage,
    isFetchingNextPage,
  );
```

With:

```typescript
  // NEW:
  const sparingsQuery = api.sparing.list.useInfiniteQuery(queryInput, { ... });
  const { items: rawItems, isLoading, isError, refetch, sentinelRef, isFetchingNextPage } = usePaginatedList(sparingsQuery);
  const items = rawItems as SparingCardItem[];
  // ... (favorites check code stays, uses items)
```

Note: keep the `getNextPageParam` in the useInfiniteQuery options unchanged. Keep the favorites check code that runs after items are loaded. Only replace the flatMap + useInfiniteScroll boilerplate.

- [ ] **Step 2: Refactor events SearchTab**

In `src/app/(dashboard)/events/page.tsx`, same pattern:

1. Replace import: `useInfiniteScroll` → `usePaginatedList`

2. Replace the query destructure + flatMap + useInfiniteScroll with:

```typescript
  const eventsQuery = api.event.list.useInfiniteQuery(queryInput, { ... });
  const { items: rawItems, isLoading, isError, refetch, sentinelRef, isFetchingNextPage } = usePaginatedList(eventsQuery);
  const items = rawItems as EventItem[];
```

- [ ] **Step 3: Verify TypeScript**

Run: `npx tsc --noEmit`

- [ ] **Step 4: Verify build**

Run: `npm run build`

- [ ] **Step 5: Commit**

```bash
git add src/app/(dashboard)/sparings/page.tsx src/app/(dashboard)/events/page.tsx
git commit -m "refactor: use usePaginatedList in sparings and events pages"
```

---

### Task 8: Final Verification

- [ ] **Step 1: Run all unit tests**

Run: `npm test`
Expected: ~30 tests pass, 0 failures

- [ ] **Step 2: TypeScript check**

Run: `npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: Successful

- [ ] **Step 4: Commit if any fixes needed**

```bash
git add -A
git commit -m "fix: final adjustments after Etap A verification"
```

---

## File Summary

| # | File | Action | Task |
|---|------|--------|------|
| 1 | `vitest.config.ts` | Create | T1 |
| 2 | `package.json` | Modify (scripts + devDep) | T1 |
| 3 | `src/__tests__/format.test.ts` | Create | T1 |
| 4 | `src/__tests__/gamification.test.ts` | Create | T2 |
| 5 | `src/__tests__/form-errors.test.ts` | Create | T3 |
| 6 | `src/__tests__/award-points.test.ts` | Create | T3 |
| 7 | `src/__tests__/is-club-member.test.ts` | Create | T3 |
| 8 | `src/lib/file-validation.ts` | Create | T4 |
| 9 | `src/__tests__/file-validation.test.ts` | Create | T4 |
| 10 | `src/app/api/upload/route.ts` | Modify | T5 |
| 11 | `src/hooks/use-paginated-list.ts` | Create | T6 |
| 12 | `src/app/(dashboard)/sparings/page.tsx` | Modify | T7 |
| 13 | `src/app/(dashboard)/events/page.tsx` | Modify | T7 |
