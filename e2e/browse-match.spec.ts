import { expect, test, type Page } from "@playwright/test";
import path from "node:path";

const SHOTS = path.join("e2e", "screenshots");
const shot = (page: Page, name: string) =>
  page.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: true });
const uniq = () => `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;

test("ZZP'er ziet z'n persoonlijke match per opdracht in de lijst", async ({ page, browser }) => {
  test.slow();
  const title = `Browse Opdracht ${uniq()}`;

  // Opdrachtgever publiceert een opdracht met een herkenbare skill.
  await page.goto("/register");
  await page.getByText("Opdrachtgever", { exact: true }).click();
  await page.fill("#name", "Browse Opdrachtgever");
  await page.fill("#companyName", "Browse Testbedrijf B.V.");
  await page.fill("#email", `browse-client-${uniq()}@test.local`);
  await page.fill("#password", "geheim123");
  await page.getByRole("button", { name: "Account aanmaken" }).click();
  await page.waitForURL("**/dashboard");

  await page.goto("/opdrachten/nieuw");
  await page.fill("#title", title);
  await page.fill("#description", "Remote project voor een ervaren ontwikkelaar.");
  await page.selectOption("#workMode", "REMOTE");
  await page.fill("#rateMin", "70");
  await page.fill("#rateMax", "95");
  await page
    .locator("fieldset", { hasText: "Vereiste skills" })
    .getByText("TypeScript", { exact: true })
    .click();
  await page.getByRole("button", { name: "Opslaan als concept" }).click();
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
  await page.getByRole("button", { name: "Publiceren" }).click();
  await expect(page.getByText("Gepubliceerd")).toBeVisible();

  // ZZP'er met aansluitend profiel bekijkt de lijst.
  const fctx = await browser.newContext();
  const fp = await fctx.newPage();
  await fp.goto("/register");
  await fp.fill("#name", "Browse Freelancer");
  await fp.fill("#email", `browse-free-${uniq()}@test.local`);
  await fp.fill("#password", "geheim123");
  await fp.getByRole("button", { name: "Account aanmaken" }).click();
  await fp.waitForURL("**/dashboard");
  await fp.goto("/profiel/bewerken");
  await fp.fill("#hourlyRate", "80");
  await fp.selectOption("#workMode", "REMOTE");
  await fp
    .locator("fieldset", { hasText: "Skills" })
    .getByText("TypeScript", { exact: true })
    .click();
  await fp.getByRole("button", { name: "Profiel opslaan" }).click();
  await expect(fp.getByText(/opgeslagen|bijgewerkt/i).first()).toBeVisible({ timeout: 15000 });

  await fp.goto("/opdrachten");
  await fp.getByLabel("Zoeken").fill(title);
  await fp.waitForURL(/[?&]q=/);
  const jobLink = fp.getByRole("link", {
    name: new RegExp(title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
  });
  await expect(jobLink).toBeVisible();
  const jobRow = fp.locator("div.card-interactive", { has: jobLink });
  await expect(jobRow.getByText(/Match \d+%/)).toBeVisible();
  await shot(fp, "30-browse-match");

  await fctx.close();
});
