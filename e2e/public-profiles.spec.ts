import { test, expect } from "@playwright/test";

test.describe("Publiczne profile (bez logowania)", () => {
  test("strona /clubs/nieistniejacy nie przekierowuje do logowania", async ({ page }) => {
    await page.goto("/clubs/00000000-0000-0000-0000-000000000000");
    const url = page.url();
    expect(url).not.toContain("/login");
  });

  test("strona /players/nieistniejacy nie przekierowuje do logowania", async ({ page }) => {
    await page.goto("/players/00000000-0000-0000-0000-000000000000");
    const url = page.url();
    expect(url).not.toContain("/login");
  });

  test("landing page jest dostępna", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "PilkaSport" })).toBeVisible();
    await expect(page.getByRole("link", { name: /Zarejestruj/i })).toBeVisible();
  });
});
