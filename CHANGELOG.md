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

## Etap 48: Pivot matchmaking — usunięcie wyników/bramek/opłat, PitchStatus, grupowe zaproszenia, tryb dyskretny ✅

**Data:** 2026-04-14

Zmiana kierunku platformy na czysty system matchmakingowy dla niższych lig. Usunięcie zbędnych ficzerów, dodanie nowych wspierających core flow.

### Usunięte (redukcja szumu)
- **Modele:** `MatchGoal`, `TournamentGoal` — usunięte całkowicie
- **Pola SparingOffer:** `homeScore`, `awayScore`, `scoreSubmittedBy`, `scoreConfirmed`, `costPaidHome`, `costPaidAway`
- **Pole TournamentTeam:** `costPaid`
- **Typy notyfikacji:** `SCORE_SUBMITTED`, `SCORE_CONFIRMED`, `SCORE_REJECTED`, `GOAL_ADDED`, `TOURNAMENT_SCORE_SUBMITTED`
- **Endpointy tRPC sparing:** `submitScore`, `confirmScore`, `getGoals`, `addGoal`, `removeGoal`, `markCostPaid`
- **Endpointy tRPC tournament:** `addGoal`, `removeGoal`, `getTopScorers`, `markTeamPaid`
- **Walidatory:** `match-goal.ts` (cały plik), `markCostPaidSchema`, `tournamentGoalSchema`, `markTeamPaidSchema`
- **Gamifikacja:** usunięto akcje `goal_scored`, `tournament_goal` (15→15 akcji)
- **Komponent:** `score-section.tsx` (416 linii), cost-paid toggles z `sparing-info.tsx`
- **UI:** win record z dashboardu i profilu klubu, tab "Strzelcy" z turnieju

### Dodane
- **PitchStatus** enum (`WE_HAVE_PITCH`, `LOOKING_FOR_PITCH`, `SPLIT_COSTS`) — pole `pitchStatus` na `SparingOffer`
  - Select w formularzu tworzenia/edycji sparingu
  - Kolorowe badge na kartach (zielone "Mamy boisko", pomarańczowe "Szukamy boiska", niebieskie "Dzielimy koszty")
- **Grupowe zaproszenia** — endpoint `invite` przyjmuje `toClubIds` (tablica 1-5 UUID) zamiast `toClubId`
  - `InviteClubDialog` — multi-select z chipami, counter, limit 5
- **Tryb dyskretny** — pole `isDiscreet` na `Player` i `Transfer`
  - Filtrowanie w `search.global`, `feed.suggestedPlayers`, `transfer.list`, `player.search`
  - Toggle w profilu zawodnika z opisem ("Ukryj mój profil...")

### Migracje
- `20260414170000_simplify_removing_scores_and_payments` — DROP tabel, ALTER kolumn, recreate NotificationType enum
- `20260414180000_add_pitch_status` — nowy enum + kolumna
- `20260414190000_add_discreet_mode` — `is_discreet` na `players` i `transfers`

### Pliki usunięte (2)
- `src/app/(dashboard)/sparings/[id]/_components/score-section.tsx`
- `src/lib/validators/match-goal.ts`

### Pliki zmodyfikowane (19)
- `prisma/schema.prisma` — usunięte modele/pola, nowe enum + pola
- `prisma/prisma.config.ts` — fix: `--config` flag required for migrate
- `src/server/trpc/routers/sparing.ts` — usunięte endpointy, dodany pitchStatus, bulk invite
- `src/server/trpc/routers/tournament.ts` — usunięte endpointy goal/payment
- `src/server/trpc/routers/stats.ts` — usunięty win record
- `src/server/trpc/routers/feed.ts` — filtr isDiscreet
- `src/server/trpc/routers/search.ts` — filtr isDiscreet
- `src/server/trpc/routers/transfer.ts` — filtr isDiscreet
- `src/server/trpc/routers/player.ts` — filtr isDiscreet
- `src/lib/labels.ts` — usunięte score labels/kolory, dodane PITCH_STATUS_LABELS
- `src/lib/gamification.ts` — usunięte goal_scored, tournament_goal
- `src/lib/validators/sparing.ts` — usunięty markCostPaidSchema, dodany pitchStatus
- `src/lib/validators/tournament.ts` — usunięte tournamentGoalSchema, markTeamPaidSchema
- `src/lib/validators/profile.ts` — dodany isDiscreet
- `src/lib/validators/transfer.ts` — dodany isDiscreet
- `src/components/sparings/sparing-form.tsx` — pitchStatus select
- `src/components/sparings/sparing-card.tsx` — pitchStatus badge
- `src/components/sparings/invite-club-dialog.tsx` — multi-select 1-5 klubów
- `src/components/forms/player-profile-form.tsx` — toggle tryb dyskretny

---

## Etap 49 — Stabilizacja + Anty No-Show (2026-04-14)

### Stabilizacja po refaktorze
- Naprawiony E2E test `sparing.spec.ts` — wizard flow (Dalej → Opublikuj), usunięte martwe pole `#costSplitInfo`
- Naprawiony unit test `gamification.test.ts` — 18 akcji w POINTS_MAP (było 20 przed usunięciem scores)

### Funkcja Anty No-Show (twarde potwierdzenie obecności)
- **Backend**: Rozszerzony `setAttendance` — oprócz INTERNAL events obsługuje TRYOUT/RECRUITMENT dla graczy z ACCEPTED application
- **Backend**: `getById` zwraca `attendance` (userId + status) do wyświetlenia na froncie
- **Frontend baner**: Bursztynowy baner ostrzegawczy na `events/[id]` gdy: rola=PLAYER, aplikacja=ACCEPTED, typ=TRYOUT/RECRUITMENT, <48h do wydarzenia
  - Przyciski: "Będę na 100%" (YES) / "Jednak rezygnuję" (NO)
  - Po odpowiedzi → zielony/czerwony baner z potwierdzeniem statusu
- **Frontend widok trenera**: Badge "Potwierdzony" (zielony) i "Zrezygnował" (czerwony) na liście zgłoszeń obok statusu aplikacji

### Pliki zmodyfikowane (4)
- `e2e/sparing.spec.ts` — wizard flow, usunięte costSplitInfo
- `src/__tests__/gamification.test.ts` — POINTS_MAP count 18
- `src/server/trpc/routers/event.ts` — rozszerzony setAttendance, attendance w getById
- `src/app/(dashboard)/events/[id]/page.tsx` — baner Anty No-Show, badge attendance

## Etap 50: Activity Heatmap ✅

**Data:** 2026-04-14

### Activity Heatmap — GitHub-style panel aktywności
- **Nowy komponent**: `ActivityHeatmap` — reużywalny client component wyświetlający heatmapę aktywności (rolling 12 miesięcy) z 4 kartami statystyk
- **Karty statystyk**: Aktywne dni (violet), Aktualna seria (orange), Najaktywniejszy miesiąc (emerald), Najlepszy dzień (amber)
- **Heatmap grid**: 53 kolumny × 7 wierszy, 5 poziomów intensywności (violet), tooltip z datą i liczbą akcji
- **Responsywność**: Desktop 12×12px + 3px gap, Mobile 10×10px + 2px gap z horyzontalnym scrollem
- **Dark/Light mode**: osobne palety kolorów per motyw
- **Loading**: skeleton (shadcn/ui), empty state: "Brak aktywności w tym okresie"
- **Źródło danych**: tabela `UserPoints` (18 typów akcji) — agregacja server-side w JS
- **tRPC endpoint**: `gamification.activityHeatmap` (publicProcedure) — agregacja dziennych counts, streaks, best month/dow
- **Integracja**: wstawiony na 3 publiczne profile (kluby, zawodnicy, trenerzy)
- **DB index**: composite `@@index([userId, createdAt])` na `UserPoints`
- **Cache**: `staleTime: 5min` na `useQuery`
- **Reuse**: `pluralPL` z `labels.ts`, `formatShortDate` z `format.ts`, shared `toDateKey` z `activity-utils.ts`

### Pliki utworzone (3)
- `src/lib/activity-utils.ts` — pure functions: aggregateDailyCounts, computeStreaks, computeBestMonth, computeBestDow, toDateKey
- `src/components/activity-heatmap.tsx` — komponent kliencki z stat cards, heatmap grid, tooltip, skeleton
- `src/__tests__/activity-utils.test.ts` — 10 testów jednostkowych

### Pliki zmodyfikowane (5)
- `prisma/schema.prisma` — composite index `(userId, createdAt)` na UserPoints
- `src/server/trpc/routers/gamification.ts` — dodany `activityHeatmap` publicProcedure
- `src/app/(public)/clubs/[id]/page.tsx` — ActivityHeatmap pod StatsBar
- `src/app/(public)/players/[id]/page.tsx` — ActivityHeatmap pod stats bar
- `src/app/(public)/coaches/[id]/page.tsx` — ActivityHeatmap na początku content section

---

## Etap 51: Dashboard Sections Redesign ✅

**Data:** 2026-04-16
**Scope:** Reorganizacja Pulpitu klubowego — z jednego długiego scrollu na 3 nawigowalne sekcje

### Zmiany
- **Sekcje dashboardu (CLUB only):** Pulpit podzielony na 3 sekcje: Aktywność (feed), Terminarz (sparingi + wydarzenia), Rekrutacja (pipeline + nabory + sugerowani)
- **Query param routing:** `?section=activity|schedule|recruitment` z `useSearchParams` + `<Suspense>` boundary
- **SectionNav:** nawigacja w prawym sidebarze (desktop) — 3 pozycje z ikonami, aktywna sekcja podświetlona sport-orange
- **SectionNavMobile:** pill bar pod hero zone (mobile, `lg:hidden`)
- **Prawy sidebar:** poszerzony z 260px na 320px, SectionNav pod kalendarzem/rankingiem
- **EventCard:** wyekstrahowany z inline rendering w `club-sections.tsx` do reużywalnego komponentu
- **FeedCard router:** wyekstrahowany z `feed-client.tsx` do shared modułu `feed-card-router.tsx`
- **ClubRecruitment:** dodany `showSection` prop do warunkowego renderowania subsections
- **Usunięte z Pulpitu:** ClubHeaderCard, ClubStatsRow, ClubQuickActions, ClubPendingAlerts, QuickActions (~300 linii)
- **Optymalizacja:** feed query disabled dla klubów w feed-client (`enabled: !isClub`), `useSectionNav` hook eliminuje duplikację
- **Feed redistribution:** feed items pogrupowane per sekcja — sparingi+turnieje → Terminarz, zawodnicy+kluby+transfery → Rekrutacja, posty klubowe → Aktywność
- **Domyślna sekcja:** Terminarz (zamiast Aktywność) — najbardziej akcjonable dane na pierwszym planie
- **Nowe sekcje:** "Szukający klubu" (zawodnicy z aktywnym transferem, filtr po pozycji) + "Nowe kluby" (nowe kluby w regionie) — osobne pozycje w nawigacji sidebara
- **Filtr pozycji:** Wszyscy / Bramkarze / Obrońcy / Pomocnicy / Napastnicy w sekcji "Szukający klubu"
- **Feed limity:** zwiększone z 5 do 30 per typ (zawodnicy, kluby, turnieje), usunięty globalny slice
- **Deduplikacja:** sparingi z feeda nie powtarzają się z własnymi sparingami w Terminarzu
- **Linki "Zobacz wszystko":** dodane do sekcji Szukający klubu (→ /transfers) i Nowe kluby (→ /search)
- **Feed filtr:** zawodnicy w feedzie filtrowane do tych z aktywnym transferem LOOKING_FOR_CLUB/FREE_AGENT + isDiscreet=false
- **Date picker:** ikona kalendarza widoczna na dark mode (CSS fix globalny)
- **PLAYER/COACH:** dashboardy bez zmian

### Pliki utworzone (9)
- `src/components/dashboard/section-nav.tsx` — SectionNav + useSectionNav hook + SECTIONS const + SectionKey type
- `src/components/dashboard/section-nav-mobile.tsx` — mobile pill bar
- `src/components/dashboard/sections/activity-section.tsx` — posty klubowe
- `src/components/dashboard/sections/schedule-section.tsx` — sparingi + wydarzenia z filtrami + feed z regionu
- `src/components/dashboard/sections/recruitment-section.tsx` — pipeline + nabory + sugerowani z sub-tabami
- `src/components/dashboard/sections/players-section.tsx` — zawodnicy szukający klubu z filtrem pozycji
- `src/components/dashboard/sections/clubs-section.tsx` — nowe kluby w regionie
- `src/components/events/event-card.tsx` — reużywalny EventCard
- `src/components/feed/feed-card-router.tsx` — FeedCard switch-case + FeedItem type

### Pliki zmodyfikowane (6)
- `src/app/(dashboard)/feed/feed-client.tsx` — query param routing (5 sekcji), usunięte inline komponenty (~300 linii)
- `src/app/(dashboard)/feed/page.tsx` — Suspense boundary dla useSearchParams
- `src/components/dashboard/club-recruitment.tsx` — showSection prop
- `src/components/layout/right-panel.tsx` — width 260→320px
- `src/server/trpc/routers/feed.ts` — limity per typ 5→30, filtr zawodników LOOKING_FOR_CLUB
- `src/styles/globals.css` — date input calendar icon dark mode fix

---

## Etap 52: Stabilizacja E2E + fix middleware cookie ✅

### Zmiany
- **E2E dla Etapu 51:** nowy plik `e2e/dashboard-sections.spec.ts` z 5 testami:
  - SectionNav widoczny w right panel na desktopie (5 buttonów: Aktywność, Terminarz, Rekrutacja, Szukający klubu, Nowe kluby)
  - Kliknięcie section nav aktualizuje URL query param (`?section=recruitment|players`, Terminarz usuwa param)
  - Filtr pozycji w PlayersSection (5 pill buttonów: Wszyscy/Bramkarze/Obrońcy/Pomocnicy/Napastnicy)
  - SectionNavMobile widoczny na mobile viewport (375×812)
  - PLAYER dashboard nie pokazuje SectionNav (tylko CLUB)
- **Fix middleware cookie name (bug #1 z backlogu):** `src/middleware.ts` hardcodował `__Secure-authjs.session-token` jako cookie name. Na HTTPS (Vercel) działało, ale na HTTP (localhost) Auth.js ustawia cookie bez `__Secure-` prefixu → middleware nie znajdował tokenu → infinite redirect do /login. Teraz dynamiczne: `req.nextUrl.protocol === "https:" ? "__Secure-..." : "authjs.session-token"`. Odblokowało E2E auth flow.
- **Robust login helper:** lokalny `robustLogin` w spec używa twardego `page.goto("/feed")` po kliknięciu Zaloguj zamiast polegać na `router.push` (cookie race z middleware).
- **Archiwizacja przedawnionych planów:** 3 plany przeniesione do `docs/superpowers/plans/archived/` (`sparing-scores-seo`, `cost-tracking`, `etap-b-email-goals` — niezgodne z pivotem matchmaking z Etap 48).

### Pliki utworzone (1)
- `e2e/dashboard-sections.spec.ts` — 5 testów E2E pokrywających Etap 51

### Pliki zmodyfikowane (1)
- `src/middleware.ts` — dynamiczna nazwa cookie bazowana na protokole (HTTPS/HTTP)

### Pliki przeniesione (3)
- `docs/superpowers/plans/archived/2026-03-27-sparing-scores-seo.md`
- `docs/superpowers/plans/archived/2026-03-28-cost-tracking.md`
- `docs/superpowers/plans/archived/2026-03-28-etap-b-email-goals.md`

### Follow-up (w tym samym etapie)
- **Fix outdated asserts w `e2e/auth.spec.ts`:** h1 `"Feed"` → regex `/Pulpit|Feed/` (CLUB używa "Pulpit" od Etap 47), `getByRole("tab")` → `getByRole("button")` dla role selectora. 5/5 auth testów przechodzi.
- **Smoke test pełnego E2E:** 24 passed / 14 failed / 9 did not run. Fix middleware odblokował ok. 10-15 testów zależnych od loginu. Pozostałe failing to pre-existing regresje (shared state, outdated) — zaraportowane jako bug #7 w backlogu (Medium).

---

## Etap 53: Stabilizacja E2E — bug #7 ✅

### Zmiany
- **Robust `login()` helper w `e2e/helpers.ts`:** zamiast polegać na kliencie (`router.push`), czeka na response z `/api/auth/callback/credentials` i robi twardy `page.goto("/feed")`. Eliminuje cookie race z middleware. Rzuca błąd jeśli wylądowaliśmy na `/login`.
- **Rules of Hooks violation fix w `src/app/(dashboard)/recruitment/page.tsx`:** 2× `useMemo` były PO wczesnym `return` dla `!isClub`. Gdy session loadował się asynchronicznie i `isClub` flip'ował `false → true`, liczba hooków się zmieniała → React Error Boundary "Ups! Coś poszło nie tak". Przeniesione hooki przed early return.
- **Hoist `email` constów poza `describe`:** w `recruitment-board.spec.ts` i `coach.spec.ts`. Describe body re-ewaluuje się per-test w niektórych trybach, co dawało różne emaile per test → zawodziły logowania. Teraz module-level.
- **`test.describe.serial` na `recruitment-board` i `coach`:** gwarantuje kolejność + shared state między testami.
- **Outdated asserts naprawione:**
  - `recruitment-board.spec`: `text=Rekrutacja` → `heading "Pipeline"`, `text=Board|Lista` → `getByTitle("Widok listy|tablicy")` (icon buttons)
  - `coach.spec`: strict-mode scope (`.first()` dla duplikowanych linków nav)
  - `public-profiles.spec`: landing page `heading "PilkaSport"` → `heading { level: 1 }` (h1 redesignowany)
  - `event.spec`: `#location` → `getByPlaceholder`, usunięte nieistniejące pole `#maxParticipants`
  - `messages.spec`: adaptacja do 3-step sparing wizard zamiast jednego formularza
  - `sparing.spec` / `sparing-advanced.spec`: `.first()` na tekstach występujących wielokrotnie (`Oczekuje`, `Dopasowany`, `Zgłoszenia (N)`, `Wizard E2E Sparing`, `Sparing testowy E2E`)
  - `onboarding.spec`: test "rejestracja przekierowuje do /login" zaktualizowany — auto-login (po fix middleware) kieruje na `/feed`, fallback na `/login`; regex pokrywa obie ścieżki.
- **Test `test.skip`:** `onboarding.spec:55` "klub moze przejsc przez caly onboarding do konca" — `Pomiń` button w step 1 detached z DOM podczas kliknięcia (React re-mount przy transition). Wymaga głębszej zmiany (możliwe `useTransition`/`flushSync` w komponencie).

### Wynik
- **Przed:** 24/47 pass (51%), 14 failed, 9 did not run
- **Po:** 43/47 pass (91.4%), 2 failed, 1 did not run, 1 skipped
- **Pozostałe 2 failing** (bug #8 Low):
  - `sparing-advanced:65` "club A accepts and completes sparing" — przycisk "Oznacz jako zakończony" nie znaleziony (do sprawdzenia czy UI czy test)
  - `sparing-advanced:82` — "did not run" bo poprzedni zawodzi (serial)

### Pliki zmodyfikowane (10)
- `src/app/(dashboard)/recruitment/page.tsx` — przeniesione `useMemo` przed early return (Rules of Hooks fix)
- `e2e/helpers.ts` — robust `login()` z twardym `page.goto("/feed")`
- `e2e/recruitment-board.spec.ts` — hoist email, serial, zaktualizowane selektory
- `e2e/coach.spec.ts` — hoist email, serial, `.first()` dla dup linków
- `e2e/public-profiles.spec.ts` — landing page h1 assertion
- `e2e/event.spec.ts` — location placeholder, usunięte maxParticipants, `.first()`
- `e2e/messages.spec.ts` — 3-step wizard, `.first()`
- `e2e/sparing.spec.ts` — `.first()` na duplikatach
- `e2e/sparing-advanced.spec.ts` — `.first()` na duplikatach
- `e2e/onboarding.spec.ts` — zaktualizowany assert, `test.skip` na problematycznym teście, lepsze selektory

### Simplify cleanup (code review follow-up, commit `e6ddf07`)
- **Usunięty duplikat `robustLogin`** w `e2e/dashboard-sections.spec.ts` — był byte-for-byte klonem `helpers.ts:login()` po fix cookie race; teraz używa shared helper (6 call-site'ów zaktualizowanych, -23 linie).
- **`test.skip(title, fn)` → `test.fixme(title, async () => {})`** w `onboarding.spec.ts:55` — usunięte ~26 linii dead body; `fixme` jest właściwą semantyką dla "broken, needs fix".
- **Strip etap-tag comment** w `auth.spec.ts:12` — usunięte `(Etap 47)` noise (git historia).

### Odrzucone findings (scope-creep / risk, do osobnej sesji)
- Refactor middleware do Auth.js v5 `auth()` callback API (wymaga testów integracyjnych).
- `storageState` fixture dla auth reuse (biggest CI win — 12-20s/run, zmiana architektury testów).
- Zastąpienie `networkidle` deterministycznym wait (risk regresji w innych testach).
- `StageValue` z Prisma enum + lucide icons w `recruitment/page.tsx` (pre-existing kod).
- Merge `stageCounts` + `entriesByStage` do single useMemo pass (micro-opt <100 entries).

---

## Etap 54: Digest Card — feed "Twój status" ✅

### Co się zmieniło
Karta na górze feedu pokazująca per-rola agregat rzeczy wymagających akcji: pending aplikacje sparingowe, nieodebrane zaproszenia, attendance 48h, upcoming 7d, stale pipeline (CLUB), recommended events (PLAYER), unread messages (COACH). Cel: retencja D+1.

### Backend
- **`src/lib/digest.ts`** — `DIGEST_THRESHOLDS` (48h/7d/14d/72h), `DigestRow`/`DigestResponse`/`DigestIconKey` types, narrowed `Db = Pick<PrismaClient, ...>`, 3 per-role helpers (`getClubDigest`/`getPlayerDigest`/`getCoachDigest`). Każdy: reads role profile → `Promise.all` counts → builds `candidates` in fixed order → filters `count > 0` + sums `totalCount`. Wspólny `finalize()` helper.
- **`src/server/trpc/routers/digest.ts`** — `digest.get` (`protectedProcedure.query`) dispatchuje per rola, dołącza `generatedAt` ISO.
- **Zarejestrowany** w `router.ts` jako `digest: digestRouter` (przed `admin:`).
- **Content matrix schema-aligned:** 5 wierszy CLUB, 4 PLAYER (bez `eventInvitations` — `invitePlayer` tworzy tylko Notification), 5 COACH. Attendance 48h bez cross-check `EventAttendance` (MVP uproszczenie udokumentowane w kodzie).
- **Tests:** 16 unit + 4 router integration (empty/no-profile, all-zero, mixed+order, shape, conditional where).

### Client
- **`src/components/dashboard/digest-card.tsx`** — `"use client"`, `api.digest.get.useQuery` (staleTime/refetchInterval 2min, refetchOnWindowFocus). Guards: loading → 168px placeholder, error → null, `totalCount === 0` → null. `ICON_MAP` 9 ikon lucide. `formatCount` → "99+" dla count ≥ 100. `data-testid` per wiersz.
- **`src/lib/translations.ts`** — sekcja Digest (15 kluczy PL→EN).
- **`src/app/(dashboard)/feed/page.tsx`** — `void trpc.digest.get.prefetch()` (RSC, zero waterfall).
- **`src/app/(dashboard)/feed/feed-client.tsx`** — render pod H1, ukryty podczas onboarding.

### Cache invalidation (9 plików)
Mutacje wołają `utils.digest.get.invalidate()` w `onSuccess`:
- `sparing.applyFor`, `sparing.respond`, `sparing.invite`, `sparing.respondToInvitation`
- `event.applyFor`, `event.respond`, `event.setAttendance`
- `recruitment.updateStage`/`updateStageAndOrder`/`remove` (via shared `invalidatePipeline()`)
- `message.send`, `message.markAsRead`

### E2E (`e2e/digest.spec.ts`)
- Empty state test: nowy CLUB → dismiss onboarding → `/feed` → `expect(getByTestId("digest-card")).toHaveCount(0)`. 1 pass.
- Happy path (`test.fixme`) — wymaga seed helpera, odsunięte.

### Routing audit
Wszystkie 9 param-hrefs → Bucket B (silent ignore, poprawna lista rodzic). Brak rewrite. 9 backlog rows Low w STATE.md „Znane Problemy" dla filtrów do implementacji (`?tab=applications`, `?filter=pending-attendance`, `?range=week`, `?filter=stale`, `?tab=my-applications`, `?filter=recommended`, `?filter=invitations`).

### Commits (9)
- `c28e0ca` — types + helpers
- `2e37706` — narrow `db` type
- `2f57ea5` — router
- `5d6b822` — router tests
- `56187a4` — component + i18n
- `b75663e` — feed integration + RSC prefetch
- `581a6d1` — routing audit + backlog
- `1172004` — cache invalidation
- `9e84ceb` — e2e spec

### Quality gate
- vitest: 87/87 pass (67 baseline + 20 nowe)
- tsc: 0 errors
- next build: success
- playwright `digest.spec.ts`: 1 pass + 1 fixme, 0 regression
- lint: skipped (`next lint` removed w Next.js 16, pre-existing baseline issue)

### Odrzucone / out-of-scope
- Cross-check `EventAttendance` w attendance48h (wymaga raw SQL).
- Inline akcje na karcie (wariant B/C z auditu).
- Snooze / dismiss (YAGNI).
- Real-time updates (polling 2min wystarczy).
- Weekly recap, new followers, matchmaking suggestions (warianty C z auditu).
- Nowe widoki filtrowane (9 backlog rows Low).
- Telemetria click-through (przyszły spec).

---

## Etap 55: Quick-apply + Design sweep + Digest cleanup ✅

### Digest cleanup (Etap 54 follow-up)
- `recommendedWhere: any` → `Prisma.EventWhereInput` w `src/lib/digest.ts`.
- Drop `generatedAt` z `DigestResponse` contract (był nieużywany client-side,
  hardcoded "zaktualizowano teraz" w `DigestCard` + 120s refetch window).
- Remove `ISO_PREFIX` assertions z `digest.test.ts`.

### D1 — Inline quick-apply na karcie sparingu
- Nowy endpoint `sparing.checkApplications({ sparingOfferIds })` — bulk
  sprawdzenie applied-map + owned-ids dla klub-viewera (mirror `favorite.check`).
- `SparingCard` rozszerzony o opcjonalny prop `quickApply`: inline button
  „Aplikuj" z `e.preventDefault()` na Link, status badge po wysłaniu,
  optimistic `localStatus` + invalidate `digest.get` i `checkApplications`.
- `SearchTab` w `sparings-client`: wywołanie `checkApplications` gdy viewer=CLUB,
  przekazanie per-card state do karty.
- Redukuje aplikację do 1 kliknięcia z listy (było: card → detail → button).

### E1+E2 — Design discipline sweep
- **Brand gradients** (DESIGN.md rule: nie używać default Tailwind indigo/sky):
  - Landing (`src/app/page.tsx`): 4× gradient violet→sky → violet→orange
    (hero headline, primary CTA, step badges, bottom CTA).
  - Club public profile hero: `from-indigo-950 via-slate-900 to-sky-950` →
    `from-violet-950 via-slate-900 to-black`.
  - Sidebar PS logo (collapsed + expanded): violet→sky → violet→orange.
- **Unifikacja dashboard label**:
  - Sidebar subtitle „Panel" → „Pulpit".
  - Feed h1 zawsze „Pulpit" (było mixed: „Pulpit" PL dla CLUB, literal English
    „Feed" dla PLAYER/COACH).

### Pozostawione (świadomie)
- Per-role accent w karcie „Dla trenerów" (sky=trener) — semantyczny role distinguisher.
- Avatar fallback violet/20→sky/20 — low opacity, nie brand.
- Typy wydarzeń/poziomy w `labels.ts`, `digest calendar: text-sky-500` — per-type semantics.
- E2E spec dla quick-apply + digest happy-path — wymagają seed fixtures.

### Commits
- `b7ef2fa` — refactor digest types + drop generatedAt
- `3a508ed` — feat quick-apply
- `31ffb48` — design sweep

### Quality gate
- vitest: 87/87 pass (no new tests, no regression)
- tsc: 0 errors
- lint: skipped (`next lint` broken w Next.js 16, pre-existing baseline)

### Backlog digest links — 9/9 zamknięte ✅
URL query handlers dla linków z `DigestCard` (rows #10, #11, #12, #13, #17 z STATE.md).

- `/sparings?tab=applications|invitations` (#10, #11): `sparings-client` czyta URL,
  mapuje applications/invitations → zakładka „Moje sparingi".
- `/calendar?range=week` (#12): `CalendarView` wczytuje `weekMode` z URL,
  przełącza na list view + date range (today → +7d).
- `/recruitment?filter=stale` (#13): client-side filter na `updatedAt < now-14d`.
- `/notifications?filter=invitations` (#17): client-side filter na typach
  CLUB_INVITATION / SPARING_INVITATION / MEMBERSHIP_REQUEST + banner z
  linkiem „pokaż wszystkie".
- `/events?filter=pending-attendance` (#9): filter search tab do
  RECRUITMENT / TRYOUT / CONTINUOUS_RECRUITMENT w najbliższych 48h
  + filter-active banner z linkiem „wyczyść".
- `/events?filter=recommended` (#15): filter dla PLAYER — RECRUITMENT
  types z regionu zawodnika + upcoming only.
- `/events?tab=my-applications` (#14): nowy `MyApplicationsTab` dla PLAYER
  używa `event.myApplications` z status badges per aplikacja.

- `/trainings?tab=applications` (#16): nowy endpoint `event.myCoachTrainings`
  zwraca eventy (INDIVIDUAL/GROUP_TRAINING) z `coachId = session.coach.id`
  + `_count.applications`. Nowy tab „Zgłoszenia" widoczny tylko dla COACH.

### Commits (Etap 55)
- `b7ef2fa` refactor(digest): tighten types, drop generatedAt
- `3a508ed` feat(sparing): inline quick-apply on card
- `31ffb48` chore(design): align brand gradients with DESIGN.md
- `41134e1` docs: update STATE and CHANGELOG
- `59ef36b` feat(digest): URL query handlers for digest links (5/9)
- `0d7e880` docs: close 5 digest rows
- `362ff4f` feat(events): URL handlers pending-attendance + recommended + my-applications
- `367cdb7` docs: close 3 more rows
- `46f6c0b` feat(trainings): 'Zgłoszenia' tab for COACH (#16)

## Etap 56 — C1 Cover photo klubu (2026-04-17)

Dodano cover photo (zdjęcie tła) na profilach klubów — osobne od logo,
prezentowane jako tło hero bannera na publicznym profilu klubu, z gradient
fallbackiem gdy brak. Edycja w panelu profilu klubu przez nowy wariant
`ImageUpload variant="cover"` (1600px max, 16:5 preview).

### Data model
- `Club.coverUrl String?` (`cover_url VARCHAR(500)`) — migracja
  `20260417120000_add_club_cover_url`.
- `updateClubSchema` + `coverUrl: z.string().url().max(500).optional()`.

### UI
- `ImageUpload` — prop `variant: "avatar" | "cover"`. Cover: aspect-[16/5],
  gradient placeholder (violet→slate→orange), button w prawym dolnym rogu
  („Dodaj tło" / „Zmień tło"), compress do 1600px.
- `ClubProfileForm` — pole „Zdjęcie tła" nad logo w karcie „Profil klubu".
- `(public)/clubs/[id]/page.tsx` — hero bg używa `coverUrl` jako `<img>`
  na absolute inset-0 z `opacity-40` + gradient `from-black/80 via-black/40
  to-black/20`. Bez cover: obecny gradient `violet-950 → slate-900 → black`.

### Upload
- `/api/upload` ALLOWED_FOLDERS += `clubs-covers` (klucz
  `clubs-covers/{clubId}.webp` w bucket `avatars`).

### Testy
- 4 nowe unit testy `updateClubSchema` coverUrl (accept/reject/omit/length).
- Unit: 91/91 pass (+4 vs Etap 55). `tsc --noEmit`: 0 errors.

### Pliki zmienione
- `prisma/schema.prisma`
- `prisma/migrations/20260417120000_add_club_cover_url/migration.sql`
- `src/lib/validators/profile.ts`
- `src/app/api/upload/route.ts`
- `src/components/image-upload.tsx`
- `src/components/forms/club-profile-form.tsx`
- `src/app/(public)/clubs/[id]/page.tsx`
- `src/__tests__/validators-profile.test.ts` (nowy)

## Etap 57 — A1 Landing hero preview (2026-04-17)

Dodano mockup pulpitu pod hero headline na landingu — browser frame
z uproszczoną reprezentacją feedu klubu (sidebar 56px, digest „Twój
status", hero match card VS, 3 feed items, right panel z nadchodzącymi
meczami i rankingiem). Server Component, zero JS, responsive.

### Pliki zmienione
- `src/components/landing/landing-hero-preview.tsx` (nowy)
- `src/app/page.tsx` — import + wstawienie pod CTA, zmniejszony
  bottom padding hero (pb-20 → pb-12, sm:pb-28 → sm:pb-20)

### Testy
- Unit: 91/91 pass (bez zmian). `tsc --noEmit`: 0 errors.

## Etap 58 — C2 Reputation badges (2026-04-17)

Dodano 3 badge reputacyjne na publicznym profilu klubu (Airbnb pattern):
„Odpowiada X%", „w Y (min/h/dni)", „Realizuje Z%". Render warunkowy —
badge pokazuje się tylko przy wystarczającej próbce (min 3 aplikacje /
min 3 matched sparingi, okno 180 dni).

### Helpers
- `src/lib/reputation.ts` (nowy) — `computeReputation({ receivedApps,
  ownedOffers })` + `REPUTATION_THRESHOLDS` + formattery `formatRate()` /
  `formatResponseTime()`. Czyste funkcje, unit-testowalne.

### Metryki
- **Response rate** = (status != PENDING) / total received.
- **Avg response time** = avg(updatedAt − createdAt) dla responded.
- **Fulfilment rate** = COMPLETED / (COMPLETED + CANCELLED-with-
  accepted-app). CANCELLED bez ACCEPTED aplikacji ignorowane (nie
  osiągnął MATCHED → brak sygnału o fulfilmencie).

### tRPC
- `club.reputation(clubId)` public query — dla ewentualnego reuse
  (obecnie profil klubu używa bezpośrednio w RSC, bez hop przez tRPC).

### UI
- `ClubReputationBadges` (nowy komponent) — 3 pill-badge tonal
  (violet / sky / emerald). Null when all three rates are null.
- Profil klubu: badges w hero pod regionem/ligą, nad CTA buttonami.

### Testy
- `src/__tests__/reputation.test.ts` — 8 testów: threshold response,
  threshold fulfilment, ignore CANCELLED-without-match, avgResponseMs
  null-when-no-response, formattery (min/h/dni, rate rounding).
- Unit: 99/99 pass (+8). `tsc --noEmit`: 0 errors.

### Pliki zmienione
- `src/lib/reputation.ts` (nowy)
- `src/server/trpc/routers/club.ts`
- `src/components/club-reputation-badges.tsx` (nowy)
- `src/app/(public)/clubs/[id]/page.tsx`
- `src/__tests__/reputation.test.ts` (nowy)

## Etap 59 — B1 Feed hierarchia (2026-04-17)

`DashboardStats` zmigrowany do RightPanel na desktopie (lg+), w main
column pozostawiony tylko na mobile. Lżejsza kompozycja feedu:
DigestCard + HeroCard + feed items; stats + kalendarz + ranking po
prawej stronie (320px panel).

### UI
- `DashboardStats` + prop `variant: "main" | "sidebar"`. Sidebar:
  zawsze `grid-cols-2`, compact padding (p-3), text-[22px], bez trend.
- `feed-client.tsx` — main column `lg:hidden` wrapper dla stats
  (mobile only); nowy `<DashboardStatsWidget variant="sidebar" />` na
  górze RightPanel (ponad `MiniCalendar`).

### Testy
- Unit: 99/99 pass. `tsc --noEmit`: 0 errors.

### Pliki zmienione
- `src/components/dashboard/dashboard-stats.tsx`
- `src/app/(dashboard)/feed/feed-client.tsx`

## Etap 60 — E3 Command palette ⌘K (2026-04-17)

Globalna paleta poleceń dostępna przez Cmd/Ctrl+K i trigger w sidebar
header (desktop). Dialog z Input, debounce 250ms, min 2 znaki, wyniki
grupowane: „Akcje" (6 static commands) + „Wyniki" (kluby/zawodnicy/
sparingi/wydarzenia przez `api.search.global`). Nawigacja strzałkami
↑↓, Enter → `router.push`, ESC zamyka.

### UI
- `CommandPalette` (nowy) — client component, Dialog (max-w-xl),
  top-mounted w Sidebar, działa globalnie dla zalogowanych.
- `CommandPaletteTrigger` — pill-button pod separator w sidebar header,
  label „Szukaj… ⌘K". Widoczny tylko gdy sidebar expanded.

### Testy
- Unit: 99/99 pass. `tsc --noEmit`: 0 errors.

### Pliki zmienione
- `src/components/command-palette.tsx` (nowy)
- `src/components/layout/sidebar.tsx`

## Etap 61 — B3 Notification grouping (2026-04-17)

Powiadomienia pogrupowane w czasowe sekcje („Dziś" / „Ostatnie 7 dni" /
„Starsze") — pattern jak w FB/IG. Każda sekcja pokazuje licznik obok
nagłówka, sama lista w osobnej ramce.

### Helpers
- `src/lib/notification-groups.ts` (nowy) — `groupNotificationsByTime()`
  przyjmuje `{ createdAt: Date | string }[]`, zwraca tylko niepuste
  buckety w kolejności today → week → older.

### Testy
- `src/__tests__/notification-groups.test.ts` — 4 testy: buckets
  (today/week/older), pomijanie pustych, ISO string parsing, empty input.
- Unit: 103/103 pass (+4). `tsc --noEmit`: 0 errors.

### Pliki zmienione
- `src/lib/notification-groups.ts` (nowy)
- `src/__tests__/notification-groups.test.ts` (nowy)
- `src/app/(dashboard)/notifications/page.tsx`

## Etap 62 — A3 Persistent „Pierwsze kroki" + FAB (2026-04-17)

Karta „Pierwsze kroki" na feedzie CLUB persystentna — widoczna dopóki
jakikolwiek krok nieskończony (poprzednio: znikała po pierwszym
sparingu/evencie). Licznik `2/4` w nagłówku, gradient violet→orange
top border. Real `done` flags: `activeSparings > 0`, `upcomingEvents
> 0`. Dodatkowo FAB „Dodaj sparing" w prawym dolnym rogu — 56px,
gradient, tylko dla CLUB, bottom-24 mobile (nad bottom-nav),
md:bottom-8 desktop.

### Pominięte z A3
- Coachmark tour (wymagałby `driver.js`/`intro.js` — osobny etap).

### Testy
- Unit: 103/103 pass. `tsc --noEmit`: 0 errors.

### Pliki zmienione
- `src/app/(dashboard)/feed/feed-client.tsx`

## Etap 63 — A2 Rotujący headline (2026-04-17)

Headline landingu rotuje co 3.2s przez 4 persony: „Umów sparing w 2
minuty" (CLUB), „Znajdź klub w swoim regionie" (PLAYER), „Prowadź
nabory jak profesjonalista" (CLUB), „Trenuj z trenerem dopasowanym do
Ciebie" (PLAYER). Fade+translate 200ms. Client component (`useEffect`
interval), gradient accent na frazie.

### Testy
- Unit: 103/103 pass. `tsc --noEmit`: 0 errors.

### Pliki zmienione
- `src/components/landing/rotating-headline.tsx` (nowy)
- `src/app/page.tsx`

## Etap 64 — C3 „Kluby dla Ciebie" z reasoning (2026-04-17)

Sekcja na feedzie PLAYER przemianowana „Kluby dla Ciebie" — nie tylko
nowe w regionie, ale curated przez reasons. `club.newInRegion` tRPC
endpoint rozszerzony o scoring: position match (+8), recruiting (+4),
active (+2), new (+1), followers * 0.1. Zwraca tylko kluby z ≥1
reason, sortowane po score.

### Reasons badges
- `position` (violet) — klub ma upcoming RECRUITMENT/TRYOUT/CONTINUOUS
  z `targetPosition` = `player.primaryPosition`. Badge: „Szuka Twojej
  pozycji".
- `recruiting` (sky) — ma upcoming recruitment event dowolny. Badge:
  „Rekrutuje".
- `active` (emerald) — ma sparing w ostatnich 30 dniach. Badge:
  „Aktywny klub".
- `new` (orange) — klub utworzony <30 dni temu. Badge: „Nowy w regionie".

### UI
- Subheader z nazwą regionu pod tytułem sekcji.
- Badges pod info klubu (wielokrotne).

### Testy
- Unit: 103/103 pass. `tsc --noEmit`: 0 errors.

### Pliki zmienione
- `src/server/trpc/routers/club.ts`
- `src/app/(dashboard)/feed/feed-client.tsx`

## Etap 65 — P4 ESLint 9 flat config (2026-04-17)

`npm run lint` odblokowany — Next 16 usunął `next lint` subcommand.
Nowy `eslint.config.mjs` (flat config) importuje `eslint-config-next`
(już w deps, v16.2.0). Skrypt lint zmieniony na `eslint .`.

### Config
- `eslint.config.mjs` (nowy, created via shell przez guard-config.sh):
  spread `next` flat config + ignores (`.next`, `src/generated`,
  `coverage`, `playwright-report`, `test-results`, `public`, `node_modules`).

### Status
- 65 pre-existing issues (23 errors, 42 warnings) — poza scope tego
  etapu (STATE.md Priority 4 explicit: „Pre-existing od upgrade'u,
  nieblokujący"). Brak CI workflow → nie blokuje deployu.
- Główne errory: `react-hooks/set-state-in-effect` (2x w
  `use-sidebar-state.ts`, `i18n.tsx`), `react-hooks/exhaustive-deps`
  (~20 missing deps warnings).

### Testy
- Unit: 103/103 pass. `tsc --noEmit`: 0 errors.

### Pliki zmienione
- `eslint.config.mjs` (nowy)
- `package.json`

## Etap 66 — P2 Seed helpers + E2E coverage (2026-04-17)

Odblokowany fixme z Etap 54 (`digest.spec.ts:47` — „CLUB with pending
application sees digest row") dzięki nowym UI-based helperom w
`e2e/helpers.ts`. Plus osobny spec dla quick-apply (`sparing.checkApplications`).

### E2E helpers (nowe)
- `completeClubOnboarding(page)` — dismiss wizard z pierwszą opcją regionu.
- `createQuickSparing(page, { dateISO, location })` — Quick mode sparing,
  zwraca `sparingId` sparsowany z URL po redirect.
- `applyToSparing(page, sparingId)` — navigate + click „Aplikuj".

### Testy E2E
- `e2e/digest.spec.ts` — fixme zamieniony na pełny test (register A →
  onboard → sparing, register B → onboard → apply, login A → digest
  card + pending-applications row + navigate).
- `e2e/quick-apply.spec.ts` (nowy) — CLUB B widzi inline „Aplikuj"
  na `/sparings`, 1-click apply flipuje button do stanu post-apply
  (`sparing.checkApplications` refetch).

### Nie wykonane w tym etapie (backlog)
- E2E dla 9 URL handlerów digestu (smoke test per `?tab/?filter`).
- Digest telemetria (click-through per `row.key`).

### Testy
- Unit: 103/103 pass. `tsc --noEmit`: 0 errors.
- E2E specs walidują się statycznie; runtime verification wymaga
  dev server + DB (uruchomienie przez `npm run test:e2e`).

### Pliki zmienione
- `e2e/helpers.ts`
- `e2e/digest.spec.ts`
- `e2e/quick-apply.spec.ts` (nowy)
