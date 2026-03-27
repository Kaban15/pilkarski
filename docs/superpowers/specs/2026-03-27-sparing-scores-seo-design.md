# Wyniki Sparingów + SEO Stron Ligowych — Design Spec

**Data:** 2026-03-27
**Status:** Zatwierdzony

---

## Feature 1: Wyniki Meczów Sparingowych

### Cel

Po zakończeniu sparingu (status COMPLETED), oba kluby mogą wpisać wynik. Pierwszy wpisuje — drugi potwierdza lub odrzuca. Potwierdzone wyniki widoczne na profilu klubu i stronie sparingu.

### Schemat danych

Nowe pola na modelu `SparingOffer`:
- `homeScore: Int?` — bramki gospodarza (klub tworzący sparing)
- `awayScore: Int?` — bramki gościa (klub zaakceptowany)
- `scoreSubmittedBy: String?` — userId osoby która wpisała wynik
- `scoreConfirmed: Boolean @default(false)` — czy drugi klub potwierdził

Logika statusów wyniku (derived, nie nowy enum):
- `homeScore === null` → brak wyniku
- `homeScore !== null && !scoreConfirmed` → oczekuje potwierdzenia
- `homeScore !== null && scoreConfirmed` → wynik potwierdzony
- Odrzucenie = reset homeScore/awayScore/scoreSubmittedBy do null

Warunek: wynik można wpisać tylko gdy sparing ma status COMPLETED.

### Backend (tRPC)

**`sparing.submitScore`** (protectedProcedure):
- Input: `{ sparingId: uuid, homeScore: 0-99, awayScore: 0-99 }`
- Walidacja: COMPLETED, user jest właścicielem LUB zaakceptowanym rywalem, brak istniejącego wyniku
- Ustawia homeScore, awayScore, scoreSubmittedBy
- Powiadomienie fire-and-forget do drugiego klubu (SCORE_SUBMITTED)

**`sparing.confirmScore`** (protectedProcedure):
- Input: `{ sparingId: uuid, confirm: boolean }`
- Walidacja: wynik istnieje, user jest drugą stroną (nie scoreSubmittedBy), scoreConfirmed === false
- confirm: true → scoreConfirmed = true + powiadomienie SCORE_CONFIRMED
- confirm: false → reset do null + powiadomienie SCORE_REJECTED

**Rozbudowa profilu klubu:**
- Query na ostatnie 10 COMPLETED sparingów z scoreConfirmed=true dla danego klubu
- Bilans W/D/L

**NotificationType:** SCORE_SUBMITTED, SCORE_CONFIRMED, SCORE_REJECTED

### Frontend

**Na `/sparings/[id]`:**
- COMPLETED + brak wyniku → formularz "Wpisz wynik" (2 inputy, przycisk)
- Wynik oczekuje → badge + przyciski "Potwierdź" / "Odrzuć" (dla drugiej strony)
- Wynik potwierdzony → "Wynik: 3:1 ✓" z badge

**Na `/clubs/[id]`:**
- Sekcja "Historia sparingów" (po "Aktywne sparingi")
- Ostatnie 10 z potwierdzonym wynikiem: rywale, wynik, data
- Bilans W/D/L z perspektywy tego klubu
- Kolor: zielony (wygrana) / szary (remis) / czerwony (porażka)

### Migracja

Wymaga migracji: `add_sparing_scores` — 4 nowe pola na SparingOffer + 3 nowe wartości NotificationType.

---

## Feature 2: SEO Stron Ligowych

### Cel

Dodanie stron `/leagues` do sitemap.xml żeby Google je zaindeksował.

### Implementacja

**`src/app/sitemap.ts`:**
- Pobranie z DB: regionów (slug), szczebli (id, regionId), grup (id, leagueLevelId)
- Generacja URL-i:
  - `/leagues` — priority 0.8
  - `/leagues/[slug]` — 16 URL-i, priority 0.7
  - `/leagues/[slug]/[levelId]` — 69 URL-i, priority 0.6
  - `/leagues/[slug]/[levelId]/[groupId]` — 397 URL-i, priority 0.5

### Poza zakresem

- `generateStaticParams` — wymaga DB w build time (niestabilne na Vercel)
- Prerendering stron — dynamiczne SSR wystarczające
