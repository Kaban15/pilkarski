import { test, expect } from "@playwright/test";
import { uniqueEmail, registerClub, registerPlayer, login } from "./helpers";

const PASSWORD = "TestHaslo123!";

test.describe.serial("Wiadomości", () => {
  const clubEmail = uniqueEmail("msgClub");
  const playerEmail = uniqueEmail("msgPlayer");
  let sparingUrl: string;

  test("setup: rejestracja kont", async ({ page }) => {
    await registerClub(page, clubEmail, PASSWORD, "Klub Msg E2E");
    await registerPlayer(page, playerEmail, PASSWORD, "Marek", "Msgowy");
  });

  test("klub tworzy sparing", async ({ page }) => {
    await login(page, clubEmail, PASSWORD);
    await page.goto("/sparings/new");
    await page.waitForLoadState("networkidle");

    // Multi-step wizard: Dane → Termin → Podsumowanie
    await page.fill("#title", "Sparing MSG test");
    await page.getByRole("button", { name: "Dalej" }).click();

    const tomorrow = new Date(Date.now() + 86400000);
    await page.fill("#matchDate", tomorrow.toISOString().slice(0, 16));
    await page.fill("#location", "Testowe boisko");
    await page.getByRole("button", { name: "Dalej" }).click();

    await page.getByRole("button", { name: "Opublikuj sparing" }).click();

    await page.waitForURL(/\/sparings\/(?!new)/, { timeout: 15000 });
    await expect(page.getByText("Testowe boisko")).toBeVisible();

    sparingUrl = page.url();
  });

  test("zawodnik widzi przycisk wiadomości na sparingu", async ({ page }) => {
    test.skip(!sparingUrl, "requires sparing created by previous test");
    await login(page, playerEmail, PASSWORD);

    await page.goto(sparingUrl);
    await page.waitForLoadState("networkidle");

    await expect(page.getByText("Sparing MSG test").first()).toBeVisible({ timeout: 15000 });
    await expect(page.getByText("Napisz wiadomość").first()).toBeVisible();
  });

  test("lista konwersacji dostępna", async ({ page }) => {
    await login(page, clubEmail, PASSWORD);
    await page.goto("/messages");
    await page.waitForLoadState("networkidle");
    // h1 "Wiadomości" on the messages page
    await expect(page.locator("h1")).toContainText("Wiadomości");
  });
});
