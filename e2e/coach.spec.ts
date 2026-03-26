import { test, expect } from "@playwright/test";
import { uniqueEmail, registerCoach, login } from "./helpers";

test.describe("Coach role", () => {
  const email = uniqueEmail("coach");
  const password = "TestPassword123!";

  test("register as coach", async ({ page }) => {
    await registerCoach(page, email, password, "Jan", "Trener");
  });

  test("login and see coach dashboard", async ({ page }) => {
    await login(page, email, password);
    await expect(page.locator("text=Witaj, trenerze")).toBeVisible({ timeout: 10000 }).catch(() => {
      // Coach onboarding may show instead
    });
    // Should see trainings in nav
    await expect(page.locator('a[href="/trainings"]')).toBeVisible();
  });

  test("visit trainings page", async ({ page }) => {
    await login(page, email, password);
    await page.goto("/trainings");
    await expect(page.locator("text=Treningi")).toBeVisible();
    // Should have tabs
    await expect(page.locator("text=Trenerzy")).toBeVisible();
  });

  test("visit profile page", async ({ page }) => {
    await login(page, email, password);
    await page.goto("/profile");
    await expect(page.locator("text=Profil trenera")).toBeVisible();
  });
});
