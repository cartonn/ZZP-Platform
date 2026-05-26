import { expect, test, type Page } from "@playwright/test";
import path from "node:path";

const SHOTS = path.join("e2e", "screenshots");
const shot = (page: Page, name: string) =>
  page.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: true });
const uniq = () => `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;

test("ZZP'er ziet proactief een passende opdracht op het dashboard", async ({ page, browser }) => {
  const title = `Match Opdracht ${uniq()}`;

  // Opdrachtgever publiceert een opdracht met een herkenbare skill, zonder vereist certificaat.
  await page.goto("/register");
  await page.getByText("Opdrachtgever", { exact: true }).click();
  await page.fill("#name", "Match Opdrachtgever");
  await page.fill("#companyName", "Match Testbedrijf B.V.");
  await page.fill("#email", `matchclient-${uniq()}@test.local`);
  await page.fill("#password", "geheim123");
  await page.getByRole("button", { name: "Account aanmaken" }).click();
  await page.waitForURL("**/dashboard");

  await page.goto("/opdrachten/nieuw");
  await page.fill("#title", title);
  await page.fill("#description", "Langlopend remote project voor een ervaren ontwikkelaar.");
  await page.selectOption("#workMode", "REMOTE");
  await page.fill("#rateMin", "70");
  await page.fill("#rateMax", "95");
  await page.locator("fieldset", { hasText: "Vereiste skills" }).getByText("TypeScript", { exact: true }).click();
  await page.getByRole("button", { name: "Opdracht aanmaken" }).click();
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
  await page.getByRole("button", { name: "Publiceren" }).click();
  await expect(page.getByText("Gepubliceerd")).toBeVisible();

  // ZZP'er met aansluitend profiel: zelfde skill, remote, tarief binnen budget.
  const ctx = await browser.newContext();
  const fp = await ctx.newPage();
  await fp.goto("/register");
  await fp.fill("#name", "Match Freelancer");
  await fp.fill("#email", `matchfree-${uniq()}@test.local`);
  await fp.fill("#password", "geheim123");
  await fp.getByRole("button", { name: "Account aanmaken" }).click();
  await fp.waitForURL("**/dashboard");

  await fp.goto("/profiel");
  await fp.fill("#hourlyRate", "80");
  await fp.selectOption("#workMode", "REMOTE");
  await fp.locator("fieldset", { hasText: "Skills" }).getByText("TypeScript", { exact: true }).click();
  await fp.getByRole("button", { name: "Profiel opslaan" }).click();
  await expect(fp.getByText(/opgeslagen|bijgewerkt/i).first()).toBeVisible({ timeout: 15000 });

  // Het systeem denkt mee: de opdracht verschijnt vanzelf op het dashboard.
  await fp.goto("/dashboard");
  await expect(fp.getByRole("heading", { name: "Opdrachten die bij je passen" })).toBeVisible();
  const match = fp.getByRole("link", { name: new RegExp(title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")) });
  await expect(match).toBeVisible();
  await expect(match.getByText(/Match \d+%/)).toBeVisible();
  await shot(fp, "18-dashboard-matches");

  await ctx.close();
});
