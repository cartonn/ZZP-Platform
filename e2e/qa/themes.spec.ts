import { expect, test, type Page } from "@playwright/test";
import path from "node:path";

// Verifieert het 3-thema systeem (Standaard / Bloei / Elektrisch Blauw) × light/dark als gebruiker.
// Zelfstandig (geen gedeelde helper) zodat deze spec los van andere QA-PR's draait.

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

test.describe("QA: Kleurschema's + dark mode", () => {
  test("login-pagina toont palettekiezer met 3 opties", async ({ page }) => {
    await page.goto("/login");
    const group = page.getByRole("radiogroup", { name: "Kleurschema" });
    await expect(group).toBeVisible();
    await expect(group.getByRole("radio")).toHaveCount(3);
    await shot(page, "themes-login-switcher");
  });

  test("palettekeuze wijzigt data-theme en blijft behouden na reload", async ({ page }) => {
    await login(page, "zzp@zzp-platform.local");

    await expect(page.locator("html")).not.toHaveAttribute("data-theme", /.+/);

    await page.getByRole("radio", { name: "Kleurschema Bloei" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "bloei");
    await shot(page, "themes-bloei");

    await page.getByRole("radio", { name: "Kleurschema Elektrisch Blauw" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "elektrisch-blauw");
    await shot(page, "themes-elektrisch");

    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "elektrisch-blauw");

    await page.getByRole("radio", { name: "Kleurschema Standaard" }).click();
    await expect(page.locator("html")).not.toHaveAttribute("data-theme", /.+/);
  });

  test("kleurschema en dark mode zijn onafhankelijk combineerbaar", async ({ page }) => {
    await login(page, "zzp@zzp-platform.local");
    await page.getByRole("radio", { name: "Kleurschema Bloei" }).click();
    await page.getByRole("button", { name: "Schakel naar donkere modus" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "bloei");
    await expect(page.locator("html")).toHaveClass(/dark/);
    await shot(page, "themes-bloei-dark");
  });
});
