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
  await page.getByRole("tab", { name: "Klub" }).click();
  await page.fill("#email", email);
  await page.fill("#password", password);
  await page.fill("#clubName", clubName);
  await page.getByRole("button", { name: "Zarejestruj się" }).click();
  await page.waitForURL("**/login?registered=true", { timeout: 15000 });
  await expect(page.getByText("Rejestracja udana")).toBeVisible();
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
  await page.getByRole("tab", { name: "Zawodnik" }).click();
  await page.fill("#email", email);
  await page.fill("#password", password);
  await page.fill("#firstName", firstName);
  await page.fill("#lastName", lastName);
  await page.getByRole("button", { name: "Zarejestruj się" }).click();
  await page.waitForURL("**/login?registered=true", { timeout: 15000 });
  await expect(page.getByText("Rejestracja udana")).toBeVisible();
}

/**
 * Log in via the UI and wait for redirect to /feed.
 */
export async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.fill("#email", email);
  await page.fill("#password", password);
  await page.getByRole("button", { name: "Zaloguj się" }).click();
  await page.waitForURL("**/feed", { timeout: 15000 });
  // Wait for page to fully load so session cookie is established
  await page.waitForLoadState("networkidle");
}

/**
 * Log out via the nav menu (works on desktop viewport).
 */
export async function logout(page: Page) {
  await page.getByRole("button", { name: "Wyloguj" }).click();
  await page.waitForURL("**/login", { timeout: 10000 });
}
