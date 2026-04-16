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
