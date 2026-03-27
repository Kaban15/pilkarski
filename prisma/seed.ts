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

// Realna struktura ligowa per województwo (sezon 2024/2025)
// Źródła: Wikipedia, wielkopolskizpn.pl, 90minut.pl, PZPN
type LeagueLevel = { name: string; tier: number; groups: number };

const LEAGUE_STRUCTURE: Record<string, LeagueLevel[]> = {
  "dolnoslaski-zpn": [
    { name: "IV liga", tier: 1, groups: 1 },
    { name: "Klasa okręgowa", tier: 2, groups: 4 },
    { name: "Klasa A", tier: 3, groups: 13 },
    { name: "Klasa B", tier: 4, groups: 23 },
  ],
  "kujawsko-pomorski-zpn": [
    { name: "IV liga", tier: 1, groups: 1 },
    { name: "Klasa okręgowa", tier: 2, groups: 2 },
    { name: "Klasa A", tier: 3, groups: 4 },
    { name: "Klasa B", tier: 4, groups: 8 },
  ],
  "lubelski-zpn": [
    { name: "IV liga", tier: 1, groups: 1 },
    { name: "Klasa okręgowa", tier: 2, groups: 4 },
    { name: "Klasa A", tier: 3, groups: 7 },
    { name: "Klasa B", tier: 4, groups: 9 },
  ],
  "lubuski-zpn": [
    { name: "IV liga", tier: 1, groups: 1 },
    { name: "Klasa okręgowa", tier: 2, groups: 2 },
    { name: "Klasa A", tier: 3, groups: 5 },
    { name: "Klasa B", tier: 4, groups: 9 },
  ],
  "lodzki-zpn": [
    { name: "IV liga", tier: 1, groups: 1 },
    { name: "Klasa okręgowa", tier: 2, groups: 4 },
    { name: "Klasa A", tier: 3, groups: 8 },
    { name: "Klasa B", tier: 4, groups: 10 },
  ],
  "malopolski-zpn": [
    { name: "IV liga", tier: 1, groups: 1 },
    { name: "V liga", tier: 2, groups: 2 },
    { name: "Klasa okręgowa", tier: 3, groups: 8 },
    { name: "Klasa A", tier: 4, groups: 19 },
    { name: "Klasa B", tier: 5, groups: 18 },
    { name: "Klasa C", tier: 6, groups: 5 },
  ],
  "mazowiecki-zpn": [
    { name: "IV liga", tier: 1, groups: 1 },
    { name: "V liga", tier: 2, groups: 2 },
    { name: "Klasa okręgowa", tier: 3, groups: 6 },
    { name: "Klasa A", tier: 4, groups: 8 },
    { name: "Klasa B", tier: 5, groups: 9 },
  ],
  "opolski-zpn": [
    { name: "IV liga", tier: 1, groups: 1 },
    { name: "Klasa okręgowa", tier: 2, groups: 2 },
    { name: "Klasa A", tier: 3, groups: 6 },
    { name: "Klasa B", tier: 4, groups: 13 },
  ],
  "podkarpacki-zpn": [
    { name: "IV liga", tier: 1, groups: 1 },
    { name: "Klasa okręgowa", tier: 2, groups: 5 },
    { name: "Klasa A", tier: 3, groups: 13 },
    { name: "Klasa B", tier: 4, groups: 21 },
  ],
  "podlaski-zpn": [
    { name: "IV liga", tier: 1, groups: 1 },
    { name: "Klasa okręgowa", tier: 2, groups: 1 },
    { name: "Klasa A", tier: 3, groups: 3 },
    // Brak Klasy B w województwie podlaskim
  ],
  "pomorski-zpn": [
    { name: "IV liga", tier: 1, groups: 1 },
    { name: "Klasa okręgowa", tier: 2, groups: 3 },
    { name: "Klasa A", tier: 3, groups: 6 },
    { name: "Klasa B", tier: 4, groups: 10 },
  ],
  "slaski-zpn": [
    { name: "IV liga", tier: 1, groups: 1 },
    { name: "V liga", tier: 2, groups: 2 },
    { name: "Klasa okręgowa", tier: 3, groups: 6 },
    { name: "Klasa A", tier: 4, groups: 14 },
    { name: "Klasa B", tier: 5, groups: 14 },
    { name: "Klasa C", tier: 6, groups: 5 },
  ],
  "swietokrzyski-zpn": [
    { name: "IV liga", tier: 1, groups: 1 },
    { name: "Klasa okręgowa", tier: 2, groups: 1 },
    { name: "Klasa A", tier: 3, groups: 3 },
    { name: "Klasa B", tier: 4, groups: 3 },
  ],
  "warminsko-mazurski-zpn": [
    { name: "IV liga", tier: 1, groups: 1 },
    { name: "Klasa okręgowa", tier: 2, groups: 2 },
    { name: "Klasa A", tier: 3, groups: 4 },
    { name: "Klasa B", tier: 4, groups: 4 },
  ],
  "wielkopolski-zpn": [
    { name: "IV liga", tier: 1, groups: 1 },
    { name: "V liga", tier: 2, groups: 3 },
    { name: "Klasa okręgowa", tier: 3, groups: 6 },
    { name: "Klasa A", tier: 4, groups: 9 },
    { name: "Klasa B", tier: 5, groups: 13 },
  ],
  "zachodniopomorski-zpn": [
    { name: "IV liga", tier: 1, groups: 1 },
    { name: "Klasa okręgowa", tier: 2, groups: 4 },
    { name: "Klasa A", tier: 3, groups: 8 },
    { name: "Klasa B", tier: 4, groups: 8 },
  ],
};

async function main() {
  console.log("Seeding regions and league structure...");

  for (const region of REGIONS) {
    const created = await db.region.upsert({
      where: { slug: region.slug },
      update: { name: region.name },
      create: region,
    });

    console.log(`  Region: ${created.name} (id: ${created.id})`);

    const levels = LEAGUE_STRUCTURE[region.slug];
    if (!levels) {
      console.warn(`    ⚠ No league structure for ${region.slug}`);
      continue;
    }

    // Remove old levels/groups that no longer exist in updated structure
    const existingLevels = await db.leagueLevel.findMany({
      where: { regionId: created.id },
      include: { groups: true },
    });

    const newLevelNames = new Set(levels.map((l) => l.name));
    for (const existing of existingLevels) {
      if (!newLevelNames.has(existing.name)) {
        // Delete groups first (cascade may handle, but be explicit)
        await db.leagueGroup.deleteMany({ where: { leagueLevelId: existing.id } });
        await db.leagueLevel.delete({ where: { id: existing.id } });
        console.log(`    Removed outdated level: ${existing.name}`);
      }
    }

    for (const level of levels) {
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

      // Remove excess groups if count decreased
      const existingGroups = await db.leagueGroup.findMany({
        where: { leagueLevelId: createdLevel.id },
        orderBy: { name: "asc" },
      });

      for (const eg of existingGroups) {
        const groupNum = parseInt(eg.name.replace("Grupa ", ""), 10);
        if (groupNum > level.groups) {
          // Only delete if no clubs assigned
          const clubCount = await db.club.count({ where: { leagueGroupId: eg.id } });
          if (clubCount === 0) {
            await db.leagueGroup.delete({ where: { id: eg.id } });
            console.log(`    Removed empty group: ${level.name} ${eg.name}`);
          } else {
            console.warn(`    ⚠ Cannot remove ${level.name} ${eg.name} — ${clubCount} clubs assigned`);
          }
        }
      }

      // Create missing groups
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
