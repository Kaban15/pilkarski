import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

async function cleanup() {
  const regions = await db.region.findMany({
    where: { slug: { in: ["zachodniopomorski-zpn"] } },
  });
  const ids = regions.map((r) => r.id);
  console.log("Regions to clean:", regions.map((r) => r.name));

  const players = await db.player.findMany({ where: { regionId: { in: ids } }, select: { userId: true } });
  const coaches = await db.coach.findMany({ where: { regionId: { in: ids } }, select: { userId: true } });
  const clubs = await db.club.findMany({ where: { regionId: { in: ids } }, select: { userId: true } });

  const userIds = [...players, ...coaches, ...clubs].map((x) => x.userId);
  console.log("Test users to delete:", userIds.length);

  if (userIds.length === 0) {
    console.log("Nothing to clean up.");
    return;
  }

  const deleted = await db.user.deleteMany({
    where: {
      id: { in: userIds },
      email: { contains: "@pilkasport.test" },
    },
  });
  console.log("Deleted:", deleted.count);
}

cleanup()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
