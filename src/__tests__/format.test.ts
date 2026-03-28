import { formatDate, formatShortDate, formatEventDateTime } from "@/lib/format";

describe("formatDate", () => {
  it("formats Date object with time in Polish", () => {
    const date = new Date("2026-03-28T16:00:00Z");
    const result = formatDate(date);
    expect(result).toContain("28");
    expect(result).toContain("2026");
    expect(result).toMatch(/\d{2}:\d{2}/);
  });

  it("formats string date", () => {
    const result = formatDate("2026-03-28T16:00:00Z");
    expect(result).toContain("28");
    expect(result).toContain("2026");
  });
});

describe("formatShortDate", () => {
  it("returns short date without time", () => {
    const result = formatShortDate(new Date("2026-03-28T16:00:00Z"));
    expect(result).toContain("28");
    expect(result).toContain("2026");
    expect(result).not.toMatch(/16:00/);
  });
});

describe("formatEventDateTime", () => {
  it("returns short date with time", () => {
    const result = formatEventDateTime(new Date("2026-03-28T16:00:00Z"));
    expect(result).toContain("28");
    expect(result).toMatch(/\d{2}:\d{2}/);
  });
});
