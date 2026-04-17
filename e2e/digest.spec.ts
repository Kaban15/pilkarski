import { test, expect } from "@playwright/test";
import { registerClub, login, uniqueEmail } from "./helpers";

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

  // Requires a seed helper to create a pending sparing application for the signed-in CLUB.
  // Current e2e/helpers.ts does not expose that — deferred to a future stage.
  //
  // When the helper exists, the body will be:
  //   1. Register club A + register club B.
  //   2. Club A creates a sparing offer.
  //   3. Club B applies.
  //   4. Login as club A → /feed.
  //   5. expect(getByTestId("digest-card")).toBeVisible()
  //   6. expect(getByTestId("club.pendingSparingApplications")).toBeVisible()
  //   7. Click it → expect URL to include "/sparings"
  test.fixme(
    "CLUB with pending application sees digest row and navigates on click",
    async () => {},
  );
});
