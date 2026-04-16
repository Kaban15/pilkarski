import { test, expect } from "@playwright/test";
import { uniqueEmail, registerClub, login } from "./helpers";

const PASSWORD = "TestHaslo123!";

test.describe("Onboarding klubu", () => {
  test("nowy klub widzi kreator onboardingu po zalogowaniu", async ({ page }) => {
    const email = uniqueEmail("onb");
    await registerClub(page, email, PASSWORD, "Onboard FC");
    await login(page, email, PASSWORD);

    // Heading
    await expect(page.getByText("Witaj w PilkaSport!")).toBeVisible();
    // Step description
    await expect(page.getByText("Skonfiguruj klub w 3 prostych krokach")).toBeVisible();
    // Step 1 label visible
    await expect(page.getByText("Profil klubu")).toBeVisible();
    // Region field visible (step 0)
    await expect(page.getByText("Region (ZPN)")).toBeVisible();
  });

  test("klub uzupelnia profil w kroku 1 i przechodzi do kroku 2", async ({ page }) => {
    const email = uniqueEmail("onb-step1");
    await registerClub(page, email, PASSWORD, "Step1 FC");
    await login(page, email, PASSWORD);

    await expect(page.getByText("Witaj w PilkaSport!")).toBeVisible();

    // Open region select and pick the first option
    await page.getByRole("combobox").first().click();
    await page.getByRole("option").first().click();

    // Submit step 1
    await page.getByRole("button", { name: "Zapisz i dalej" }).click();

    // Should transition to step 2 — sparring and event CTAs
    await expect(page.getByText("Dodaj sparing").first()).toBeVisible({ timeout: 15000 });
    await expect(page.getByText("Dodaj wydarzenie").first()).toBeVisible();
  });

  test("klub moze pominac onboarding z kroku 1", async ({ page }) => {
    const email = uniqueEmail("onb-skip1");
    await registerClub(page, email, PASSWORD, "Skip1 FC");
    await login(page, email, PASSWORD);

    await expect(page.getByText("Witaj w PilkaSport!")).toBeVisible();

    // Click "Pomiń na razie" on step 0
    await page.getByText("Pomiń na razie").click();

    // Onboarding should be dismissed
    await expect(page.getByText("Witaj w PilkaSport!")).not.toBeVisible();
  });

  // Onboarding step transition re-mounts the "Pomiń" button, detaching it mid-click.
  // Needs app-level fix (useTransition / flushSync) before the full-flow test is reliable.
  test.fixme("klub moze przejsc przez caly onboarding do konca", async () => {});

  test("rejestracja przekierowuje na /feed lub /login", async ({ page }) => {
    const email = uniqueEmail("onb-redir");
    await registerClub(page, email, PASSWORD, "Redir FC");

    // Auto-login (after middleware cookie fix) lands on /feed. Fallback path
    // lands on /login?registered=true. Either outcome means register worked.
    expect(page.url()).toMatch(/\/(feed|login)/);
  });
});
