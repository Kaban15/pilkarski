import { test, expect } from "@playwright/test";
import { uniqueEmail, registerClub, login } from "./helpers";

const PASSWORD = "TestHaslo123!";

test.describe("Powiadomienia", () => {
  test("strona /notifications jest dostępna po zalogowaniu", async ({ page }) => {
    const email = uniqueEmail("notif");
    await registerClub(page, email, PASSWORD, "Klub Notif E2E");
    await login(page, email, PASSWORD);

    await page.goto("/notifications");
    await expect(page.getByRole("heading", { name: /Powiadomienia/i })).toBeVisible();
  });

  test("bell icon jest widoczny w nawigacji", async ({ page }) => {
    const email = uniqueEmail("bell");
    await registerClub(page, email, PASSWORD, "Klub Bell E2E");
    await login(page, email, PASSWORD);

    // Bell icon should be a link to /notifications
    const bellLink = page.locator('a[href="/notifications"]').first();
    await expect(bellLink).toBeVisible();
  });
});
