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
  await expect(page.getByText("2026-09-01 — 2026-12-01")).toBeVisible();
  await expect(page.getByText("Beschikbaar vanaf 2026-09-01")).toBeVisible();
  await shot(page, "37-beschikbaarheid");

  await page.getByRole("button", { name: "Periode verwijderen" }).click();
  await expect(page.getByText("2026-09-01 — 2026-12-01")).toHaveCount(0);
});
