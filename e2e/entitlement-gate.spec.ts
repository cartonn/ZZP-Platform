import { expect, test, type Page } from "@playwright/test";

async function login(page: Page, email: string, password = "demo1234") {
  await page.goto("/login");
  await page.fill("#email", email);
  await page.fill("#password", password);
  await page.getByRole("button", { name: "Inloggen" }).click();
  await page.waitForURL("**/dashboard");
}

// Betaalde features (boekhouding, ontzorgd) zijn server-side afgeschermd: een ZZP'er zonder
// betaald plan (youssef@ heeft geen abonnement → FREE) ziet een upgrade-slot i.p.v. de content.
test("FREE-ZZP'er stuit op het entitlement-slot bij betaalde features", async ({ page }) => {
  await login(page, "youssef@zzp-platform.local");

  await page.goto("/ontzorgd");
  await expect(page.getByText("Ontzorgd zit in een betaald plan")).toBeVisible();
  await expect(page.getByRole("link", { name: "Bekijk abonnementen" })).toBeVisible();

  await page.goto("/administratie");
  await expect(page.getByText("Boekhouding zit in een betaald plan")).toBeVisible();
  await expect(page.getByRole("link", { name: "Bekijk abonnementen" })).toBeVisible();
});
