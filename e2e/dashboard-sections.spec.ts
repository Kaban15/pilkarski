import { test, expect, type Page } from "@playwright/test";
import { uniqueEmail, registerClub, registerPlayer } from "./helpers";

// Workaround for cookie race between router.push and middleware after signIn —
// after submitting the login form, force a hard goto to /feed so the browser
// sends the freshly-set session cookie on the next request.
async function robustLogin(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.fill("#email", email);
  await page.fill("#password", password);
  await page.getByRole("button", { name: "Zaloguj się" }).click();
  await page
    .waitForResponse(
      (r) => r.url().includes("/api/auth/callback/credentials"),
      { timeout: 10000 },
    )
    .catch(() => {});
  await page.goto("/feed");
  await page.waitForLoadState("networkidle");
  if (page.url().includes("/login")) {
    throw new Error(`Login failed for ${email}: ${page.url()}`);
  }
}

test.describe("Dashboard Sections (Etap 51)", () => {
  const clubEmail = uniqueEmail("sections-club");
  const password = "TestPassword123!";

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await registerClub(page, clubEmail, password, "Sections FC");
    if (page.url().includes("/login")) {
      await robustLogin(page, clubEmail, password);
    } else {
      await page.waitForLoadState("networkidle");
    }
    // Complete onboarding by picking a region — persists regionId in DB,
    // so subsequent tests skip the onboarding banner and render SectionNav.
    await expect(page.getByText("Witaj w PilkaSport!")).toBeVisible();
    await page.getByRole("combobox").first().click();
    await page.getByRole("option").first().click();
    await page.getByRole("button", { name: /Zapisz i dalej/ }).click();
    await expect(page.getByRole("link", { name: /Dodaj sparing/ })).toBeVisible();
    await page.close();
  });

  test("SectionNav visible in right panel on desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await robustLogin(page, clubEmail, password);

    const rightPanel = page.locator("aside").filter({ hasText: "Sekcje" });
    await expect(rightPanel).toBeVisible();

    for (const label of [
      "Aktywność",
      "Terminarz",
      "Rekrutacja",
      "Szukający klubu",
      "Nowe kluby",
    ]) {
      await expect(rightPanel.getByRole("button", { name: label })).toBeVisible();
    }
  });

  test("clicking section nav updates URL query param", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await robustLogin(page, clubEmail, password);

    const rightPanel = page.locator("aside").filter({ hasText: "Sekcje" });

    await rightPanel.getByRole("button", { name: "Rekrutacja" }).click();
    await expect(page).toHaveURL(/\?section=recruitment/);

    await rightPanel.getByRole("button", { name: "Szukający klubu" }).click();
    await expect(page).toHaveURL(/\?section=players/);

    // "Terminarz" is the default — clicking removes the param
    await rightPanel.getByRole("button", { name: "Terminarz" }).click();
    await expect(page).not.toHaveURL(/\?section=/);
  });

  test("position filter pills visible in PlayersSection", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await robustLogin(page, clubEmail, password);
    await page.goto("/feed?section=players");

    await expect(
      page.getByRole("heading", { name: /Zawodnicy szukający klubu/ }),
    ).toBeVisible();

    for (const label of ["Wszyscy", "Bramkarze", "Obrońcy", "Pomocnicy", "Napastnicy"]) {
      await expect(page.getByRole("button", { name: label })).toBeVisible();
    }
  });

  test("SectionNavMobile pill bar visible on mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await robustLogin(page, clubEmail, password);

    // Mobile nav renders before the (hidden) RightPanel in DOM order,
    // so .first() picks the visible mobile pill.
    await expect(page.getByRole("button", { name: "Aktywność" }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Rekrutacja" }).first()).toBeVisible();
  });

  test("PLAYER dashboard does not show SectionNav", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    const playerEmail = uniqueEmail("sections-player");
    await registerPlayer(page, playerEmail, password, "Jan", "Testowy");
    if (page.url().includes("/login")) {
      await robustLogin(page, playerEmail, password);
    } else {
      await page.waitForLoadState("networkidle");
    }

    await expect(page.locator("aside").filter({ hasText: "Sekcje" })).toHaveCount(0);
  });
});
