import { test, expect, type Page } from "@playwright/test";
import {
  uniqueEmail,
  registerClub,
  registerPlayer,
  registerCoach,
  login,
} from "./helpers";

const password = "TestPassword123!";

async function onboardClub(page: Page) {
  await expect(page.getByText("Witaj w PilkaSport!")).toBeVisible({ timeout: 10000 });
  await page.getByRole("combobox").first().click();
  await page.getByRole("option").first().click();
  await page.getByRole("button", { name: /Zapisz i dalej/ }).click();
  await expect(page.getByRole("link", { name: /Dodaj sparing/ })).toBeVisible({ timeout: 10000 });
}

async function ensureOnDashboard(page: Page) {
  await page.waitForLoadState("networkidle");
  if (page.url().includes("/login")) {
    throw new Error(`Got bounced to /login from ${page.url()}`);
  }
}

async function assertUrlHandler(page: Page, url: string, expectedQuery: string) {
  const response = await page.goto(url);
  await page.waitForLoadState("networkidle");
  expect(response?.status(), `GET ${url}`).toBeLessThan(500);
  expect(page.url(), `URL preserved for ${url}`).toContain(expectedQuery);
  expect(page.url(), `no redirect to /login for ${url}`).not.toContain("/login");
  const body = await page.locator("body").textContent();
  expect(body, `no crash banner for ${url}`).not.toMatch(/Wystąpił błąd|Application error/);
}

test.describe("Digest URL handlers — smoke", () => {
  test("CLUB: 5 digest URLs open without redirect/crash", async ({ page }) => {
    const email = uniqueEmail("digest-url-club");
    await registerClub(page, email, password, `Digest URL Club ${Date.now()}`);
    if (page.url().includes("/login")) await login(page, email, password);
    await onboardClub(page);

    for (const [url, q] of [
      ["/events?filter=pending-attendance", "filter=pending-attendance"],
      ["/sparings?tab=applications", "tab=applications"],
      ["/sparings?tab=invitations", "tab=invitations"],
      ["/calendar?range=week", "range=week"],
      ["/recruitment?filter=stale", "filter=stale"],
    ] as const) {
      await assertUrlHandler(page, url, q);
    }
  });

  test("PLAYER: 3 digest URLs open without redirect/crash", async ({ page }) => {
    const email = uniqueEmail("digest-url-player");
    await registerPlayer(page, email, password, "Digest", `Player${Date.now()}`);
    if (page.url().includes("/login")) await login(page, email, password);
    await ensureOnDashboard(page);

    for (const [url, q] of [
      ["/events?tab=my-applications", "tab=my-applications"],
      ["/events?filter=recommended", "filter=recommended"],
      ["/calendar?range=week", "range=week"],
    ] as const) {
      await assertUrlHandler(page, url, q);
    }
  });

  test("COACH: 2 digest URLs open without redirect/crash", async ({ page }) => {
    const email = uniqueEmail("digest-url-coach");
    await registerCoach(page, email, password, "Digest", `Coach${Date.now()}`);
    if (page.url().includes("/login")) await login(page, email, password);
    await ensureOnDashboard(page);

    for (const [url, q] of [
      ["/trainings?tab=applications", "tab=applications"],
      ["/notifications?filter=invitations", "filter=invitations"],
    ] as const) {
      await assertUrlHandler(page, url, q);
    }
  });
});
