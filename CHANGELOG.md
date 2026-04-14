# PilkaSport — Changelog

Pełna historia zmian per etap. Plik append-only — nowe etapy dodawane na końcu.

---

## Faza 1: Inicjalizacja ✅
- Next.js 16 + TypeScript + Tailwind CSS 4 + shadcn/ui
- Prisma 7 z `@prisma/adapter-pg` (Supabase Session Pooler)
- tRPC v11 (fetch adapter, superjson)
- Struktura folderów, git repo, `.env`, `.gitignore`

## Faza 2: Auth + Profile ✅
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

## Faza 3: Regiony, Ligi, Grupy ✅
- Seed: 16 województw (ZPN), 80 szczebli ligowych, 272 grup
- tRPC region router: `list`, `leagueLevels`, `leagueGroups`, `hierarchy`
- Kaskadowe dropdowny w profilu klubu: Region → Szczebel → Grupa
- `dotenv` + `tsx` do uruchamiania seed

## Faza 4: Sparingi i Wydarzenia ✅
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

## Faza 5: System Wiadomości ✅
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

## Faza 6: Feed, Filtrowanie, Polish ✅
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

## Faza 7: Publiczne Profile ✅
- **Strony publiczne (bez logowania):**
  - `/clubs/[id]` — profil klubu: logo, nazwa, miasto, region, liga, kontakt, www, opis
  - `/players/[id]` — profil zawodnika: zdjęcie, imię, pozycja, wiek, region, wzrost/waga, noga, bio, historia kariery
- **Middleware:** dodane `/clubs/` i `/players/` do publicznych prefixów
- **Linki:** karty klubów/zawodników w feedzie i wyszukiwarce prowadzą do publicznych profili
- **CTA:** przyciski "Dołącz do PilkaSport" / "Zaloguj się" na stronach publicznych
- **Layout:** grupa `(public)` z własnym layoutem (bez nawigacji dashboardu)

## Faza 8: Upload Zdjęć ✅
- **Supabase Storage:** bucket `avatars` (publiczny, 2 MB limit, JPEG/PNG/WebP)
- **Klient Supabase:** `src/lib/supabase.ts` (`@supabase/supabase-js`)
- **Komponent `ImageUpload`:** upload z podglądem, walidacja typu i rozmiaru, upsert
- **Formularz klubu:** upload logo (`logoUrl`) nad formularzem
- **Formularz zawodnika:** upload zdjęcia (`photoUrl`) nad formularzem
- **Publiczne profile:** wyświetlanie zdjęcia obok nazwy (placeholder z inicjałami gdy brak)
- **Validators:** `logoUrl` i `photoUrl` dodane do schematów Zod

## Faza 9: Powiadomienia ✅
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

## Faza 10: Testy E2E ✅
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

## Faza 11: UX Polish ✅
- **Toast notifications (sonner):**
  - `<Toaster>` w root layout (`position="top-right"`, `richColors`, `closeButton`)
  - `toast.success()` / `toast.error()` na wszystkich akcjach
  - Usunięto inline success/error state i `alert()` — zastąpione toastami
- **Skeleton loadery (shadcn/ui Skeleton):**
  - Komponent `CardSkeleton` z 4 wariantami
  - Skeleton loadery na: feed, sparingi, wydarzenia, wiadomości, powiadomienia
- **Infinite scroll:**
  - Hook `useInfiniteScroll` (IntersectionObserver)
  - Automatyczne doładowywanie na listach sparingów i wydarzeń
- **Inline walidacja formularzy:**
  - Helper `getFieldErrors()` — parsowanie Zod errors na per-field messages
  - Walidacja client-side z podświetleniem pól i komunikatami

## Faza 12: Deploy + Quick Wins + Code Review ✅
- **Deploy na Vercel:**
  - Projekt: `pilkarski.vercel.app` (auto-deploy z GitHub `main`)
  - GitHub: `https://github.com/Kaban15/pilkarski`
  - Env vars: `DATABASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `AUTH_SECRET`, `AUTH_TRUST_HOST`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `postinstall: "prisma generate"` w package.json
- **Auth fixes (Vercel):**
  - `SessionProvider` w root layout — bez niego `signIn()` nie pobierał CSRF tokena
  - Middleware: cookie name `__Secure-authjs.session-token` + `AUTH_SECRET`
- **SEO:** `robots.ts`, `sitemap.ts`, `manifest.ts`, `icon.svg`
- **Strony błędów:** `error.tsx` (globalny error boundary), `not-found.tsx` (404)
- **Rate limiting:** In-memory rate limiter z auto-cleanup co 5 min
- **Publiczne profile — session-aware CTA:** `PublicProfileCTA`
- **Code review (`/simplify`):**
  - Fix memory leak w rate limiterze
  - `FOOT_LABELS`, `EVENT_TYPE_COLORS` scentralizowane
  - `DetailPageSkeleton`, `PublicProfileCTA` wyekstrahowane

## Faza 13: Nowe Funkcjonalności ✅
- **Edycja i usuwanie sparingów/wydarzeń:**
  - tRPC `sparing.update` / `delete`, `event.update` / `delete`
  - Strony edycji: `/sparings/[id]/edit`, `/events/[id]/edit`
- **Filtrowanie i sortowanie list:**
  - Parametry: `city`, `dateFrom`, `dateTo`, `sortBy`, `sortOrder`, `clubId`
  - Panel "Więcej filtrów": miasto (debounce 400ms), zakres dat
- **Publiczny profil klubu z aktywnością:**
  - Sekcje "Aktywne sparingi" i "Nadchodzące wydarzenia" na `/clubs/[id]`
- **System ulubionych:**
  - Model `Favorite`, toggle, check (batch), list (cursor-based)
  - Serduszka na kartach sparingów i wydarzeń
  - Strona `/favorites`

## Faza 14: Ulepszenia Techniczne ✅
- **Supabase Realtime dla czatu (WebSocket):**
  - Broadcast channel `chat:${conversationId}`
  - Fallback poll 30s
- **Optymalizacja obrazków (client-side):**
  - `compressImage()` — resize do 800×800, WebP (quality 0.8) via Canvas API
- **Dynamiczne SEO na publicznych profilach:**
  - Server components z `generateMetadata()` — dynamiczne title, description, og:image

## Faza 15: Dark Mode, Kalendarz, Statystyki ✅
- **Dark mode:** class-based, ThemeToggle, script przed hydracją (zero flash)
- **Kalendarz (`/calendar`):** widok miesięczny, kolorowe tagi, nawigacja
- **Statystyki na dashboardzie:** `stats.dashboard`, karty per rola

## Redesign Etap 1: UI/Design ✅
- Design System: Inter font, Slate-based paleta, CSS animacje
- Sidebar (desktop 240px) + Bottom Nav (mobile)
- Landing page przeprojektowana
- Dashboard Feed, Listy, Detail pages, Messages, Profile publiczne, Auth pages — przeprojektowane
- 8 nowych komponentów shadcn/ui (badge, avatar, separator, tooltip, dialog, sheet, dropdown-menu, textarea)

## Redesign Etap 2: UX i Funkcjonalności ✅
- Animacje: `scale-in`, `.stagger-children`, `active:scale(0.98)`, smooth transitions
- Uniwersalny `EmptyState` (6 stron), `ConfirmDialog`, lepsze formularze (Textarea, FormTooltip)
- Breadcrumbs, real-time unread indicators w bottom-nav

## Task 3.1: System Ocen i Recenzji ✅
- Model `Review` (rating 1-5, comment, relacje reviewer/reviewed Club + SparingOffer)
- Router `review`: create, getForSparing, listByClub, averageByClub, myReview
- `StarRating` komponent, formularz oceny na `/sparings/[id]`, sekcja recenzji na `/clubs/[id]`

## Task 3.2: System Ogłoszeń Transferowych ✅
- Model `Transfer` (TransferType, TransferStatus, relacje User/Region)
- Router `transfer`: create, update, delete, close, list, getById, my
- UI: `/transfers` (lista z filtrami), `/transfers/new`, `/transfers/[id]`, `/transfers/[id]/edit`
- Kolorowanie: cyan=transfery

## Task 3.3: Statystyki i Analityka Rozszerzona ✅
- `recharts` (wykresy React)
- `stats.detailed`: aktywność per miesiąc, top 5 regionów, totale, user stats per rola
- UI `/stats`: 6 kart totals, BarChart, PieChart, sekcja "Twoje statystyki"

## Task 3.4: Mapa z Lokalizacjami ✅
- `leaflet`, `react-leaflet` — OpenStreetMap tiles (darmowe)
- `MapView` komponent z markerami, popupami, hue-rotate ikonami
- UI `/map`: toggle Sparingi/Wydarzenia, dynamic import (SSR-safe)

## Task 3.5: System Punktacji / Gamifikacja ✅
- Modele `UserPoints` + `UserBadge`, 9 odznak, `POINTS_MAP`
- Router `gamification`: myPoints, myBadges, checkBadges, leaderboard
- UI `/ranking`: punkty, odznaki, top 20 leaderboard

## Task 3.6: PWA + Push Notifications ✅
- Service Worker (`public/sw.js`): cache, push handler, notification click
- Model `PushSubscription`, router `push`: subscribe, unsubscribe, status
- `PushNotificationToggle` komponent, VAPID keys

## Etap 4: Sparing Flow UX/UI Overhaul ✅
- **I1 Foundation:** `<SparingForm>` shared, detail page rozbity na 4 sub-components, "Moje sparingi" panel, "already applied" state, mutacja `complete`, error handling + auth filtering
- **I2 UX Uplift:** 3-krokowy wizard, redesign karty (pill-badges, countdown, avatar), post-match timeline, kontr-propozycja terminu (COUNTER_PROPOSED), widok piłkarza, nowe pola (level, ageCategory, preferredTime)
- E2E: `sparing-advanced.spec.ts` (4 testy)

## Etap 5: UX Hotfixes + Club Followers + Player Recruitments ✅
- Hotfixy: ConfirmDialog na "Zakończ", datetime-local na counter-proposal, race condition guard
- Type Safety: typy zamiast `as any`, EmptyState z `actionOnClick`, error retry
- `ClubFollower` model, follow/unfollow endpoints, `FollowClubButton`
- Follower notifications przy tworzeniu sparingu/wydarzenia
- Club dashboard sections (pending apps, active sparings, upcoming events)
- Player recruitments feed ("Nabory dla Ciebie")

## Etap 6: Backlog Cleanup + Push + Infra Fixes ✅
- Transaction Pooler (port 6543), server-side image upload, SUPABASE_SERVICE_ROLE_KEY
- 13 instancji `as any` zastąpionych typami
- A11y: aria-labels, focus-visible:ring-2
- Push notifications: `sendPushToUser()` z auto-cleanup
- E2E: `sparing-advanced.spec.ts`

## Etap 7: Club UX Week 1 — Dashboard & Flow ✅
- T1: Redesign dashboardu (akcyjne metryki, quick actions, empty state)
- T2: Fix kontroli ról — events (ukryte dla nie-klubów, shadcn Select)
- T3: UX "Moje sparingi" (badge pending, sekcja nadchodzących meczy)
- T4: UX detail page (sortowanie zgłoszeń, avatary, amber banner)
- T5: "Moje wydarzenia" tab
- T6: Kalendarz (toggle "Tylko moje", widok agendy)
- T7: Mobile polish (scroll filtrów, pending badge)
- T8: Typowanie (usunięcie `any`)

## Etap 8: Club Onboarding Week 2 ✅
- T1: Landing copy pod kluby ("Umów sparing w 2 minuty")
- T2: Dynamiczne statystyki z DB na landing
- T3: Auto-login po rejestracji
- T4: `ClubOnboarding` — 3-krokowy wizard (miasto/region/liga → CTA → gotowe)
- T5: Profil klubu — progress bar (6 pól)
- T6: Kontekstowe powitanie + checklist "Pierwsze kroki"
- T7: Szybki sparing (toggle pełny/szybki)
- T8: E2E testy onboardingu (5 testów)

## Etap 9: Visual Redesign "Sexy & Simple" ✅
- Dark mode: Vercel-style neutral (#0a0a0a)
- Sparing card: czysta karta bez border-left
- Landing: 4 features zamiast 6, mniejsze ikony
- Dashboard feed: bez ikon/strzałek, inline pills stats
- Sidebar: 10 pozycji (z 14), 3 sekcje (z 4)
- Event cards: unified style

## Etap 10: Wiadomości z publicznych profili ✅
- `ProfileMessageButton` — session-aware, inline pole tekstowe, redirect do konwersacji
- Zintegrowany na `/clubs/[id]` i `/players/[id]`

## Etap 11: Rekrutacja, Marketplace Treningów, Community ✅
- **Stage 1:** Rozszerzony EventType (TRYOUT, CAMP, CONTINUOUS_RECRUITMENT, INDIVIDUAL/GROUP_TRAINING), nowe pola Event, powiadomienia RECRUITMENT_NEW/MATCH, `ClubRecruitment` widget
- **Stage 2:** Transfer pola (availableFrom, preferredLevel), `RecruitmentPipeline` model (stages WATCHING→SIGNED), router `recruitment`, UI `/recruitment`, "Na radar" button
- **Stage 3:** `ClubPost` model z kategoriami, router `clubPost`, `/community`, feed integration, gamifikacja

## Etap 12: Rola Trenera (COACH) ✅
- `UserRole.COACH`, model `Coach` (specjalizacja, licencja)
- Auth: register/login z COACH, trzecia karta rejestracji
- Router `coach`: me, update, getById, list
- `CoachProfileForm` z upload zdjęcia, Select specjalizacji/licencji
- Dashboard/Layout: COACH support w stats, feed, sidebar
- Labels: `COACH_SPECIALIZATION_LABELS`, `COACH_LEVEL_LABELS`, `ROLE_LABELS`

## Etap 13: Product Consolidation ✅
- Sidebar role-aware, "Rekrutacja"/"Treningi" w sekcji "Główne"
- `recruitment.stats` + `exportCsv`, `RecruitmentStats` widget
- `/trainings` — treningi + katalog trenerów
- Community: limit 5 postów, min content 10, przycisk "Zgłoś"
- `PlayerOnboarding` + `CoachOnboarding` — 3-krokowe wizardy
- +4 nowe eventy gamifikacyjne

## Etap 14: Visual Redesign "Pitch Black Precision" ✅
- Landing: dark-first (#050505), dot grid, gradient orb, fluid clamp() typography
- Dashboard: StatsBar z ikonami, FeedCard hover reveal, compact QuickActions
- Sparing card: avatar top-left, region outline badge, countdown pill
- Sidebar: compact (56px header, 16px icons)
- Design tokens: zinc-based (#fafafa/#71717a)

## Etap 15: Club Happy Path & Dashboard UX ✅
- ClubQuickActions: 3 CTA + "Więcej działań"
- ProcessSteps: reużywalny komponent
- Coachmark: jednorazowe tooltipy (localStorage)

## Etap 16: Recruitment CRM & Pipeline Board ✅
- Kanban board z 6 kolumnami + HTML5 drag-and-drop
- RecruitmentEvent model — timeline zmian etapów
- Mini-timeline na kartach, avg time to sign, Board/List toggle

## Etap 17: Trainings & COACH Development Hub ✅
- `event.recommendedTrainings`, `stats.coachDashboard`
- Training presets (6 szablonów), "Polecane dla Ciebie"

## Etap 18: Community & Social Layer ✅
- Favorite rozszerzony o clubPostId, bookmark button
- `club.newInRegion`, NewClubsInRegion widget

## Etap 19: Mobile & Performance Polish ✅
- Role-aware bottom-nav (CLUB/PLAYER/COACH)
- OfflineBanner, MobileRefresh

## Etap 20: Backlog Cleanup ✅
- E2E: coach.spec, recruitment-board.spec, community.spec
- Publiczny profil trenera `/coaches/[id]`
- COACH tworzy treningi (Event.clubId optional, Event.coachId)
- Powiadomienia przypominające: `/api/reminders`
- event.list: `types` array filter
- Null-safety fixes po Event.clubId optional

## Etap 21: Sparing Invitations ✅
- `SparingInvitation` model (fromClub, toClub, expiresAt)
- `invite`, `respondToInvitation`, `myInvitations`
- `InviteClubDialog`, `SentInvitations`, `ReceivedInvitations`
- Club router: `search` parametr w `club.list`

## Etap 22: Club Membership & Squad Management ✅
- `ClubMembership` model (PENDING/ACCEPTED/REJECTED/LEFT/REMOVED)
- `TeamLineup` + `TeamLineupPlayer` modele
- `INTERNAL` ClubPostCategory
- Routery: `clubMembership` (requestJoin, respond, leave, remove, listMembers...), `teamLineup`
- `JoinClubButton`, `/squad` z 3 tabami, Sidebar: "Kadra"

## Etap 23: League Directory ✅
- Publiczny katalog: `/leagues` → region → szczebel → grupa → lista klubów
- Seed: 16 regionów, 69 szczebli, 397 grup (realne dane 2024/2025)
- `sortGroupsByNumber()` helper, `pluralPL()` odmiana polska
- Integracja z `/clubs/[id]` (klikalne badge'e), wyszukiwarka, sidebar

## Etap 24: Sparing Scores + League SEO ✅
- Wyniki meczów: `homeScore`, `awayScore`, `scoreSubmittedBy`, `scoreConfirmed`
- `submitScore` + `confirmScore` z push notifications
- `ScoreSection` komponent, "Historia sparingów" na `/clubs/[id]`
- Sitemap: ~480 URL-i (dynamic z DB), graceful fallback

## Etap 25: Internal Events, Attendance & Club Permissions ✅
- `EventVisibility` (PUBLIC/INTERNAL), `AttendanceStatus` (YES/NO/MAYBE)
- `EventAttendance` model, `checkEventPermission()` helper
- `AttendanceSection` widget, visibility dropdown w formularzach
- `ClubMembership.canManageEvents` — delegowanie uprawnień

## Etap 26: Club Invite Members ✅
- `INVITED` MembershipStatus, `CLUB_INVITATION` NotificationType
- `searchUsers`, `invite`, `respondToInvite`, `myInvitations`
- `InviteMemberDialog`, `ClubInviteButton` na profilach, `ClubInvitations` widget

## Etap 27: UX Fixes, Coach Permissions, Career & Profile Links ✅
- JWT fix (ClubInviteButton), BackButton komponent
- Usunięcie cen/kosztów (priceInfo, costSplitInfo)
- Coach tworzy wydarzenia przez klub (canManageEvents membership)
- `CoachCareerEntry` model z timeline na profilu
- Klikalne profile na 11 stronach, `getProfileHref()` helper

## Etap 28: Attendance Reminders 24h + Coach Profile Fix ✅
- Coach profile: graceful fallback dla careerEntries
- Przypomnienia 24h: batch lookup, dedup, `Promise.allSettled`
- Push przy tworzeniu INTERNAL eventu do całej kadry
- `formatEventDateTime()` helper

## Etap 29: Violet Surge — Visual Redesign ✅
- Paleta: violet `#7c3aed` + violet→sky gradient
- Dark bg: `#0c0a1a` (deep navy-violet)
- 6 systemów animacji: ScrollReveal, Hover Glow, Animated Hero blobs, Micro-interactions, Page Transitions
- `prefers-reduced-motion` wsparcie
- Landing, Dashboard, Sparing card, Sidebar — pełny redesign

## Etap 30: League Catalog Redesign — 90minut Style ✅
- `/leagues` — hero z Trophy, grid 4-kolumnowy z Shield ikonami
- Table-style listy na sub-stronach
- Numerowana lista klubów z logotypami

## Etap 31: League Map + Active Club Badge ✅
- `PolandMap` komponent — grid 4x4 z 16 województwami, violet glow on hover
- Badge "Aktywny" przy klubach (sparingi/wydarzenia w ostatnich 6 mies.)
- Hero ulepszenia: gradient trophy icon, ScrollReveal

## Etap 32: League Navigation + Club Group Chat ✅
- League nav: "Menu główne" → `/feed`, sezon 2025/26, redesign kart regionów
- `Conversation.clubId` — jeden czat grupowy per klub
- `getClubChat` + `sendToClubChat` endpoints
- `/club-chat` — violet theme, nazwy nadawców, polling 10s
- Optymalizacje: warunkowy participant create, lastMessageId scroll tracking

---

## Naprawy z code review (zbiorczy backlog)

### Naprawione (sesja 2026-03-23)
- Duplikat aplikacji na sparing — check `findUnique` przed `create`
- Apply widoczne dla PLAYER → `&& isClub` guard
- Transfery brak w feedzie → dodane
- Feed brak error handling → error state + retry
- matchDate akceptuje dowolny string → refine() rejects past dates
- isParticipant bug → sprawdza `applicantClub.userId`

### Naprawione (sesja 2026-03-25)
- Hero SVG overlay blokuje kliknięcia → `pointer-events-none`
- Crash Radix Select `value=""` → sentinel `"__all__"`
- Widoczność liczby zgłoszeń → usunięto `_count.applications` z listingów
- Zgłoszenia widoczne w event detail → filtrowanie po auth
- "0 zaakceptowanych" → sekcja widoczna tylko gdy `maxParticipants` ustawiony

### Migracje DB (wszystkie zastosowane)
- `0_init` — baseline
- `20260323201350_add_reviews_transfers_gamification_push`
- `20260324055816_add_sparing_level_category`
- `20260324062139_add_counter_proposal`
- `20260324110435_add_club_followers`
- `20260326120000_add_coach_role`
- `20260326180000_recruitment_board`
- `20260326200000_favorite_club_post`
- `20260326220000_coach_creates_events`
- `20260327100000_sparing_invitations`
- `20260327120000_club_membership`
- `20260327140000_add_sparing_scores`
- `20260327160000_add_event_visibility_attendance`
- `20260327180000_add_invited_status`
- `20260327200000_add_coach_career`
- `20260327220000_add_club_chat`

---

## Etap 33: FotMob Club Management Flow Redesign ✅

**Cel:** Redesign club management flow (Dashboard → Kadra → Pipeline → Profil publiczny) w stylu Sofascore/FotMob — dark-first, data-dense, sportowy feel.

**Design tokens:**
- Dark mode: `#111827` bg (gray-900), `#1f2937` cards, `#374151` borders, `#9ca3af` muted text
- Typography: uppercase tracking-wider section labels, font-extrabold stats
- Border radius: `rounded-xl` (12px) na kartach

**Dashboard klubu (`feed/page.tsx`):**
- ClubHeaderCard — gradient hero (indigo-950→slate-900) z dot-pattern, logo, badges
- StatsRow — 4 StatsCell (Aktywne/Zgłoszenia/Kadra/Bilans W-R-P)
- NextMatchCard — MatchCard variant="highlight" (logo vs logo, countdown)
- QuickActions — gradient primary + outline secondary buttons
- PendingAlerts — lista alertów z kolorowymi kropkami i relative time
- Backend: `stats.clubDashboard` rozszerzony o nextMatch, squadCount, winRecord

**Kadra (`squad/page.tsx`):**
- 3-tab layout → single scrollable page z sekcjami
- Grupowanie po pozycji: GK (red), DEF (blue), MID (emerald), FWD (amber)
- Trenerzy z badge "Zarządza" (amber), prośby z inline accept/reject
- Kolorowe left-bar per sekcja, collapsible "+N więcej"

**Pipeline (`recruitment/page.tsx`):**
- ProgressBar — proporcjonalny, kolorowy (blue→amber→violet→emerald)
- StagePills — scrollowalne filtry per etap z liczbami
- List view jako domyślny (board jako toggle), karty z meta pills i mini-timeline
- MetricCard — "Średni czas do podpisania" z sky-400

**Profil publiczny klubu (`clubs/[id]/page.tsx`):**
- 2-kolumnowy layout → single-column z 5 tabami (Mecze/Kadra/Nabory/Opinie/Info)
- Hero: gradient (indigo-950→slate-900→sky-950), dot-pattern, badge "Aktywny"
- StatsBar: W/R/P/Kadra inline
- Tab Mecze: MatchCard z kolorowym wynikiem (emerald=W, red=L, gray=D)
- Tab Kadra: PositionGroup read-only
- Tab Info: kontakt, opis, liga (przeniesione z sidebar)

**Nowe pliki (5):**
- `src/components/stats-cell.tsx` — reużywalny stat display
- `src/components/match-card.tsx` — match display (compact + highlight)
- `src/components/squad/position-group.tsx` — position-grouped player list
- `src/components/recruitment/stage-pill.tsx` — pipeline stage filter
- `src/app/(public)/clubs/[id]/club-profile-tabs.tsx` — client component dla tabów

**Pliki zmodyfikowane (7):**
- `src/styles/globals.css` — dark mode tokens
- `src/app/(dashboard)/feed/page.tsx` — club dashboard redesign
- `src/app/(dashboard)/squad/page.tsx` — position-grouped layout
- `src/app/(dashboard)/recruitment/page.tsx` — progress bar + stage pills
- `src/app/(public)/clubs/[id]/page.tsx` — single-column tabs
- `src/components/dashboard/club-sections.tsx` — token alignment
- `src/components/recruitment/recruitment-stats.tsx` — token alignment
- `src/server/trpc/routers/stats.ts` — nextMatch, squadCount, winRecord

---

## Etap 34: Backlog Etap A — Unit Tests + File Validation + Shared Hook ✅

**Cel:** Zamknięcie 3 problemów z backlogu: brak unit testów, brak walidacji server-side plików, zduplikowane patterny list.

**1. Vitest Setup + 33 Unit Tests:**
- Zainstalowany `vitest` (devDependency), `vitest.config.ts` z aliasami `@/`
- Skrypty: `npm test` (vitest run), `npm run test:watch`
- `src/__tests__/format.test.ts` — formatDate, formatShortDate, formatEventDateTime (4 testy)
- `src/__tests__/gamification.test.ts` — POINTS_MAP (16 akcji), BADGES (9 odznak, zero stats, thresholds) (14 testów)
- `src/__tests__/form-errors.test.ts` — getFieldErrors z ZodError (2 testy)
- `src/__tests__/award-points.test.ts` — awardPoints z mock Prisma (3 testy)
- `src/__tests__/is-club-member.test.ts` — isClubMember z mock Prisma (3 testy)
- `src/__tests__/file-validation.test.ts` — detectFileType magic bytes (7 testów)
- `tsconfig.json` — `src/__tests__` excluded (vitest handles own types)

**2. Server-side File Validation (Magic Bytes):**
- `src/lib/file-validation.ts` — `detectFileType(bytes: Uint8Array)` → JPEG/PNG/WebP or null
- `src/app/api/upload/route.ts` — magic bytes check przed uploadem do Supabase
- Odrzuca pliki z nieprawidłowymi magic bytes (400 "Nieprawidłowy format pliku")

**3. Shared Pagination Hook:**
- `src/hooks/use-paginated-list.ts` — `usePaginatedList<T>(query)` wraps useInfiniteScroll + flatMap
- `src/app/(dashboard)/sparings/page.tsx` — refactored (-18 linii boilerplate)
- `src/app/(dashboard)/events/page.tsx` — refactored (-18 linii boilerplate)

**Backlog status:** Problem #2 (upload validation) ✅, Problem #4 (unit tests) ✅, Problem #5 (shared hook) ✅

---

## Etap 35: Email Transakcyjne + Protokół Meczowy (Strzelcy) ✅

**Cel:** Zwiększenie retencji — emaile transakcyjne przy kluczowych akcjach + protokół meczowy ze strzelcami bramek.

**Part 1 — Email transakcyjne (Resend):**
- Nowa zależność: `resend`
- `src/server/send-email.ts` — `sendEmailToUser()` helper (fire-and-forget, pattern jak sendPushToUser)
- `src/lib/email-template.ts` — HTML template z PS logo, violet gradient, CTA button, XSS escaping
- `src/lib/email-throttle.ts` — debounce 15min na emailach o wiadomościach (in-memory Map z auto-cleanup)
- 6 triggerów w 3 routerach:
  - sparing.ts: applyFor, respond, submitScore, invite
  - message.ts: send (z throttle)
  - club-membership.ts: invite
- `src/__tests__/email-template.test.ts` — 3 testy (rendering, XSS escape, branding)
- `src/__tests__/email-throttle.test.ts` — 4 testy (allow/block/different users/types)
- Env var: `RESEND_API_KEY` (do konfiguracji na Vercel)

**Part 2 — Protokół meczowy (strzelcy bramek):**
- Model `MatchGoal` (sparingOfferId, scorerUserId, minute, ownGoal)
- `GOAL_ADDED` NotificationType, `goal_scored: 5` w POINTS_MAP
- `sparing.addGoal` — walidacja: COMPLETED+scoreConfirmed, caller=club owner, scorer=ACCEPTED member, goals≤score
- `sparing.removeGoal` — walidacja: caller=club owner
- `sparing.getGoals` — publiczny, z scorer info
- UI w score-section.tsx: lista strzelców + formularz "Dodaj strzelca" (Select z obu kadr, minuta, samobój)
- UI w club-profile-tabs.tsx: `⚽ Kowalski 23', Nowak 67'` pod wynikami meczów
- Powiadomienie + push + email do strzelca: "Bramka dodana!"
- `src/lib/validators/match-goal.ts` — addGoalSchema, removeGoalSchema, getGoalsSchema

**Migracja:** Wymaga `npm run db:migrate -- --url "..." --name add_match_goals`

---

## Etap 36: Moduł Turniejowy ✅

**Cel:** Pełny system turniejowy — faza grupowa + drabinka pucharowa, rejestracja drużyn, wyniki, tabele, strzelcy, gamifikacja.

**Schema (5 nowych modeli):**
- `Tournament` — format (GROUP_STAGE/KNOCKOUT/GROUP_AND_KNOCKOUT), maxTeams 4-16, status, groupCount, advancingPerGroup
- `TournamentTeam` — clubId (opcjonalny, ad-hoc drużyny), status PENDING/ACCEPTED/REJECTED, groupLabel, seed
- `TournamentMatch` — phase (GROUP→FINAL), wyniki z potwierdzeniem, karne, matchOrder
- `TournamentGoal` — strzelcy bramek per mecz
- `TournamentStanding` — materialized tabela grupowa (pkt/bramki/bilans)

**Backend (15 procedur w tournament router):**
- CRUD: create, update, delete, list, getById
- Rejestracja: applyTeam, respondToApplication, withdraw
- Flow: startTournament (round-robin/bracket gen), submitMatchScore, confirmMatchScore, generateKnockoutAfterGroups, completeTournament
- Bramki: addGoal, removeGoal, getTopScorers
- Pure logic helpers (TDD, 13 testów): generateRoundRobin, generateKnockoutBracket, recalculateStandings, getNextPhase

**Frontend:**
- `/tournaments` — lista z filtrami (region, status), infinite scroll, TournamentCard (orange accent)
- `/tournaments/new` — formularz z format-specific pola (grupy, advancing, maxTeams)
- `/tournaments/[id]` — hero (amber→orange gradient) + 5 tabów:
  - Drużyny: lista z accept/reject, "Dołącz" button
  - Grupy: GroupTable (tabela + mecze per grupa, highlight advancing)
  - Drabinka: BracketView (kolumny per faza, TBD placeholders)
  - Strzelcy: TopScorers (top 10, orange accent)
  - Info: opis, daty, format, organizator

**Integracja:**
- Sidebar: "Turnieje" (Trophy icon) w sekcji "Więcej"
- Feed: turnieje w feedzie (typ "tournament", orange badge)
- Kalendarz: turnieje widoczne (orange)

**Gamifikacja:** tournament_created (15pkt), tournament_win (20pkt), tournament_goal (5pkt), badge "Mistrz turniejów" (wygraj 3)
**Powiadomienia:** 5 typów (APPLICATION, ACCEPTED, REJECTED, STARTED, SCORE_SUBMITTED) + push + email
**Migracja:** `20260328140000_add_tournaments` — 5 tabel, 4 enumy, 5 NotificationTypes — ZASTOSOWANA

---

## Etap 37: Rozliczenia Kosztów ✅

**Cel:** Informacja o kosztach + tracking statusu opłat na sparingach, wydarzeniach i turniejach.

**Schema (6 nowych pól):**
- `SparingOffer`: costPerTeam (Int?), costPaidHome (Boolean), costPaidAway (Boolean)
- `Event`: costPerPerson (Int?)
- `Tournament`: costPerTeam (Int?)
- `TournamentTeam`: costPaid (Boolean)

**Backend (2 nowe procedury):**
- `sparing.markCostPaid` — toggle costPaidHome/costPaidAway, walidacja: MATCHED/COMPLETED + owner danego klubu
- `tournament.markTeamPaid` — toggle costPaid per drużyna, walidacja: tournament creator
- Cost fields dodane do create/update w sparing, event, tournament routerach

**Frontend:**
- Formularze: pole "Koszt na drużynę/osobę (PLN)" w sparing-form, events/new, tournaments/new
- Karty: amber badge "X PLN" na sparing-card + event cards
- Sparing detail: sekcja "Rozliczenie" widoczna dla uczestników (MATCHED/COMPLETED) — badge Opłacone/Nieopłacone + toggle per strona
- Event detail: "Koszt: X PLN na osobę" w info
- Tournament detail: badge wpisowe + toggle paid per drużyna w tab Drużyny (tylko organizator)

**Widoczność:** Kwota publiczna (pomaga w decyzji), status opłat prywatny (tylko uczestnicy/organizator)

**Migracja:** `20260328160000_add_cost_fields` — 6 ALTER TABLE ADD COLUMN — ZASTOSOWANA

## Etap 38: Panel Admina / Moderacji ✅

**Data:** 2026-03-30

**Zakres:** Pełny panel administracyjny — moderacja zgłoszonych postów, zarządzanie użytkownikami (ban/admin), metryki platformy, zarządzanie treścią.

**Schema (3 nowe pola na User, 4 na ClubPost, 1 nowy model):**
- `User.isAdmin` (Boolean) — uprawnienia admina, dowolna rola
- `User.isBanned` (Boolean) — blokada logowania z 5-min cache w JWT
- `ClubPost.hidden` / `hiddenAt` / `hiddenBy` / `reportCount` — soft delete + denormalizacja zgłoszeń
- `ClubPostReport` — model zgłoszeń (userId, postId, reason), unique constraint na (userId, postId)

**Backend (1 nowy router, 11 procedur):**
- `admin.reportsList` — zgłoszone posty (reportCount > 0), sort by count DESC
- `admin.dismissReport` — wyzeruj reportCount, usuń rekordy zgłoszeń
- `admin.hidePost` — ukryj post (hidden=true), wyczyść zgłoszenia
- `admin.usersList` — lista userów z search (email/nazwa), cursor pagination
- `admin.ban` / `admin.unban` — toggle isBanned (guard: nie można siebie)
- `admin.setAdmin` — toggle isAdmin (guard: nie można odebrać ostatniemu adminowi)
- `admin.dashboard` — metryki: userzy per rola, sparingi/wydarzenia/turnieje (total + 7d), pending reports
- `admin.contentList` — lista sparingów/wydarzeń/turniejów z search + pagination
- `admin.deleteContent` — soft delete (CANCELLED) dla sparingów/turniejów, hard delete dla wydarzeń
- `adminProcedure` middleware — sprawdza `isAdmin` na sesji

**Zmiany w istniejącym kodzie:**
- `clubPost.report` — przepisany: persystuje `ClubPostReport` z deduplikacją (upsert), inkrementuje `reportCount`
- `clubPost.list` — dodany filtr `hidden: false`
- `feed.get` — dodany filtr `hidden: false` na ClubPost query
- `favorite.list` — JS-side filter ukrytych ClubPostów
- `auth/config.ts` — `isAdmin` w JWT/session, `isBanned` check w authorize + 5-min cache w jwt callback
- `middleware.ts` — Edge-level blokada `/admin` dla non-admin
- `next-auth.d.ts` — `isAdmin` + `bannedCheckedAt` w typach

**Frontend:**
- `/admin` — strona z 4 tabami (shadcn Tabs):
  - **Raporty:** lista zgłoszonych postów, dismiss/hide z ConfirmDialog, expandable szczegóły zgłoszeń, badge count
  - **Użytkownicy:** search (debounce 300ms), karty z role badge, ban/unban + setAdmin toggles
  - **Metryki:** StatsCell grid — łącznie (8 metryk) + 7-dniowe (3 metryki)
  - **Treści:** pill-switcher (sparing/event/tournament), search, delete z ConfirmDialog
- Sidebar: link "Admin" z ikoną Shield, widoczny tylko dla isAdmin

**Spec:** `docs/superpowers/specs/2026-03-30-admin-panel.md`
**Plan:** `docs/superpowers/plans/2026-03-30-admin-panel.md`
**Migracja:** Raw SQL (ALTER TABLE + CREATE TABLE) — ZASTOSOWANA

---

## Etap 39: Loga regionów, sociale, redesign sidebara, smart lokalizacje ✅ (2026-04-05)

**Loga ZPN regionów:**
- 16 logotypów ZPN pobrane do `/public/regions/` (slug-based naming)
- Komponent `<RegionLogo>` z `next/image` — reużywalny w całej apce
- Loga dodane w: `/leagues` (kafelki, mapa Polski), strony regionów/szczebli/grup, profile publiczne (klub, gracz, trener), karty sparingów, szczegóły eventów/transferów/sparingów
- `feed.ts` — dodano `slug` do selectów regionu
- `PolandMap` — logo zamiast ikony MapPin

**Social links (Facebook + Instagram):**
- `facebookUrl`, `instagramUrl` na modelach Club, Player, Coach (Prisma schema + db push)
- Walidatory: `updateClubSchema`, `updatePlayerSchema`, coach update schema
- Formularze profili: pola FB/Insta (inline edit w klubie, input w gracz/trener)
- Profile publiczne: ikony FB/Insta w hero (widoczne tylko gdy URL podpięty)
- Komponent `<SocialLinks>` — wyciągnięty z 3 profili do shared

**Redesign zapraszania klubów na sparing:**
- Przycisk "Zaproś klub" — full-width CTA z ikoną i opisem (zamiast małego buttona)
- Kaskadowe filtry: Region → Szczebel → Grupa (oprócz wyszukiwania po nazwie)
- Wyniki z logami regionów i info o lidze/grupie
- Backend: `leagueLevelId` dodane do `club.list`

**Profil klubu — inline edit:**
- Osobna karta "Region i liga" z widokiem logo + dane, tryb edycji z kaskadowymi selectami
- Formularz profilu → widok danych: każde pole z ikoną ołówka, edycja inline z instant save
- Komponenty `EditableField` i `EditableTextarea` (lokalne w formularzu)

**Redesign sidebara:**
- Glassmorphism: `bg-[#0b1120]/95` + `backdrop-blur-xl`
- Dekoracyjne gradient orby (violet/sky blur)
- Gradient active indicator (violet→sky) zamiast border-l
- Pill-shaped hover states, gradient badge na powiadomieniach
- Sekcja użytkownika z gradient avatar ring
- Szerokość 256px (z 240px)

**Smart lokalizacje w wydarzeniach:**
- Usunięte: pola Region i Maks. uczestników z formularza nowego wydarzenia
- Region auto-ustawiany z profilu klubu w backendzie
- `event.recentLocations` — endpoint pobierający unikalne lokalizacje klubu
- Picker lokalizacji: auto-ładuje ostatnią, pill buttons z zapisanymi, "+ Inna lokalizacja"
- Edycja zapisanych lokalizacji inline (ołówek → input, Enter/Esc)
- `event.updateLocation` — aktualizuje lokalizację we wszystkich eventach klubu

**Dark mode fix:**
- Globalny CSS fix dla native `<select>` i `<option>` — `background-color: var(--background/--card)`

**Refactoring (simplify):**
- `<SocialLinks>` — shared component (wyciągnięty z 3 profili)
- `getUserClubId()` — shared helper (wyciągnięty z 2 endpointów event.ts)
- Fix: React anti-pattern (state mutation during render → useEffect)
- Fix: zduplikowana logika zapisu lokalizacji → `saveEditedLoc()`
- Fix: misaligned query enable condition w invite-club-dialog
- `staleTime: Infinity` → 5 minut

**Nowe pliki:**
- `src/components/region-logo.tsx`
- `src/components/social-links.tsx`
- `src/server/get-user-club-id.ts`
- `public/regions/*.png` (16 plików)

---

## Etap 40: X/Twitter-style redesign + Sport Energy + Smart Matching ✅

**Data:** 2026-04-05

### Design: Sport Energy (kolorystyka + mikro-interakcje)
- Nowe kolory: cyan (`--sport-cyan`) i żółty (`--sport-yellow`) jako secondary akcenty
- CTA button variant `sport` — gradient violet→cyan
- Heart bounce animacja na favorite toggle
- Sparing card: cyan left border, flat hover, countdown pulse < 24h
- Apply buttons: animacja "Wysłano ✓" / "Zgłoszono ✓" z check-pop
- Nawigacja: cyan active indicator + notification badge
- Hero: cyan/yellow blobs, sport-heading (uppercase + gradient stripe)
- Typografia nagłówków: font-weight 900, letter-spacing -0.02em, uppercase

### Design: X/Twitter-style overhaul
- Dark mode: pure black `#000000` tło (card, background, sidebar)
- Flat cards: `rounded-none`, usunięte shadow-sm/md/lg z ~20 plików
- Minimal borders: `#2f3336` zamiast `#374151`
- Chat bubbles: X-blue (`#1d9bf0`) dla swoich, `bg-secondary` dla cudzych
- Tabs: underline indicator (`border-b-2 border-x-blue`) zamiast background
- Badge: `rounded-md` zamiast `rounded-full`
- Sidebar: X-style "Więcej" — inline collapsible z identycznym stylem jak główne elementy
- Landing page: czarne tło, usunięte gradient orbs
- CSS variable `--x-blue: #1d9bf0` dla spójności (tabs, notifications, chat)
- Hidden scrollbar na sidebarze (`scrollbar-width: none`)

### Feature: Smart Club Sorting w zaproszeniach sparingowych
- `club.list` — nowy parametr `prioritizeForClubId`
- Sortowanie: ten sam LeagueLevel + Region → ten sam LeagueLevel → ten sam Region → reszta
- Self-exclusion z wyników
- `getMatchTier()` helper function
- Invite dialog automatycznie przekazuje club ID

### Feature: "Szukam klubu" toggle
- `lookingForClub Boolean` na Player i Coach (Prisma migration)
- Checkbox na profilach: "Szukam klubu" z opisem, disabled bez regionu
- Prywatność: pole wykluczone z public endpoints (player.getById, list, coach.getById, list, search.global)
- Notyfikacje: event recruitment → lookingForClub players/coaches w regionie
- Notyfikacje: transfer LOOKING_FOR_PLAYER → lookingForClub users (z filtrem pozycji)

### Feature: Zapraszanie zawodników na wydarzenia
- `player.search` — nowy endpoint z filtrami (name, region, league, position, club via membership)
- lookingForClub boost: gracze szukający klubu w tym samym regionie wyżej w wynikach
- `event.invitePlayer` — wysyła notyfikację + push
- `InvitePlayerDialog` — komponent z wyszukiwarką i filtrami (wzorzec jak InviteClubDialog)
- Fix: `isOwner` na stronie eventu uwzględnia teraz coach creators

### Performance
- Usunięte `page-enter` animacja z dashboard layout (300ms na każdy route change)
- Usunięte `stagger-children` z 6 stron (feed, events, sparings, transfers, tournaments, recruitments)
- Usunięte `skeleton-reveal` — kolidowało z `animate-pulse`
- Usunięte gradient orbs z sidebara i landing page (GPU-heavy blur filters)

### Fixes
- Push notification toggle: icon-only w sidebarze (nazwa użytkownika nie jest ściskana)
- Kalendarz "Dziś": toggle filtra dzisiejszych wydarzeń w widoku listy
- Sidebar active indicator: podświetla "Więcej" gdy aktywna strona jest w submenu

### Code quality (simplify)
- CSS variable `--x-blue` zamiast hardcoded `#1d9bf0` w 4 plikach
- `hover:border-border` zamiast `hover:border-[#2f3336]` w 3 plikach
- `bg-background` zamiast `bg-[#000000]`/`bg-black` w 4 plikach
- Usunięte dead `hover:border-opacity-100` z onboardingu

### Nowe pliki
- `src/components/events/invite-player-dialog.tsx`
- `docs/superpowers/specs/2026-04-05-sparing-sort-looking-for-club.md`
- `docs/superpowers/specs/2026-04-05-invite-players-to-events.md`
- `docs/superpowers/plans/2026-04-05-sport-energy-design.md`
- `docs/superpowers/plans/2026-04-05-sparing-sort-looking-for-club.md`
- `docs/superpowers/plans/2026-04-05-invite-players-to-events.md`
- `prisma/migrations/20260405_add_looking_for_club/migration.sql`

## Etap 41: i18n (PL/EN) + X-style white background ✅

### Feature: Przełączanie języka PL/EN
- Lekki system i18n bez zewnętrznych bibliotek: `I18nProvider` (React Context) + `useI18n()` hook + `t()` helper
- Podejście "polski tekst jako klucz" — `t("Sparingi")` zwraca "Sparrings" gdy locale=en
- Słownik `plToEn` w `src/lib/translations.ts` (~950 wpisów)
- Generyczny `getLabels(map, locale)` z `WeakMap` cache do tłumaczenia label maps
- `LanguageToggle` w sidebarze (Globe icon + EN/PL)
- Język persisted w `localStorage`, aktualizuje `<html lang>`
- Przetłumaczone ~65 komponentów: nawigacja, dashboard, sparingi, wydarzenia, transfery, turnieje, rekrutacja, wiadomości, powiadomienia, admin, profile, formularze, onboarding, auth
- Server components (publiczne profile, landing) pozostają po polsku (wymagałyby innego podejścia)

### Feature: Białe tło w trybie jasnym (X-style)
- Nowe kolory light mode: `--background: #ffffff`, `--foreground: #0f1419`, `--border: #eff3f4`, `--muted: #f7f9f9`
- Sidebar: theme-aware kolory z `dark:` wariantami zamiast hardkodowanych `text-white`
- Sidebar widoczny i czytelny w obu trybach

### Code quality (simplify)
- `useMemo` na context value w `I18nProvider` — zapobiega re-renderom 65+ konsumentów
- Stabilna `identity` ref dla pre-mount `t()` (zamiast inline arrow)
- `WeakMap` cache w `getLabels()` — eliminuje alokację obiektów przy powtórnych wywołaniach
- Usunięte 20 copy-paste getter functions → 1 generyczny `getLabels(map, locale)`
- Sidebar: import `ROLE_LABELS` zamiast inline duplikacji
- Language toggle: `<Globe>` z lucide-react zamiast inline SVG

### Nowe pliki
- `src/lib/i18n.tsx` — I18nProvider, useI18n hook
- `src/lib/translations.ts` — słownik PL→EN (~950 wpisów)
- `src/components/language-toggle.tsx` — przełącznik języka

## Etap 42: Security hardening + ai-toolkit compliance ✅

**Data:** 2026-04-07

### Security
- Security headers w `next.config.ts`: HSTS, CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy
- `.strict()` na 37 schematach Zod w 12 plikach walidatorów — odrzuca nieznane pola (mass assignment protection)
- `src/env.ts` — Zod validation env vars przy starcie (DATABASE_URL, NEXTAUTH_SECRET, SUPABASE keys, VAPID, RESEND)
- Upload endpoint: whitelist dozwolonych folderów (`clubs`, `players`, `coaches`, `events`) + UUID validation entityId
- CRON_SECRET: fail-fast pattern (500 jeśli niezdefiniowany, nie silent pass)
- Zamiana `process.env.X!` na `env.X` w 3 plikach (upload, send-email, send-push)

### Type Safety
- Eliminacja 3 krytycznych `any`: `award-points.ts` (`db: any` → `Pick<PrismaClient, "userPoints">`), `event.ts` (`where: any` → `Prisma.EventWhereInput`), `send-email.ts` (typed db param)
- Eliminacja 18 non-null assertions `!` w 15 routerach + `tournament-logic.ts` — zamiana `items.pop()!` na safe guard pattern
- `event.ts:333` — usunięcie `as Record<string, unknown>` → direct property access

### Architecture
- Prisma `$transaction` w tournament.ts (tournament + team create atomically)
- 63 `.catch(() => {})` → kontekstowe error logging (`[awardPoints]`, `[notification]`, `[push]`, `[email]`, `[fire-and-forget]`) w 10 plikach
- `loading.tsx` + `error.tsx` w 8 dashboard route segments (events, sparings, transfers, community, tournaments, calendar, feed, messages)
- `src/server/fire-and-log.ts` — helper fireAndLog<T>

### Testing
- Vitest coverage config (`@vitest/coverage-v8`, provider v8)
- Unit testy auth routera: 4 testy (duplicate email, CLUB/PLAYER creation, rate limiting)
- Factory functions: `src/__tests__/factories.ts` (createMockUser, Session, Club, Player, Sparing, Event)
- E2E guards: `test.skip(!sparingUrl, ...)` w sparing.spec.ts i messages.spec.ts

### Nowe pliki
- `src/env.ts` — Zod-validated environment variables
- `src/server/fire-and-log.ts` — fire-and-forget z logging helper
- `src/__tests__/factories.ts` — test data factories
- `src/__tests__/routers/auth.test.ts` — unit testy auth routera
- `src/app/(dashboard)/events/loading.tsx` + `error.tsx`
- `src/app/(dashboard)/sparings/loading.tsx` + `error.tsx`
- `src/app/(dashboard)/transfers/loading.tsx` + `error.tsx`
- `src/app/(dashboard)/community/loading.tsx` + `error.tsx`
- `src/app/(dashboard)/tournaments/loading.tsx` + `error.tsx`
- `src/app/(dashboard)/calendar/loading.tsx` + `error.tsx`
- `src/app/(dashboard)/feed/loading.tsx` + `error.tsx`
- `src/app/(dashboard)/messages/loading.tsx` + `error.tsx`

## Etap 43: Perceived Performance — Skeleton Loading + staleTime Tuning ✅

**Data:** 2026-04-08

**Cel:** Szybsza percepcja nawigacji między podstronami dashboardu — skeleton UI zamiast pustych spinnerów + agresywniejsze cachowanie queries.

### Skeleton Loading (8 plików loading.tsx)
- Feed, Community → `FeedCardSkeleton` (lista postów z badge + linie tekstu)
- Events, Sparings, Transfers, Tournaments → `CardSkeleton` w gridzie `sm:grid-cols-2 lg:grid-cols-3`
- Messages → `ConversationSkeleton` (awatar + linie konwersacji)
- Calendar → duży prostokątny skeleton `h-[400px]`
- Wszystkie z nagłówkiem skeleton (tytuł + podtytuł)

### staleTime Tuning
- Global default: `30s → 60s` (providers.tsx)
- `feed.get`: default → `300_000` (5 min)
- `stats.dashboard`: `60_000` → `300_000` (5 min)
- `stats.clubDashboard`: `30_000` → `300_000` (5 min)
- `event.list` (infinite): default → `180_000` (3 min)
- `sparing.list` (infinite): default → `180_000` (3 min)
- `transfer.list` (infinite): default → `180_000` (3 min)
- `tournament.list` (infinite): default → `180_000` (3 min)
- `message.getConversations`: default → `60_000` (1 min)

### Pliki zmodyfikowane (10)
- `src/components/providers.tsx` — global staleTime 60s
- `src/app/(dashboard)/feed/loading.tsx` — FeedCardSkeleton
- `src/app/(dashboard)/feed/page.tsx` — staleTime 5min na feed/stats/clubDashboard
- `src/app/(dashboard)/events/loading.tsx` — CardSkeleton grid
- `src/app/(dashboard)/events/page.tsx` — staleTime 3min
- `src/app/(dashboard)/sparings/loading.tsx` — CardSkeleton grid
- `src/app/(dashboard)/sparings/page.tsx` — staleTime 3min
- `src/app/(dashboard)/transfers/loading.tsx` — CardSkeleton grid
- `src/app/(dashboard)/transfers/page.tsx` — staleTime 3min
- `src/app/(dashboard)/tournaments/loading.tsx` — CardSkeleton grid
- `src/app/(dashboard)/tournaments/page.tsx` — staleTime 3min
- `src/app/(dashboard)/community/loading.tsx` — FeedCardSkeleton
- `src/app/(dashboard)/messages/loading.tsx` — ConversationSkeleton
- `src/app/(dashboard)/messages/page.tsx` — staleTime 1min
- `src/app/(dashboard)/calendar/loading.tsx` — prostokątny skeleton

### tRPC Prefetch on Hover
- Hook `usePrefetchRoute()` — mapuje route href → odpowiedni `utils.<router>.prefetch()` / `prefetchInfinite()`
- Deduplikacja: `Set<string>` zapobiega wielokrotnemu prefetchowi tego samego route
- Pokrycie: feed, sparings, events, transfers, tournaments, messages, community, ranking, notifications, favorites
- Sidebar: `onMouseEnter` na każdym `<Link>` (desktop)
- BottomNav: `onTouchStart` na każdym `<Link>` (mobile — ~200ms przed navigate)

### RSC Router Cache
- `next.config.ts`: `experimental.staleTimes` — `dynamic: 30s`, `static: 180s`
- Klient cachuje RSC payload między nawigacjami zamiast odpytywać serwer za każdym razem

### Nowe pliki
- `src/hooks/use-prefetch-route.ts`

### Pliki zmodyfikowane (dodatkowe)
- `src/components/layout/sidebar.tsx` — import + onMouseEnter prefetch
- `src/components/layout/bottom-nav.tsx` — import + onTouchStart prefetch
- `next.config.ts` — experimental.staleTimes

## Etap 44: Feed Redesign — Zróżnicowane karty, 3-kolumnowy layout, Pull-to-Refresh ✅

**Data:** 2026-04-08

### Zróżnicowane karty feedu (6 typów)
- `SparingFeedCard` — herby klubów VS, countdown <24h (pulse), koszt badge, emerald accent
- `EventFeedCard` — typ wydarzenia badge, koszt, max uczestników, violet accent
- `TransferFeedCard` — pozycja badge, region, cyan accent
- `TournamentFeedCard` — format badge (Grupy/Puchar), ilość drużyn counter, orange accent
- `ClubPostFeedCard` — kategoria z kolorami, podgląd treści (line-clamp-2), rose accent
- `NewMemberFeedCard` — awatar/logo, pozycja, region, blue/orange accent
- Każda karta ma unikalne hover (border + tło w kolorze accent)
- Zastąpienie monolitycznego `FeedCard` z switch statements

### 3-kolumnowy layout (desktop)
- Feed page: `lg:flex lg:gap-6` — main feed (flex-1, max-w-2xl) + right panel (w-72/xl:w-80)
- Right panel sticky (top-6): QuickLinks (role-aware) + Top 5 Leaderboard
- Prawa kolumna hidden na mobile (`hidden lg:block`)
- Club: szybkie akcje (nowy sparing, nabór, pipeline, kalendarz, szukaj rywala)
- Player/Coach: statystyki (zgłoszenia, wiadomości) + leaderboard

### Pull-to-Refresh (mobile gesture)
- `usePullToRefresh` hook — touch gesture z dampening, threshold 80px
- `PullToRefreshIndicator` — rotating arrow z progress, spin na refresh
- Podpięty do feed.refetch() + stats.refetch()
- Widoczny tylko na mobile (`md:hidden`)

### Nowe pliki (9)
- `src/components/feed/sparing-feed-card.tsx`
- `src/components/feed/event-feed-card.tsx`
- `src/components/feed/transfer-feed-card.tsx`
- `src/components/feed/tournament-feed-card.tsx`
- `src/components/feed/club-post-feed-card.tsx`
- `src/components/feed/new-member-feed-card.tsx`
- `src/components/feed/feed-right-panel.tsx`
- `src/components/feed/pull-to-refresh-indicator.tsx`
- `src/components/feed/index.ts`
- `src/hooks/use-pull-to-refresh.ts`

### Pliki zmodyfikowane
- `src/app/(dashboard)/feed/page.tsx` — rozbicie FeedCard na dispatcher, 2-kolumnowy layout, pull-to-refresh, usunięte nieużywane importy (formatDate, MapPin, FileText, getLabels, EVENT_TYPE_LABELS, POSITION_LABELS)

---

## Faza 45: Visual Redesign — Theme Layer ✅

**Data:** 2026-04-08

Transformacja wizualna z flat X/Twitter-style na dynamiczny, sportowy interfejs z głębią, gradientami i hierarchią wizualną. Podejście Theme Layer — zmiany skoncentrowane w CSS/theme, zero zmian w logice biznesowej.

### Fundament Theme (`globals.css`)
- Primary accent: `#7c3aed` → `#8b5cf6` (violet-500, jaśniejszy, lepszy kontrast)
- Dark mode karty: `#000000` → `#0a0a0f` (odcięcie od tła)
- Dark mode border: `#2f3336` → `rgba(139,92,246,0.10)` (violet tint)
- Nowe CSS vars: `--shadow-card`, `--shadow-card-hover`, `--shadow-button-primary`, `--card-elevated-bg`, `--card-elevated-border`
- Nowe utility: `.sport-gradient-{blue,amber,violet,green}`, `.sport-card-elevated`
- `--font-display: var(--font-rubik)` w `@theme inline`
- `.sport-heading` z `font-family: var(--font-rubik)`
- `.hover-glow-violet` zaktualizowany do nowego koloru

### Typografia
- Import Rubik (Google Fonts) obok Inter w `layout.tsx`
- CSS variables: `--font-inter`, `--font-rubik` na `<html>`
- Rubik: wagi 600-900, display font na nagłówkach (`font-display` class)
- Inter: body text (bez zmian)

### Zaokrąglenia (zróżnicowana hierarchia)
- `card.tsx`: `rounded-none` → `rounded-2xl` (16px) + shadow + violet border
- `button.tsx`: `rounded-md` → `rounded-lg` (8px) + gradient na default variant
- `input.tsx`: `rounded-md` → `rounded-[10px]`
- `dialog.tsx`: `rounded-lg` → `rounded-[20px]`
- `sheet.tsx` (bottom): dodano `rounded-t-[20px]`

### Hero Section (`ClubHeaderCard`)
- Dot pattern → SVG boisko (linie, pole karne, koło środkowe) na 4% opacity
- Gradient glow: radial violet w prawym górnym rogu
- Herb klubu: 56px → 72px, gradient tło (`#8b5cf6` → `#6d28d9`), shadow
- Nazwa: Rubik font, 26px, tracking -0.5px
- Podtytuł: `text-accent-foreground` zamiast hardcoded hex

### Karta Sparingu
- VS layout: 2 herby (44x44px, `rounded-xl`) z "vs" pomiędzy
- Gradient left border: pseudo-element cyan→violet (3px)
- Tytuł w Rubik font (`font-display` class)
- Badge z `rounded-lg`
- Extracted `crestSlotClass` constant (DRY)

### Pipeline Rekrutacyjny
- Layout: `flex flex-wrap` → `grid grid-cols-2`
- Kafelki: gradient tło per kolor (`.sport-gradient-*`), colored border
- Liczby: `text-lg` → `text-[32px] font-extrabold`
- avgTime tile dopasowany do nowego designu
- Kolory: `*-500` → `*-400` (jaśniejsze na ciemnym tle)

### Kalendarz
- `getDayGradientStyle()` helper: gradient + border + glow per typ wydarzenia
- Cyan = sparing, orange = turniej, violet = wydarzenie

### Sidebar
- Usunięta nazwa użytkownika i rola z user section
- Zostaje: avatar + ikony (język, powiadomienia, theme)
- Usunięte dead code: import `ROLE_LABELS`, zmienna `roleLabel`

### Cleanup (code review)
- `style={{ fontFamily }}` → `font-display` Tailwind class (2 miejsca)
- `text-[#a78bfa]` → `text-accent-foreground`
- Rubik: ograniczenie wag do `["600","700","800","900"]` (mniej KB)
- Crest slot: `from-[#1a1a2e]` → `from-muted` (light mode compatible)

### Pliki zmodyfikowane (11)
- `src/styles/globals.css`
- `src/app/layout.tsx`
- `src/components/ui/card.tsx`
- `src/components/ui/button.tsx`
- `src/components/ui/dialog.tsx`
- `src/components/ui/sheet.tsx`
- `src/components/ui/input.tsx`
- `src/app/(dashboard)/feed/page.tsx`
- `src/components/sparings/sparing-card.tsx`
- `src/components/recruitment/recruitment-stats.tsx`
- `src/components/calendar-view.tsx`
- `src/components/layout/sidebar.tsx`

---

## Faza 46: RSC Data Prefetch & Performance ✅

**Data:** 2026-04-08

Eliminacja waterfall na najważniejszych stronach przez server-side prefetch + poprawki prefetch hooka.

### RSC Data Prefetch
- `src/lib/trpc-server.ts` — server-side tRPC caller z `createHydrationHelpers` (@trpc/react-query/rsc)
- `createCallerFactory` wyeksportowany z `src/server/trpc/trpc.ts`
- Feed page: RSC wrapper prefetchuje `feed.get`, `stats.dashboard`, `club.me`, `stats.clubDashboard` server-side
- Sparings page: RSC wrapper prefetchuje `region.list` server-side
- Klient dostaje dane z `HydrateClient` — zero waterfall na first render
- Pakiet `server-only` dodany dla bezpieczeństwa importów

### Time-aware Prefetch Hook
- `usePrefetchRoute`: `Set` → `Map<string, number>` z 60s cooldown
- Re-prefetch po powrocie na stronę (wcześniej: once-per-session, nigdy nie odświeżał)

### staleTime Normalization
- `stats.clubDashboard`: `30_000` → `120_000` w `club-sections.tsx` i `sparings-client.tsx`
- Eliminuje niepotrzebne refetche co 30s

### UI: Usunięty Bilans W-R-P
- Kafelek "Bilans W-R-P" usunięty z dashboard stats row
- Grid zmieniony z `grid-cols-2 sm:grid-cols-4` na `grid-cols-3`
- Usunięty `winRecord` z `ClubStatsRow` props i `ClubDashboard`

### Nowe pliki (3)
- `src/lib/trpc-server.ts`
- `src/app/(dashboard)/feed/feed-client.tsx` (wydzielone z page.tsx)
- `src/app/(dashboard)/sparings/sparings-client.tsx` (wydzielone z page.tsx)

### Pliki zmodyfikowane (6)
- `src/server/trpc/trpc.ts` — export `createCallerFactory`
- `src/app/(dashboard)/feed/page.tsx` — RSC wrapper z prefetch
- `src/app/(dashboard)/sparings/page.tsx` — RSC wrapper z prefetch
- `src/hooks/use-prefetch-route.ts` — time-aware prefetch
- `src/components/dashboard/club-sections.tsx` — staleTime 120s
- `package.json` — dodany `server-only`

---

## Etap 47: Dashboard & Visual Redesign ✅

### Design System — Deep Charcoal
- Dark mode: tło `#09090b`, karty `#111116`, border `rgba(139,92,246,0.06)`
- Light mode: tło `#fafafa`, karty `#ffffff`, sport-orange `#ea580c` (WCAG contrast fix)
- Nowy token `--sport-orange` (dual accent: violet + orange)
- Nowy token `--shadow-hero` dla hero kart
- Sidebar accent w dark mode: orange-tinted (`rgba(249,115,22,0.12)`)

### Layout — Sportstream Hybrid
- Sidebar collapsed by default (64px, ikony), expand toggle z chevron, overlay na expand
- `useSidebarState` hook z localStorage persist
- Flat nav list (10 items) zamiast "Więcej" toggle
- Active state: orange tint bg + gradient bar (violet→orange)
- Top tabs: role-specific nawigacja (CLUB 6 tabów, PLAYER 5, COACH 5), sticky, pill-style
- Layout: `md:ml-16` (z 64), TopTabs nad contentem
- Right panel (lg+ only, 260px): mini kalendarz, upcoming, ranking, quick actions

### Dashboard Components
- `DashboardStats`: 4 stat cards per rola (Rubik 28px bold, trend indicators)
  - CLUB: aktywne sparingi, oczekujące aplikacje, wydarzenia, ranking
  - PLAYER: zgłoszenia, treningi, wiadomości, ranking
  - COACH: zaplanowane treningi, zapisy, wydarzenia, wiadomości
- `HeroCard`: VS layout z herbami (CLUB — next matched sparing z countdown), SimpleHeroCard CTA (PLAYER/COACH)
- `MiniCalendar`: 7-kolumnowy grid, highlighted days (orange=sparing, violet=event)
- `UpcomingWidget`: 4 najbliższe wydarzenia/sparingi z colored bar
- `RankingWidget`: 5 pozycji wokół usera z highlight

### Feed & UI Updates
- Feed cards: ikony z tint per typ (orange=sparing, violet=event, green=turniej, cyan=transfer, blue=post)
- Bottom nav: `text-sport-cyan` → `text-sport-orange`, badge gradient `from-violet-500 to-sport-orange`
- Button: nowy `accent` variant (orange gradient), `sport` variant zaktualizowany (cyan→orange)
- Landing page: `border-white/[0.06]` → `border-border`, stats counter `text-sport-cyan` → `text-sport-orange`

### Cleanup & Simplify
- Usunięto duplicate `ClubNextMatch` z feed-client (HeroCard go zastępuje)
- Usunięto duplicate `CoachDashboardStats` (DashboardStats obsługuje COACH)
- Usunięto `as any` casty — poprawne typowanie z tRPC inference + `session.user.id`
- Wyrównano `staleTime` na `stats.clubDashboard` (300_000) w 5 komponentach
- Dodano `staleTime: 60_000` do sidebar unread count queries
- Extract `SimpleHeroCard` z duplikacji PlayerHero/CoachHero
- Usunięto unused `mounted` z `useSidebarState`

### Nowe pliki (8)
- `src/hooks/use-sidebar-state.ts`
- `src/components/layout/top-tabs.tsx`
- `src/components/layout/right-panel.tsx`
- `src/components/dashboard/dashboard-stats.tsx`
- `src/components/dashboard/hero-card.tsx`
- `src/components/dashboard/mini-calendar.tsx`
- `src/components/dashboard/upcoming-widget.tsx`
- `src/components/dashboard/ranking-widget.tsx`

### Pliki zmodyfikowane (16)
- `src/styles/globals.css` — nowe tokeny Deep Charcoal
- `src/components/layout/sidebar.tsx` — collapsed-first rewrite
- `src/app/(dashboard)/layout.tsx` — TopTabs + ml-16
- `src/components/layout/bottom-nav.tsx` — orange accent
- `src/components/ui/button.tsx` — accent variant + sport update
- `src/app/(dashboard)/feed/feed-client.tsx` — stats + hero + right panel integration
- `src/app/page.tsx` — border-border, sport-orange stats
- `src/app/(dashboard)/tournaments/[id]/page.tsx` — bg-card
- `src/components/events/invite-player-dialog.tsx` — sport-orange
- `src/components/feed/sparing-feed-card.tsx` — orange icon tint
- `src/components/feed/event-feed-card.tsx` — violet icon tint
- `src/components/feed/tournament-feed-card.tsx` — green icon tint
- `src/components/feed/transfer-feed-card.tsx` — cyan icon tint
- `src/components/feed/club-post-feed-card.tsx` — blue icon tint
- `src/components/feed/new-member-feed-card.tsx` — unified hover
- `STATE.md` — Etap 47
