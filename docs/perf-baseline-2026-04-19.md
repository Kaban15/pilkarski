# Perf Baseline — 2026-04-19

Wyniki pomiarów wg specu `docs/superpowers/specs/2026-04-19-perf-diagnosis-design.md`.

**Reguły wypełniania:**
- Warm: median z 3 kolejnych hitów
- Cold: N=1 (oznaczone jako noisy)
- Disable cache ON dla cold, OFF dla warm
- Incognito window bez extensions dla prod

---

## Środowisko A — `npm run dev` lokalnie

Cold = `Ctrl+C` dev server, `rm -rf .next`, `npm run dev`, pierwsze hit.

| Route | Scenario | TTFB | RSC payload ms | Client tRPC count | tRPC critical path sum | LCP | TBT | Slowest fetch | Notes |
|---|---|---|---|---|---|---|---|---|---|
| `/feed` | cold |  |  |  |  |  |  |  |  |
| `/feed` | warm (median) |  |  |  |  |  |  |  |  |
| `/sparings` | cold |  |  |  |  |  |  |  |  |
| `/sparings` | warm (median) |  |  |  |  |  |  |  |  |
| `/sparings/[id]` | cold |  |  |  |  |  |  |  |  |
| `/sparings/[id]` | warm (median) |  |  |  |  |  |  |  |  |
| `/events` | cold |  |  |  |  |  |  |  |  |
| `/events` | warm (median) |  |  |  |  |  |  |  |  |
| `/clubs/[id]` | cold |  |  |  |  |  |  |  |  |
| `/clubs/[id]` | warm (median) |  |  |  |  |  |  |  |  |

---

## Środowisko B — `npm run build && npm start` lokalnie

Cold = kill process, `npm start`, pierwsze hit.

| Route | Scenario | TTFB | RSC payload ms | Client tRPC count | tRPC critical path sum | LCP | TBT | Slowest fetch | Notes |
|---|---|---|---|---|---|---|---|---|---|
| `/feed` | cold |  |  |  |  |  |  |  |  |
| `/feed` | warm (median) |  |  |  |  |  |  |  |  |
| `/sparings` | cold |  |  |  |  |  |  |  |  |
| `/sparings` | warm (median) |  |  |  |  |  |  |  |  |
| `/sparings/[id]` | cold |  |  |  |  |  |  |  |  |
| `/sparings/[id]` | warm (median) |  |  |  |  |  |  |  |  |
| `/events` | cold |  |  |  |  |  |  |  |  |
| `/events` | warm (median) |  |  |  |  |  |  |  |  |
| `/clubs/[id]` | cold |  |  |  |  |  |  |  |  |
| `/clubs/[id]` | warm (median) |  |  |  |  |  |  |  |  |

---

## Środowisko C — Vercel prod (`pilkarski.vercel.app`)

Cold = poczekaj ≥10 min bez requestów do domeny, fresh incognito window.

| Route | Scenario | TTFB | RSC payload ms | Client tRPC count | tRPC critical path sum | LCP | TBT | Slowest fetch | Notes |
|---|---|---|---|---|---|---|---|---|---|
| `/feed` | cold |  |  |  |  |  |  |  |  |
| `/feed` | warm (median) |  |  |  |  |  |  |  |  |
| `/sparings` | cold |  |  |  |  |  |  |  |  |
| `/sparings` | warm (median) |  |  |  |  |  |  |  |  |
| `/sparings/[id]` | cold |  |  |  |  |  |  |  |  |
| `/sparings/[id]` | warm (median) |  |  |  |  |  |  |  |  |
| `/events` | cold |  |  |  |  |  |  |  |  |
| `/events` | warm (median) |  |  |  |  |  |  |  |  |
| `/clubs/[id]` | cold |  |  |  |  |  |  |  |  |
| `/clubs/[id]` | warm (median) |  |  |  |  |  |  |  |  |

---

## Kontrola bez DB — H1 isolation

Hit na route bez tRPC/DB (`/robots.txt` albo landing `/`) — jeśli cold
też wolny, to cold nie jest winą Supabase.

| Env | Route | Cold TTFB | Warm TTFB (median) | Notes |
|---|---|---|---|---|
| A (dev) | `/robots.txt` |  |  |  |
| B (start) | `/robots.txt` |  |  |  |
| C (prod) | `/robots.txt` |  |  |  |

---

## Obserwacje / podejrzenia podczas pomiarów

(Wpisuj tu luźne notatki które zauważysz — np. „na `/sparings` widać
4 tRPC requesty sekwencyjnie, każdy 200-400ms" albo „prod cold TTFB
pokazuje waiting 2.5s w Network Timing")

- …

---

## Pomiary TTFB przez curl (automatyczne, 2026-04-19)

**Metoda:** `curl -w "%{time_starttransfer}"` — 3 próbki per route, surowy
TTFB (bez LCP, bez DOM rendering). Jeszcze nie pełny baseline Chrome
DevTools, ale jasny sygnał dla H5.

### Prod Vercel (C)

| Route | Status | try1 | try2 | try3 | Median |
|---|---|---|---|---|---|
| `/robots.txt` | 200 | 438 ms | 365 ms | 340 ms | **365 ms** |
| `/` | 200 | 966 ms | 146 ms | 297 ms | **297 ms** (try1 cold) |
| `/leagues` | 200 | 143 ms | 148 ms | 165 ms | **148 ms** |
| `/login` | 200 | 664 ms | 159 ms | 299 ms | **299 ms** (try1 cold) |
| `/register` | 200 | 526 ms | 147 ms | 170 ms | **170 ms** (try1 cold) |
| `/feed` | 307 | 160 ms | 171 ms | 154 ms | **160 ms** |
| `/sparings` | 307 | 147 ms | 139 ms | 144 ms | **144 ms** |
| `/events` | 307 | 142 ms | 142 ms | 147 ms | **142 ms** |
| `/recruitment` | 307 | 139 ms | 149 ms | 150 ms | **149 ms** |
| **`/regions/wielkopolski-zpn.png`** | **307** | 146 ms | 143 ms | 154 ms | **146 ms** |

### Local `npm start` (B)

| Route | Status | try1 | try2 | try3 | Median |
|---|---|---|---|---|---|
| `/robots.txt` | 307 | 2 ms | 22 ms | 2 ms | **2 ms** |
| `/` | 200 | 14 ms | 4 ms | 3 ms | **4 ms** |
| `/leagues` | 307 | 2 ms | 2 ms | 2 ms | **2 ms** |
| `/login` | 200 | 6 ms | 3 ms | 3 ms | **3 ms** |
| `/register` | 200 | 6 ms | 3 ms | 3 ms | **3 ms** |
| `/feed` | 307 | 2 ms | 2 ms | 2 ms | **2 ms** |
| `/sparings` | 307 | 2 ms | 2 ms | 2 ms | **2 ms** |
| `/regions/wielkopolski-zpn.png` | 307 | 2 ms | 2 ms | 2 ms | **2 ms** |

### Wnioski z curl-only pomiarów

1. **H5 POTWIERDZONA** — middleware matcher (`src/middleware.ts:52`)
   `"/((?!_next/static|_next/image|favicon.ico).*)"` **łapie
   `/regions/*.png`**. Każdy PNG regionu płaci JWT verify. Na Vercel
   = ~145 ms per asset. Feed renderujący 5-10 RegionLogo → 700-1500 ms
   narzutu tylko na middleware dla obrazów.
2. **H4 CZĘŚCIOWO** — lokalnie `npm start` daje 2-22 ms TTFB
   (idealnie), prod Vercel 140-170 ms dla 307. Różnica ~100-150 ms
   to koszt **Vercel Edge Runtime** (JWT verify w edge), nie bug
   aplikacji. Nie da się tego wyeliminować bez rezygnacji z middleware
   na Vercel.
3. **H1 WIDOCZNA na try1** — pierwszy hit po przerwie: `/`=966ms,
   `/login`=664ms, `/register`=526ms. Warm schodzi do 145-300 ms.
   Spread ~3-4× na pierwszy cold, **spełnia próg ≥2× AND ≥300 ms**.
   Klasyczny Vercel Lambda cold start albo middleware warm-up.
4. **H2 i H3 — nie można zweryfikować z curl** — wymaga browser
   DevTools (client tRPC count, RSC payload, LCP). Do dalszych
   pomiarów z twojej strony.

### Prawdopodobny ranking przyczyn laga (hipoteza)

1. **H5 (~60%)** — PNG regionów na każdej karcie feed płaci middleware
   140 ms × 10 obrazów = **1.4 s narzutu per visible feed**
2. **H1 (~25%)** — pierwsze wejście po przerwie (Lambda cold)
3. **H3 (~10%)** — JWT refresh na każdej nawigacji (Auth.js callback)
4. **H4 (~5%)** — Edge Runtime narzut per-se (nieusuwalny bez
   rearchitektury)
