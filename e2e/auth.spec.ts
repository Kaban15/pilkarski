import { test, expect } from "@playwright/test";
import { uniqueEmail, registerClub, registerPlayer, login } from "./helpers";

const PASSWORD = "TestHaslo123!";

test.describe("Rejestracja i logowanie", () => {
  test("rejestracja klubu i logowanie", async ({ page }) => {
    const email = uniqueEmail("club");
    await registerClub(page, email, PASSWORD, "Testowy Klub E2E");
    await login(page, email, PASSWORD);

    // Dashboard h1: "Pulpit" for CLUB, "Feed" for PLAYER/COACH
    await expect(page.locator("h1")).toContainText(/Pulpit|Feed/);
  });

  test("rejestracja zawodnika i logowanie", async ({ page }) => {
    const email = uniqueEmail("player");
    await registerPlayer(page, email, PASSWORD, "Jan", "Testowy");
    await login(page, email, PASSWORD);

    await expect(page.locator("h1")).toContainText(/Pulpit|Feed/);
  });

  test("logowanie z błędnym hasłem", async ({ page }) => {
    await page.goto("/login");
    await page.fill("#email", "nieistniejacy@test.pl");
    await page.fill("#password", "zlehaslo123");
    await page.getByRole("button", { name: "Zaloguj się" }).click();

    await expect(page.getByText("Nieprawidłowy e-mail lub hasło")).toBeVisible();
  });

  test("niezalogowany użytkownik jest przekierowany do /login", async ({ page }) => {
    await page.goto("/feed");
    await page.waitForURL("**/login**", { timeout: 15000 });
    expect(page.url()).toContain("/login");
  });

  test("rejestracja z istniejącym emailem pokazuje błąd", async ({ page }) => {
    const email = uniqueEmail("dup");
    await registerClub(page, email, PASSWORD, "Klub Duplikat");

    await page.goto("/register");
    await page.getByRole("button", { name: "Klub" }).click();
    await page.fill("#email", email);
    await page.fill("#password", PASSWORD);
    await page.fill("#clubName", "Klub Duplikat 2");
    await page.getByRole("button", { name: "Zarejestruj się" }).click();

    await expect(page.getByText(/już istnieje|błąd/i)).toBeVisible();
  });
});
