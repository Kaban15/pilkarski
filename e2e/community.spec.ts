import { test, expect } from "@playwright/test";
import { uniqueEmail, registerClub, login } from "./helpers";

test.describe("Community board", () => {
  const email = uniqueEmail("community");
  const password = "TestPassword123!";

  test("register and visit community", async ({ page }) => {
    await registerClub(page, email, password, "Community FC");
    await login(page, email, password);
    await page.goto("/community");
    await expect(page.locator("text=Tablica społeczności")).toBeVisible();
  });

  test("see add post button as club", async ({ page }) => {
    await login(page, email, password);
    await page.goto("/community");
    await expect(page.getByRole("button", { name: "Dodaj post" })).toBeVisible();
  });

  test("category tabs visible", async ({ page }) => {
    await login(page, email, password);
    await page.goto("/community");
    await expect(page.locator("text=Wszystkie")).toBeVisible();
  });
});
