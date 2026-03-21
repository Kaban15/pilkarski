import { test, expect } from "@playwright/test";
import { uniqueEmail, registerClub, registerPlayer, login } from "./helpers";

const PASSWORD = "TestHaslo123!";

test.describe.serial("Wydarzenia", () => {
  const clubEmail = uniqueEmail("evClub");
  const playerEmail = uniqueEmail("evPlayer");
  let eventUrl: string;

  test("klub tworzy wydarzenie", async ({ page }) => {
    await registerClub(page, clubEmail, PASSWORD, "Klub Event E2E");
    await login(page, clubEmail, PASSWORD);

    await page.goto("/events/new");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("Nowe wydarzenie")).toBeVisible();

    const tomorrow = new Date(Date.now() + 86400000);
    const dateStr = tomorrow.toISOString().slice(0, 16);

    await page.selectOption("#type", "OPEN_TRAINING");
    await page.fill("#title", "Trening testowy E2E");
    await page.fill("#eventDate", dateStr);
    await page.fill("#location", "Hala Sportowa Testowa");
    await page.fill("#maxParticipants", "20");
    await page.fill("textarea", "Opis testowego treningu");

    await page.getByRole("button", { name: "Utwórz wydarzenie" }).click();

    // Wait for redirect to detail page (not /events/new)
    await page.waitForURL(/\/events\/(?!new)/, { timeout: 15000 });
    await expect(page.getByText("Hala Sportowa Testowa")).toBeVisible();

    eventUrl = page.url();
  });

  test("lista wydarzeń zawiera utworzone wydarzenie", async ({ page }) => {
    await login(page, clubEmail, PASSWORD);
    await page.goto("/events");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("Trening testowy E2E").first()).toBeVisible();
  });

  test("zawodnik zgłasza się na wydarzenie", async ({ page }) => {
    await registerPlayer(page, playerEmail, PASSWORD, "Anna", "Testowa");
    await login(page, playerEmail, PASSWORD);

    await page.goto(eventUrl);
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("Trening testowy E2E")).toBeVisible();

    await page.fill('input[placeholder="Wiadomość (opcjonalna)"]', "Chcę dołączyć!");
    await page.getByRole("button", { name: "Zgłoś się" }).click();

    // After applying, the application should appear with "Oczekuje" status
    await expect(page.getByText("Oczekuje")).toBeVisible({ timeout: 15000 });
    await expect(page.getByText("Chcę dołączyć!")).toBeVisible();
  });

  test("klub widzi zgłoszenie i akceptuje", async ({ page }) => {
    await login(page, clubEmail, PASSWORD);
    await page.goto(eventUrl);
    await page.waitForLoadState("networkidle");

    // Wait for applications to load — check that count > 0
    await expect(page.getByText(/Zgłoszenia \([1-9]/)).toBeVisible({ timeout: 15000 });
    await expect(page.getByText("Chcę dołączyć!")).toBeVisible();

    await page.getByRole("button", { name: "Akceptuj" }).click();

    await expect(page.getByText(/Zaakceptowany/i)).toBeVisible();
  });
});
