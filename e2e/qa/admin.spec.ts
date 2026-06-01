import { expect, test } from "@playwright/test";
import { ACCOUNTS, login, shot } from "./helpers";

test.describe("QA: Admin", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, ACCOUNTS.admin);
  });

  test("dashboard toont beheerwerkplek", async ({ page }) => {
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await shot(page, "admin-dashboard");
  });

  test("verificatiequeue", async ({ page }) => {
    await page.goto("/admin/verificaties");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await shot(page, "admin-verificaties");
  });

  test("gebruikersbeheer", async ({ page }) => {
    await page.goto("/admin/gebruikers");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await shot(page, "admin-gebruikers");
  });

  test("audit log", async ({ page }) => {
    await page.goto("/admin/audit");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await shot(page, "admin-audit");
  });

  test("DBA-risico overzicht", async ({ page }) => {
    await page.goto("/admin/dba");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await shot(page, "admin-dba");
  });

  test("opdrachten overzicht", async ({ page }) => {
    await page.goto("/admin/opdrachten");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await shot(page, "admin-opdrachten");
  });
});
