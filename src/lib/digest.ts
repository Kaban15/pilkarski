export const DIGEST_THRESHOLDS = {
  attendanceWarnHours: 48,
  upcomingDays: 7,
  stalePipelineDays: 14,
  recommendedEventHours: 72,
} as const;

export type DigestIconKey =
  | "sparing"
  | "event"
  | "message"
  | "transfer"
  | "calendar"
  | "pipeline"
  | "attendance"
  | "invitation"
  | "recommendation";

export type DigestRow = {
  key: string;
  count: number;
  label: string;
  href: string;
  iconKey: DigestIconKey;
};

export type DigestRole = "CLUB" | "PLAYER" | "COACH";

export type DigestResponse = {
  role: DigestRole;
  rows: DigestRow[];
  totalCount: number;
  generatedAt: string;
};

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

function finalize(candidates: DigestRow[]): { rows: DigestRow[]; totalCount: number } {
  const rows = candidates.filter((r) => r.count > 0);
  const totalCount = rows.reduce((sum, r) => sum + r.count, 0);
  return { rows, totalCount };
}

// ============================================================
// CLUB
// ============================================================

export async function getClubDigest(args: {
  db: any;
  userId: string;
}): Promise<{ rows: DigestRow[]; totalCount: number }> {
  const { db, userId } = args;
  const club = await db.club.findUnique({ where: { userId } });
  if (!club) return { rows: [], totalCount: 0 };

  const now = new Date();
  const in48h = new Date(now.getTime() + DIGEST_THRESHOLDS.attendanceWarnHours * HOUR_MS);
  const inWeek = new Date(now.getTime() + DIGEST_THRESHOLDS.upcomingDays * DAY_MS);
  const staleBefore = new Date(now.getTime() - DIGEST_THRESHOLDS.stalePipelineDays * DAY_MS);

  const [
    attendance48h,
    pendingApplications,
    pendingInvitations,
    upcomingSparings,
    upcomingEvents,
    stalePipeline,
  ] = await Promise.all([
    // MVP: we do not cross-check EventAttendance — accepted apps within the window count as "pending confirmation".
    db.eventApplication.count({
      where: {
        status: "ACCEPTED",
        event: {
          clubId: club.id,
          type: { in: ["TRYOUT", "RECRUITMENT"] },
          eventDate: { gte: now, lte: in48h },
        },
      },
    }),
    db.sparingApplication.count({
      where: {
        status: "PENDING",
        OR: [
          { sparingOffer: { clubId: club.id } },
          { applicantClubId: club.id },
        ],
      },
    }),
    db.sparingInvitation.count({
      where: {
        toClubId: club.id,
        status: "PENDING",
        OR: [{ expiresAt: null }, { expiresAt: { gte: now } }],
      },
    }),
    db.sparingOffer.count({
      where: {
        matchDate: { gte: now, lte: inWeek },
        status: "MATCHED",
        OR: [
          { clubId: club.id },
          {
            applications: {
              some: { status: "ACCEPTED", applicantClubId: club.id },
            },
          },
        ],
      },
    }),
    db.event.count({
      where: {
        clubId: club.id,
        eventDate: { gte: now, lte: inWeek },
      },
    }),
    db.recruitmentPipeline.count({
      where: {
        clubId: club.id,
        stage: { notIn: ["SIGNED", "REJECTED"] },
        updatedAt: { lt: staleBefore },
      },
    }),
  ]);

  const candidates: DigestRow[] = [
    {
      key: "club.attendance48h",
      count: attendance48h,
      label: "Zgłoszenia bez potwierdzenia (<48h)",
      href: "/events?filter=pending-attendance",
      iconKey: "attendance",
    },
    {
      key: "club.pendingSparingApplications",
      count: pendingApplications,
      label: "Aplikacje sparingowe czekają",
      href: "/sparings?tab=applications",
      iconKey: "sparing",
    },
    {
      key: "club.pendingSparingInvitations",
      count: pendingInvitations,
      label: "Nieodebrane zaproszenia",
      href: "/sparings?tab=invitations",
      iconKey: "invitation",
    },
    {
      key: "club.upcomingWeek",
      count: upcomingSparings + upcomingEvents,
      label: "Wydarzenia w tym tygodniu",
      href: "/calendar?range=week",
      iconKey: "calendar",
    },
    {
      key: "club.stalePipeline",
      count: stalePipeline,
      label: "Kandydaci bez ruchu >14 dni",
      href: "/recruitment?filter=stale",
      iconKey: "pipeline",
    },
  ];

  return finalize(candidates);
}

// ============================================================
// PLAYER
// ============================================================

export async function getPlayerDigest(args: {
  db: any;
  userId: string;
}): Promise<{ rows: DigestRow[]; totalCount: number }> {
  const { db, userId } = args;
  const player = await db.player.findUnique({ where: { userId } });
  if (!player) return { rows: [], totalCount: 0 };

  const now = new Date();
  const in48h = new Date(now.getTime() + DIGEST_THRESHOLDS.attendanceWarnHours * HOUR_MS);
  const inWeek = new Date(now.getTime() + DIGEST_THRESHOLDS.upcomingDays * DAY_MS);
  const since72h = new Date(now.getTime() - DIGEST_THRESHOLDS.recommendedEventHours * HOUR_MS);

  const recommendedWhere: any = {
    createdAt: { gte: since72h },
    type: { in: ["RECRUITMENT", "TRYOUT", "CONTINUOUS_RECRUITMENT"] },
  };
  if (player.regionId) recommendedWhere.regionId = player.regionId;
  if (player.primaryPosition) {
    recommendedWhere.OR = [
      { targetPosition: null },
      { targetPosition: player.primaryPosition },
    ];
  }

  const [
    myApplicationsInProgress,
    attendance48h,
    upcomingWeek,
    recommendedEvents,
  ] = await Promise.all([
    db.eventApplication.count({
      where: { playerId: player.id, status: "PENDING" },
    }),
    db.eventApplication.count({
      where: {
        playerId: player.id,
        status: "ACCEPTED",
        event: {
          type: { in: ["TRYOUT", "RECRUITMENT"] },
          eventDate: { gte: now, lte: in48h },
        },
      },
    }),
    db.eventApplication.count({
      where: {
        playerId: player.id,
        status: "ACCEPTED",
        event: { eventDate: { gte: now, lte: inWeek } },
      },
    }),
    db.event.count({ where: recommendedWhere }),
  ]);

  const candidates: DigestRow[] = [
    {
      key: "player.myApplicationsInProgress",
      count: myApplicationsInProgress,
      label: "Twoje aplikacje w toku",
      href: "/events?tab=my-applications",
      iconKey: "event",
    },
    {
      key: "player.attendance48h",
      count: attendance48h,
      label: "Potwierdź obecność (<48h)",
      href: "/events?filter=pending-attendance",
      iconKey: "attendance",
    },
    {
      key: "player.upcomingWeek",
      count: upcomingWeek,
      label: "Wydarzenia w tym tygodniu",
      href: "/calendar?range=week",
      iconKey: "calendar",
    },
    {
      key: "player.recommendedEvents",
      count: recommendedEvents,
      label: "Nowe nabory dla Ciebie",
      href: "/events?filter=recommended",
      iconKey: "recommendation",
    },
  ];

  return finalize(candidates);
}

// ============================================================
// COACH
// ============================================================

export async function getCoachDigest(args: {
  db: any;
  userId: string;
}): Promise<{ rows: DigestRow[]; totalCount: number }> {
  const { db, userId } = args;
  const coach = await db.coach.findUnique({ where: { userId } });
  if (!coach) return { rows: [], totalCount: 0 };

  const now = new Date();
  const in48h = new Date(now.getTime() + DIGEST_THRESHOLDS.attendanceWarnHours * HOUR_MS);
  const inWeek = new Date(now.getTime() + DIGEST_THRESHOLDS.upcomingDays * DAY_MS);

  const [
    trainingApplications,
    clubInvitations,
    attendance48h,
    upcomingWeek,
    unreadMessages,
  ] = await Promise.all([
    db.eventApplication.count({
      where: {
        status: "PENDING",
        event: {
          coachId: coach.id,
          type: { in: ["INDIVIDUAL_TRAINING", "GROUP_TRAINING"] },
        },
      },
    }),
    db.clubMembership.count({
      where: { memberUserId: userId, status: "INVITED" },
    }),
    db.eventApplication.count({
      where: {
        status: "ACCEPTED",
        event: {
          coachId: coach.id,
          eventDate: { gte: now, lte: in48h },
        },
      },
    }),
    db.event.count({
      where: { coachId: coach.id, eventDate: { gte: now, lte: inWeek } },
    }),
    db.message.count({
      where: {
        conversation: { participants: { some: { userId } } },
        readAt: null,
        senderId: { not: userId },
      },
    }),
  ]);

  const candidates: DigestRow[] = [
    {
      key: "coach.trainingApplications",
      count: trainingApplications,
      label: "Zgłoszenia na treningi",
      href: "/trainings?tab=applications",
      iconKey: "event",
    },
    {
      key: "coach.clubInvitations",
      count: clubInvitations,
      label: "Zaproszenia od klubów",
      href: "/notifications?filter=invitations",
      iconKey: "invitation",
    },
    {
      key: "coach.attendance48h",
      count: attendance48h,
      label: "Potwierdź obecność (<48h)",
      href: "/events?filter=pending-attendance",
      iconKey: "attendance",
    },
    {
      key: "coach.upcomingWeek",
      count: upcomingWeek,
      label: "Treningi w tym tygodniu",
      href: "/calendar?range=week",
      iconKey: "calendar",
    },
    {
      key: "coach.unreadMessages",
      count: unreadMessages,
      label: "Nowe wiadomości",
      href: "/messages",
      iconKey: "message",
    },
  ];

  return finalize(candidates);
}
