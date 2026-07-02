import { expect, test, type Page } from "@playwright/test";
import path from "node:path";

const SHOTS = path.join("e2e", "screenshots");
const shot = (page: Page, name: string) =>
  page.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: true });
const uniq = () => `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;

async function registerClient(page: Page, email: string) {
  await page.goto("/register");
  await page.getByText("Opdrachtgever", { exact: true }).click();
  await page.fill("#name", "Coll Opdrachtgever");
  await page.fill("#companyName", "Coll Testbedrijf B.V.");
  await page.fill("#email", email);
  await page.fill("#password", "geheim123");
  await page.getByRole("button", { name: "Account aanmaken" }).click();
  await page.waitForURL("**/dashboard");
}
async function registerFreelancer(page: Page, email: string) {
  await page.goto("/register");
  await page.fill("#name", "Coll Freelancer");
  await page.fill("#email", email);
  await page.fill("#password", "geheim123");
  await page.getByRole("button", { name: "Account aanmaken" }).click();
  await page.waitForURL("**/dashboard");
}

test("berichten, reactie accepteren, samenwerking voorstellen/activeren, notificaties", async ({
  page,
  browser,
}) => {
  test.slow(); // zware multi-context journey; veel dev-mode route-compiles onder parallelle load
  const title = `Coll Opdracht ${uniq()}`;
  await registerClient(page, `coll-client-${uniq()}@test.local`);

  // Opdracht aanmaken + publiceren.
  await page.goto("/opdrachten/nieuw");
  await page.fill("#title", title);
  await page.fill("#description", "Samenwerkingsproject, ervaren ontwikkelaar gezocht.");
  await page.selectOption("#workMode", "REMOTE");
  await page.getByRole("button", { name: "Opslaan als concept" }).click();
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
  const detailUrl = page.url();
  await page.getByRole("button", { name: "Publiceren" }).click();
  await expect(page.getByText("Gepubliceerd")).toBeVisible();

  // ZZP'er reageert.
  const fctx = await browser.newContext();
  const fp = await fctx.newPage();
  await registerFreelancer(fp, `coll-free-${uniq()}@test.local`);
  await fp.goto(detailUrl);
  await fp.fill("#motivation", "Ik werk graag aan dit soort projecten en ben beschikbaar.");
  await fp.getByRole("button", { name: "Reactie versturen" }).click();
  await fp.waitForURL("**/reacties");

  // Opdrachtgever start een gesprek vanuit de kandidaat.
  await page.goto("/kandidaten");
  await expect(page.getByText("Coll Freelancer")).toBeVisible();
  await page.getByRole("button", { name: "Bericht sturen" }).click();
  await page.waitForURL(/\/berichten\/[a-z0-9]+$/);
  await page
    .locator('textarea[name="body"]')
    .fill("Hoi, ik heb interesse in je reactie. Wanneer kun je starten?");
  await page.getByRole("button", { name: "Versturen" }).click();
  await expect(page.getByText("Hoi, ik heb interesse")).toBeVisible({ timeout: 15000 });
  await shot(page, "22-berichten");

  // ZZP'er ziet het bericht en antwoordt.
  await fp.goto("/berichten");
  await expect(fp.getByText("Coll Opdrachtgever")).toBeVisible();
  await expect(fp.getByText(/nieuw/)).toBeVisible();
  await fp.getByText("Coll Opdrachtgever").click();
  await fp.waitForURL(/\/berichten\/[a-z0-9]+$/);
  await expect(fp.getByText("Hoi, ik heb interesse")).toBeVisible({ timeout: 15000 });
  await fp.locator('textarea[name="body"]').fill("Hoi! Ik kan per direct starten.");
  await fp.getByRole("button", { name: "Versturen" }).click();
  await expect(fp.getByText("Ik kan per direct starten")).toBeVisible({ timeout: 15000 });

  // Opdrachtgever accepteert de reactie en stelt een samenwerking voor.
  await page.goto("/kandidaten");
  await page.getByRole("button", { name: "Accepteren" }).click();
  await expect(page.getByText("Samenwerking voorstellen")).toBeVisible();
  await page.locator('input[name="rate"]').fill("90");
  await page.getByRole("button", { name: "Voorstel versturen" }).click();
  await expect(page.getByRole("link", { name: "Bekijk samenwerking" })).toBeVisible();

  // ZZP'er ziet de samenwerking en activeert die.
  await fp.goto("/samenwerkingen");
  const collabCard = fp.locator("div.bg-card", { hasText: title });
  await expect(collabCard.getByText("Voorgesteld")).toBeVisible();
  await shot(fp, "23-samenwerkingen");
  await collabCard.getByRole("button", { name: "Contract ondertekenen" }).click();
  await expect(fp.locator("div.bg-card", { hasText: title }).getByText("Actief")).toBeVisible();

  // ZZP'er heeft notificaties (bericht + reactie geaccepteerd + samenwerking voorgesteld).
  await fp.goto("/notificaties");
  await expect(fp.getByText("Je reactie is geaccepteerd")).toBeVisible();
  await expect(fp.getByText("Nieuw bericht")).toBeVisible();
  await shot(fp, "24-notificaties");

  await fctx.close();
});
