import {
  generateRoundRobin,
  generateKnockoutBracket,
  recalculateStandings,
  getNextPhase,
} from "@/server/tournament-logic";

describe("generateRoundRobin", () => {
  it("generates correct number of matches for 4 teams", () => {
    const matches = generateRoundRobin(["A", "B", "C", "D"]);
    expect(matches).toHaveLength(6);
  });

  it("generates correct number of matches for 3 teams", () => {
    const matches = generateRoundRobin(["A", "B", "C"]);
    expect(matches).toHaveLength(3);
  });

  it("every team plays every other team exactly once", () => {
    const teams = ["A", "B", "C", "D"];
    const matches = generateRoundRobin(teams);
    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        const found = matches.some(
          ([h, a]) => (h === teams[i] && a === teams[j]) || (h === teams[j] && a === teams[i])
        );
        expect(found, `${teams[i]} vs ${teams[j]} should exist`).toBe(true);
      }
    }
  });

  it("handles 6 teams", () => {
    const matches = generateRoundRobin(["A", "B", "C", "D", "E", "F"]);
    expect(matches).toHaveLength(15);
  });
});

describe("generateKnockoutBracket", () => {
  it("generates semifinal + final + 3rd place for 4 teams", () => {
    const teams = [
      { id: "A", seed: 1 }, { id: "B", seed: 2 },
      { id: "C", seed: 3 }, { id: "D", seed: 4 },
    ];
    const matches = generateKnockoutBracket(teams);
    expect(matches.filter(m => m.phase === "SEMI_FINAL")).toHaveLength(2);
    expect(matches.filter(m => m.phase === "FINAL")).toHaveLength(1);
    expect(matches.filter(m => m.phase === "THIRD_PLACE")).toHaveLength(1);
  });

  it("generates QF + SF + final for 8 teams", () => {
    const teams = Array.from({ length: 8 }, (_, i) => ({ id: String(i), seed: i + 1 }));
    const matches = generateKnockoutBracket(teams);
    expect(matches.filter(m => m.phase === "QUARTER_FINAL")).toHaveLength(4);
    expect(matches.filter(m => m.phase === "SEMI_FINAL")).toHaveLength(2);
  });

  it("seeds 1 vs 4, 2 vs 3 in semis for 4 teams", () => {
    const teams = [
      { id: "A", seed: 1 }, { id: "B", seed: 2 },
      { id: "C", seed: 3 }, { id: "D", seed: 4 },
    ];
    const matches = generateKnockoutBracket(teams);
    const semis = matches.filter(m => m.phase === "SEMI_FINAL");
    expect(semis[0].homeId).toBe("A");
    expect(semis[0].awayId).toBe("D");
    expect(semis[1].homeId).toBe("B");
    expect(semis[1].awayId).toBe("C");
  });
});

describe("recalculateStandings", () => {
  it("calculates 3 points for win", () => {
    const matches = [{ homeTeamId: "A", awayTeamId: "B", homeScore: 2, awayScore: 1 }];
    const standings = recalculateStandings(matches, ["A", "B"]);
    expect(standings.find(s => s.teamId === "A")!.points).toBe(3);
    expect(standings.find(s => s.teamId === "B")!.points).toBe(0);
  });

  it("calculates 1 point each for draw", () => {
    const matches = [{ homeTeamId: "A", awayTeamId: "B", homeScore: 1, awayScore: 1 }];
    const standings = recalculateStandings(matches, ["A", "B"]);
    expect(standings.find(s => s.teamId === "A")!.points).toBe(1);
    expect(standings.find(s => s.teamId === "B")!.points).toBe(1);
  });

  it("sorts by points then goal diff then goals for", () => {
    const matches = [
      { homeTeamId: "A", awayTeamId: "B", homeScore: 2, awayScore: 0 },
      { homeTeamId: "A", awayTeamId: "C", homeScore: 1, awayScore: 1 },
      { homeTeamId: "B", awayTeamId: "C", homeScore: 1, awayScore: 0 },
    ];
    const standings = recalculateStandings(matches, ["A", "B", "C"]);
    expect(standings[0].teamId).toBe("A");
    expect(standings[1].teamId).toBe("B");
    expect(standings[2].teamId).toBe("C");
  });
});

describe("getNextPhase", () => {
  it("QUARTER_FINAL → SEMI_FINAL", () => { expect(getNextPhase("QUARTER_FINAL")).toBe("SEMI_FINAL"); });
  it("SEMI_FINAL → FINAL", () => { expect(getNextPhase("SEMI_FINAL")).toBe("FINAL"); });
  it("FINAL → null", () => { expect(getNextPhase("FINAL")).toBeNull(); });
});
