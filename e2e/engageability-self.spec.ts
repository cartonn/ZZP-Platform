import { expect, test, type Page } from "@playwright/test";
import path from "node:path";

const SHOTS = path.join("e2e", "screenshots");
const shot = (page: Page, name: string) =>
  page.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: true });
const uniq = () => `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;

test("inzetbaarheid-zelfweergave: ZZP'er ziet zijn blokkerende status met herstelpad op het profiel", async ({
  page,
}) => {
  // Een verse ZZP'er mist gegarandeerd de verplichte documenten → blokkerende status met doorklik.
  // (De oude dashboard-kaart "Jouw inzetbaarheid" is in de command-center-overhaul vervangen door
  // de owner-only blocker-chip op /profiel, met deeplink naar de ontbrekende stap.)
  await page.goto("/register");
  await page.fill("#name", "Inzet Zelfview");
  await page.fill("#email", `inzet-self-${uniq()}@test.local`);
  await page.fill("#password", "geheim123");
  await page.getByRole("button", { name: "Account aanmaken" }).click();
  await page.waitForURL("**/dashboard");

  await page.goto("/profiel");
  // .first(): de blocker verschijnt als chip in de kop én als herstel-CTA in de zijkolom.
  const blockerChip = page.getByRole("link", { name: /Nog niet inzetbaar/ }).first();
  await expect(blockerChip).toBeVisible();
  await shot(page, "engageability-self");

  // Het herstelpad: de chip linkt naar de plek waar de ontbrekende stap wordt opgelost.
  await blockerChip.click();
  await page.waitForURL(/\/(certificaten|profiel)/);
});
