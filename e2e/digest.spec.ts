import { test, expect } from "@playwright/test";
import {
  registerClub,
  login,
  uniqueEmail,
  completeClubOnboarding,
  createQuickSparing,
  applyToSparing,
  logout,
} from "./helpers";

test.describe("Digest card", () => {
  test("new CLUB with zero activity does NOT see digest card", async ({ page }) => {
    const email = uniqueEmail("digest-empty");
    const password = "TestPassword123!";
    const clubName = `Digest Empty ${Date.now()}`;

    await registerClub(page, email, password, clubName);
    if (page.url().includes("/login")) {
      await login(page, email, password);
    } else {
      await page.waitForLoadState("networkidle");
    }

    // Dismiss onboarding so DigestCard actually renders — it is gated by
    // !showOnboarding in feed-client.tsx. Without this, the test would be
    // trivially green (digest hidden because onboarding banner is shown),
    // not a real verification of the totalCount === 0 guard.
    await expect(page.getByText("Witaj w PilkaSport!")).toBeVisible();
    await page.getByRole("combobox").first().click();
    await page.getByRole("option").first().click();
    await page.getByRole("button", { name: /Zapisz i dalej/ }).click();
    await expect(page.getByRole("link", { name: /Dodaj sparing/ })).toBeVisible();

    // Feed is ready; DigestCard mounts, queries, and should stay hidden
    // because a fresh club has totalCount === 0.
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible({ timeout: 10000 });

    // Let the trpc query settle (skeleton → null render).
    await page.waitForLoadState("networkidle");
    await expect(page.getByTestId("digest-card")).toHaveCount(0);
  });

  test("CLUB with pending application sees digest row and navigates on click", async ({ page }) => {
    const passwordA = "TestPasswordA123!";
    const passwordB = "TestPasswordB123!";
    const emailA = uniqueEmail("digest-host");
    const emailB = uniqueEmail("digest-applicant");
    const clubA = `Digest Host ${Date.now()}`;
    const clubB = `Digest Applicant ${Date.now()}`;

    // 1. Register club A (host) + onboard + create sparing.
    await registerClub(page, emailA, passwordA, clubA);
    if (page.url().includes("/login")) await login(page, emailA, passwordA);
    await completeClubOnboarding(page);

    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const dateISO = tomorrow.toISOString().slice(0, 16);
    const sparingId = await createQuickSparing(page, {
      dateISO,
      location: "Stadion Testowy",
    });

    // 2. Logout, register club B (applicant), onboard, apply.
    await logout(page);
    await registerClub(page, emailB, passwordB, clubB);
    if (page.url().includes("/login")) await login(page, emailB, passwordB);
    await completeClubOnboarding(page);
    await applyToSparing(page, sparingId);

    // 3. Logout, login as club A → /feed, digest card with pending row.
    await logout(page);
    await login(page, emailA, passwordA);
    await page.waitForLoadState("networkidle");

    const digest = page.getByTestId("digest-card");
    await expect(digest).toBeVisible({ timeout: 10000 });

    const row = page.getByTestId("club.pendingSparingApplications");
    await expect(row).toBeVisible();
    await row.click();
    await expect(page).toHaveURL(/\/sparings/);
  });
});
