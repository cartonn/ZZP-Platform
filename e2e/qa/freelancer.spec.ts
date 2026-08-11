import { expect, test } from "@playwright/test";
import { ACCOUNTS, login, shot } from "./helpers";

test.describe("QA: Freelancer (Sanne)", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, ACCOUNTS.freelancer);
  });

  test("dashboard toont next-actions", async ({ page }) => {
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    // De next-action-zone heet in het command-center-dashboard "Volgende acties".
    await expect(page.getByText("Volgende acties")).toBeVisible();
    await shot(page, "freelancer-dashboard");
  });

  test("certificaten toont statusoverzicht", async ({ page }) => {
    await page.goto("/certificaten");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await shot(page, "freelancer-certificaten");
  });

  test("alle navigatie-items zijn klikbaar", async ({ page }) => {
    const nav = page.getByRole("navigation", { name: "Hoofdnavigatie" });
    const links = await nav.getByRole("link").all();
    expect(links.length).toBeGreaterThan(3);
    for (const link of links) {
      const href = await link.getAttribute("href");
      if (href && !href.startsWith("http")) {
        await page.goto(href);
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      }
    }
    await shot(page, "freelancer-all-nav");
  });

  test("profiel bewerken flow", async ({ page }) => {
    await page.goto("/profiel/bewerken");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await shot(page, "freelancer-profiel");
  });

  test("opdrachten bladeren", async ({ page }) => {
    await page.goto("/opdrachten");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await shot(page, "freelancer-opdrachten");
  });

  test("facturen overzicht", async ({ page }) => {
    await page.goto("/facturen");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await shot(page, "freelancer-facturen");
  });

  test("notificaties pagina", async ({ page }) => {
    await page.goto("/notificaties");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await shot(page, "freelancer-notificaties");
  });

  test("kan /admin niet bereiken", async ({ page }) => {
    // De server-side route-gate weert non-admins; page.goto volgt de redirect, dus
    // assert op de eind-URL (weg van /admin), niet op de HTTP-status van het antwoord.
    await page.goto("/admin/verificaties");
    await expect(page).not.toHaveURL(/\/admin/);
    await shot(page, "freelancer-admin-blocked");
  });
});
