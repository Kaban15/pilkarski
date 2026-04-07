/**
 * Test data factories for PilkaSport.
 * Use these to create typed mock objects with sensible defaults.
 */

export function createMockUser(overrides?: Record<string, unknown>) {
  return {
    id: "user-1",
    email: "test@example.com",
    role: "PLAYER" as const,
    passwordHash: "$2a$12$fakehash",
    isAdmin: false,
    isBanned: false,
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
    club: null,
    player: null,
    coach: null,
    ...overrides,
  };
}

export function createMockSession(overrides?: Record<string, unknown>) {
  return {
    user: {
      id: "user-1",
      email: "test@example.com",
      role: "CLUB" as const,
      isAdmin: false,
      ...overrides,
    },
    expires: new Date(Date.now() + 86400_000).toISOString(),
  };
}

export function createMockClub(overrides?: Record<string, unknown>) {
  return {
    id: "club-1",
    userId: "user-1",
    name: "Test FC",
    city: null,
    logoUrl: null,
    regionId: null,
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
    ...overrides,
  };
}

export function createMockPlayer(overrides?: Record<string, unknown>) {
  return {
    id: "player-1",
    userId: "user-2",
    firstName: "Jan",
    lastName: "Kowalski",
    primaryPosition: "CM",
    city: null,
    photoUrl: null,
    regionId: null,
    createdAt: new Date("2025-01-01"),
    ...overrides,
  };
}

export function createMockSparing(overrides?: Record<string, unknown>) {
  return {
    id: "sparing-1",
    clubId: "club-1",
    title: "Sparing testowy",
    description: null,
    matchDate: new Date(Date.now() + 7 * 86400_000),
    location: null,
    level: null,
    ageCategory: null,
    status: "OPEN" as const,
    regionId: null,
    costPerTeam: null,
    createdAt: new Date("2025-01-01"),
    ...overrides,
  };
}

export function createMockEvent(overrides?: Record<string, unknown>) {
  return {
    id: "event-1",
    clubId: "club-1",
    coachId: null,
    type: "OPEN_TRAINING" as const,
    title: "Trening testowy",
    description: null,
    eventDate: new Date(Date.now() + 7 * 86400_000),
    location: null,
    maxParticipants: null,
    visibility: "PUBLIC" as const,
    regionId: null,
    costPerPerson: null,
    createdAt: new Date("2025-01-01"),
    ...overrides,
  };
}
