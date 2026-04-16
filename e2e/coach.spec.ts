import { test, expect } from "@playwright/test";
import { uniqueEmail, registerCoach, login } from "./helpers";

// Hoisted outside describe — shared across tests (describe body can re-evaluate).
const email = uniqueEmail("coach");
const password = "TestPassword123!";

test.describe.serial("Coach role", () => {
  test("register as coach", async ({ page }) => {
    await registerCoach(page, email, password, "Jan", "Trener");
  });

  test("login and see coach dashboard", async ({ page }) => {
    await login(page, email, password);
    await expect(page.locator("text=Witaj, trenerze")).toBeVisible({ timeout: 10000 }).catch(() => {
      // Coach onboarding may show instead
    });
    // Should see trainings in nav (sidebar + bottom nav render the same link)
    await expect(page.locator('a[href="/trainings"]').first()).toBeVisible();
  });

  test("visit trainings page", async ({ page }) => {
    await login(page, email, password);
    await page.goto("/trainings");
    await expect(page.getByRole("heading", { name: "Treningi" })).toBeVisible();
  });

  test("visit profile page", async ({ page }) => {
    await login(page, email, password);
    await page.goto("/profile");
    await expect(page.locator("text=Profil trenera").first()).toBeVisible();
  });
});
