# Wewnętrzne Wydarzenia, Frekwencja i Uprawnienia Klubowe — Design Spec

**Data:** 2026-03-27
**Status:** Zatwierdzony

---

## Cel

Rozszerzenie systemu wydarzeń o widoczność INTERNAL (tylko dla członków klubu), śledzenie obecności (YES/NO/MAYBE) na wydarzeniach wewnętrznych oraz delegowanie uprawnień do zarządzania wydarzeniami.

## Schemat danych

### Nowy enum `EventVisibility`
- `PUBLIC` — widoczne dla wszystkich (domyślne, obecne zachowanie)
- `INTERNAL` — widoczne tylko dla członków klubu z ClubMembership status ACCEPTED

### Nowy enum `AttendanceStatus`
- `YES`, `NO`, `MAYBE`

### Nowe pole na `Event`
- `visibility: EventVisibility @default(PUBLIC)`

### Nowy model `EventAttendance`
- `id: String @id @default(uuid())`
- `eventId: String` (FK → Event)
- `userId: String` (FK → User)
- `status: AttendanceStatus`
- `updatedAt: DateTime @updatedAt`
- `@@unique([eventId, userId])`

### Nowe pole na `ClubMembership`
- `canManageEvents: Boolean @default(false)`

### Helper `checkEventPermission(userId, clubId)`
Zwraca true jeśli:
- user jest właścicielem klubu (club.userId === userId), LUB
- user ma ClubMembership z status ACCEPTED i canManageEvents true

## Backend (tRPC)

### Modyfikacje istniejących procedur

**`event.create`:**
- Dodać `visibility` do inputu (default PUBLIC)
- Jeśli INTERNAL: walidacja checkEventPermission (owner lub member z canManageEvents)

**`event.list`:**
- Wydarzenia INTERNAL widoczne tylko gdy user jest ACCEPTED member danego klubu
- PUBLIC bez zmian

**`event.getById`:**
- Jeśli INTERNAL: sprawdzić membership, brak → NOT_FOUND

### Nowe procedury

**`event.setAttendance`** (protectedProcedure):
- Input: `{ eventId: uuid, status: YES|NO|MAYBE }`
- Walidacja: wydarzenie INTERNAL, user jest ACCEPTED member klubu
- Upsert na EventAttendance (@@unique eventId+userId)

**`event.getAttendance`** (protectedProcedure):
- Input: `{ eventId: uuid }`
- Zwraca: lista attendance z user info (imię, rola) + stats { yes, no, maybe }
- Walidacja: user jest member klubu

**`clubMembership.setPermissions`** (protectedProcedure):
- Input: `{ membershipId: uuid, canManageEvents: boolean }`
- Walidacja: caller jest właścicielem klubu (club.userId)
- Update flagi canManageEvents

## Frontend

### `/events/[id]` — strona szczegółów
- Badge "Tylko dla klubu" (amber) gdy visibility === INTERNAL
- Widget "Twoja obecność" — 3 przyciski (Tak/Nie/Nie wiem) dla ACCEPTED members
- Dla admins/trenerów/właściciela: lista obecności z podziałem YES/NO/MAYBE + liczniki

### `/events/new` i `/events/[id]/edit`
- Dropdown "Widoczność" (Publiczne / Tylko dla klubu) w formularzu

### `/squad`
- Toggle "Zarządzanie wydarzeniami" przy każdym członku
- Widoczne tylko dla właściciela klubu

### `/events` — lista
- Badge "Klub" (amber) na wydarzeniach INTERNAL

## Migracja

Wymaga migracji: `add_event_visibility_attendance` — nowy enum, pole visibility, model EventAttendance, pole canManageEvents.

## Poza zakresem

- Powiadomienia o niezaznaczonej obecności
- Eksport listy obecności
- Historyczna analityka frekwencji
