import { expect, test, type Page } from "@playwright/test";
import path from "node:path";

const shot = (p: Page, n: string) =>
  p.screenshot({ path: path.join("e2e", "screenshots", n + ".png"), fullPage: true });
const uniq = () => `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;

test("beschikbaarheid: periode toevoegen, zien en verwijderen", async ({ page }) => {
  await page.goto("/register");
  await page.fill("#name", "Beschikbare Freelancer");
  await page.fill("#email", `avail-${uniq()}@test.local`);
  await page.fill("#password", "geheim123");
  await page.getByRole("button", { name: "Account aanmaken" }).click();
  await page.waitForURL("**/dashboard");

  await page.goto("/beschikbaarheid");
  // DateInput = NL-tekstveld (dd-mm-jjjj); vul in dat formaat.
  await page.fill("#startDate", "01-09-2026");
  await page.fill("#endDate", "01-12-2026");
  await page.selectOption("#type", "AVAILABLE");
  await page.fill("#hoursPerWeek", "32");
  await page.getByRole("button", { name: "Toevoegen" }).click();

  await expect(page.getByText("Toegevoegd.")).toBeVisible();
  // De rij toont NL-datums (formatDateShortNl): "1 sep 2026 — 1 dec 2026" + badge "Beschikbaar".
  await expect(page.getByText("1 sep 2026 — 1 dec 2026")).toBeVisible();
  // De status-badge (span); "Beschikbaar" komt ook voor als radio-optie en select-option.
  await expect(page.locator("span").filter({ hasText: /^Beschikbaar$/ })).toBeVisible();
  await shot(page, "37-beschikbaarheid");

  await page.getByRole("button", { name: "Periode verwijderen" }).click();
  await expect(page.getByText("1 sep 2026 — 1 dec 2026")).toHaveCount(0);
});
