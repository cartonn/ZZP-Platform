import { expect, test, type Page } from "@playwright/test";
import path from "node:path";

const shot = (p: Page, n: string) =>
  p.screenshot({ path: path.join("e2e", "screenshots", n + ".png"), fullPage: true });
const uniq = () => `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
const SAMPLE = {
  name: "diploma.pdf",
  mimeType: "application/pdf",
  buffer: Buffer.from("%PDF-1.4 diploma-uittreksel"),
};

test("DUO-diplomaverificatie: ongeldige code faalt, geldige code verifieert", async ({ page }) => {
  await page.goto("/register");
  await page.fill("#name", "Duo Freelancer");
  await page.fill("#email", `duo-${uniq()}@test.local`);
  await page.fill("#password", "geheim123");
  await page.getByRole("button", { name: "Account aanmaken" }).click();
  await page.waitForURL("**/dashboard");

  // Diploma-credential aanmaken.
  await page.goto("/certificaten/nieuw");
  await page.selectOption("#type", "DIPLOMA");
  await page.fill("#title", "Hbo Verpleegkunde");
  await page.setInputFiles("#document", SAMPLE);
  await page.getByRole("button", { name: "Certificaat toevoegen" }).click();
  await page.waitForURL("**/certificaten");
  await expect(page.getByText("Concept")).toBeVisible();

  // Ongeldige verificatiecode → fout.
  await page.getByLabel("DUO-verificatiecode").fill("12345");
  await page.getByRole("button", { name: "Verifieer via DUO" }).click();
  await expect(page.getByText(/Ongeldige verificatiecode/)).toBeVisible();

  // Geldige code → systeem-geverifieerd via DUO.
  await page.getByLabel("DUO-verificatiecode").fill("DUO-AB12-CD34");
  await page.getByRole("button", { name: "Verifieer via DUO" }).click();
  await expect(page.getByText("Geverifieerd", { exact: true }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Verifieer via DUO" })).toHaveCount(0);
  await shot(page, "38-duo-verified");
});
