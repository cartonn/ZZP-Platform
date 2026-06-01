import { expect, test, type Page } from "@playwright/test";
import path from "node:path";

const shot = (p: Page, n: string) =>
  p.screenshot({ path: path.join("e2e", "screenshots", n + ".png"), fullPage: true });
const uniq = () => `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;

test("AVG: gegevens exporteren en verwijdering aanvragen/intrekken", async ({ page }) => {
  const email = `acct-${uniq()}@test.local`;
  await page.goto("/register");
  await page.fill("#name", "Acct Freelancer");
  await page.fill("#email", email);
  await page.fill("#password", "geheim123");
  await page.getByRole("button", { name: "Account aanmaken" }).click();
  await page.waitForURL("**/dashboard");

  await page.goto("/account");
  await expect(page.getByRole("heading", { name: "Account & privacy" })).toBeVisible();

  // Inzage: export levert JSON met de eigen e-mail.
  const href = await page
    .getByRole("link", { name: /Download mijn gegevens/ })
    .getAttribute("href");
  expect(href).toBe("/api/account/export");
  const resp = await page.context().request.get(href!);
  expect(resp.status()).toBe(200);
  expect(resp.headers()["content-type"]).toContain("application/json");
  expect(await resp.text()).toContain(email);

  // Verwijderverzoek + intrekken.
  await page.getByRole("button", { name: "Verwijdering aanvragen" }).click();
  await expect(page.getByText(/Verwijdering aangevraagd/)).toBeVisible();
  await shot(page, "36-account");
  await page.getByRole("button", { name: "Verzoek intrekken" }).click();
  await expect(page.getByRole("button", { name: "Verwijdering aanvragen" })).toBeVisible();
});

test("Audit: login-events worden gelogd (admin ziet USER_LOGIN)", async ({ page }) => {
  await page.goto("/login");
  await page.fill("#email", "admin@zzp-platform.local");
  await page.fill("#password", "demo1234");
  await page.getByRole("button", { name: "Inloggen" }).click();
  await page.waitForURL("**/dashboard");

  await page.goto("/admin/audit");
  // getByLabel("Actie") botst met de zijbalk-badge ("… vraagt actie"); richt op het invoerveld.
  await page.getByRole("textbox", { name: "Actie" }).fill("USER_LOGIN");
  await page.getByRole("button", { name: "Filteren" }).click();
  await expect(page.getByText("USER_LOGIN").first()).toBeVisible();
});
