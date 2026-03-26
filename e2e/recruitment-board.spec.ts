import { test, expect } from "@playwright/test";
import { uniqueEmail, registerClub, login } from "./helpers";

test.describe("Recruitment board", () => {
  const email = uniqueEmail("recruit");
  const password = "TestPassword123!";

  test("register club and visit recruitment page", async ({ page }) => {
    await registerClub(page, email, password, "Rekrutacja FC");
    await login(page, email, password);
    await page.goto("/recruitment");
    await expect(page.locator("text=Rekrutacja")).toBeVisible();
  });

  test("see board/list toggle", async ({ page }) => {
    await login(page, email, password);
    await page.goto("/recruitment");
    // Board view is default
    await expect(page.locator("text=Board")).toBeVisible();
    await expect(page.locator("text=Lista")).toBeVisible();
  });

  test("empty pipeline shows CTA", async ({ page }) => {
    await login(page, email, password);
    await page.goto("/recruitment");
    await expect(page.locator("text=Pusty pipeline")).toBeVisible();
    await expect(page.locator("text=Przeglądaj transfery")).toBeVisible();
  });

  test("switch to list view", async ({ page }) => {
    await login(page, email, password);
    await page.goto("/recruitment");
    await page.getByRole("button", { name: "Lista" }).click();
    // Should still show empty state or list view
    await expect(page.locator("text=Pusty pipeline")).toBeVisible();
  });
});
