import { expect, test, type Page } from "@playwright/test";
import path from "node:path";

// Verifieert de Platform-bewaking end-to-end: mislukte logins → monitor detecteert →
// incident verschijnt in /admin/bewaking. Vereist CRON_SECRET in de serveromgeving.
const SHOTS = path.join("e2e", "qa", "screenshots");
const shot = (page: Page, name: string) =>
  page.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: true });

async function login(page: Page, email: string, password = "demo1234") {
  await page.goto("/login");
  await page.fill("#email", email);
  await page.fill("#password", password);
  await page.getByRole("button", { name: "Inloggen" }).click();
}

test.describe("QA: Platform-bewaking", () => {
  test("admin ziet het bewakingsscherm; lege staat is rustig", async ({ page }) => {
    await login(page, "admin@zzp-platform.local");
    await page.waitForURL("**/dashboard");
    await page.goto("/admin/bewaking");
    await expect(page.getByRole("heading", { name: "Platform-bewaking" })).toBeVisible();
    await shot(page, "bewaking-overzicht");
  });

  test("freelancer kan /admin/bewaking niet bereiken", async ({ page }) => {
    await login(page, "zzp@zzp-platform.local");
    await page.waitForURL("**/dashboard");
    await page.goto("/admin/bewaking");
    await page.waitForLoadState("networkidle");
    // De freelancer ziet het bewakingsscherm niet (middleware/role-guard stuurt weg).
    await expect(page.getByRole("heading", { name: "Platform-bewaking" })).toHaveCount(0);
  });

  test("brute-force-burst → incident gedetecteerd en zichtbaar voor admin", async ({
    page,
    request,
  }) => {
    const secret = process.env.CRON_SECRET;
    test.skip(!secret, "CRON_SECRET niet gezet in deze omgeving");

    // 6 mislukte inlogpogingen voor één account (genereert auth-auditregels).
    for (let i = 0; i < 6; i++) {
      await login(page, "zzp@zzp-platform.local", "foutwachtwoord");
      await expect(page.getByRole("alert")).toBeVisible();
    }

    // Trigger de bewakingsronde via het beveiligde endpoint.
    const res = await request.post("/api/tasks/monitor", {
      headers: { authorization: `Bearer ${secret}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.findings).toBeGreaterThanOrEqual(1);

    // Admin ziet het incident.
    await page.context().clearCookies();
    await login(page, "admin@zzp-platform.local");
    await page.waitForURL("**/dashboard");
    await page.goto("/admin/bewaking");
    await expect(page.getByText(/mislukte inlogpogingen/i).first()).toBeVisible();
    await shot(page, "bewaking-incident");
  });
});
