import { expect, test } from "@playwright/test";
import { ACCOUNTS, login, shot } from "./helpers";

test.describe("QA: Client (Mark Jansen)", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, ACCOUNTS.client);
  });

  test("dashboard toont opdrachtgever-view", async ({ page }) => {
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await shot(page, "client-dashboard");
  });

  test("opdrachten beheren", async ({ page }) => {
    await page.goto("/opdrachten");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await shot(page, "client-opdrachten");
  });

  test("kandidaten/reacties", async ({ page }) => {
    await page.goto("/reacties");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await shot(page, "client-reacties");
  });

  test("freelancers zoeken", async ({ page }) => {
    await page.goto("/freelancers");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await shot(page, "client-freelancers");
  });

  test("samenwerkingen overzicht", async ({ page }) => {
    await page.goto("/samenwerkingen");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await shot(page, "client-samenwerkingen");
  });

  test("bedrijfsprofiel", async ({ page }) => {
    await page.goto("/bedrijf");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await shot(page, "client-bedrijf");
  });

  test("kan /admin niet bereiken", async ({ page }) => {
    // De server-side route-gate weert non-admins; page.goto volgt de redirect, dus
    // assert op de eind-URL (weg van /admin), niet op de HTTP-status van het antwoord.
    await page.goto("/admin/gebruikers");
    await expect(page).not.toHaveURL(/\/admin/);
    await shot(page, "client-admin-blocked");
  });
});
