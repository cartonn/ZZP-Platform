import { expect, test, type Page } from "@playwright/test";
import path from "node:path";

const shot = (p: Page, n: string) =>
  p.screenshot({ path: path.join("e2e", "screenshots", n + ".png"), fullPage: true });
const uniq = () => `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
const SAMPLE = {
  name: "big.pdf",
  mimeType: "application/pdf",
  buffer: Buffer.from("%PDF-1.4 big-bewijs"),
};

test("BIG-registerverificatie: ongeldig nummer faalt, geldig nummer verifieert", async ({
  page,
}) => {
  await page.goto("/register");
  await page.fill("#name", "Big Freelancer");
  await page.fill("#email", `big-${uniq()}@test.local`);
  await page.fill("#password", "geheim123");
  await page.getByRole("button", { name: "Account aanmaken" }).click();
  await page.waitForURL("**/dashboard");

  await page.goto("/certificaten/nieuw");
  await page.selectOption("#type", "LICENSE");
  await page.fill("#title", "BIG-registratie verpleegkundige");
  await page.setInputFiles("#document", SAMPLE);
  await page.getByRole("button", { name: "Certificaat toevoegen" }).click();
  await page.waitForURL("**/certificaten");
  await expect(page.getByText("Concept")).toBeVisible();

  // Ongeldig BIG-nummer → fout.
  await page.getByLabel("BIG-nummer").fill("123");
  await page.getByRole("button", { name: "Verifieer via BIG-register" }).click();
  await expect(page.getByText(/Ongeldig BIG-nummer/)).toBeVisible();

  // Geldig BIG-nummer (11 cijfers) → systeem-geverifieerd via BIG. Exact matchen: "Geverifieerd"
  // komt als substring ook in omliggende teksten voor ("geverifieerde", uitlegzinnen).
  await page.getByLabel("BIG-nummer").fill("12345678901");
  await page.getByRole("button", { name: "Verifieer via BIG-register" }).click();
  await expect(page.getByText("Geverifieerd", { exact: true }).first()).toBeVisible({
    timeout: 10000,
  });
  await expect(page.getByRole("button", { name: "Verifieer via BIG-register" })).toHaveCount(0);
  await shot(page, "39-big-verified");
});
