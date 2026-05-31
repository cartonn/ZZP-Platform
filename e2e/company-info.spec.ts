import { expect, test, type Page } from "@playwright/test";
import path from "node:path";

const shot = (p: Page, n: string) =>
  p.screenshot({ path: path.join("e2e", "screenshots", n + ".png"), fullPage: true });
const uniq = () => `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;

test("ZZP'er ziet info over de opdrachtgever bij een opdracht", async ({ page, browser }) => {
  test.slow();
  const title = `Bedrijf Opdracht ${uniq()}`;
  const about = `Wij bouwen duurzame software voor de zorg ${uniq()}.`;

  // Opdrachtgever vult het bedrijfsprofiel aan.
  await page.goto("/register");
  await page.getByText("Opdrachtgever", { exact: true }).click();
  await page.fill("#name", "Bedrijfsinfo Opdrachtgever");
  await page.fill("#companyName", "Bedrijfsinfo Testbedrijf B.V.");
  await page.fill("#email", `bedrijfinfo-${uniq()}@test.local`);
  await page.fill("#password", "geheim123");
  await page.getByRole("button", { name: "Account aanmaken" }).click();
  await page.waitForURL("**/dashboard");

  await page.goto("/bedrijf");
  await page.fill("#location", "Utrecht");
  await page.fill("#website", "https://voorbeeld-bedrijf.nl");
  await page.fill("#description", about);
  await page.getByRole("button", { name: "Bedrijfsprofiel opslaan" }).click();
  await expect(page.getByText("Opgeslagen.")).toBeVisible({ timeout: 15000 });

  // Opdracht publiceren.
  await page.goto("/opdrachten/nieuw");
  await page.fill("#title", title);
  await page.fill("#description", "Remote project.");
  await page.selectOption("#workMode", "REMOTE");
  await page.getByRole("button", { name: "Opdracht aanmaken" }).click();
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
  const detailUrl = page.url();
  await page.getByRole("button", { name: "Publiceren" }).click();
  await expect(page.getByText("Gepubliceerd")).toBeVisible();

  // ZZP'er bekijkt de opdracht en ziet info over de opdrachtgever.
  const fctx = await browser.newContext();
  const fp = await fctx.newPage();
  await fp.goto("/register");
  await fp.fill("#name", "Bedrijfsinfo Freelancer");
  await fp.fill("#email", `bedrijfinfo-free-${uniq()}@test.local`);
  await fp.fill("#password", "geheim123");
  await fp.getByRole("button", { name: "Account aanmaken" }).click();
  await fp.waitForURL("**/dashboard");
  await fp.goto(detailUrl);

  const section = fp.locator("section", { hasText: "Over de opdrachtgever" });
  await expect(section).toBeVisible();
  await expect(section.getByText(about)).toBeVisible();
  await expect(section.getByText("Utrecht")).toBeVisible();
  await expect(section.getByRole("link", { name: /Website/ })).toBeVisible();
  await shot(fp, "33-company-info");

  await fctx.close();
});
