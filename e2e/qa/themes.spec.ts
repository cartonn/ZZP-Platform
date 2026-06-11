import { expect, test, type Page } from "@playwright/test";
import path from "node:path";

// Verifieert licht/donker als gebruikerskeuze. Het vroegere palette-systeem
// (3 kleurschema's) is bewust verwijderd: één identiteit — zie ADR 0007.

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

test.describe("QA: Licht/donker thema", () => {
  test("er is geen palettekiezer meer (één identiteit)", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("radiogroup", { name: "Kleurschema" })).toHaveCount(0);
    await expect(page.locator("html")).not.toHaveAttribute("data-theme", /.+/);
  });

  test("donkere modus schakelt en blijft behouden na reload", async ({ page }) => {
    await login(page, "zzp@zzp-platform.local");

    await page.getByRole("button", { name: "Schakel naar donkere modus" }).click();
    await expect(page.locator("html")).toHaveClass(/dark/);
    await shot(page, "themes-donker");

    await page.reload();
    await expect(page.locator("html")).toHaveClass(/dark/);

    await page.getByRole("button", { name: "Schakel naar lichte modus" }).click();
    await expect(page.locator("html")).not.toHaveClass(/dark/);
    await shot(page, "themes-licht");
  });
});
