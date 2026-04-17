import { updateClubSchema } from "@/lib/validators/profile";

describe("updateClubSchema — coverUrl", () => {
  it("accepts valid https coverUrl", () => {
    const r = updateClubSchema.safeParse({
      name: "Test Klub",
      coverUrl: "https://cdn.example.com/clubs-covers/abc.webp",
    });
    expect(r.success).toBe(true);
  });

  it("rejects non-URL string", () => {
    const r = updateClubSchema.safeParse({
      name: "Test Klub",
      coverUrl: "not-a-url",
    });
    expect(r.success).toBe(false);
  });

  it("allows omitted coverUrl", () => {
    const r = updateClubSchema.safeParse({ name: "Test Klub" });
    expect(r.success).toBe(true);
  });

  it("rejects URL over 500 chars", () => {
    const longUrl = "https://x.example.com/" + "a".repeat(500);
    const r = updateClubSchema.safeParse({ name: "Test Klub", coverUrl: longUrl });
    expect(r.success).toBe(false);
  });
});
