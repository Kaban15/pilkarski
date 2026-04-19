import { type Page, expect } from "@playwright/test";

/**
 * Generate a unique email for test isolation.
 */
export function uniqueEmail(prefix: string) {
  return `${prefix}-${Date.now()}@test.pilkasport.pl`;
}

/**
 * Register a new club account via the UI.
 */
export async function registerClub(
  page: Page,
  email: string,
  password: string,
  clubName: string,
) {
  await page.goto("/register");
  await page.getByRole("button", { name: "Klub" }).click();
  await page.fill("#email", email);
  await page.fill("#password", password);
  await page.fill("#clubName", clubName);
  await page.getByRole("button", { name: "Zarejestruj się" }).click();
  // Auto-login redirects to /feed, fallback to /login?registered=true
  await page.waitForURL(/\/(feed|login)/, { timeout: 15000 });
}

/**
 * Register a new player account via the UI.
 */
export async function registerPlayer(
  page: Page,
  email: string,
  password: string,
  firstName: string,
  lastName: string,
) {
  await page.goto("/register");
  await page.getByRole("button", { name: "Zawodnik" }).click();
  await page.fill("#email", email);
  await page.fill("#password", password);
  await page.fill("#firstName", firstName);
  await page.fill("#lastName", lastName);
  await page.getByRole("button", { name: "Zarejestruj się" }).click();
  await page.waitForURL(/\/(feed|login)/, { timeout: 15000 });
}

/**
 * Register a new coach account via the UI.
 */
export async function registerCoach(
  page: Page,
  email: string,
  password: string,
  firstName: string,
  lastName: string,
) {
  await page.goto("/register");
  await page.getByRole("button", { name: "Trener" }).click();
  await page.fill("#email", email);
  await page.fill("#password", password);
  await page.fill("#firstName", firstName);
  await page.fill("#lastName", lastName);
  await page.getByRole("button", { name: "Zarejestruj się" }).click();
  await page.waitForURL(/\/(feed|login)/, { timeout: 15000 });
}

/**
 * Log in via the UI. After signIn, force a hard goto to /feed to avoid
 * a cookie race between client-side router.push and middleware.
 */
export async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.fill("#email", email);
  await page.fill("#password", password);
  await page.getByRole("button", { name: "Zaloguj się" }).click();
  await page
    .waitForResponse(
      (r) => r.url().includes("/api/auth/callback/credentials"),
      { timeout: 15000 },
    )
    .catch(() => {});
  await page.goto("/feed");
  await page.waitForLoadState("networkidle");
  if (page.url().includes("/login")) {
    throw new Error(`Login failed for ${email}: ${page.url()}`);
  }
}

/**
 * Log out via the nav menu (works on desktop viewport).
 */
export async function logout(page: Page) {
  await page.getByRole("button", { name: "Wyloguj" }).click();
  await page.waitForURL("**/login", { timeout: 10000 });
}

/**
 * Dismiss the club onboarding wizard by picking the first region and saving.
 * Idempotent — no-op if banner is not visible (already onboarded).
 */
export async function completeClubOnboarding(page: Page) {
  const banner = page.getByText("Witaj w PilkaSport!");
  const bannerVisible = await banner
    .waitFor({ state: "visible", timeout: 15000 })
    .then(() => true)
    .catch(() => false);
  if (!bannerVisible) return;
  await page.getByRole("combobox").first().click();
  const firstOption = page.getByRole("option").first();
  await expect(firstOption).toBeVisible({ timeout: 5000 });
  await firstOption.click();
  const submit = page.getByRole("button", { name: /Zapisz i dalej/ });
  await expect(submit).toBeEnabled({ timeout: 5000 });
  const [response] = await Promise.all([
    page.waitForResponse(
      (r) => r.url().includes("club.update") && r.request().method() === "POST",
      { timeout: 15000 },
    ),
    submit.click(),
  ]);
  if (!response.ok()) throw new Error(`club.update failed: ${response.status()}`);
  await expect(page.getByText("Znajdź rywala na mecz sparingowy")).toBeVisible({ timeout: 10000 });
}

/**
 * Create a sparing offer using the Quick mode. Returns the sparing ID
 * parsed from the resulting URL (/sparings/{uuid}).
 */
export async function createQuickSparing(
  page: Page,
  opts: { dateISO: string; location?: string },
): Promise<string> {
  await page.goto("/sparings/new");
  await page.getByRole("button", { name: /Szybki sparing/ }).click();
  await page.locator('input[type="datetime-local"]').fill(opts.dateISO);
  if (opts.location) {
    await page
      .locator('input[placeholder*="Stadion"], input[placeholder*="Miejsce"]')
      .first()
      .fill(opts.location);
  }
  await page.getByRole("button", { name: /Opublikuj sparing/ }).click();
  await page.waitForURL(/\/sparings\/[0-9a-f-]+$/, { timeout: 15000 });
  const match = page.url().match(/\/sparings\/([0-9a-f-]+)$/);
  if (!match) throw new Error(`Could not parse sparing ID from ${page.url()}`);
  return match[1];
}

/**
 * Apply to a sparing as the currently-logged-in club.
 * Single click on the inline Apply button; waits for justApplied state
 * (button disables + switches to "Wysłano").
 */
export async function applyToSparing(page: Page, sparingId: string) {
  await page.goto(`/sparings/${sparingId}`);
  const submit = page.getByTestId("sparing-apply-submit");
  await expect(submit).toBeEnabled({ timeout: 10000 });
  const [response] = await Promise.all([
    page.waitForResponse(
      (r) => r.url().includes("sparing.applyFor") && r.request().method() === "POST",
      { timeout: 20000 },
    ),
    submit.click(),
  ]);
  if (!response.ok()) throw new Error(`applyFor failed: ${response.status()}`);
  await expect(submit).toContainText(/Wysłano/i, { timeout: 5000 });
}
