import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

// Pre-hashed "Test123!" with bcrypt (12 rounds)
const PASSWORD_HASH =
  "$2b$12$gmjkSa1uapThsKJOkkZsrum2xfc/hv1HH5SRr6/KcK79MwI1EqGvu";

// ── CONFIG ──────────────────────────────────────────────────
const CLUBS_PER_GROUP = 10;
const PLAYERS_PER_CLUB = 12;
const COACHES_PER_REGION = 8;

// ── DATA POOLS ──────────────────────────────────────────────

const CLUB_PREFIXES = [
  "Orzeł", "Sokół", "Wisła", "Warta", "Stal",
  "Górnik", "Lechia", "Polonia", "Piast", "Hutnik",
  "Błękitni", "Czarni", "Korona", "Olimpia", "Unia",
  "Victoria", "Pogoń", "Ruch", "Skra", "Grom",
];

const CITIES_BY_REGION: Record<string, string[]> = {
  "dolnoslaski-zpn": ["Wrocław", "Wałbrzych", "Legnica", "Jelenia Góra", "Lubin", "Głogów", "Świdnica", "Oleśnica", "Bolesławiec", "Kłodzko"],
  "kujawsko-pomorski-zpn": ["Bydgoszcz", "Toruń", "Włocławek", "Grudziądz", "Inowrocław", "Brodnica", "Chełmno", "Świecie", "Mogilno", "Nakło"],
  "lubelski-zpn": ["Lublin", "Zamość", "Chełm", "Biała Podlaska", "Puławy", "Świdnik", "Kraśnik", "Łuków", "Hrubieszów", "Tomaszów Lub."],
  "lubuski-zpn": ["Zielona Góra", "Gorzów Wlkp.", "Nowa Sól", "Żary", "Żagań", "Świebodzin", "Krosno Odrz.", "Międzyrzecz", "Gubin", "Sulechów"],
  "lodzki-zpn": ["Łódź", "Piotrków Tryb.", "Pabianice", "Tomaszów Maz.", "Bełchatów", "Zgierz", "Skierniewice", "Radomsko", "Kutno", "Sieradz"],
  "malopolski-zpn": ["Kraków", "Tarnów", "Nowy Sącz", "Oświęcim", "Chrzanów", "Bochnia", "Gorlice", "Myślenice", "Wadowice", "Zakopane"],
  "mazowiecki-zpn": ["Warszawa", "Radom", "Płock", "Siedlce", "Ostrołęka", "Pruszków", "Legionowo", "Mińsk Maz.", "Wołomin", "Piaseczno"],
  "opolski-zpn": ["Opole", "Kędzierzyn-Koźle", "Nysa", "Brzeg", "Kluczbork", "Prudnik", "Strzelce Op.", "Namysłów", "Głubczyce", "Krapkowice"],
  "podkarpacki-zpn": ["Rzeszów", "Przemyśl", "Stalowa Wola", "Mielec", "Krosno", "Tarnobrzeg", "Jasło", "Sanok", "Dębica", "Jarosław"],
  "podlaski-zpn": ["Białystok", "Suwałki", "Łomża", "Augustów", "Bielsk Podl.", "Hajnówka", "Zambrów", "Sokółka", "Grajewo", "Kolno"],
  "pomorski-zpn": ["Gdańsk", "Gdynia", "Sopot", "Słupsk", "Tczew", "Starogard Gd.", "Wejherowo", "Rumia", "Chojnice", "Lębork"],
  "slaski-zpn": ["Katowice", "Częstochowa", "Sosnowiec", "Gliwice", "Zabrze", "Bytom", "Rybnik", "Tychy", "Dąbrowa Górn.", "Jaworzno"],
  "swietokrzyski-zpn": ["Kielce", "Ostrowiec Św.", "Starachowice", "Skarżysko-Kam.", "Sandomierz", "Końskie", "Busko-Zdrój", "Jędrzejów", "Staszów", "Pińczów"],
  "warminsko-mazurski-zpn": ["Olsztyn", "Elbląg", "Ełk", "Ostróda", "Iława", "Giżycko", "Kętrzyn", "Bartoszyce", "Szczytno", "Mrągowo"],
  "wielkopolski-zpn": ["Poznań", "Kalisz", "Konin", "Piła", "Ostrów Wlkp.", "Gniezno", "Leszno", "Śrem", "Turek", "Rawicz"],
  "zachodniopomorski-zpn": ["Szczecin", "Koszalin", "Stargard", "Kołobrzeg", "Świnoujście", "Szczecinek", "Białogard", "Wałcz", "Gryfino", "Police"],
};

const FIRST_NAMES_MALE = [
  "Adam", "Jakub", "Mateusz", "Michał", "Piotr", "Krzysztof", "Tomasz",
  "Łukasz", "Marcin", "Paweł", "Kamil", "Dawid", "Bartosz", "Sebastian",
  "Maciej", "Wojciech", "Grzegorz", "Rafał", "Artur", "Daniel",
  "Filip", "Szymon", "Karol", "Robert", "Damian", "Przemysław", "Patryk",
  "Hubert", "Dominik", "Konrad", "Norbert", "Adrian", "Mariusz", "Marek",
  "Radosław", "Janusz", "Dariusz", "Andrzej", "Jan", "Aleksander",
];

const LAST_NAMES = [
  "Nowak", "Kowalski", "Wiśniewski", "Wójcik", "Kowalczyk", "Kamiński",
  "Lewandowski", "Zieliński", "Szymański", "Woźniak", "Dąbrowski",
  "Kozłowski", "Jankowski", "Mazur", "Kwiatkowski", "Krawczyk",
  "Piotrowski", "Grabowski", "Nowakowski", "Pawłowski", "Michalski",
  "Adamczyk", "Dudek", "Zając", "Wieczorek", "Jabłoński", "Król",
  "Majewski", "Olszewski", "Jaworski", "Stępień", "Malinowski",
  "Pawlak", "Górski", "Witkowski", "Walczak", "Sikora", "Baran",
  "Rutkowski", "Michalak", "Szewczyk", "Ostrowski", "Tomczyk",
  "Pietrzak", "Marciniak", "Wróbel", "Zalewski", "Błaszczyk",
];

const POSITIONS: Array<
  "GK" | "CB" | "LB" | "RB" | "CDM" | "CM" | "CAM" | "LM" | "RM" | "LW" | "RW" | "ST"
> = ["GK", "CB", "LB", "RB", "CDM", "CM", "CAM", "LM", "RM", "LW", "RW", "ST"];

// Realistic squad distribution: 1 GK, 2 CB, 1 LB, 1 RB, 1 CDM, 2 CM, 1 CAM, 1 winger, 2 ST
const SQUAD_TEMPLATE: typeof POSITIONS = [
  "GK", "CB", "CB", "LB", "RB", "CDM", "CM", "CM", "CAM", "LW", "RW", "ST",
];

const COACH_SPECIALIZATIONS = [
  "Trener główny", "Trener bramkarzy", "Trener przygotowania fizycznego",
  "Trener młodzieży", "Trener juniorów", "Asystent trenera",
  "Trener indywidualny", "Trener taktyki",
];

const COACH_LEVELS = ["UEFA A", "UEFA B", "UEFA C", "UEFA Pro", "Grassroots"];

// ── HELPERS ─────────────────────────────────────────────────

let emailCounter = 0;
async function initEmailCounter() {
  const count = await db.user.count({
    where: { email: { contains: "@pilkasport.test" } },
  });
  emailCounter = count;
  console.log(`📧 Starting email counter at ${emailCounter}`);
}
function uniqueEmail(prefix: string): string {
  return `test.${prefix}.${++emailCounter}@pilkasport.test`;
}

function pick<T>(arr: T[], index: number): T {
  return arr[index % arr.length];
}

function randomInt(min: number, max: number, seed: number): number {
  return min + (seed % (max - min + 1));
}

// ── MAIN ────────────────────────────────────────────────────

async function main() {
  console.log("🏟️  Seeding test data...\n");

  await initEmailCounter();

  // Load all regions with their groups
  const regions = await db.region.findMany({
    include: {
      leagueLevels: {
        include: { groups: true },
        orderBy: { tier: "asc" },
      },
    },
    orderBy: { id: "asc" },
  });

  if (regions.length === 0) {
    console.error("❌ No regions found. Run `npm run db:seed` first.");
    process.exit(1);
  }

  let totalClubs = 0;
  let totalPlayers = 0;
  let totalCoaches = 0;

  for (const region of regions) {
    const cities = CITIES_BY_REGION[region.slug] ?? ["Miasto"];
    const allGroups = region.leagueLevels.flatMap((ll) => ll.groups);

    // Skip regions that already have test clubs
    const existingClubs = await db.club.count({ where: { regionId: region.id } });
    if (existingClubs >= allGroups.length * CLUBS_PER_GROUP) {
      console.log(`⏭️  ${region.name} — already seeded (${existingClubs} clubs), skipping`);
      totalClubs += existingClubs;
      const existingPlayers = await db.player.count({ where: { regionId: region.id } });
      totalPlayers += existingPlayers;
      const existingCoaches = await db.coach.count({ where: { regionId: region.id } });
      totalCoaches += existingCoaches;
      // Advance email counter to avoid collisions
      emailCounter += existingClubs + existingPlayers + existingCoaches;
      continue;
    }

    console.log(`📍 ${region.name} — ${allGroups.length} grup`);

    // ── CLUBS + PLAYERS per group ───────────────────────────
    for (const group of allGroups) {
      // Batch: create all club users for this group
      const clubData = Array.from({ length: CLUBS_PER_GROUP }, (_, i) => {
        const city = pick(cities, group.id * 100 + i);
        const prefix = pick(CLUB_PREFIXES, group.id * 10 + i);
        const clubName = `${prefix} ${city}`;
        return { clubName, city, index: i };
      });

      for (const cd of clubData) {
        const clubEmail = uniqueEmail("club");

        // Create user + club
        const clubUser = await db.user.create({
          data: {
            email: clubEmail,
            passwordHash: PASSWORD_HASH,
            role: "CLUB",
            isVerified: true,
            club: {
              create: {
                name: cd.clubName,
                city: cd.city,
                regionId: region.id,
                leagueGroupId: group.id,
                contactEmail: clubEmail,
              },
            },
          },
          include: { club: true },
        });

        totalClubs++;

        // Create players for this club's region
        const playerCreates = Array.from(
          { length: PLAYERS_PER_CLUB },
          (_, pi) => {
            const seed = group.id * 1000 + cd.index * 100 + pi;
            const firstName = pick(FIRST_NAMES_MALE, seed);
            const lastName = pick(LAST_NAMES, seed + 7);
            const primaryPos = SQUAD_TEMPLATE[pi % SQUAD_TEMPLATE.length];
            const secondaryPos = pick(
              POSITIONS.filter((p) => p !== primaryPos),
              seed + 3
            );
            const foot = (["RIGHT", "LEFT", "BOTH"] as const)[seed % 3];

            return {
              email: uniqueEmail("player"),
              firstName,
              lastName,
              primaryPos,
              secondaryPos,
              foot,
              city: pick(cities, seed + 5),
              heightCm: randomInt(168, 195, seed),
              weightKg: randomInt(62, 92, seed),
              yearOffset: randomInt(18, 35, seed + 2),
            };
          }
        );

        // Create player users + profiles sequentially (no transaction timeout)
        for (const p of playerCreates) {
          await db.user.create({
            data: {
              email: p.email,
              passwordHash: PASSWORD_HASH,
              role: "PLAYER",
              isVerified: true,
              player: {
                create: {
                  firstName: p.firstName,
                  lastName: p.lastName,
                  city: p.city,
                  regionId: region.id,
                  heightCm: p.heightCm,
                  weightKg: p.weightKg,
                  preferredFoot: p.foot,
                  primaryPosition: p.primaryPos,
                  secondaryPosition: p.secondaryPos,
                  dateOfBirth: new Date(
                    2026 - p.yearOffset,
                    (p.heightCm % 12),
                    (p.weightKg % 28) + 1
                  ),
                  bio: `Zawodnik testowy — ${p.primaryPos}, ${p.city}`,
                },
              },
            },
          });
        }

        totalPlayers += PLAYERS_PER_CLUB;
      }
    }

    // ── COACHES per region ──────────────────────────────────
    const coachCreates = Array.from(
      { length: COACHES_PER_REGION },
      (_, ci) => {
        const seed = region.id * 100 + ci;
        return {
          email: uniqueEmail("coach"),
          firstName: pick(FIRST_NAMES_MALE, seed + 20),
          lastName: pick(LAST_NAMES, seed + 13),
          specialization: pick(COACH_SPECIALIZATIONS, ci),
          level: pick(COACH_LEVELS, seed),
          city: pick(cities, seed + 2),
        };
      }
    );

    for (const c of coachCreates) {
      await db.user.create({
        data: {
          email: c.email,
          passwordHash: PASSWORD_HASH,
          role: "COACH",
          isVerified: true,
          coach: {
            create: {
              firstName: c.firstName,
              lastName: c.lastName,
              specialization: c.specialization,
              level: c.level,
              city: c.city,
              regionId: region.id,
              bio: `Trener testowy — ${c.specialization}, ${c.level}`,
            },
          },
        },
      });
    }

    totalCoaches += COACHES_PER_REGION;

    console.log(
      `   ✅ ${allGroups.length * CLUBS_PER_GROUP} klubów, ${allGroups.length * CLUBS_PER_GROUP * PLAYERS_PER_CLUB} graczy, ${COACHES_PER_REGION} trenerów`
    );
  }

  console.log(`\n🏁 Gotowe!`);
  console.log(`   Kluby:      ${totalClubs}`);
  console.log(`   Zawodnicy:  ${totalPlayers}`);
  console.log(`   Trenerzy:   ${totalCoaches}`);
  console.log(`   Hasło:      Test123!`);
  console.log(`   Email:      test.{club|player|coach}.N@pilkasport.test`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
