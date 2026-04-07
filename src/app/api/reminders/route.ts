import { NextResponse } from "next/server";
import { db } from "@/server/db/client";
import { sendPushToUser } from "@/server/send-push";
import { formatEventDateTime } from "@/lib/format";

// POST /api/reminders — send reminder notifications
// Can be called from Vercel Cron or manually
export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const notifications: { userId: string; title: string; message: string; link: string }[] = [];

  // 1. Clubs with no sparings or events in 30 days
  const inactiveClubs = await db.club.findMany({
    where: {
      sparingOffers: { none: { createdAt: { gte: thirtyDaysAgo } } },
      events: { none: { createdAt: { gte: thirtyDaysAgo } } },
    },
    select: { userId: true, name: true },
    take: 50,
  });

  for (const club of inactiveClubs) {
    // Check if reminder already sent recently
    const recentReminder = await db.notification.findFirst({
      where: { userId: club.userId, type: "REMINDER", createdAt: { gte: sevenDaysAgo } },
    });
    if (!recentReminder) {
      notifications.push({
        userId: club.userId,
        title: "Czas na aktywność!",
        message: `${club.name} nie dodał sparingu ani naboru od 30 dni. Dodaj ogłoszenie i znajdź rywala.`,
        link: "/sparings/new",
      });
    }
  }

  // 2. Clubs with candidates in pipeline without progress (WATCHING for 14+ days)
  const stalePipelines = await db.recruitmentPipeline.findMany({
    where: {
      stage: "WATCHING",
      updatedAt: { lte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) },
    },
    include: {
      club: { select: { userId: true, name: true } },
    },
    take: 50,
  });

  const clubPipelineCounts = new Map<string, number>();
  for (const entry of stalePipelines) {
    clubPipelineCounts.set(
      entry.club.userId,
      (clubPipelineCounts.get(entry.club.userId) ?? 0) + 1
    );
  }

  for (const [userId, count] of clubPipelineCounts) {
    const recentReminder = await db.notification.findFirst({
      where: { userId, type: "REMINDER", createdAt: { gte: sevenDaysAgo } },
    });
    if (!recentReminder) {
      notifications.push({
        userId,
        title: "Kandydaci czekają",
        message: `Masz ${count} zawodników na radarze od ponad 2 tygodni. Zaproś ich na testy!`,
        link: "/recruitment",
      });
    }
  }

  // 3. Players with incomplete profiles (no region or position set)
  const incompletePlayers = await db.player.findMany({
    where: {
      OR: [{ regionId: null }, { primaryPosition: null }],
      createdAt: { lte: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
    },
    select: { userId: true, firstName: true },
    take: 50,
  });

  for (const player of incompletePlayers) {
    const recentReminder = await db.notification.findFirst({
      where: { userId: player.userId, type: "REMINDER", createdAt: { gte: sevenDaysAgo } },
    });
    if (!recentReminder) {
      notifications.push({
        userId: player.userId,
        title: "Uzupełnij profil",
        message: `${player.firstName}, uzupełnij pozycję i region — kluby będą mogły Cię znaleźć!`,
        link: "/profile",
      });
    }
  }

  // 4. Attendance reminders — INTERNAL events starting in ~24h without attendance declaration
  const now = new Date();
  const in20h = new Date(now.getTime() + 20 * 60 * 60 * 1000);
  const in28h = new Date(now.getTime() + 28 * 60 * 60 * 1000);

  const upcomingInternalEvents = await db.event.findMany({
    where: {
      visibility: "INTERNAL",
      eventDate: { gte: in20h, lte: in28h },
      clubId: { not: null },
    },
    select: {
      id: true,
      title: true,
      eventDate: true,
      clubId: true,
      club: { select: { name: true } },
    },
  });

  if (upcomingInternalEvents.length > 0) {
    const eventLinks = upcomingInternalEvents.map((e) => `/events/${e.id}`);

    // Batch: get all recent reminders for these events in one query
    const recentReminders = await db.notification.findMany({
      where: {
        type: "REMINDER",
        link: { in: eventLinks },
        createdAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
      },
      select: { userId: true, link: true },
    });
    const remindedSet = new Set(recentReminders.map((r) => `${r.userId}:${r.link}`));

    const pushPromises: Promise<void>[] = [];

    for (const event of upcomingInternalEvents) {
      if (!event.clubId) continue;

      const [members, declared] = await Promise.all([
        db.clubMembership.findMany({
          where: { clubId: event.clubId, status: "ACCEPTED" },
          select: { memberUserId: true },
        }),
        db.eventAttendance.findMany({
          where: { eventId: event.id },
          select: { userId: true },
        }),
      ]);

      const declaredSet = new Set(declared.map((d) => d.userId));
      const eventLink = `/events/${event.id}`;
      const dateStr = formatEventDateTime(event.eventDate);
      const clubName = event.club?.name ?? "Klub";

      for (const member of members) {
        if (declaredSet.has(member.memberUserId)) continue;
        if (remindedSet.has(`${member.memberUserId}:${eventLink}`)) continue;

        notifications.push({
          userId: member.memberUserId,
          title: "Potwierdź obecność",
          message: `${clubName}: ${event.title} — ${dateStr}. Zadeklaruj czy będziesz!`,
          link: eventLink,
        });

        pushPromises.push(
          sendPushToUser(member.memberUserId, {
            title: "Potwierdź obecność",
            body: `${clubName}: ${event.title} — ${dateStr}`,
            url: eventLink,
          }).catch((err) => console.error("[push]", err))
        );
      }
    }

    await Promise.allSettled(pushPromises);
  }

  // Batch create notifications
  if (notifications.length > 0) {
    await db.notification.createMany({
      data: notifications.map((n) => ({
        userId: n.userId,
        type: "REMINDER" as const,
        title: n.title,
        message: n.message,
        link: n.link,
      })),
    });
  }

  return NextResponse.json({ sent: notifications.length });
}
