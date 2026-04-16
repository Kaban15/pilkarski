import { test, expect } from "@playwright/test";
import { uniqueEmail, registerClub, login } from "./helpers";

// Hoisted outside describe so all tests share the same email (describe body
// can be re-evaluated per test, which would produce a new user each time).
const email = uniqueEmail("recruit");
const password = "TestPassword123!";

test.describe.serial("Recruitment board", () => {
  test("register club and visit recruitment page", async ({ page }) => {
    await registerClub(page, email, password, "Rekrutacja FC");
    await login(page, email, password);
    await page.goto("/recruitment");
    await expect(page.getByRole("heading", { name: "Pipeline" })).toBeVisible();
  });

  test("see board/list toggle", async ({ page }) => {
    await login(page, email, password);
    await page.goto("/recruitment");
    await expect(page.getByTitle("Widok listy")).toBeVisible();
    await expect(page.getByTitle("Widok tablicy")).toBeVisible();
  });

  test("empty pipeline shows CTA", async ({ page }) => {
    await login(page, email, password);
    await page.goto("/recruitment");
    await expect(page.locator("text=Pusty pipeline")).toBeVisible();
    await expect(page.locator("text=Przeglądaj transfery")).toBeVisible();
  });

  test("switch to board view", async ({ page }) => {
    await login(page, email, password);
    await page.goto("/recruitment");
    await page.getByTitle("Widok tablicy").click();
    // Board view shows stage column headers
    await expect(page.locator("text=Radar")).toBeVisible();
  });
});
