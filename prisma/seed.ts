import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

// 16 Wojewódzkich Związków Piłki Nożnej
const REGIONS = [
  { name: "Dolnośląski ZPN", slug: "dolnoslaski-zpn" },
  { name: "Kujawsko-Pomorski ZPN", slug: "kujawsko-pomorski-zpn" },
  { name: "Lubelski ZPN", slug: "lubelski-zpn" },
  { name: "Lubuski ZPN", slug: "lubuski-zpn" },
  { name: "Łódzki ZPN", slug: "lodzki-zpn" },
  { name: "Małopolski ZPN", slug: "malopolski-zpn" },
  { name: "Mazowiecki ZPN", slug: "mazowiecki-zpn" },
  { name: "Opolski ZPN", slug: "opolski-zpn" },
  { name: "Podkarpacki ZPN", slug: "podkarpacki-zpn" },
  { name: "Podlaski ZPN", slug: "podlaski-zpn" },
  { name: "Pomorski ZPN", slug: "pomorski-zpn" },
  { name: "Śląski ZPN", slug: "slaski-zpn" },
  { name: "Świętokrzyski ZPN", slug: "swietokrzyski-zpn" },
  { name: "Warmińsko-Mazurski ZPN", slug: "warminsko-mazurski-zpn" },
  { name: "Wielkopolski ZPN", slug: "wielkopolski-zpn" },
  { name: "Zachodniopomorski ZPN", slug: "zachodniopomorski-zpn" },
];

// Typowe szczeble ligowe w strukturze regionalnej (od najwyższego)
const LEAGUE_LEVELS = [
  { name: "IV liga", tier: 1, groups: 1 },
  { name: "Klasa okręgowa", tier: 2, groups: 2 },
  { name: "Klasa A", tier: 3, groups: 4 },
  { name: "Klasa B", tier: 4, groups: 6 },
  { name: "Klasa C", tier: 5, groups: 4 },
];

async function main() {
  console.log("Seeding regions...");

  for (const region of REGIONS) {
    const created = await db.region.upsert({
      where: { slug: region.slug },
      update: { name: region.name },
      create: region,
    });

    console.log(`  Region: ${created.name} (id: ${created.id})`);

    for (const level of LEAGUE_LEVELS) {
      const createdLevel = await db.leagueLevel.upsert({
        where: {
          regionId_name: { regionId: created.id, name: level.name },
        },
        update: { tier: level.tier },
        create: {
          regionId: created.id,
          name: level.name,
          tier: level.tier,
        },
      });

      for (let g = 1; g <= level.groups; g++) {
        const groupName = level.groups === 1 ? "Grupa 1" : `Grupa ${g}`;
        await db.leagueGroup.upsert({
          where: {
            leagueLevelId_name: {
              leagueLevelId: createdLevel.id,
              name: groupName,
            },
          },
          update: {},
          create: {
            leagueLevelId: createdLevel.id,
            name: groupName,
          },
        });
      }
    }
  }

  const regionCount = await db.region.count();
  const levelCount = await db.leagueLevel.count();
  const groupCount = await db.leagueGroup.count();

  console.log(`\nDone! ${regionCount} regions, ${levelCount} league levels, ${groupCount} groups.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
