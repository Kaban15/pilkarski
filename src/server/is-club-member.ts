import { db } from "@/server/db/client";

export async function isClubMember(userId: string, clubId: string): Promise<boolean> {
  const membership = await db.clubMembership.findUnique({
    where: { clubId_memberUserId: { clubId, memberUserId: userId } },
    select: { status: true },
  });
  return membership?.status === "ACCEPTED";
}

export async function getClubMembership(userId: string, clubId: string) {
  return db.clubMembership.findUnique({
    where: { clubId_memberUserId: { clubId, memberUserId: userId } },
  });
}
