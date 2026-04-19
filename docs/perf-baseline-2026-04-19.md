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
