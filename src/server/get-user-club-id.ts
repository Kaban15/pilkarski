import type { PrismaClient } from "@/generated/prisma/client";

export async function getUserClubId(
  db: PrismaClient,
  userId: string,
  role: string,
): Promise<string | null> {
  if (role === "COACH") {
    const membership = await db.clubMembership.findFirst({
      where: { memberUserId: userId, status: "ACCEPTED" },
      select: { clubId: true },
    });
    return membership?.clubId ?? null;
  }

  const club = await db.club.findUnique({
    where: { userId },
    select: { id: true },
  });
  return club?.id ?? null;
}
