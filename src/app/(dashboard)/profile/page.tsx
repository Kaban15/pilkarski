import { auth } from "@/server/auth/config";
import { redirect } from "next/navigation";
import { db } from "@/server/db/client";
import { ClubProfileForm } from "@/components/forms/club-profile-form";
import { PlayerProfileForm } from "@/components/forms/player-profile-form";

export default async function ProfilePage() {
  const session = await auth();
  if (!session) redirect("/login");

  const user = session.user as { id: string; role: "CLUB" | "PLAYER" };

  if (user.role === "CLUB") {
    const club = await db.club.findUnique({
      where: { userId: user.id },
      include: { region: true, leagueGroup: { include: { leagueLevel: true } } },
    });
    const regions = await db.region.findMany({ orderBy: { name: "asc" } });
    return <ClubProfileForm club={club!} regions={regions} />;
  }

  const player = await db.player.findUnique({
    where: { userId: user.id },
    include: { region: true, careerEntries: { orderBy: { season: "desc" } } },
  });
  const regions = await db.region.findMany({ orderBy: { name: "asc" } });
  return <PlayerProfileForm player={player!} regions={regions} />;
}
