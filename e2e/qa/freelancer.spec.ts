import { expect, test } from "@playwright/test";
import { ACCOUNTS, login, shot } from "./helpers";

test.describe("QA: Freelancer (Sanne)", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, ACCOUNTS.freelancer);
  });

  test("dashboard toont next-actions", async ({ page }) => {
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByText("Volgende stappen")).toBeVisible();
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
    await page.goto("/profiel");
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
    const res = await page.goto("/admin/verificaties");
    expect(res?.status()).toBeGreaterThanOrEqual(300);
    await shot(page, "freelancer-admin-blocked");
  });
});
