import { expect, test, type Page } from "@playwright/test";
import path from "node:path";

const shot = (p: Page, n: string) =>
  p.screenshot({ path: path.join("e2e", "screenshots", n + ".png"), fullPage: true });
const uniq = () => `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;

test("AVG-verwijderverzoek vraagt aandacht bij de beheerder", async ({ page, browser }) => {
  test.slow();
  const name = `Verwijder Tester ${uniq()}`;

  // ZZP'er vraagt accountverwijdering aan (AVG).
  await page.goto("/register");
  await page.fill("#name", name);
  await page.fill("#email", `verwijder-${uniq()}@test.local`);
  await page.fill("#password", "geheim123");
  await page.getByRole("button", { name: "Account aanmaken" }).click();
  await page.waitForURL("**/dashboard");
  await page.goto("/account");
  await page.getByRole("button", { name: "Verwijdering aanvragen" }).click();
  await expect(page.getByText(/Verwijdering aangevraagd op/)).toBeVisible({ timeout: 15000 });

  // Beheerder ziet het verzoek terug als aandachtspunt.
  const adminCtx = await browser.newContext();
  const admin = await adminCtx.newPage();
  await admin.goto("/login");
  await admin.fill("#email", "admin@zzp-platform.local");
  await admin.fill("#password", "demo1234");
  await admin.getByRole("button", { name: "Inloggen" }).click();
  await admin.waitForURL("**/dashboard");
  await expect(admin.getByText(/AVG-verwijderverzoek\(en\) — beoordeel/)).toBeVisible();

  await admin.goto("/admin/gebruikers");
  await expect(
    admin.getByRole("link", { name: /AVG-verwijderverzoek\(en\) — beoordeel/ }),
  ).toBeVisible();

  // Filter op verwijderverzoeken: de gebruiker staat erbij met een rood label.
  await admin.goto("/admin/gebruikers?deletion=1");
  await expect(admin.getByText(name)).toBeVisible();
  await expect(admin.getByText("Verwijderverzoek").first()).toBeVisible();
  await shot(admin, "42-admin-deletion-requests");

  await adminCtx.close();
});
