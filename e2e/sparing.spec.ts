import { test, expect } from "@playwright/test";
import { uniqueEmail, registerClub, login } from "./helpers";

const PASSWORD = "TestHaslo123!";

test.describe.serial("Sparingi", () => {
  const clubAEmail = uniqueEmail("sparA");
  const clubBEmail = uniqueEmail("sparB");
  let sparingUrl: string;

  test("klub A tworzy sparing", async ({ page }) => {
    await registerClub(page, clubAEmail, PASSWORD, "Klub Sparing A");
    await login(page, clubAEmail, PASSWORD);

    await page.goto("/sparings/new");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("Nowy sparing")).toBeVisible();

    const tomorrow = new Date(Date.now() + 86400000);
    const dateStr = tomorrow.toISOString().slice(0, 16);
    await page.fill("#title", "Sparing testowy E2E");
    await page.fill("#matchDate", dateStr);
    await page.fill("#location", "Boisko Testowe, Warszawa");
    await page.fill("#costSplitInfo", "50/50");
    await page.fill("textarea", "Opis testowy sparingu");

    await page.getByRole("button", { name: "Utwórz sparing" }).click();

    // Wait for redirect to detail page (not /sparings/new)
    await page.waitForURL(/\/sparings\/(?!new)/, { timeout: 15000 });
    await expect(page.getByText("Boisko Testowe, Warszawa")).toBeVisible();

    sparingUrl = page.url();
  });

  test("lista sparingów zawiera utworzony sparing", async ({ page }) => {
    await login(page, clubAEmail, PASSWORD);
    await page.goto("/sparings");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("Sparing testowy E2E").first()).toBeVisible();
  });

  test("klub B aplikuje na sparing", async ({ page }) => {
    test.skip(!sparingUrl, "requires sparing created by previous test");
    await registerClub(page, clubBEmail, PASSWORD, "Klub Sparing B");
    await login(page, clubBEmail, PASSWORD);

    await page.goto(sparingUrl);
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("Sparing testowy E2E")).toBeVisible();

    await page.fill('input[placeholder="Wiadomość (opcjonalna)"]', "Chcemy zagrać!");
    await page.getByRole("button", { name: "Aplikuj" }).click();

    // After applying, the application should appear with "Oczekuje" status
    await expect(page.getByText("Oczekuje")).toBeVisible({ timeout: 15000 });
    await expect(page.getByText("Chcemy zagrać!")).toBeVisible();
  });

  test("klub A widzi zgłoszenie i akceptuje", async ({ page }) => {
    test.skip(!sparingUrl, "requires sparing created by previous test");
    await login(page, clubAEmail, PASSWORD);
    await page.goto(sparingUrl);
    await page.waitForLoadState("networkidle");

    // Wait for applications to load — check that count > 0
    await expect(page.getByText(/Zgłoszenia \([1-9]/)).toBeVisible({ timeout: 15000 });
    await expect(page.getByText("Chcemy zagrać!")).toBeVisible();

    await page.getByRole("button", { name: "Akceptuj" }).click();

    await expect(page.getByText("Dopasowany")).toBeVisible();
  });
});
