import { auth } from "@/server/auth/config";
import { redirect } from "next/navigation";
import { db } from "@/server/db/client";
import { ClubProfileForm } from "@/components/forms/club-profile-form";
import { PlayerProfileForm } from "@/components/forms/player-profile-form";
import { CoachProfileForm } from "@/components/forms/coach-profile-form";

export default async function ProfilePage() {
  const session = await auth();
  if (!session) redirect("/login");

  const user = session.user as { id: string; role: "CLUB" | "PLAYER" | "COACH" };

  const regions = db.region.findMany({ orderBy: { name: "asc" } });

  if (user.role === "CLUB") {
    const [club, resolvedRegions] = await Promise.all([
      db.club.findUnique({
        where: { userId: user.id },
        include: { region: true, leagueGroup: { include: { leagueLevel: true } } },
      }),
      regions,
    ]);
    return <ClubProfileForm club={club!} regions={resolvedRegions} />;
  }

  if (user.role === "COACH") {
    const [coach, resolvedRegions] = await Promise.all([
      db.coach.findUnique({
        where: { userId: user.id },
        include: { region: true, careerEntries: { orderBy: { season: "desc" } } },
      }),
      regions,
    ]);
    return <CoachProfileForm coach={coach!} regions={resolvedRegions} />;
  }

  const [player, resolvedRegions] = await Promise.all([
    db.player.findUnique({
      where: { userId: user.id },
      include: { region: true, careerEntries: { orderBy: { season: "desc" } } },
    }),
    regions,
  ]);
  return <PlayerProfileForm player={player!} regions={resolvedRegions} />;
}
