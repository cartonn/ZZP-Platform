import { expect, test, type Page } from "@playwright/test";
import path from "node:path";

// Verifieert het Ontzorgd-dashboard (belasting/administratie in één beeld) als ZZP'er.
const SHOTS = path.join("e2e", "qa", "screenshots");
const shot = (page: Page, name: string) =>
  page.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: true });

async function login(page: Page, email: string) {
  await page.goto("/login");
  await page.fill("#email", email);
  await page.fill("#password", "demo1234");
  await page.getByRole("button", { name: "Inloggen" }).click();
  await page.waitForURL("**/dashboard");
}

test.describe("QA: Ontzorgd-dashboard", () => {
  test("ZZP'er ziet het Ontzorgd-scherm met disclaimer", async ({ page }) => {
    await login(page, "zzp@zzp-platform.local");
    await page.goto("/ontzorgd");
    await expect(page.getByRole("heading", { name: "Ontzorgd" })).toBeVisible();
    // De fiscale disclaimer moet altijd aanwezig zijn (geen fiscaal advies).
    await expect(page.getByText(/indicatieve berekening/i)).toBeVisible();
    await shot(page, "ontzorgd-freelancer");
  });

  test("nav bevat Ontzorgd voor de ZZP'er", async ({ page }) => {
    await login(page, "zzp@zzp-platform.local");
    const nav = page.getByRole("navigation", { name: "Hoofdnavigatie" });
    await expect(nav.getByText("Ontzorgd")).toBeVisible();
  });

  test("opdrachtgever wordt doorgestuurd (geen eigen ontzorg-scherm)", async ({ page }) => {
    await login(page, "opdrachtgever@zzp-platform.local");
    await page.goto("/ontzorgd");
    await page.waitForLoadState("networkidle");
    // redirect naar /administratie: de opdrachtgever ziet NIET het Ontzorgd-scherm.
    await expect(page.getByRole("heading", { name: "Ontzorgd", exact: true })).toHaveCount(0);
  });
});
