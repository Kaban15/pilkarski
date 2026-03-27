# Zaproszenia do Kadry Klubu — Design Spec

**Data:** 2026-03-27
**Status:** Zatwierdzony

---

## Cel

Klub może wyszukać zawodnika/trenera i wysłać mu zaproszenie do kadry. Zawodnik zatwierdza lub odrzuca. Odwrotny flow do istniejącego requestJoin.

## Schema

Nowy status `INVITED` w istniejącym enum `MembershipStatus`. Brak nowych modeli — istniejący `ClubMembership` obsługuje oba flow:
- `requestJoin` → status PENDING (zawodnik→klub)
- `invite` → status INVITED (klub→zawodnik)

Nowy `NotificationType`: `CLUB_INVITATION`

## Backend (tRPC)

### `clubMembership.invite` (protectedProcedure)
- Input: `{ userId: uuid, message?: string(max 500) }`
- Walidacja:
  - Caller jest właścicielem klubu (club.userId)
  - Target user ma rolę PLAYER lub COACH
  - Brak istniejącego ACCEPTED/INVITED/PENDING membership
- Tworzy ClubMembership: status INVITED, memberType z roli usera
- Powiadomienie CLUB_INVITATION + push do zapraszanego
- Link w powiadomieniu: `/squad` (lub dedykowana strona zaproszeń)

### `clubMembership.respondToInvite` (protectedProcedure)
- Input: `{ membershipId: uuid, decision: "ACCEPT" | "REJECT" }`
- Walidacja: membership status INVITED, caller jest memberUserId
- ACCEPT → status ACCEPTED, acceptedAt = now(), powiadomienie do właściciela klubu
- REJECT → status REJECTED

### `clubMembership.searchUsers` (protectedProcedure)
- Input: `{ query: string(min 2, max 100), limit: number(1-20, default 10) }`
- Szuka po Player.firstName/lastName i Coach.firstName/lastName (case-insensitive contains)
- Wyklucza userów z istniejącym ACCEPTED/INVITED/PENDING membership w klubie callera
- Zwraca: userId, role, firstName, lastName, photoUrl, city, position (player) / specialization (coach)

### `clubMembership.myInvitations` (protectedProcedure)
- Zwraca zaproszenia INVITED skierowane do callera
- Include: club (id, name, logoUrl, city)

## Frontend

### `/squad` — dialog zaproszenia
- Przycisk "Zaproś" (UserPlus) w headerze kadry (owner-only)
- Dialog: input wyszukiwania (debounce 400ms), lista wyników z przyciskiem "Zaproś"
- Tab "Prośby" rozszerzony o zaproszenia INVITED (wysłane)

### `/players/[id]` i `/coaches/[id]` — przycisk profilu
- Przycisk "Zaproś do klubu" w hero (obok Follow/Message)
- Widoczny gdy: caller jest właścicielem klubu, target nie jest członkiem/zaproszonym
- Po kliknięciu: bezpośrednio wysyła zaproszenie (bez dialogu)

### Dashboard (feed) — sekcja zaproszeń
- Dla PLAYER/COACH: sekcja "Zaproszenia do klubów" gdy mają INVITED memberships
- Karty z logo klubu, nazwą, przyciskami "Akceptuj" / "Odrzuć"

## Poza zakresem
- Batch invite
- Wygaśnięcie zaproszenia
- Edycja wiadomości po wysłaniu
