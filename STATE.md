# PilkaSport — Stan Projektu

## Aktualny etap: Fazy 1–15 + UI Redesign (Etap 1–3) ✅ → Etap 4: Sparing Flow Overhaul (Iteracja 1 ✅, Iteracja 2 W TRAKCIE)
**Ostatnia sesja:** 2026-03-24

---

## Co jest gotowe

### Faza 1: Inicjalizacja ✅
- Next.js 16 + TypeScript + Tailwind CSS 4 + shadcn/ui
- Prisma 7 z `@prisma/adapter-pg` (Supabase Session Pooler)
- tRPC v11 (fetch adapter, superjson)
- Struktura folderów, git repo, `.env`, `.gitignore`

### Faza 2: Auth + Profile ✅
- Auth.js v5 (credentials provider, JWT sessions)
- Rejestracja `/register` z wyborem roli (Klub / Zawodnik)
- Logowanie `/login` (z Suspense boundary dla useSearchParams)
- Middleware ochrony tras (`getToken()` — Edge-compatible, bez Prisma)
- `protectedProcedure` w tRPC
- CRUD profilu Klubu: nazwa, miasto, region, kontakt, strona www, opis
- CRUD profilu Zawodnika: dane personalne, pozycja, wzrost/waga, noga, bio
- Historia kariery zawodnika (dodawanie/usuwanie)
- Cursor-based pagination na listach klubów i zawodników
- Zod v4 walidacja na wszystkich formularzach
- Dashboard layout z nawigacją (`DashboardNav`)
- shadcn/ui: Button, Input, Label, Card, Tabs, Select

### Faza 3: Regiony, Ligi, Grupy ✅
- Seed: 16 województw (ZPN), 80 szczebli ligowych, 272 grup
- tRPC region router: `list`, `leagueLevels`, `leagueGroups`, `hierarchy`
- Kaskadowe dropdowny w profilu klubu: Region → Szczebel → Grupa
- `dotenv` + `tsx` do uruchamiania seed

### Faza 4: Sparingi i Wydarzenia ✅
- **Sparingi:**
  - `sparing.create` / `list` / `getById` / `applyFor` / `respond` / `cancel` / `my`
  - Tworzenie ogłoszenia (tytuł, data, miejsce, koszty, region)
  - Aplikowanie klubów + akceptacja/odrzucenie przez właściciela
  - Auto-reject pozostałych po akceptacji → status MATCHED
  - UI: `/sparings` (lista + filtr region), `/sparings/new`, `/sparings/[id]`
- **Wydarzenia:**
  - `event.create` / `list` / `getById` / `applyFor` / `respond` / `my` / `myApplications`
  - Typy: trening otwarty, nabór
  - Zgłoszenia zawodników + akceptacja/odrzucenie przez klub
  - Limit miejsc (maxParticipants) respektowany
  - UI: `/events` (lista + filtry region/typ), `/events/new`, `/events/[id]`

---

### Faza 5: System Wiadomości ✅
- **tRPC router `message`:**
  - `getConversations` — lista konwersacji z ostatnią wiadomością i danymi rozmówcy
  - `getMessages` — wiadomości w konwersacji (cursor-based pagination)
  - `send` — wyślij wiadomość (auto-tworzenie konwersacji jeśli nie istnieje)
  - `markAsRead` — oznacz wiadomości od rozmówcy jako przeczytane
  - `unreadCount` — liczba nieprzeczytanych (do badge'a)
  - `getConversationWith` — szukanie istniejącej konwersacji z danym userem
- **UI:**
  - `/messages` — lista konwersacji (avatar, nazwa, ostatnia wiadomość, data)
  - `/messages/[conversationId]` — widok czatu (bąbelki, auto-scroll, polling co 5s)
  - Komponent `SendMessageButton` — przycisk "Napisz wiadomość" (inline formularz → redirect do czatu)
  - Przycisk dodany na `/sparings/[id]` i `/events/[id]` (kontakt z właścicielem klubu)
- **Prisma:** modele `Conversation`, `ConversationParticipant`, `Message`
- **Validators:** `sendMessageSchema`, `getMessagesSchema`, `markAsReadSchema`

---

### Faza 6: Feed, Filtrowanie, Polish ✅
- **Feed (`/feed`):**
  - tRPC `feed.get` — agregacja sparingów, wydarzeń, nowych klubów i zawodników z regionu użytkownika
  - Unified feed posortowany po dacie, kolorowe tagi typów (sparing/wydarzenie/klub/zawodnik)
- **Wyszukiwarka (`/search`):**
  - tRPC `search.global` — szukanie po klubach (nazwa, miasto), zawodnikach (imię, nazwisko), sparingach i wydarzeniach
  - Case-insensitive matching, wyniki pogrupowane po typie
- **Responsywność mobilna:**
  - Hamburger menu z animacją (3 kreski → X), pełne menu mobilne z linkami i wylogowaniem
- **SEO:**
  - Root layout: OpenGraph meta, template title (`%s | PilkaSport`), locale `pl_PL`
  - Landing page: dedykowane meta tagi i OG
- **Landing page (`/`):**
  - Hero z CTA (rejestracja + logowanie), sekcja 3 filarów, dolne CTA, footer
- **Code review & cleanup (`/simplify`):**
  - Wyekstrahowano wspólne stałe do `src/lib/labels.ts`: `POSITION_LABELS`, `EVENT_TYPE_LABELS`, `SPARING_STATUS_*`, `APPLICATION_STATUS_*`, `getUserDisplayName()`
  - Usunięto duplikacje z 6 plików UI (feed, search, events, sparings, messages)
  - Zrównoleglono zapytania w feed router (`Promise.all` dla club/player lookup)
  - Polling w czacie: change detection (skip `markAsRead` gdy brak nowych wiadomości)

---

### Faza 7: Publiczne Profile ✅
- **Strony publiczne (bez logowania):**
  - `/clubs/[id]` — profil klubu: logo, nazwa, miasto, region, liga, kontakt, www, opis
  - `/players/[id]` — profil zawodnika: zdjęcie, imię, pozycja, wiek, region, wzrost/waga, noga, bio, historia kariery
- **Middleware:** dodane `/clubs/` i `/players/` do publicznych prefixów
- **Linki:** karty klubów/zawodników w feedzie i wyszukiwarce prowadzą do publicznych profili
- **CTA:** przyciski "Dołącz do PilkaSport" / "Zaloguj się" na stronach publicznych
- **Layout:** grupa `(public)` z własnym layoutem (bez nawigacji dashboardu)

---

### Faza 8: Upload Zdjęć ✅
- **Supabase Storage:** bucket `avatars` (publiczny, 2 MB limit, JPEG/PNG/WebP)
- **Klient Supabase:** `src/lib/supabase.ts` (`@supabase/supabase-js`)
- **Komponent `ImageUpload`:** upload z podglądem, walidacja typu i rozmiaru, upsert
- **Formularz klubu:** upload logo (`logoUrl`) nad formularzem
- **Formularz zawodnika:** upload zdjęcia (`photoUrl`) nad formularzem
- **Publiczne profile:** wyświetlanie zdjęcia obok nazwy (placeholder z inicjałami gdy brak)
- **Validators:** `logoUrl` i `photoUrl` dodane do schematów Zod

---

### Faza 9: Powiadomienia ✅
- **Prisma:** model `Notification` (typ, tytuł, treść, link, read) — 19 tabel łącznie
- **Enum `NotificationType`:** SPARING_APPLICATION, SPARING_ACCEPTED, SPARING_REJECTED, EVENT_APPLICATION, EVENT_ACCEPTED, EVENT_REJECTED, NEW_MESSAGE
- **tRPC router `notification`:** `list` (cursor-based), `unreadCount`, `markAsRead`, `markAllAsRead`
- **Automatyczne notyfikacje (fire-and-forget):**
  - Aplikacja na sparing → powiadomienie do właściciela sparingu
  - Odpowiedź na aplikację sparingową → powiadomienie do aplikanta
  - Zgłoszenie na wydarzenie → powiadomienie do właściciela wydarzenia
  - Odpowiedź na zgłoszenie → powiadomienie do zawodnika
  - Nowa wiadomość → powiadomienie do odbiorcy
- **UI:**
  - Bell icon z badge w nawigacji (desktop + mobile), polling co 30s z change detection
  - `/notifications` — lista powiadomień z oznaczaniem jako przeczytane (pojedynczo + wszystkie)
  - Polskie etykiety typów (`NOTIFICATION_TYPE_LABELS`, `NOTIFICATION_TYPE_COLORS` w `labels.ts`)
- **Code review (`/simplify`):**
  - Bell icon SVG zdeduplikowany do komponentu `NotifBell`
  - `getUserDisplayName()` użyte w message.ts
  - Redundantne zapytania DB usunięte (include club w istniejącym query)
  - Notyfikacje fire-and-forget (nie blokują response'a)

---

### Faza 10: Testy E2E ✅
- **Playwright** (`@playwright/test`) — Chromium, headless
- **22 testy** pokrywające wszystkie krytyczne ścieżki:
  - **Auth (5):** rejestracja klub/zawodnik, logowanie, błędne hasło, redirect niezalogowanego, duplikat email
  - **Sparingi (4):** tworzenie → lista → aplikacja klubu B → akceptacja (status "Dopasowany")
  - **Wydarzenia (4):** tworzenie → lista → zgłoszenie zawodnika → akceptacja (status "Zaakceptowany")
  - **Wiadomości (4):** rejestracja kont → tworzenie sparingu → przycisk "Napisz wiadomość" → lista konwersacji
  - **Powiadomienia (2):** strona `/notifications` dostępna, bell icon w nawigacji
  - **Publiczne profile (3):** `/clubs/[id]` i `/players/[id]` bez logowania, landing page
- **Konfiguracja:** `playwright.config.ts` (workers: 1, serial, webServer: `npm run dev`)
- **Helpery:** `e2e/helpers.ts` — `registerClub`, `registerPlayer`, `login`, `logout`, `uniqueEmail`
- **Skrypty:** `npm run test:e2e` (headless), `npm run test:e2e:ui` (z UI)

---

### Faza 11: UX Polish ✅
- **Toast notifications (sonner):**
  - `<Toaster>` w root layout (`position="top-right"`, `richColors`, `closeButton`)
  - `toast.success()` / `toast.error()` na wszystkich akcjach: zapis profilu, tworzenie/aplikowanie/akceptacja/odrzucenie sparingów i wydarzeń, wysyłka wiadomości, rejestracja
  - Usunięto inline success/error state i `alert()` — zastąpione toastami
- **Skeleton loadery (shadcn/ui Skeleton):**
  - Komponent `CardSkeleton` z 4 wariantami: `CardSkeleton`, `FeedCardSkeleton`, `ConversationSkeleton`, `NotificationSkeleton`
  - Skeleton loadery na: feed, sparingi (lista + detail), wydarzenia (lista + detail), wiadomości (lista + czat), powiadomienia
- **Infinite scroll:**
  - Hook `useInfiniteScroll` (IntersectionObserver)
  - Automatyczne doładowywanie na listach sparingów i wydarzeń (cursor-based pagination z tRPC)
  - Skeleton loadery jako wskaźnik ładowania kolejnych elementów
- **Inline walidacja formularzy:**
  - Helper `getFieldErrors()` — parsowanie Zod errors na per-field messages
  - Walidacja client-side z podświetleniem pól (border-red-500) i komunikatami pod polami
  - Dodane na: rejestracja, nowy sparing, nowe wydarzenie

---

### Faza 12: Deploy + Quick Wins + Code Review ✅
- **Deploy na Vercel:**
  - Projekt: `pilkarski.vercel.app` (auto-deploy z GitHub `main`)
  - GitHub: `https://github.com/Kaban15/pilkarski`
  - Env vars: `DATABASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `AUTH_SECRET`, `AUTH_TRUST_HOST`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `postinstall: "prisma generate"` w package.json (Vercel nie ma wygenerowanego klienta)
- **Auth fixes (Vercel):**
  - `SessionProvider` w root layout (`src/components/providers.tsx`) — bez niego `signIn()` nie pobierał CSRF tokena
  - Middleware: cookie name `__Secure-authjs.session-token` + `AUTH_SECRET` (Auth.js v5 zmienił nazwy vs v4)
- **SEO:**
  - `robots.ts` — blokuje crawlery na prywatnych trasach
  - `sitemap.ts` — publiczne strony
  - `manifest.ts` — PWA manifest (standalone, theme green-600)
  - `icon.svg` — favicon SVG (zielona piłka z "PS")
- **Strony błędów:**
  - `error.tsx` — globalny error boundary (po polsku, przycisk "Spróbuj ponownie")
  - `not-found.tsx` — 404 (po polsku, link do strony głównej)
- **Rate limiting:**
  - In-memory rate limiter (`src/lib/rate-limit.ts`) z auto-cleanup co 5 min
  - Rejestracja: 3 próby/min na email
  - Logowanie: 5 prób/min na email
- **Publiczne profile — session-aware CTA:**
  - Komponent `PublicProfileCTA` — zalogowany widzi "Wróć do dashboardu", niezalogowany "Dołącz/Zaloguj"
- **Code review (`/simplify`):**
  - Fix memory leak w rate limiterze (unbounded Map → cleanup expired entries)
  - `FOOT_LABELS` scentralizowane do `labels.ts` (było zduplikowane)
  - Event type options z `EVENT_TYPE_LABELS` (było hardcoded)
  - `DetailPageSkeleton` wyekstrahowany (było zduplikowane w events/sparings)
  - `PublicProfileCTA` wyekstrahowany (było zduplikowane w clubs/players)

---

### Faza 13: Nowe Funkcjonalności ✅
- **Edycja i usuwanie sparingów/wydarzeń:**
  - tRPC `sparing.update` / `sparing.delete`, `event.update` / `event.delete`
  - Walidacja własności (tylko właściciel) i statusu (OPEN)
  - Validatory: `updateSparingSchema` / `updateEventSchema` (`.extend()` z create)
  - Strony edycji: `/sparings/[id]/edit`, `/events/[id]/edit` (pre-filled formularze)
  - Przyciski "Edytuj" / "Usuń" na stronach szczegółów (widoczne tylko dla właściciela)
  - Potwierdzenie usunięcia (inline banner z przyciskami)
  - Formularz aplikowania ukryty dla właściciela (`!isOwner` guard)
- **Filtrowanie i sortowanie list:**
  - Nowe parametry w `sparing.list` / `event.list`: `city`, `dateFrom`, `dateTo`, `sortBy`, `sortOrder`, `clubId`
  - Dropdown sortowania (data rosnąco/malejąco, najnowsze/najstarsze, tytuł A-Z/Z-A)
  - Panel "Więcej filtrów": miasto (z debounce 400ms), zakres dat, przycisk "Wyczyść filtry"
- **Publiczny profil klubu z aktywnością:**
  - Na `/clubs/[id]`: sekcje "Aktywne sparingi" i "Nadchodzące wydarzenia" (limit 5, `Promise.all`)
- **System ulubionych:**
  - Prisma: model `Favorite` (relacje User/SparingOffer/Event, unique constraints)
  - Migracja: `20260322080408_add_favorites`
  - tRPC router `favorite`: `toggle`, `check` (batch), `list` (cursor-based pagination)
  - Komponent `FavoriteButton` (serduszko, toggle, sync z propem `initialFavorited`)
  - Serduszka na kartach sparingów i wydarzeń (z `favorite.check` po załadowaniu listy)
  - Strona `/favorites` z listą zapisanych ogłoszeń
  - Link "Ulubione" w nawigacji (`DashboardNav`)
- **Code review (`/simplify`):**
  - Schema `.extend()` zamiast duplikacji pól (validators)
  - Usunięto dead code: unused `_count` w sparing delete, unreachable throw w favorite router
  - `EVENT_TYPE_COLORS` przeniesione do `labels.ts` (było inline)
  - Debounce na input miasta (400ms) — eliminacja DB hit per keystroke
  - `Promise.all` na public profile klubu (3 zapytania równolegle zamiast waterfall)
  - `FavoriteButton` sync z `initialFavorited` via `useEffect`
  - Pusty div usunięty gdy `!isOwner` w events detail
  - Apply form ukryty dla właściciela (UX fix)
  - Fix: `favorite.check` na `loadMore` (paginacja nie sprawdzała favoritów — merge do Set)
  - Feed key: usunięto zbędny index z React key (`type-id` unikalne)

---

### Faza 14: Ulepszenia Techniczne ✅
- **Supabase Realtime dla czatu (WebSocket):**
  - Broadcast channel `chat:${conversationId}` — wiadomości przychodzą natychmiastowo
  - Po wysłaniu via tRPC → broadcast do drugiego uczestnika
  - Deduplikacja wiadomości (sprawdzenie `msg.id` w istniejącym stanie)
  - Fallback poll zmniejszony z 5s → 30s (łapie wiadomości przy zerwaniu WebSocket)
  - Zero nowych zależności (`@supabase/supabase-js` ma Realtime wbudowany)
- **Optymalizacja obrazków (client-side):**
  - `compressImage()` — resize do max 800×800, konwersja do WebP (quality 0.8) via Canvas API
  - Limit uploadu podniesiony z 2 MB → 5 MB (po kompresji plik mały)
  - Zawsze uploaduje jako `.webp` z `contentType: "image/webp"`
  - Zero nowych zależności (Canvas API w przeglądarce)
- **Dynamiczne SEO na publicznych profilach:**
  - `/clubs/[id]` i `/players/[id]` przerobione z `"use client"` na server components
  - `generateMetadata()` — dynamiczne `title`, `description`, `og:image` per klub/zawodnik
  - Dane fetchowane server-side (Prisma bezpośrednio) — content w HTML od razu (lepsze SEO)
  - `notFound()` zamiast client-side error state

---

### Faza 15: UX — Dark Mode, Kalendarz, Statystyki ✅
- **Dark mode (Tailwind CSS 4 class strategy):**
  - `@custom-variant dark` w `globals.css` — class-based dark mode
  - Pełne zmienne tematyczne CSS (light + dark): `--background`, `--foreground`, `--card`, `--primary`, `--muted`, `--border`, etc.
  - Komponent `ThemeToggle` (słońce/księżyc) w nawigacji desktop i mobile
  - Script w `<head>` ładuje preferencję z `localStorage` przed hydracją (zero flash)
  - Respektuje `prefers-color-scheme` jako domyślny
  - Zaktualizowane kolory w ~25 plikach: `bg-white` → `bg-background`, `text-gray-*` → `text-muted-foreground`, kolorowe tagi z `dark:` wariantami
  - shadcn/ui komponenty (Card, Button, Input) automatycznie reagują na dark mode via CSS vars
- **Kalendarz sparingów/wydarzeń (`/calendar`):**
  - Widok miesięczny z siatką 7 kolumn (Pn–Nd)
  - Nawigacja: poprzedni/następny miesiąc, przycisk "Dziś"
  - Dane z istniejących endpointów `sparing.list` + `event.list` (dateFrom/dateTo)
  - Kolorowe tagi: zielone (sparingi), fioletowe (wydarzenia)
  - Max 3 pozycje na dzień + "+N więcej"
  - Dzisiejszy dzień podświetlony `ring-primary`
  - Link "Kalendarz" w nawigacji dashboardu
  - Zero nowych zależności (custom komponent)
- **Statystyki na dashboardzie (feed):**
  - tRPC router `stats.dashboard` — zlicza sparingi, aplikacje, wydarzenia, wiadomości
  - Różne karty dla roli CLUB (4 karty) i PLAYER (2 karty)
  - `Promise.all` na wszystkie count queries
  - Karty statystyk nad feedem z linkami do odpowiednich sekcji
  - Komponent `StatsBar` w `feed/page.tsx`

---

### Redesign Etap 1: UI/Design ✅
- **Design System:**
  - Font Inter (next/font/google) z `display: "swap"` — zastąpił Arial
  - Nowa paleta kolorów Slate-based: `--background: #fafbfc` (light), `#0b0f1a` (dark)
  - Sidebar CSS variables: `--sidebar-background`, `--sidebar-foreground`, `--sidebar-border`, `--sidebar-accent`, etc.
  - Animacje CSS: `fade-in`, `slide-up`, `slide-in-left` (keyframes w globals.css)
  - Font smoothing: antialiased, font-feature-settings
  - Border radius: `0.75rem` (z 0.625rem)
- **Nawigacja — Sidebar (desktop) + Bottom Nav (mobile):**
  - `src/components/layout/sidebar.tsx` — stały lewy panel 240px, 4 sekcje (Główne, Aktywność, Komunikacja, Moje), ikony Lucide, aktywny link podświetlony, badge'e unread (wiadomości + powiadomienia, polling 30s), user section na dole z avatar/imię/rola/theme toggle/wyloguj
  - `src/components/layout/bottom-nav.tsx` — fixed bottom, 5 ikon (Feed, Sparingi, Wydarzenia, Wiadomości, Profil), badge na wiadomościach, `md:hidden`
  - `src/app/(dashboard)/layout.tsx` — `Sidebar` + `main.md:ml-60` + `BottomNav`, max-w-6xl content
  - Stary `dashboard-nav.tsx` zachowany (nie usunięty, ale nieużywany)
- **Landing page (przeprojektowana):**
  - Sticky navbar z backdrop-blur + logo "PS"
  - Hero: gradient tło, badge "Platforma dla polskiego futbolu", heading z akcentem primary, 2 CTA (shadow-lg), gradient orb
  - Stats bar: 4 kolumny (16 województw, 80 szczebli, 272 grup, 100% darmowa)
  - Features: 6 kart z ikonami Lucide w kolorowych kółkach (Swords, Trophy, MessageSquare, Globe, Target, Zap)
  - Sekcja "Dla kogo": 2 karty gradient (zielona=Kluby, fioletowa=Zawodnicy) z listą korzyści
  - CTA dolne z gradient
  - Footer z logo + copyright
- **Dashboard Feed (przeprojektowany):**
  - Karty feeda z kolorową lewą linią (border-l-[3px]) per typ: emerald=sparing, violet=event, blue=club, orange=player
  - Ikona typu w kolorowym kółku po lewej, badge typ + data, title z hover:text-primary, meta z ikonami Calendar/MapPin
  - Arrow on hover (opacity transition)
  - Stats cards z ikonami w kolorowych kółkach (emerald, blue, violet, amber)
  - Empty state z ikoną, tytułem, opisem i CTA do profilu
- **Listy sparingów i wydarzeń (przeprojektowane):**
  - Karty z border-l (emerald/violet), ikony Calendar/MapPin/Globe/Users, Badge component z shadcn
  - Filtry: `h-9 rounded-lg`, `SlidersHorizontal` icon, badge "!" przy aktywnych filtrach, Search icon w city input
  - Empty states z ikonami (Swords/Trophy)
- **Detail pages sparingów/wydarzeń (przeprojektowane):**
  - Back button z ArrowLeft, heading + status Badge obok, przyciski z ikonami (Pencil, Trash2)
  - Info grid z ikonami w kolorowych kółkach (Calendar=emerald, MapPin=blue, Banknote=amber, Globe=orange, Users=emerald, FileText=muted)
  - Separator między info a opisem
  - Delete confirmation: `border-destructive/30 bg-destructive/5`, AlertTriangle icon
  - Aplikacje/zgłoszenia: `divide-y`, Badge status, CheckCircle2/XCircle na przyciskach, `isOwner` guard na accept/reject
- **Messages (przeprojektowane):**
  - Lista konwersacji: kolorowe avatary (emerald=klub, violet=zawodnik), hover:text-primary, ArrowRight on hover
  - Czat: rounded card container, avatar + nazwa w headerze, primary-colored bubbles (rounded-br-md dla własnych, rounded-bl-md dla rozmówcy), Send icon button, timestamp `text-[10px]`
  - Empty state z ikoną MessageSquare
- **Profile publiczne (przeprojektowane):**
  - Klub: hero banner gradient emerald z SVG pattern, logo 28x28 rounded-2xl, Badge'e (region, liga), 3-kolumnowy layout (2+1), sidebar z kontaktem (Mail/Phone/ExternalLink), sparingi/wydarzenia jako `divide-y` listy z Badge'ami
  - Zawodnik: hero banner gradient violet, stats bar (-mt-12, 4 karty: Wiek/Wzrost/Waga/Noga z ikonami), bio card, career timeline z pionową linią i kropkami (aktywna=violet, reszta=border)
- **Auth pages (przeprojektowane):**
  - Gradient tło (`from-primary/5 via-background to-background`), logo PS na górze, shadow-lg card
  - Login: ikona LogIn na przycisku, error w `rounded-lg bg-destructive/10`, registered success w `rounded-lg bg-emerald-50`
  - Register: role selector jako 2 karty z ikonami (Shield=Klub, Users=Zawodnik) zamiast Tabs, grid-cols-2 na imię/nazwisko
- **Nowe komponenty shadcn/ui (8):**
  - `src/components/ui/badge.tsx`
  - `src/components/ui/avatar.tsx`
  - `src/components/ui/separator.tsx`
  - `src/components/ui/tooltip.tsx`
  - `src/components/ui/dialog.tsx`
  - `src/components/ui/sheet.tsx`
  - `src/components/ui/dropdown-menu.tsx`
  - `src/components/ui/textarea.tsx`

---

### Redesign Etap 2: UX i Funkcjonalności ✅
- **Animacje i micro-interactions:**
  - Keyframe `scale-in` (opacity + scale 0.95→1) w globals.css
  - Klasa `.stagger-children` — staggered `slide-up` z delay 50ms per element (max 9+)
  - Zastosowane na: feed (karty + stats), sparingi (grid), wydarzenia (grid)
  - Globalny `active:scale(0.98)` na przyciskach (button/a/role=button)
  - Smooth 150ms transitions na interactive elements (color, bg, border, shadow, transform, opacity)
- **Uniwersalny komponent EmptyState:**
  - `src/components/empty-state.tsx` — props: `icon`, `title`, `description`, `actionLabel?`, `actionHref?`
  - Zastosowany na 6 stronach: feed, sparingi, wydarzenia, wiadomości, powiadomienia, ulubione
  - Spójny wygląd: ikona w kółku, tytuł, opis, opcjonalny link
- **ConfirmDialog (shadcn Dialog zamiast inline delete):**
  - `src/components/confirm-dialog.tsx` — props: `open`, `onOpenChange`, `title`, `description`, `onConfirm`, `loading?`, `variant?`
  - Wariant destructive z ikoną AlertTriangle w czerwonym kółku
  - Zamieniono inline delete confirmation na modal dialog w: `/sparings/[id]`, `/events/[id]`
- **Lepsze formularze:**
  - Zamieniono 6× plain `<textarea>` na shadcn `<Textarea>`: sparings new/edit, events new/edit, club form, player form
  - `src/components/form-tooltip.tsx` — HelpCircle icon z tooltip (Radix Tooltip)
  - Tooltips dodane na: "Podział kosztów" (sparings/new), "Maks. uczestników" (events/new)
- **Breadcrumbs:**
  - `src/components/breadcrumbs.tsx` — ChevronRight separator, ostatni element bold text-foreground
  - Zastąpiono "Wróć" button breadcrumbami na: sparings detail, events detail, sparings edit, events edit
  - Np: `Sparingi > Tytuł sparingu` lub `Wydarzenia > Tytuł > Edycja`
- **Real-time unread indicators w bottom-nav:**
  - Bottom-nav: dodano polling `notification.unreadCount` (co 30s, obok istniejącego messages polling)
  - Zamieniono "Profil" na "Powiadomienia" (Bell icon) w mobile bottom-nav
  - Badge z unread count na wiadomościach i powiadomieniach (sidebar miał już oba)

---

## Code Review — Znane Problemy

### Krytyczne (bezpieczeństwo)
1. **`sparing.getById` i `event.getById` to `publicProcedure`** — zwracają WSZYSTKIE aplikacje z danymi osobowymi. → **Zaplanowane w Etap 4, I1-6**
2. **Brak rate limitingu na mutacjach** — tylko login/register mają rate limit. Wiadomości, aplikacje, favorites — brak.
3. **Cookie `__Secure-` w middleware** — nie działa na localhost (HTTP). Dev auth może być zepsuty.
4. **Upload bez walidacji server-side** — Supabase anon key pozwala wrzucić cokolwiek do bucketa.

### Ważne (architektura)
5. **Nie używa tRPC React Query hooks** — imperywne `trpc.xxx.query()` z `useState/useEffect`. Brak cache invalidation, optimistic updates.
6. **20+ `as any`** — w auth callbacks, Prisma where, listach. → **Częściowo w Etap 4, I1-2**
7. **Fire-and-forget notifications `.catch(() => {})`** — ciche połykanie błędów.

### Naprawione (sesja 2026-03-23)
- ~~Duplikat aplikacji na sparing — raw Prisma error~~ → dodano check `findUnique` przed `create`
- ~~Apply widoczne dla PLAYER~~ → dodano `&& isClub` guard
- ~~Transfery brak w feedzie~~ → dodane do feed.ts + feed/page.tsx
- ~~Feed brak error handling~~ → error state + retry button
- ~~matchDate akceptuje dowolny string~~ → refine() rejects past dates
- ~~isParticipant bug~~ → sprawdza `applicantClub.userId === session.user.id`

### Sugestie (backlog)
8. Zduplikowane patterny list (sparingi/wydarzenia) — wyekstrahować shared hook
9. ~~Native `<select>` zamiast shadcn Select~~ → **Zaplanowane w Etap 4, I1-1**
10. Brak unit testów — tylko E2E

---

### Task 3.1: System Ocen i Recenzji ✅
- **Prisma:** model `Review` (rating 1-5, comment, relacje reviewer/reviewed Club + SparingOffer)
  - Unique constraint `[sparingOfferId, reviewerClubId]` — 1 recenzja per klub per sparing
  - `NotificationType.NEW_REVIEW` dodany
- **tRPC router `review`:**
  - `create` — wystawienie recenzji (tylko uczestnik MATCHED/COMPLETED sparingu, walidacja własności)
  - `getForSparing` — lista recenzji per sparing
  - `listByClub` — recenzje klubu (cursor-based pagination)
  - `averageByClub` — średnia ocena + count (aggregate)
  - `myReview` — sprawdzenie czy user już ocenił dany sparing
- **Validator:** `createReviewSchema` (Zod v4) — rating 1-5, comment max 1000 znaków
- **Komponent `StarRating`:** interaktywne gwiazdki (sm/md/lg), readonly mode, amber-400 fill
- **UI `/sparings/[id]`:**
  - Formularz oceny widoczny po dopasowanym sparingu (dla uczestników, jeśli nie ocenili)
  - Lista recenzji pod zgłoszeniami
  - Wskaźnik "Twoja ocena" jeśli już wystawiona
- **UI `/clubs/[id]` (profil publiczny):**
  - Badge ze średnią oceną w hero (gwiazdka + X.X + count)
  - Sekcja "Recenzje" z ostatnimi 5 opiniami (gwiazdki, komentarz, nazwa sparingu)
- **Labels:** `NEW_REVIEW` w `NOTIFICATION_TYPE_LABELS` i `NOTIFICATION_TYPE_COLORS`
- **Notyfikacja fire-and-forget** przy wystawieniu recenzji
- **Migracja DB:** wymaga `npm run db:migrate -- --url "..." --name add_reviews`

---

### Task 3.2: System Ogłoszeń Transferowych ✅
- **Prisma:** model `Transfer` (TransferType: LOOKING_FOR_CLUB/LOOKING_FOR_PLAYER/FREE_AGENT, TransferStatus: ACTIVE/CLOSED)
  - Relacje: User, Region. Pola: title, description, position, regionId, minAge, maxAge
  - Indeksy: `[type, status]`, `[regionId]`, `[position]`
- **tRPC router `transfer`:**
  - `create` — walidacja roli (klub=LOOKING_FOR_PLAYER, zawodnik=LOOKING_FOR_CLUB/FREE_AGENT)
  - `update` / `delete` / `close` — tylko owner, status ACTIVE
  - `list` — filtry: typ, pozycja, region, cursor-based pagination, sortowanie
  - `getById` — z include user.club/player + region
  - `my` — moje ogłoszenia
- **Validator:** `createTransferSchema`, `updateTransferSchema` (Zod v4)
- **Labels:** `TRANSFER_TYPE_LABELS/COLORS`, `TRANSFER_STATUS_LABELS/COLORS`
- **UI:**
  - `/transfers` — lista z filtrami (typ, pozycja, region), infinite scroll, karty z cyan border-l
  - `/transfers/new` — formularz (typ zależny od roli, pozycja, region, wiek dla klubów)
  - `/transfers/[id]` — szczegóły z info grid, przycisk wiadomości, edycja/zamknięcie/usunięcie
  - `/transfers/[id]/edit` — edycja z pre-filled danymi
- **Nawigacja:** link "Transfery" (ArrowRightLeft icon) w sidebar sekcja "Aktywność"
- **Kolorowanie:** cyan=transfery (konsekwentnie z paletą: emerald=sparingi, violet=wydarzenia)
- **Migracja DB:** wymaga `npm run db:migrate -- --url "..." --name add_transfers`

---

### Task 3.3: Statystyki i Analityka Rozszerzona ✅
- **Zależność:** `recharts` (wykresy React)
- **tRPC `stats.detailed`:**
  - Aktywność per miesiąc (sparingi + wydarzenia, ostatnie 6 mies.) — aggregateByMonth helper
  - Top 5 najaktywniejszych regionów (groupBy regionId)
  - Totale platformy: kluby, zawodnicy, sparingi, wydarzenia, transfery, recenzje
  - User stats (klub): totalSparings, matchRate%, totalApps, acceptRate%, avgRating, reviewCount
  - User stats (zawodnik): totalApps, acceptedApps, acceptRate%
- **UI `/stats`:**
  - 6 kart z totals platformy (ikony kolorowe: emerald, blue, violet, cyan, amber)
  - Wykres słupkowy (BarChart) — sparingi vs wydarzenia per miesiąc
  - Wykres kołowy (PieChart) — najaktywniejsze regiony
  - Sekcja "Twoje statystyki" — karty z match rate, accept rate, średnią oceną (różne per rola)
- **Nawigacja:** link "Statystyki" (BarChart3 icon) w sidebar sekcja "Moje"

---

### Task 3.4: Mapa z Lokalizacjami ✅
- **Zależności:** `leaflet`, `react-leaflet`, `@types/leaflet`
- **Komponent `MapView`** (`src/components/map-view.tsx`):
  - Leaflet + OpenStreetMap tiles (darmowe, bez klucza API)
  - Markery z popupami (tytuł, lokalizacja, data, link do szczegółów)
  - Ikony: domyślne Leaflet z hue-rotate (green=sparingi, violet=wydarzenia)
  - Center: Polska (51.92, 19.15), zoom 6
  - `mounted` guard (Leaflet nie działa SSR)
- **Strona `/map`:**
  - Pobiera sparingi (OPEN) + wydarzenia z lat/lng
  - Toggle filtry: Sparingi / Wydarzenia (kolorowe przyciski)
  - Empty state gdy brak ogłoszeń z lokalizacją
  - Dynamic import (`next/dynamic`, `ssr: false`)
- **Nawigacja:** link "Mapa" (MapPin icon) w sidebar sekcja "Aktywność"
- **Uwaga:** sparingi/wydarzenia już mają pola `lat`/`lng` w schemacie — wystarczy je ustawiać przy tworzeniu

---

### Task 3.5: System Punktacji / Gamifikacja ✅
- **Prisma:** modele `UserPoints` (punkty per akcja, action+refId) i `UserBadge` (unique userId+badge)
- **System punktowy (`src/lib/gamification.ts`):**
  - `POINTS_MAP`: sparing_created=10, sparing_matched=15, event_created=10, application_sent=5, application_accepted=10, review_given=10, transfer_created=5, message_sent=2, profile_completed=20
  - `BADGES` (9 odznak): Debiutant, Mistrz sparingów, Matchmaker, Organizator, Recenzent, Komunikator, Aktywny gracz, Weteran, Łowca okazji
- **Helper `awardPoints()`** (`src/server/award-points.ts`) — fire-and-forget, wywoływany z routerów
- **Integracja punktów w routerach:** sparing.create, sparing.applyFor, sparing.respond(ACCEPTED), event.create, review.create
- **tRPC router `gamification`:**
  - `myPoints` — total + ostatnie 20 wpisów
  - `myBadges` — lista zdobytych odznak
  - `checkBadges` — mutation sprawdzająca i przyznająca nowe odznaki
  - `leaderboard` — top N użytkowników (points + badges count + profil)
- **UI `/ranking`:**
  - 3 karty: punkty, odznaki, pozycja w rankingu
  - Sekcja "Twoje odznaki" (zdobyte)
  - Sekcja "Wszystkie odznaki" (grid, earned vs locked)
  - Leaderboard top 20 (pozycja, avatar, nazwa, punkty, odznaki, link do profilu)
  - Historia ostatnich punktów
- **Nawigacja:** link "Ranking" (Medal icon) w sidebar sekcja "Moje"
- **Migracja DB:** wymaga `npm run db:migrate -- --url "..." --name add_gamification`

---

### Task 3.6: PWA + Push Notifications ✅
- **Service Worker** (`public/sw.js`):
  - Cache static assets (network-first, fallback cache)
  - Skip API/tRPC calls
  - Push event handler → `showNotification()` z title, body, icon
  - Notification click → `clients.openWindow(url)`
- **Prisma:** model `PushSubscription` (endpoint, p256dh, auth, unique userId+endpoint)
- **tRPC router `push`:**
  - `subscribe` — upsert subskrypcji (endpoint, p256dh, auth)
  - `unsubscribe` — usunięcie subskrypcji
  - `status` — czy user ma aktywną subskrypcję
- **Komponent `PushNotificationToggle`:**
  - Sprawdza `serviceWorker` + `PushManager` support
  - Rejestruje SW (`/sw.js`)
  - Toggle: subscribe (requestPermission → pushManager.subscribe → tRPC) / unsubscribe
  - Wymaga `NEXT_PUBLIC_VAPID_PUBLIC_KEY` env var
  - Widoczny w sidebar user section (obok ThemeToggle)
- **Manifest** już istniał (`manifest.ts`) — `display: "standalone"`, `theme_color: #16a34a`
- **Do konfiguracji na deploy:**
  - Wygenerować VAPID keys: `npx web-push generate-vapid-keys`
  - Ustawić `NEXT_PUBLIC_VAPID_PUBLIC_KEY` i `VAPID_PRIVATE_KEY` w env
  - Zainstalować `web-push` i dodać endpoint API do wysyłania push (lub Supabase Edge Function)
- **Migracja DB:** wymaga `npm run db:migrate -- --url "..." --name add_push_subscriptions`

---

## Co zostało do zrobienia

### Hotfixy z sesji 2026-03-23 ✅
- Fix: Vercel build — `process.env.DATABASE_URL` zamiast `env()` w prisma.config.ts
- Fix: vercel-build script — `prisma generate && next build` (migrate deploy usunięte, migracje aplikowane ręcznie)
- Fix: Brakujące pliki w git — 34 pliki (komponenty UI, strony) dodane do repo
- Fix: Duplikat aplikacji na sparing — check `findUnique` przed `create`
- Fix: Sekcja "Aplikuj" ukryta dla roli PLAYER (widoczna tylko CLUB)
- Fix: Transfery dodane do feedu (brakowały w feed.ts + feed/page.tsx)
- Fix: Error handling na Feed (error state + retry) i Sparing detail (404 obsługa)
- Fix: matchDate validator — odrzuca daty w przeszłości i nieprawidłowe formaty
- Fix: isParticipant — sprawdza `applicantClub.userId === session.user.id` (nie "jakikolwiek accepted")

### Redesign Etap 4: Sparing Flow UX/UI Overhaul (W TRAKCIE)

**Cel:** Znacząca poprawa UX/UI i jakości kodu wokół sparingów — od tworzenia, przez zarządzanie, po widok piłkarza. Estetyka: Transfermarkt + Sofascore + nowoczesny SaaS.

#### Code Review — Issue List (2026-03-23)

**P0 — Krytyczne:**
1. ~~Detail page to god-component (436 linii, 12 useState)~~ → rozbity na 4 sub-components (I1-2) ✅
2. ~~Brak stanu "already applied"~~ → badge z aktualnym statusem zgłoszenia (I1-4) ✅
3. ~~`getById` to publicProcedure — zgłoszenia widoczne dla anonimowych~~ → filtrowanie po auth (I1-6) ✅
4. ~~Brak mutacji `complete`~~ → dodana mutacja MATCHED → COMPLETED (I1-5) ✅

**P1 — Ważne UX:**
1. ~~Formularz create/edit to "jeden ekran na wszystko"~~ → 3-krokowy wizard w create mode (I2-1) ✅
2. ~~Raw `<select>` zamiast shadcn Select~~ → shadcn Select w SparingForm + liście sparingów (I1-1) ✅
3. ~~Karta sparingu nie komunikuje wartości~~ → pill-badges (poziom, kategoria, region), avatar klubu, countdown (I2-2) ✅
4. ~~"Dodaj sparing" widoczne dla PLAYER~~ → ukryte dla roli PLAYER (I1-4) ✅
5. Zero feedback po accept/reject — brak next-step CTA → **Zaplanowane I2-3**
6. ~~Endpoint `sparing.my` nieużywany w UI~~ → panel "Moje sparingi" z tabs (I1-3) ✅
7. ~~Brak error handling na liście sparingów~~ → error state + retry (I1-6) ✅
8. ~~Niespójne kolory błędów~~ → `border-destructive` wszędzie (I1-1) ✅

**P2 — Refaktoryzacja:**
1. `any` wszędzie na froncie (9 wystąpień w plikach sparingowych) — częściowo zmniejszone
2. ~~Duplikacja kodu create/edit~~ → shared `<SparingForm>` (I1-1) ✅
3. Ręczny deleteMany przed delete — redundantne (Prisma onDelete: Cascade)
4. ~~Region fetch bez `.catch()` na 3 stronach~~ → dodane `.catch()` (I1-1, I1-6) ✅
5. Brak a11y (StarRating bez aria-label, select focus ring)
6. Brak kontr-propozycji (flow binarny: accept/reject) → **Zaplanowane I2-4**

#### Plan: Iteracja 1 — Foundation ✅

| # | Zadanie | Pliki | Status |
|---|---------|-------|--------|
| I1-1 | **Wydziel `<SparingForm>`** — shared create/edit, shadcn Select zamiast raw, semantic error colors | `src/components/sparings/sparing-form.tsx` (NEW), `sparings/new/page.tsx`, `sparings/[id]/edit/page.tsx` | ✅ |
| I1-2 | **Rozdziel detail page na sekcje** — 4 sub-components (~120 linii page.tsx zamiast 436) | `sparings/[id]/page.tsx` → `_components/sparing-info.tsx`, `sparing-applications.tsx`, `sparing-reviews.tsx`, `apply-form.tsx` | ✅ |
| I1-3 | **Dodaj "Moje sparingi" panel** — tabs "Szukaj" / "Moje", endpoint `sparing.my` z podziałem na statusy | `sparings/page.tsx` | ✅ |
| I1-4 | **Ukryj "Dodaj" dla PLAYER + "already applied" state** — badge "Twoje zgłoszenie: Oczekuje" zamiast formularza | `sparings/page.tsx`, `apply-form.tsx` | ✅ |
| I1-5 | **Dodaj mutację `complete`** — owner: MATCHED → COMPLETED, przycisk "Oznacz jako zakończony" | `routers/sparing.ts`, `sparing-info.tsx` | ✅ |
| I1-6 | **Error handling na liście + ograniczenie getById** — `.catch()`, error+retry, zgłoszenia widoczne tylko ownerowi/aplikantowi | `sparings/page.tsx`, `routers/sparing.ts` | ✅ |

#### Plan: Iteracja 2 — UX Uplift (Footinho vibe)

| # | Zadanie | Pliki | Status |
|---|---------|-------|--------|
| I2-1 | **Multi-step wizard (3 kroki)** — (1) Dane sparingu: tytuł, region, poziom, kategoria (2) Termin + lokalizacja (3) Podsumowanie + "Opublikuj" | `sparing-form.tsx` | ✅ |
| I2-2 | **Redesign karty sparingu** — avatar klubu, pill-badges (poziom, kategoria, region), countdown "za 3 dni", arrow on hover | `src/components/sparings/sparing-card.tsx` (NEW) | ✅ |
| I2-3 | **Post-match flow** — timeline (Utworzony → Dopasowany → Rozegrany), CTA "Wyślij wiadomość rywalowi", CTA "Oceń sparing" | `sparing-info.tsx` | ⬜ |
| I2-4 | **Kontr-propozycja terminu** — nowy status COUNTER_PROPOSED, date picker w apply form | `routers/sparing.ts`, `apply-form.tsx`, schema migration | ⬜ |
| I2-5 | **Widok piłkarza** — bez "Dodaj", CTA "Obserwuj sparing", feed-style lista | `sparings/page.tsx` | ⬜ |
| I2-6 | **Wzbogać model danych** — pola: `level` (enum), `ageCategory` (enum), `preferredTime` | `schema.prisma`, `validators/sparing.ts`, migration | ✅ |

#### Verification Checklist
- **Testy ręczne:**
  1. CLUB: utwórz sparing (wizard) → lista → "Moje sparingi" → szczegóły
  2. Inny CLUB: aplikuj → owner accept → MATCHED → complete → review
  3. PLAYER: lista bez "Dodaj" → szczegóły bez "Aplikuj" → ulubione
  4. Duplikat: 2x aplikuj → komunikat "Już aplikowałeś"
  5. Mobile 375px: cały flow
  6. Dark mode: kolory badge'ów, formularzy, kart
- **Komendy:**
  ```bash
  npx tsc --noEmit          # zero errors
  npm run lint               # zero warnings
  npm run build              # successful build
  ```
- **Istniejące E2E:** `e2e/sparing.spec.ts` (4 testy: create → list → apply → accept)
- **E2E do dodania:** create wizard, already-applied state, complete flow, PLAYER permissions

### Naprawy z code review (starsze — osobny backlog)
- Fix #1: ~~Ograniczyć widoczność aplikacji w getById~~ → Iteracja 1, I1-6
- Fix #2: Dodać rate limiting na mutacje tRPC
- Fix #5: Migracja na tRPC React Query hooks (największy impact)
- Fix #6: Wyeliminować `as any` — użyć Prisma types (częściowo w I1-2)

### Konfiguracja push (opcjonalna)
1. `npx web-push generate-vapid-keys`
2. Dodaj `NEXT_PUBLIC_VAPID_PUBLIC_KEY` i `VAPID_PRIVATE_KEY` do env vars
3. Zainstaluj `web-push` i dodaj API endpoint do wysyłania push

---

### Prisma Migrations ✅
- Baseline migration: `prisma/migrations/0_init/migration.sql` (336 linii, wygenerowane z live DB)
- Migration `20260323201350_add_reviews_transfers_gamification_push` — zastosowana
- Migration `20260324055816_add_sparing_level_category` — zastosowana (enumy SparingLevel, AgeCategory + pola level, ageCategory, preferredTime w SparingOffer)
- `vercel-build` script: `prisma generate && next build` (migrate deploy usunięte — migracje aplikowane ręcznie przed deploy)
- `prisma.config.ts` używa `process.env.DATABASE_URL!` (nie `env()` — nie działa na Vercel ani Windows)
- Workflow zmian schematu:
  1. Edytuj `prisma/schema.prisma`
  2. `npm run db:migrate -- --url "postgresql://..." --name <nazwa_zmiany>` (tworzy plik migration)
  3. Commituj `prisma/migrations/` do gita
  4. Push → Vercel auto-deploy (generuje klienta, ale NIE uruchamia migrate deploy)
  5. Migracje na produkcji: ręcznie `prisma migrate deploy --url "..."` przed deploy LUB przywrócić w vercel-build gdy Prisma naprawi env()
- **Uwaga:** `env()` w `prisma.config.ts` nie działa na Windows (Prisma 7.5.0 bug) i na Vercel — zawsze używaj `--url "..."` lub `process.env`

---

## Tech Stack
| Warstwa     | Technologia                            |
|-------------|----------------------------------------|
| Frontend    | Next.js 16 (App Router) + TypeScript   |
| UI          | Tailwind CSS 4 + shadcn/ui (15 komponentów) + sonner + Recharts + Leaflet |
| Font        | Inter (next/font/google)               |
| API         | tRPC v11 (fetch adapter)               |
| ORM         | Prisma 7 + @prisma/adapter-pg          |
| Baza danych | PostgreSQL (Supabase — Session Pooler) |
| Storage     | Supabase Storage (bucket `avatars`)    |
| Auth        | Auth.js v5 (next-auth@beta)            |
| Walidacja   | Zod v4                                 |
| Testy       | Playwright (E2E, 22 testy)             |
| Hosting     | Vercel (`pilkarski.vercel.app`)         |

---

## Kluczowe Pliki
```
prisma/schema.prisma                  — schemat BD (26 modeli)
prisma/prisma.config.ts               — konfiguracja Prisma 7 (env() helper)
prisma/migrations/                    — migracje BD (baseline 0_init + przyszłe zmiany)
prisma/seed.ts                        — seed regionów/lig/grup

src/middleware.ts                      — ochrona tras (JWT, Edge-compatible, public prefixes)
src/server/auth/config.ts             — Auth.js config (credentials)
src/server/db/client.ts               — Prisma client singleton (PrismaPg adapter)
src/server/trpc/trpc.ts               — tRPC init + publicProcedure + protectedProcedure
src/server/trpc/router.ts             — root router (health, auth, club, player, region, sparing, event, message, feed, search, notification)
src/server/trpc/routers/auth.ts       — rejestracja
src/server/trpc/routers/club.ts       — CRUD klubu + lista
src/server/trpc/routers/player.ts     — CRUD zawodnika + kariera + lista
src/server/trpc/routers/region.ts     — regiony, ligi, grupy, hierarchy
src/server/trpc/routers/sparing.ts    — CRUD sparingów + aplikacje + notyfikacje
src/server/trpc/routers/event.ts      — CRUD wydarzeń + zgłoszenia + notyfikacje
src/server/trpc/routers/message.ts    — system wiadomości (konwersacje, czat) + notyfikacje
src/server/trpc/routers/feed.ts       — feed z regionu użytkownika
src/server/trpc/routers/search.ts     — globalna wyszukiwarka
src/server/trpc/routers/notification.ts — powiadomienia (list, unreadCount, markAsRead)
src/server/trpc/routers/favorite.ts    — ulubione (toggle, check, list)
src/server/trpc/routers/stats.ts       — statystyki dashboardu (counts per role)
src/server/trpc/routers/review.ts      — recenzje (create, getForSparing, listByClub, averageByClub, myReview)
src/server/trpc/routers/transfer.ts    — transfery (create, update, delete, close, list, getById, my)
src/server/trpc/routers/gamification.ts — punkty, odznaki, leaderboard
src/server/trpc/routers/push.ts        — push subscriptions (subscribe, unsubscribe, status)
src/server/award-points.ts             — helper awardPoints() (fire-and-forget)

src/lib/trpc.ts                       — tRPC vanilla client (frontend)
src/lib/supabase.ts                   — Supabase client (storage)
src/lib/format.ts                     — formatDate (pl-PL)
src/lib/labels.ts                     — wspólne stałe (labels, statusy, FOOT_LABELS, notification types, getUserDisplayName)
src/lib/rate-limit.ts                 — in-memory rate limiter z auto-cleanup
src/lib/validators/auth.ts            — Zod: rejestracja, logowanie
src/lib/validators/profile.ts         — Zod: profil klubu (+ logoUrl), zawodnika (+ photoUrl), kariera
src/lib/validators/sparing.ts         — Zod: tworzenie sparingu, aplikacja
src/lib/validators/event.ts           — Zod: tworzenie wydarzenia, zgłoszenie
src/lib/validators/review.ts          — Zod: tworzenie recenzji (rating 1-5, comment)
src/lib/validators/transfer.ts        — Zod: tworzenie/edycja ogłoszenia transferowego
src/lib/gamification.ts               — POINTS_MAP, BADGES definicje, BadgeCheckStats
src/lib/validators/message.ts         — Zod: wysyłka wiadomości, paginacja, markAsRead
src/lib/form-errors.ts                — helper getFieldErrors() (Zod → per-field errors)

src/app/(auth)/login/page.tsx         — logowanie
src/app/(auth)/register/page.tsx      — rejestracja (z tab Klub/Zawodnik)
src/app/(dashboard)/layout.tsx        — layout z nawigacją
src/app/(dashboard)/feed/page.tsx     — feed z regionu (sparingi, wydarzenia, kluby, zawodnicy)
src/app/(dashboard)/search/page.tsx   — globalna wyszukiwarka
src/app/(dashboard)/profile/page.tsx  — profil (server component → formularz z upload zdjęcia)
src/app/(dashboard)/sparings/         — lista, nowy, szczegóły sparingu (+ przycisk wiadomości)
src/app/(dashboard)/events/           — lista, nowy, szczegóły wydarzenia (+ przycisk wiadomości)
src/app/(dashboard)/messages/         — lista konwersacji, widok czatu
src/app/(dashboard)/notifications/    — lista powiadomień
src/app/(dashboard)/favorites/        — lista ulubionych
src/app/(dashboard)/calendar/         — widok kalendarza sparingów/wydarzeń
src/app/(dashboard)/sparings/[id]/edit/ — edycja sparingu
src/app/(dashboard)/events/[id]/edit/ — edycja wydarzenia
src/app/(public)/clubs/[id]/page.tsx  — publiczny profil klubu
src/app/(public)/players/[id]/page.tsx — publiczny profil zawodnika

src/components/layout/sidebar.tsx             — sidebar nawigacja desktop (240px, sekcje, ikony, badge'e, user)
src/components/layout/bottom-nav.tsx         — mobile bottom nav (5 ikon, badge'e)
src/components/layout/dashboard-nav.tsx      — DEPRECATED — stara górna nawigacja (nieużywana po redesign)
src/components/ui/badge.tsx                  — shadcn Badge (NEW)
src/components/ui/avatar.tsx                 — shadcn Avatar (NEW)
src/components/ui/separator.tsx              — shadcn Separator (NEW)
src/components/ui/tooltip.tsx                — shadcn Tooltip (NEW)
src/components/ui/dialog.tsx                 — shadcn Dialog (NEW)
src/components/ui/sheet.tsx                  — shadcn Sheet (NEW)
src/components/ui/dropdown-menu.tsx          — shadcn DropdownMenu (NEW)
src/components/ui/textarea.tsx               — shadcn Textarea (NEW)
src/components/forms/club-profile-form.tsx    — formularz klubu (kaskadowe dropdowny + upload logo)
src/components/forms/player-profile-form.tsx  — formularz zawodnika + kariera + upload zdjęcia
src/components/send-message-button.tsx       — przycisk "Napisz wiadomość" (inline)
src/components/image-upload.tsx              — komponent uploadu zdjęć (Supabase Storage)
src/components/card-skeleton.tsx             — skeleton loadery (CardSkeleton, FeedCardSkeleton, DetailPageSkeleton, ConversationSkeleton, NotificationSkeleton)
src/components/public-profile-cta.tsx       — session-aware CTA na publicznych profilach
src/components/favorite-button.tsx          — przycisk serduszka (toggle ulubione)
src/components/theme-toggle.tsx            — przełącznik dark/light mode
src/components/calendar-view.tsx           — widok kalendarza miesięcznego
src/components/empty-state.tsx             — uniwersalny empty state (icon, title, description, action)
src/components/confirm-dialog.tsx          — modal potwierdzenia (shadcn Dialog, wariant destructive)
src/components/breadcrumbs.tsx             — breadcrumbs nawigacja (ChevronRight separator)
src/components/form-tooltip.tsx            — tooltip help przy polach formularzy (HelpCircle)
src/components/star-rating.tsx            — interaktywne gwiazdki 1-5 (sm/md/lg, readonly mode)
src/components/map-view.tsx              — Leaflet mapa z markerami (dynamic import, SSR-safe)
src/components/push-notification-toggle.tsx — toggle push notifications (SW + PushManager)

src/app/(dashboard)/transfers/           — lista, nowy, szczegóły, edycja ogłoszeń transferowych
src/app/(dashboard)/stats/               — statystyki z wykresami (Recharts)
src/app/(dashboard)/map/                 — mapa sparingów/wydarzeń (Leaflet)
src/app/(dashboard)/ranking/             — ranking, odznaki, historia punktów
src/components/providers.tsx                — SessionProvider wrapper (root layout)
src/hooks/use-infinite-scroll.ts             — hook IntersectionObserver do infinite scroll
src/types/next-auth.d.ts              — rozszerzenie typów sesji (id, role)

src/app/robots.ts                     — robots.txt (Next.js metadata API)
src/app/sitemap.ts                    — sitemap.xml
src/app/manifest.ts                   — PWA web manifest
src/app/icon.svg                      — favicon SVG
src/app/error.tsx                     — globalny error boundary
src/app/not-found.tsx                 — strona 404

playwright.config.ts                  — konfiguracja Playwright (workers: 1, serial)
e2e/helpers.ts                        — helpery testowe (register, login, uniqueEmail)
e2e/auth.spec.ts                      — testy auth (rejestracja, logowanie, redirect)
e2e/sparing.spec.ts                   — testy sparingów (tworzenie → aplikacja → akceptacja)
e2e/event.spec.ts                     — testy wydarzeń (tworzenie → zgłoszenie → akceptacja)
e2e/messages.spec.ts                  — testy wiadomości (przycisk, konwersacje)
e2e/notifications.spec.ts             — testy powiadomień (strona, bell icon)
e2e/public-profiles.spec.ts           — testy publicznych profili i landing page
```

---

## Kluczowe Decyzje Techniczne
1. **Monorepo** Next.js full-stack (zamiast osobnego backendu).
2. **Prisma 7** wymaga `prisma.config.ts` z `env()` helper (nie `process.env` w schema).
3. **Prisma adapter-pg** z `PoolConfig` object (nie string URL w konstruktorze).
4. **Middleware** używa `getToken()` z `next-auth/jwt` (nie `auth()`) — Edge-compatible.
5. **Next.js 16** deprecjonuje middleware na rzecz proxy — warning, ale działa.
6. **Zod v4** import z `zod/v4` (nie `zod`).
7. **tRPC** — `apply` to reserved word, używamy `applyFor`.
8. **Supabase Session Pooler** zamiast direct connection (IPv4 kompatybilność).
9. **Prisma generated client** → `src/generated/prisma/` (gitignored, import z `/client`).
10. **Prisma migrate** zamiast `db push` — baseline migration `0_init` + `vercel-build` script (`prisma migrate deploy && next build`). Lokalnie: `--url "..."` wymagany (env() w prisma.config.ts nie działa na Windows w v7.5.0).
11. **Notyfikacje fire-and-forget** — nie blokują response'a, `.catch(() => {})`.
12. **Supabase Storage** — bucket `avatars` publiczny, upsert z entity ID jako nazwa pliku.
13. **Auth.js v5 na Vercel** — wymaga `AUTH_SECRET`, `AUTH_TRUST_HOST=true`, cookie name `__Secure-authjs.session-token` (nie `__Secure-next-auth.*`).
14. **SessionProvider** — wymagany w root layout żeby `signIn()`/`useSession()` z `next-auth/react` działały.
15. **Sidebar layout** zamiast top-nav — sidebar desktop (fixed, 240px, `md:flex`) + bottom nav mobile (`md:hidden`). Content z `md:ml-60`.
16. **Font Inter** z `next/font/google` — className na `<html>`, NIE ustawiać font-family w globals.css (nadpisywałoby next/font).
17. **Design tokens Slate-based** — `#fafbfc`/`#0b0f1a` background (zamiast `#ffffff`/`#0a0a0a`), lepszy kontrast.
18. **Kolorowanie po typie** — emerald=sparingi, violet=wydarzenia, blue=kluby, orange=zawodnicy, amber=wiadomości. Konsekwentne w całym UI.
19. **Hero banners na profilach publicznych** — gradient (emerald=kluby, violet=zawodnicy) z SVG pattern, duże zdjęcie/logo, Badge'e.

---

## Supabase
- Projekt: **Kabanos** (free tier)
- Host: `aws-1-eu-west-1.pooler.supabase.com` (Session Pooler)
- Baza: `postgres`
- 20 tabel + seed data (16 regionów, 80 lig, 272 grup)
- Storage: bucket `avatars` (public, 2 MB, image/jpeg, image/png, image/webp)

---

## Roadmapa

| Faza | Nazwa                         | Status       |
|------|-------------------------------|--------------|
| 1    | Inicjalizacja projektu        | ✅ Gotowe    |
| 2    | Auth + User + Profile CRUD    | ✅ Gotowe    |
| 3    | Regiony, Ligi, Grupy (seed)   | ✅ Gotowe    |
| 4    | Moduł Sparingów i Wydarzeń    | ✅ Gotowe    |
| 5    | System Wiadomości             | ✅ Gotowe    |
| 6    | Feed, Filtrowanie, Polish     | ✅ Gotowe    |
| 7    | Publiczne Profile             | ✅ Gotowe    |
| 8    | Upload Zdjęć                  | ✅ Gotowe    |
| 9    | Powiadomienia                 | ✅ Gotowe    |
| 10   | Testy E2E                     | ✅ Gotowe    |
| 11   | UX Polish                     | ✅ Gotowe    |
| 12   | Deploy + Quick Wins + Review  | ✅ Gotowe    |
| 13   | Nowe Funkcjonalności          | ✅ Gotowe    |
| 14   | Ulepszenia Techniczne         | ✅ Gotowe    |
| 15   | Dark Mode, Kalendarz, Statystyki | ✅ Gotowe |
| R1   | Redesign Etap 1: UI/Design       | ✅ Gotowe |
| R2   | Redesign Etap 2: UX/Funkcjonalności | ✅ Gotowe |
| R3   | Redesign Etap 3: Rozbudowa       | ✅ Gotowe |

---

## Instrukcje na start następnej sesji
1. Przeczytaj ten plik (`STATE.md`).
2. **Nie skanuj** całego repo — pliki kluczowe wymienione powyżej.
3. **Następny krok: Redesign Etap 3** — Rozbudowa Platformy (system ocen, ogłoszenia transferowe, statystyki, mapa, gamifikacja, PWA). Plan w `docs/superpowers/plans/2026-03-23-pilkasport-redesign.md` (Task 3.1–3.6).
4. Aplikacja live: **https://pilkarski.vercel.app** | GitHub: **https://github.com/Kaban15/pilkarski**
5. Przed instalacją nowych zależności — pytaj o zgodę.
6. Po zakończeniu prac — zaktualizuj ten plik.
7. **Prisma migrations:** używaj `npm run db:migrate -- --url "postgresql://..." --name <nazwa>` do tworzenia nowych migracji lokalnie.
   - `env()` w `prisma.config.ts` nie działa na Windows → zawsze podaj `--url "..."` dla lokalnych komend.
   - Na Vercel działa automatycznie przez `vercel-build` script (`prisma migrate deploy`).
8. **UI pattern — kolorowanie typów:** emerald=sparingi, violet=wydarzenia, blue=kluby, orange=zawodnicy, amber=wiadomości. Stosuj konsekwentnie.
9. **Sidebar nawigacja:** desktop = `sidebar.tsx` (fixed left 240px), mobile = `bottom-nav.tsx` (fixed bottom, 5 ikon: Feed/Sparingi/Wydarzenia/Wiadomości/Powiadomienia). Stary `dashboard-nav.tsx` jest DEPRECATED.
10. **Znane problemy bezpieczeństwa** opisane w sekcji "Code Review" — do naprawienia w przyszłych sesjach.
11. **Nowe komponenty (Etap 2):** `EmptyState` (empty states), `ConfirmDialog` (delete modals), `Breadcrumbs` (nawigacja), `FormTooltip` (help tooltips). Używaj ich zamiast inline implementacji.
12. **Animacje:** klasa `.stagger-children` na kontenerach list daje staggered slide-up. `animate-fade-in` na stronach. `animate-scale-in` na modalach.
