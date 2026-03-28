export function generateRoundRobin(teamIds: string[]): Array<[string, string]> {
  const matches: Array<[string, string]> = [];
  const n = teamIds.length;
  const teams = [...teamIds];

  if (n % 2 !== 0) teams.push("__BYE__");
  const totalRounds = teams.length - 1;

  for (let round = 0; round < totalRounds; round++) {
    for (let i = 0; i < teams.length / 2; i++) {
      const home = teams[i];
      const away = teams[teams.length - 1 - i];
      if (home !== "__BYE__" && away !== "__BYE__") {
        matches.push([home, away]);
      }
    }
    const last = teams.pop()!;
    teams.splice(1, 0, last);
  }

  return matches;
}

interface SeedTeam { id: string; seed: number; }
interface BracketMatch { homeId: string; awayId: string; phase: string; matchOrder: number; }

export function generateKnockoutBracket(teams: SeedTeam[]): BracketMatch[] {
  const sorted = [...teams].sort((a, b) => a.seed - b.seed);
  const n = sorted.length;
  const matches: BracketMatch[] = [];

  let firstPhase: string;
  if (n <= 4) firstPhase = "SEMI_FINAL";
  else if (n <= 8) firstPhase = "QUARTER_FINAL";
  else firstPhase = "ROUND_OF_16";

  for (let i = 0; i < n / 2; i++) {
    matches.push({ homeId: sorted[i].id, awayId: sorted[n - 1 - i].id, phase: firstPhase, matchOrder: i });
  }

  let currentRoundSize = n / 2;
  let currentPhase = firstPhase;
  let orderOffset = n / 2;

  while (currentRoundSize > 1) {
    const nextPhase = getNextPhase(currentPhase);
    if (!nextPhase) break;
    const nextRoundSize = currentRoundSize / 2;
    for (let i = 0; i < nextRoundSize; i++) {
      matches.push({ homeId: "__TBD__", awayId: "__TBD__", phase: nextPhase, matchOrder: orderOffset + i });
    }
    if (nextPhase === "FINAL") {
      matches.push({ homeId: "__TBD__", awayId: "__TBD__", phase: "THIRD_PLACE", matchOrder: orderOffset + nextRoundSize });
    }
    orderOffset += nextRoundSize + (nextPhase === "FINAL" ? 1 : 0);
    currentRoundSize = nextRoundSize;
    currentPhase = nextPhase;
  }

  return matches;
}

interface ConfirmedMatch { homeTeamId: string; awayTeamId: string; homeScore: number; awayScore: number; }
interface StandingRow { teamId: string; played: number; won: number; drawn: number; lost: number; goalsFor: number; goalsAgainst: number; points: number; }

export function recalculateStandings(matches: ConfirmedMatch[], teamIds: string[]): StandingRow[] {
  const map = new Map<string, StandingRow>();
  for (const id of teamIds) {
    map.set(id, { teamId: id, played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0 });
  }

  for (const m of matches) {
    const home = map.get(m.homeTeamId)!;
    const away = map.get(m.awayTeamId)!;
    home.played++; away.played++;
    home.goalsFor += m.homeScore; home.goalsAgainst += m.awayScore;
    away.goalsFor += m.awayScore; away.goalsAgainst += m.homeScore;

    if (m.homeScore > m.awayScore) { home.won++; home.points += 3; away.lost++; }
    else if (m.homeScore < m.awayScore) { away.won++; away.points += 3; home.lost++; }
    else { home.drawn++; away.drawn++; home.points += 1; away.points += 1; }
  }

  return Array.from(map.values()).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    const gdA = a.goalsFor - a.goalsAgainst;
    const gdB = b.goalsFor - b.goalsAgainst;
    if (gdB !== gdA) return gdB - gdA;
    return b.goalsFor - a.goalsFor;
  });
}

export function getNextPhase(phase: string): string | null {
  const order: Record<string, string> = {
    ROUND_OF_16: "QUARTER_FINAL",
    QUARTER_FINAL: "SEMI_FINAL",
    SEMI_FINAL: "FINAL",
  };
  return order[phase] ?? null;
}
