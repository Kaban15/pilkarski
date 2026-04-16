import { test, expect } from "@playwright/test";
import { uniqueEmail, registerClub, registerPlayer, login } from "./helpers";

const PASSWORD = "TestHaslo123!";

test.describe.serial("Sparing — wizard, complete, player view", () => {
  const clubAEmail = uniqueEmail("wizA");
  const clubBEmail = uniqueEmail("wizB");
  const playerEmail = uniqueEmail("wizP");
  let sparingUrl: string;

  test("club creates sparing via multi-step wizard", async ({ page }) => {
    await registerClub(page, clubAEmail, PASSWORD, "Wizard Klub A");
    await login(page, clubAEmail, PASSWORD);

    await page.goto("/sparings/new");
    await page.waitForLoadState("networkidle");

    // Step 1 — Dane sparingu
    await expect(page.getByText("Dane sparingu")).toBeVisible();
    await page.fill("#title", "Wizard E2E Sparing");

    // Click Dalej to go to step 2
    await page.getByRole("button", { name: "Dalej" }).click();

    // Step 2 — Termin i miejsce
    await expect(page.getByText("Termin i miejsce")).toBeVisible();
    const tomorrow = new Date(Date.now() + 86400000);
    const dateStr = tomorrow.toISOString().slice(0, 16);
    await page.fill("#matchDate", dateStr);
    await page.fill("#location", "Stadion Wizard");

    await page.getByRole("button", { name: "Dalej" }).click();

    // Step 3 — Podsumowanie
    await expect(page.getByText("Podsumowanie")).toBeVisible();
    await expect(page.getByText("Wizard E2E Sparing").first()).toBeVisible();
    await expect(page.getByText("Stadion Wizard")).toBeVisible();

    await page.getByRole("button", { name: "Opublikuj sparing" }).click();

    // Should redirect to detail page
    await page.waitForURL(/\/sparings\/(?!new)/, { timeout: 15000 });
    await expect(page.getByText("Wizard E2E Sparing").first()).toBeVisible();
    sparingUrl = page.url();
  });

  test("club B applies and already-applied state shows", async ({ page }) => {
    await registerClub(page, clubBEmail, PASSWORD, "Wizard Klub B");
    await login(page, clubBEmail, PASSWORD);

    await page.goto(sparingUrl);
    await page.waitForLoadState("networkidle");

    // Apply
    await page.getByRole("button", { name: "Aplikuj" }).click();
    await expect(page.getByText("Oczekuje").first()).toBeVisible({ timeout: 15000 });

    // Reload — should see already-applied state instead of apply form
    await page.reload();
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("Oczekuje").first()).toBeVisible({ timeout: 10000 });
  });

  test("club A accepts and completes sparing", async ({ page }) => {
    await login(page, clubAEmail, PASSWORD);
    await page.goto(sparingUrl);
    await page.waitForLoadState("networkidle");

    // Accept application
    await expect(page.getByText(/Zgłoszenia \([1-9]/).first()).toBeVisible({ timeout: 15000 });
    await page.getByRole("button", { name: "Akceptuj" }).click();
    await expect(page.getByText("Dopasowany").first()).toBeVisible({ timeout: 10000 });

    // Complete sparing
    await page.getByRole("button", { name: /Oznacz jako zakończony|Zakończ/ }).click();
    // Confirm dialog
    await page.getByRole("button", { name: /Tak, zakończ/ }).click();
    await expect(page.getByText("Zakończony")).toBeVisible({ timeout: 10000 });
  });

  test("player cannot see 'Dodaj sparing' button", async ({ page }) => {
    await registerPlayer(page, playerEmail, PASSWORD, "Wizard", "Player");
    await login(page, playerEmail, PASSWORD);

    await page.goto("/sparings");
    await page.waitForLoadState("networkidle");

    // Player should NOT see "Dodaj sparing" button
    await expect(page.getByRole("link", { name: /Dodaj sparing|Dodaj/ })).not.toBeVisible();

    // Navigate to a sparing detail — player should not see apply form
    await page.goto(sparingUrl);
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("button", { name: "Aplikuj" })).not.toBeVisible();
  });
});
