# Perf Diagnosis — Design Spec

**Data:** 2026-04-19
**Autor:** brainstorming session (Piotr + Claude)
**Status:** Proposed — awaiting implementation phase
**Scope:** Diagnoza systemowej latencji („lag") na platformie PilkaSport.
Ta spec pokrywa **tylko fazę diagnostyczną**; fix phase wymaga osobnej
rundy brainstormu po zebraniu danych.

---

## Problem statement

User zgłasza subiektywne odczucie „lag" — podstrony ładują się z
opóźnieniem na **obu środowiskach** (lokalne + produkcja Vercel).
Wrażenie dotyczy wszystkich typów interakcji (nawigacja, data-fetching,
kliknięcia w UI, formy). Pomiarów brak — diagnoza **nie może opierać
się na hipotezach** bez baseline'u.

### Kontekst techniczny

- Next.js 16 (App Router) + RSC + React Compiler (Etap 73)
- tRPC v11 (fetch adapter, superjson) + Prisma 7 + Supabase Session
  Pooler (port 6543, free tier)
- Auth.js v5 (JWT strategy, `getToken()` w middleware)
- Optymalizacje wcześniej wdrożone: RSC prefetch (Etap 65+), staleTimes
  tuning (global 60s, feed/stats 5min), `usePrefetchRoute` hover
  prefetch, Next 16 router cache (`staleTimes.dynamic: 30`,
  `static: 180`)

Pomimo tych optymalizacji — lag. Co oznacza że **wąskim gardłem jest
coś innego** niż to, co już zoptymalizowano.

### Lessons learned z etapu 74/75

Etap 74 postulował hipotezę „quick-apply fail = regres Etap 72
(img→Image)". Playwright trace w Etap 75 pokazał że **hipoteza była
fałszywa** — prawdziwy root cause to Next 16 Dev Tools portal + test
selector mismatch. Wniosek: **nie diagnozujemy bez danych.**

---

## Cele

1. Zmierzyć baseline wydajności na 5 reprezentatywnych ścieżkach
2. Porównać `dev` / `production build lokalnie` / `prod Vercel`
3. Rozróżnić cold-start od warm performance
4. Zidentyfikować dominującą hipotezę (H1–H4) albo eskalować do B

## Non-cele

- Real User Monitoring (RUM) — opcja C, odrzucona jako over-kill
- Mobile throttling — osobny pass później, tylko jeśli desktop czysty
- Bundle analysis / code splitting optimizations — odrzucone, Next
  Compiler + React Compiler już to pokrywają (patrz STATE.md)
- Pisanie kodu fixów — **HARD GATE**: implementacja po re-designie

---

## Protokół pomiarowy

### Matryca pomiarów

| Wymiar | Wartości |
|---|---|
| **Ścieżki** | `/feed`, `/sparings`, `/sparings/[id]` (detail, prefetched), `/events`, `/clubs/[id]` (publiczny profil) |
| **Środowiska** | A) `npm run dev` lokalnie, B) `npm run build && npm start` lokalnie, C) `pilkarski.vercel.app` prod |
| **Scenariusze** | Cold (pierwszy hit po ≥10 min przerwy), Warm (3× kolejne przejścia) |

**Łącznie:** 5 × 3 × 2 = **30 pomiarów.** ~45 min ręcznej pracy w
przeglądarce.

### Metryki per pomiar

- **TTFB** — z głównego dokumentu HTML/RSC payload (Network → pierwszy
  request → Timing tab). Uwaga: w RSC App Routerze HTML payload zawiera
  już wynik **server-side tRPC calls** — długi TTFB może skrywać
  waterfall który nie jest widoczny w Network jako osobne fetche.
- **RSC payload duration** — osobna kolumna; dla requestów
  `?_rsc=...` lub `text/x-component` content-type
- **Client-side tRPC count + sum** — liczba requestów tRPC w Network
  (client-side fetches) + suma czasu tych które są na **critical path**
  (serial waterfall, nie parallel). Notatka: jeśli widać 5× 400 ms
  serial, suma = 2 s — to gorsze niż pojedynczy 1.2 s parallel fetch
- **LCP, TBT** — Performance Insights overlay. **3 próbki, median** —
  Performance Insights jest sampled, nie deterministic
- **Slowest fetch** — URL + czas (kontekstowe, nie jedyny indicator)

### Narzędzia

- **Chrome DevTools Network tab** — **Disable cache ON dla cold
  pomiarów** (hard-reload + wyłączony cache, żeby nie było
  contamination z disk cache), **OFF dla warm** (symulacja realnego
  usera z ciepłą przeglądarką)
- **Chrome DevTools Performance Insights** (Web Vitals overlay)
- **tRPC debug:** filtr `trpc` w Network → sortuj po `Time`
- Brak artificial throttling

### Definicja cold-start per środowisko

„≥10 min idle" ma różną semantykę w każdym środowisku — musimy
przypiąć definicję, bo inaczej cold/warm spread nie da się
zinterpretować.

| Env | Co się „wychładza" | Operacja cold |
|---|---|---|
| A (`npm run dev`) | Supabase pooler + build cache Next dev | Kill dev server (Ctrl+C), `rm -rf .next`, `npm run dev`, pierwsze hit |
| B (`npm start` po build) | Supabase pooler + node.js process state | Kill server, `npm start`, pierwsze hit |
| C (Vercel prod) | Lambda cold start + Supabase pooler + middleware cache (3 niezależne timery) | Poczekaj ≥10 min bez requestów do domeny, pierwsze hit z fresh incognito window |

**Kontrola dla H1 (Supabase cold) vs ogólny cold start:** każdy env mierzy też
**jedną ścieżkę bez DB access** (`/` landing page lub `/robots.txt`).
Jeśli ta też wolna na cold → to nie Supabase, tylko framework/infra cold.

### Sampling

- **Cold:** N=1 per cell (cold jest drogi — restart/odczekać 10 min).
  **Notuj jako noisy, nie stosuj dokładnego progu dla delta cold-only**
- **Warm:** 3 kolejne hity, **median** jako raportowana wartość

### Co świadomie NIE mierzymy (i dlaczego)

- **Throttling mobile** — odrzucone w scope diagnozy, separate pass
- **DB query-level trace** — dopiero jeśli wyniki wskażą Supabase/tRPC
  jako winowajcę
- **Bundle size analyzer** — bundle analyzer output znany z poprzednich
  etapów, nie jest smoking gun

---

## Hipotezy i progi decyzyjne

Cztery hipotezy na podstawie stacku + STATE.md, posortowane od
najbardziej prawdopodobnej:

### H1 — Supabase pooler cold start

**Dlaczego prawdopodobna:** Free tier, Transaction Pooler (6543), Auth.js
session refresh w middleware hitting DB, `connect` latency może rosnąć
po idle.

**Sygnał w pomiarach:**
- Cold TTFB >>> warm TTFB (spread np. 3 s vs 200 ms)
- Cold tRPC calls każdy 1–2 s, warm <200 ms
- Prod + dev dotknięte (oba hit ten sam Supabase)

**Koszt fixa:** ~1 h (warm-up endpoint + Vercel cron ping) lub upgrade
planu.

### H2 — tRPC waterfall (client OR server)

**Dlaczego prawdopodobna:** pomimo RSC prefetch, niektóre strony mogą
nie prefetchować wszystkiego albo prefetchować sekwencyjnie w RSC
layerze.

**Sygnał:**
- **Client-side:** 5+ tRPC requestów sekwencyjnych w Network, każdy
  czeka na poprzedni; sum(tRPC critical path) ≫ max(single fetch)
- **Server-side (RSC waterfall):** długi TTFB głównego dokumentu BEZ
  proporcjonalnie długich client tRPC calls — sugeruje że czas idzie
  w server-side prefetchu. **Nie da się tego w pełni rozróżnić bez
  server-side trace** → jeśli H2 dominuje ale client tRPC jest
  tani → **forced escalation do Alt B** (console.time markery w RSC
  layout/page + tRPC middleware)
- Bardziej widoczne na `/sparings/[id]`, mniej na `/feed` (który ma RSC
  prefetch w Etap 65)

**Koszt fixa:** 2–4 h (batch link tRPC + parallel fetches w RSC route
handlers).

### H3 — Session/JWT refresh heavy

**Dlaczego prawdopodobna:** Auth.js v5 w każdym middleware hit robi
`getToken()` + potencjalnie DB hit jeśli `callbacks.jwt` nie throttled.

**Sygnał:**
- Na każdą nawigację request do `/api/auth/session` (>100 ms każdy)
- Middleware TTFB rośnie proporcjonalnie do głębokości route
- Widoczne zwłaszcza na publicznych routes z auth check

**Koszt fixa:** 1–2 h (`callbacks.jwt` with `trigger === "update"`
throttle, JWT maxAge extend).

### H5 — Middleware matcher zbyt szeroki

**Dlaczego prawdopodobna:** Auth.js middleware w Next uruchamia się
na każdym request pasującym matcher config. Jeśli `matcher` łapie też
static assets (np. `/_next/static/*` albo `/images/*`), każdy PNG/CSS
płaci JWT verification + getToken cost. Distinct od H3 (config matcher
vs callback logic).

**Sygnał:**
- W Network tab wiele static assets (obrazy, fonts, `_next/static/`)
  ma niespodziewany TTFB (>50 ms zamiast <10 ms)
- `/robots.txt` albo czysty static route ma TTFB proporcjonalny do
  JWT cost (rzędu 100+ ms zamiast edge-cached <20 ms)

**Koszt fixa:** 15 min (zawęzić `matcher` w `middleware.ts` żeby
wykluczyć `_next/static/`, `_next/image/`, `favicon.ico`, `/api/` gdzie
nie trzeba auth).

### H4 — Dev-mode only artifact

**Dlaczego prawdopodobna:** `npm run dev` kompiluje on-demand, Next 16
+ React Compiler babel pass może być wolny, brak minifikacji.

**Sygnał:**
- `npm run build && npm start` lokalnie → TTFB <300 ms
- `npm run dev` → TTFB 1+ s
- Prod Vercel pasuje do `npm start` lokalnie

**Koszt fixa:** Zero kodu. „Nie fix — tylko wytłumaczenie dla
developera że dev mode to nie prod."

### Progi decyzyjne

- **Silny sygnał = spread ≥2× AND absolute delta ≥300 ms** (ta druga
  część kluczowa — 2× przy 80 ms to 160 ms, poniżej network jitter).
  Jeśli oba warunki spełnione dla jednej hipotezy → fix od razu +
  re-measure walidacyjny
- **Dwie hipotezy równorzędne** → fix tańszą pierwszą, re-measure,
  potem druga
- **Żadna nie pasuje progi** → eskalacja do opcji **B** (server-side
  instrumentacja, osobny brainstorm) — spodziewany ~30% edge case
- **H2 sygnał dominuje ale client-side tRPC tani** → automatyczna
  eskalacja do B (bo samego DevTools nie wystarczy na RSC trace)

### Świadomie odrzucone hipotezy (żeby nie wracać)

- Bundle size / JS blocking — React Compiler + Next 16 już
  optymalizują, bundle analyzer nie pokazuje anomalii
- CSS / font blocking — `next/font` inline
- Obraz loading — `next/image` już zmigrowane w Etap 72

---

## Podział pracy

| Krok | Wykonawca | Szacowany czas |
|---|---|---|
| 1. Pomiary `npm run dev` lokalnie (5 × 2 scenariusze = 10 pomiarów) | User | 10 min |
| 2. Pomiary `npm start` (prod build lokalnie, 10 pomiarów) | User | 10 min |
| 3. Pomiary prod Vercel (10 pomiarów) | User | 10 min |
| 4. Wpisanie wyników do `docs/perf-baseline-2026-04-19.md` | User (paste do tabeli) | 5 min |
| 5. Analiza tabeli + wybór dominującej hipotezy | Claude | 5 min |
| 6. Re-design fix phase + user approval | Claude + User | 10 min |
| 7. Implementacja fixa | Claude | 1–4 h (zależy od H) |
| 8. Re-measure + porównanie baseline → after | User | 15 min |

**Total faza diagnostyczna:** ~50 min user + 20 min Claude.
**Total z fixem:** +1–4 h.

---

## Output artefakty

### `docs/perf-baseline-2026-04-19.md`

Tabela markdown z pomiarami. Commitable — baseline dla przyszłych
porównań. Struktura:

```
| Route | Env | Scenario | TTFB | RSC payload ms | Client tRPC count | Client tRPC critical path sum | LCP | TBT | Slowest fetch | Notes |
```

Warm scenario: median z 3 próbek. Cold scenario: N=1, oznaczone jako
noisy. Osobna sekcja kontrolna dla `/robots.txt` lub `/` (bez DB) jako
control dla H1.

### Ewentualny `docs/perf-after-fix-2026-04-XX.md`

Post-fix tabela, porównanie delta z baseline. Powstaje w kroku 8.

---

## Contract dla fix phase

Ten dokument **kończy się** na kroku 6 (re-design po analizie). Fix phase
dostanie osobny design document po wyborze hipotezy. Ta spec jest tylko
dla fazy diagnostycznej.

**Reguły twarde:**

1. **Bez pomiarów — zero kodu fixa.** Learning z Etap 74/75.
2. **Jeśli dane niejednoznaczne** → dodatkowy pomiar, nie zgadywanie.
3. **Minimalna zmiana** — fix tylko dla dominującej hipotezy, nie
   „przy okazji" refaktor.
4. **Post-fix re-measure obowiązkowy** — bez porównania nie wiemy czy
   fix pomógł.

---

## Znane ryzyka pomiarowe (zapisane, żeby nie zaskoczyły)

1. **Vercel Lambda cold start konfunduje z Supabase pooler cold** —
   oba idle-out ~podobnie. **Mitigation:** control route bez DB
   (`/robots.txt` albo `/`) — jeśli ona też wolna na cold, to infra
   cold (Lambda), nie DB.
2. **Windows local TLS setup overhead** — Windows network stack bez WSL
   może dodać 100–300 ms TLS do Supabase połączenia, czego nie ma na
   Vercel. **Mitigation:** porównanie dev vs `npm start` lokalnie na
   tym samym łączu; jeśli oba tak samo wolne → to nie framework,
   tylko OS-level TLS.
3. **Chrome Performance Insights LCP jest sampled** — shift między
   runs bez zmiany kodu. **Mitigation:** 3 próbki warm, median.
4. **„Disable cache"** — **ON dla cold**, OFF dla warm (zrobione w
   sekcji protokołu). Na cold disk cache zafałszuje drugi i kolejny
   route w sesji.
5. **Incognito mode na prod** — ekstensje mogą dodawać latencję
   (uBlock parsing, password managers). Rekomendacja: incognito window
   bez extensions dla prod pomiarów.

---

## Odrzucone alternatywy

### Alternatywa B — Server-side `console.time()` instrumentacja

**Dlaczego odrzucone jako pierwszy krok:** wymaga kodu w tRPC middleware,
routerach, RSC. Zmiana kodu tymczasowa → ryzyko regresji. Zasadne
dopiero po DevTools sweep jeśli A nic nie pokaże.

### Alternatywa C — Vercel Analytics + Speed Insights + OTEL

**Dlaczego odrzucone:** YAGNI dla pierwszego pomiaru. Infrastruktura na
zapas bez hipotezy. Może mieć sens po fazie fixów, jako monitoring
długoterminowy.

### Alternatywa D — Playwright-based measurement script

**Dlaczego odrzucone:** Playwright warm context ≠ cold-start behavior.
Nie łapie real network variability. Więcej kodu niż oszczędności czasu
przy 30 pomiarach.

---

## Acceptance criteria

Diagnoza uznawana za zamkniętą gdy:

- ✅ Tabela 30 pomiarów wypełniona i committed
- ✅ Dominująca hipoteza wybrana (H1–H4) albo ścieżka eskalacji do B
  potwierdzona
- ✅ User approved fix-phase re-design
- ❌ **Jeśli żadna z powyższych nie spełniona** — diagnoza open,
  kontynuuj.
