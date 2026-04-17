import { test, expect } from "@playwright/test";
import {
  registerClub,
  login,
  uniqueEmail,
  completeClubOnboarding,
  createQuickSparing,
  logout,
} from "./helpers";

test.describe("Quick apply inline on SparingCard", () => {
  test("CLUB B sees inline 'Aplikuj' on club A's sparing and can 1-click apply", async ({ page }) => {
    const passwordA = "TestPasswordA123!";
    const passwordB = "TestPasswordB123!";
    const emailA = uniqueEmail("qa-host");
    const emailB = uniqueEmail("qa-applicant");
    const clubA = `QA Host ${Date.now()}`;
    const clubB = `QA Applicant ${Date.now()}`;

    // Club A hosts a sparing.
    await registerClub(page, emailA, passwordA, clubA);
    if (page.url().includes("/login")) await login(page, emailA, passwordA);
    await completeClubOnboarding(page);

    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const dateISO = tomorrow.toISOString().slice(0, 16);
    await createQuickSparing(page, { dateISO, location: "Stadion QA" });

    // Club B lands on /sparings and sees inline Aplikuj.
    await logout(page);
    await registerClub(page, emailB, passwordB, clubB);
    if (page.url().includes("/login")) await login(page, emailB, passwordB);
    await completeClubOnboarding(page);

    await page.goto("/sparings");
    await page.waitForLoadState("networkidle");

    // Inline quick-apply button on a card.
    const applyBtn = page.getByRole("button", { name: /^Aplikuj$/ }).first();
    await expect(applyBtn).toBeVisible({ timeout: 10000 });
    await applyBtn.click();

    // After successful quick-apply, the button should flip to "Aplikowano"
    // or a disabled state (sparing.checkApplications query refetched).
    await expect(
      page.getByRole("button", { name: /Aplikowano|Zastosowano|Oczekuje/ }).first(),
    ).toBeVisible({ timeout: 10000 });
  });
});
