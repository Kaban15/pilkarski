import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

async function main() {
  const clubs = await db.club.count();
  const players = await db.player.count();
  const coaches = await db.coach.count();
  console.log(`Kluby: ${clubs}`);
  console.log(`Zawodnicy: ${players}`);
  console.log(`Trenerzy: ${coaches}`);
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
