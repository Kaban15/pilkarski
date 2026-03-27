import { db } from "@/server/db/client";

export async function checkEventPermission(userId: string, clubId: string): Promise<boolean> {
  const club = await db.club.findUnique({
    where: { id: clubId },
    select: { userId: true },
  });

  if (club?.userId === userId) return true;

  const membership = await db.clubMembership.findUnique({
    where: { clubId_memberUserId: { clubId, memberUserId: userId } },
    select: { status: true, canManageEvents: true },
  });

  return membership?.status === "ACCEPTED" && membership.canManageEvents === true;
}
